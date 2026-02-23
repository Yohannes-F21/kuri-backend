const nodemailer = require("nodemailer");
const nodemailerConfig = require("../utils/nodemailerConfig");
const smtpTransport = require("nodemailer-smtp-transport");

const sendContactUsMail = async ({ name, email, message, subject }) => {
  let testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport(
    smtpTransport(nodemailerConfig)
  );

  const mailOptions = {
    from: `${name} <${email}>`,
    to: "johnrobitm@gmail.com",
    subject,
    text: `You received a new message from ${name} (${email}):\n\n${message}`,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = sendContactUsMail;
