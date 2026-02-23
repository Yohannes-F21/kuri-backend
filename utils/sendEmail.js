const nodemailer = require("nodemailer");
const nodemailerConfig = require("../utils/nodemailerConfig");
const smtpTransport = require("nodemailer-smtp-transport");

const sendEmail = async ({ email, subject, html }) => {
  let testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport(
    smtpTransport(nodemailerConfig)
  );

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
