const sendEmail = require("./sendEmail.js");

const sendVerificationEmail = async ({ name, email, token, origin, role }) => {
  const subject = "Email Verification";

  const base = String(origin || "").replace(/\/+$/, "");
  const params = new URLSearchParams();
  if (email) params.set("email", String(email));
  if (token) params.set("token", String(token));
  if (role) params.set("role", String(role));

  const verificationLink = `${base}/verify-email?${params.toString()}`;

  const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2>Email Verification</h2>
            <p>Hello ${name || ""},</p>
            <p>Please verify your email address by clicking the button below.</p>
            <p style="margin: 24px 0;">
                <a
                    href="${verificationLink}"
                    style="display: inline-block; padding: 12px 18px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 6px;"
                >
                    Verify Email
                </a>
            </p>
            <p>If the button doesn't work, copy and paste this link:</p>
            <p><a href="${verificationLink}">${verificationLink}</a></p>
        </div>
    `;

  return sendEmail({ email, subject, html });
};

module.exports = sendVerificationEmail;
