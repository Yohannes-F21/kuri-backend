const sendEmail = require("./sendEmail.js")

const sendVerificationEmail = async({name, email, password, token, origin, role}) => {
    const subject = "Email Verification"
    const verificationLink = `${origin}/verify-email?token=${token}&email=${email}&role=${role}`
    const text = `Hello ${name}, this is your temporary password ${password}. Please verify your email by clicking this link and change your password: <a href=${verificationLink}>Verify your Email</a>`
    return sendEmail({email, subject, html: text})
}

module.exports = sendVerificationEmail