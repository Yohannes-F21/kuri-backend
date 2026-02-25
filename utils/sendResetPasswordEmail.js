const sendEmail = require("./sendEmail");

const sendResetPasswordEmail = async ({ name, email, token, origin, role }) => {
  const base = String(origin || "").replace(/\/+$/, "");
  const params = new URLSearchParams();
  if (token) params.set("token", String(token));
  if (email) params.set("email", String(email));
  if (role) params.set("role", String(role));

  const resetLink = `${base}/reset-password?${params.toString()}`;
  const message = `<p>Please reset password by clicking on the following link: <a href="${resetLink}">Reset Password</a></p>`;

  return sendEmail({
    email,
    subject: "Reset Password",
    html: `<h4>Hello ${name}, </h4> ${message}`,
  });
};

module.exports = sendResetPasswordEmail;
