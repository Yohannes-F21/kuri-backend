const sendEmail = require("./sendEmail");

const sendOTPEmail = async ({ email, OTP }) => {
  //   const resetLink = `${origin}/user/reset-password?token=${token}&email=${email}`;
  //   const message = `<p>Please reset password by clicking on the following link: <a href="${resetLink}">Reset Password</a></p>`;
  console.log(email, "the email");
  return sendEmail({
    email,
    subject: "Please Confirm your OTP(One Time Password)",
    html: `<h4>Here is your OTP code: ${OTP}, </h4>`,
  });
};

module.exports = sendOTPEmail;
