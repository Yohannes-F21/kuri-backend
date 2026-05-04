const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;

const smtpSecure = process.env.SMTP_SECURE
  ? process.env.SMTP_SECURE === "true"
  : smtpPort === 465;

const extractEmailAddress = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const match = raw.match(/<([^>]+)>/);
  return (match ? match[1] : raw).trim();
};

const nodemailerConfig = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: extractEmailAddress(process.env.EMAIL_FROM),
    // Gmail App Passwords are often shown with spaces; remove whitespace to avoid 535 auth failures.
    pass: (process.env.EMAIL_PASS || "").replace(/\s+/g, ""),
  },
};

module.exports = nodemailerConfig;
