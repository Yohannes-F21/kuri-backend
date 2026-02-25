const nodemailer = require("nodemailer");
const nodemailerConfig = require("../utils/nodemailerConfig");
const dns = require("dns");

const DEFAULT_PUBLIC_DNS = ["1.1.1.1", "8.8.8.8"];

const parseCsv = (value) =>
  String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const lookupIpv4 = async (hostname) => {
  if (!hostname) return null;
  const result = await dns.promises.lookup(hostname, { family: 4 });
  return result && result.address ? result.address : null;
};

const isDnsTimeoutError = (error) => {
  const code = error && error.code;
  const message = String(error && error.message ? error.message : "");
  return (
    code === "ETIMEOUT" ||
    code === "EDNS" ||
    message.includes("queryA ETIMEOUT") ||
    message.includes("querySrv ETIMEOUT")
  );
};

const resolveIpv4WithPublicDns = async (hostname) => {
  // Fallback path if OS DNS is problematic; uses c-ares and may timeout on some networks.
  const servers =
    parseCsv(process.env.EMAIL_DNS_SERVERS) ||
    parseCsv(process.env.MONGO_DNS_SERVERS) ||
    DEFAULT_PUBLIC_DNS;

  const resolver = new dns.Resolver();
  resolver.setServers(servers.length ? servers : DEFAULT_PUBLIC_DNS);
  const addresses = await resolver.resolve4(hostname);
  return addresses && addresses.length ? addresses[0] : null;
};

const sendEmail = async ({ email, subject, html }) => {
  if (!nodemailerConfig?.auth?.user || !nodemailerConfig?.auth?.pass) {
    throw new Error(
      "Email is not configured. Set EMAIL_USER (or EMAIL) and EMAIL_PASS in your environment. For Gmail, EMAIL_PASS must be an App Password (not your normal password).",
    );
  }

  const originalHost = nodemailerConfig.host;

  const createTransporter = (overrideConfig) =>
    nodemailer.createTransport({
      ...overrideConfig,
      // Prefer IPv4 to avoid some IPv6/DNS edge cases
      family: 4,
      // Fail fast instead of hanging ~1min+ on network/DNS issues
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });

  // IMPORTANT: net.connect() hostname lookups use OS DNS (not dns.setServers).
  // To avoid ETIMEOUT on smtp.gmail.com, resolve via public DNS and connect by IP.
  let initialConfig = nodemailerConfig;
  try {
    // Prefer OS DNS lookup first (it worked on your machine while resolve4 timed out)
    const ip =
      (await lookupIpv4(originalHost)) ||
      (await resolveIpv4WithPublicDns(originalHost));
    if (ip) {
      initialConfig = {
        ...nodemailerConfig,
        host: ip,
        tls: {
          ...(nodemailerConfig.tls || {}),
          servername: originalHost,
        },
      };
    }
  } catch (_) {
    // If public DNS resolution fails, fall back to original config (sendMail retry below may still fix it)
  }

  let transporter = createTransporter(initialConfig);

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.EMAIL,
    to: email,
    subject,
    html,
  };

  try {
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    // If DNS intermittently fails inside nodemailer/net.connect, retry once using a
    // public-DNS resolved IPv4 and preserve TLS SNI via tls.servername.
    if (isDnsTimeoutError(error) && originalHost) {
      const ip =
        (await lookupIpv4(originalHost)) ||
        (await resolveIpv4WithPublicDns(originalHost));
      if (ip) {
        transporter = createTransporter({
          ...nodemailerConfig,
          host: ip,
          tls: {
            ...(nodemailerConfig.tls || {}),
            servername: originalHost,
          },
        });

        return await transporter.sendMail(mailOptions);
      }
    }

    if (error?.code === "EAUTH" || error?.responseCode === 535) {
      throw new Error(
        "SMTP authentication failed (Gmail 535). If you are using Gmail, enable 2-Step Verification on the account and use a Google App Password as EMAIL_PASS. Also ensure EMAIL_USER matches the Gmail account that generated the App Password.",
      );
    }
    throw error;
  }
};

module.exports = sendEmail;
