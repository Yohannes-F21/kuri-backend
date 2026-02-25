const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;

const smtpSecure = process.env.SMTP_SECURE
  ? process.env.SMTP_SECURE === "true"
  : smtpPort === 465;

const nodemailerConfig = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: (process.env.EMAIL_USER || process.env.EMAIL || "").trim(),
    // Gmail App Passwords are often shown with spaces; remove whitespace to avoid 535 auth failures.
    pass: (process.env.EMAIL_PASS || "").replace(/\s+/g, ""),
  },
};

module.exports = nodemailerConfig;
