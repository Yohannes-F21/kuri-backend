const { createJWT, isTokenValid, attachCookiesToResponse } = require("./jwt");
const createTokenUser = require("./createTokenUser");
const sendEmail = require("./sendEmail");
const sendResetPasswordEmail = require("./sendResetPasswordEmail");
const sendVerificationEmail = require("./sendVerificationEmail");
const sendContactUsMail = require("./sendContactUsEmail");

module.exports = {
  createJWT,
  isTokenValid,
  attachCookiesToResponse,
  sendContactUsMail,
  createTokenUser,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
};
