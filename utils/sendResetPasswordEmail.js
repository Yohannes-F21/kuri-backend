const sendEmail = require("./sendEmail");

const sendResetPasswordEmail = async ({ name, email, token, origin, role }) => {
  const resetLink = `${origin}/reset-password?token=${token}&email=${email}&role=${role}`;
  const message = `<p>Please reset password by clicking on the following link: <a href=${resetLink}>Reset Password</a></p>`;
  console.log(email);
  return sendEmail({
    email,
    subject: "Reset Password",
    html: `<h4>Hello ${name}, </h4> ${message}`,
  });
};

module.exports = sendResetPasswordEmail;
