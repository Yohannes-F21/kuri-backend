const mongoose = require("mongoose");
const sendOTPEmail = require("../utils/sendOTPEmail");
const bcrypt = require("bcryptjs");

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 15 // 15 minutes
    }
})

otpSchema.pre("save", async function(next) {
    if (this.isNew) {
        this.otp = Math.floor(100000 + Math.random() * 900000).toString();
        await sendOTPEmail({ email: this.email, OTP: this.otp });
        this.otp = await bcrypt.hash(this.otp, 10);
    }
    next();
})

const OTPModel = mongoose.model("otp", otpSchema);

module.exports = { OTPModel };
