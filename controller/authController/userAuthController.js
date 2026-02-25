const { UserModel } = require("../../models/User.model");
const { TokenModel } = require("../../models/Token.model");
const { OTPModel } = require("../../models/OTP.model");
const { StatusCodes } = require("http-status-codes");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const axios = require("axios");
const {
  attachCookiesToResponse,
  createTokenUser,
  sendVerificationEmail,
  sendResetPasswordEmail,
} = require("../../utils/");

const frontendOrigin = (
  process.env.FRONT_END_URL || "http://localhost:5173"
).trim();
const frontendLoginUrl = (
  process.env.FRONT_END_LOGIN_URL ||
  `${frontendOrigin.replace(/\/+$/, "")}/login`
).trim();
const backendOrigin = (
  process.env.BACK_END_URL || `http://localhost:${process.env.port || 5000}`
).trim();

const normalizeEmail = (value) => (value || "").trim().toLowerCase();

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findUserByEmailInsensitive = async (normalizedEmail) => {
  if (!normalizedEmail) return null;
  return UserModel.findOne({
    email: new RegExp(`^${escapeRegex(normalizedEmail)}$`, "i"),
  });
};

const getMe = async (req, res) => {
  try {
    const user = req.user;
    // console.log(user);
    res.status(StatusCodes.OK).json({ user });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error fetching user", error });
  }
};

const register = async (req, res) => {
  const { email, name, mobile, gender, password } = req.body;
  try {
    // const response = await axios.post(
    //   `https://www.google.com/recaptcha/api/siteverify?secret=6LcWdU8pAAAAAACjGfKHyYwhbXbXVITsjEdTnXNP&response=${token}`
    // );

    // if (!response.data.success) {
    //   return res
    //     .status(500)
    //     .send({ message: "Error Verifying Captcha.", success: false });
    // }

    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = String(password || "").trim();

    if (!normalizedEmail || !normalizedPassword || !name) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Please provide name, email and password",
      });
    }

    const userExists = await UserModel.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.send({
        success: false,
        message: "User already exists",
      });
    }

    const verificationToken = crypto.randomBytes(40).toString("hex");

    const user = await UserModel.create({
      email: normalizedEmail,
      password: normalizedPassword,
      name,
      verificationToken,
      mobile,
      gender,
    });

    await sendVerificationEmail({
      name,
      email: normalizedEmail,
      token: verificationToken,
      origin: frontendOrigin,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message:
        "User created successfully. Please check your email for verification",
    });
  } catch (error) {
    console.log(error);
    res.send({ message: error, success: false });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || "").trim();

  if (!normalizedEmail || !normalizedPassword) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Please provide email and password",
      code: "MISSING_CREDENTIALS",
    });
  }

  const user = await findUserByEmailInsensitive(normalizedEmail);
  if (!user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: "Invalid email or password",
      code: "INVALID_CREDENTIALS",
    });
  }

  const isPasswordCorrect = await user.comparePassword(normalizedPassword);

  if (!isPasswordCorrect) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: "Invalid email or password",
      code: "INVALID_CREDENTIALS",
    });
  }

  if (!user.isVerified) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: "Please verify your email first",
      code: "EMAIL_NOT_VERIFIED",
    });
  }

  const tokenUser = createTokenUser(user);

  let refreshToken = "";
  const existingToken = await TokenModel.findOne({ user: user._id });

  if (existingToken) {
    const { isValid } = existingToken;

    if (!isValid) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid token" });
    }

    refreshToken = existingToken.refreshToken;
    attachCookiesToResponse({ res, user: tokenUser, refreshToken });
    res.status(StatusCodes.OK).json({ user: tokenUser });
    return;
  }

  refreshToken = crypto.randomBytes(40).toString("hex");
  const userAgent = req.headers["user-agent"] || "unknown";
  const ip = req.ip;
  const userToken = { refreshToken, ip, userAgent, user: user._id };

  await TokenModel.create(userToken);
  attachCookiesToResponse({ res, user: tokenUser, refreshToken });

  res.status(StatusCodes.OK).json({ user: tokenUser });
};

const loginWithOtp = async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const normalizedOtp = String(otp || "").trim();
  // console.log(email, otp, "email, otp");

  if (!normalizedEmail || !normalizedOtp) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Please provide email and otp" });
  }

  const user = await UserModel.findOne({ email: normalizedEmail });

  if (!user) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "No Such User" });
  }

  const otpExists = await OTPModel.findOne({ email: normalizedEmail });
  // console.log(otpExists, "otpExists");

  if (!otpExists) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "No such OTP sent for this account" });
  }

  if (!(await bcrypt.compare(normalizedOtp, otpExists.otp))) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Please Verify with valid OTP" });
  }

  const tokenUser = createTokenUser(user);

  let refreshToken = "";

  const existingToken = await TokenModel.findOne({ user: user._id });
  // console.log(existingToken, "existingToken");

  if (existingToken) {
    const { isValid } = existingToken;

    if (!isValid) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid token" });
    }

    refreshToken = existingToken.refreshToken;
    attachCookiesToResponse({ res, user: tokenUser, refreshToken });
    res.status(StatusCodes.OK).json({ user: tokenUser });
    return;
  }

  refreshToken = crypto.randomBytes(40).toString("hex");
  const userAgent = req.headers["user-agent"] || "unknown";
  const ip = req.ip;
  const userToken = { refreshToken, ip, userAgent, user: user._id };

  await TokenModel.create(userToken);
  // console.log(userToken, "userToken created");
  attachCookiesToResponse({ res, user: tokenUser, refreshToken });

  res.status(StatusCodes.OK).json({ user: tokenUser });
};

const verifyEmail = async (req, res) => {
  const { verificationToken, token, email } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const normalizedToken = String(verificationToken || token || "").trim();

  if (!normalizedEmail || !normalizedToken) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Please provide email and token" });
  }

  const user = await UserModel.findOne({ email: normalizedEmail });
  if (!user || user.verificationToken !== normalizedToken) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Verification Failed" });
  }

  user.isVerified = true;
  user.verified = Date.now();
  user.verificationToken = "";
  await user.save();

  res.status(StatusCodes.OK).json({ success: true, message: "Email verified" });
};

const verifyEmailFromLink = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.query.email);
    const normalizedToken = String(
      req.query.token || req.query.verificationToken || "",
    ).trim();

    if (!normalizedEmail || !normalizedToken) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send(
          `<h2>Verification Failed</h2><p>Missing email or token.</p><p><a href="${frontendOrigin}">Go back</a></p>`,
        );
    }

    const user = await UserModel.findOne({ email: normalizedEmail });
    if (!user || user.verificationToken !== normalizedToken) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .send(
          `<h2>Verification Failed</h2><p>Invalid or expired verification link.</p><p><a href="${frontendOrigin}">Go back</a></p>`,
        );
    }

    user.isVerified = true;
    user.verified = Date.now();
    user.verificationToken = "";
    await user.save();

    return res.redirect(302, frontendLoginUrl);
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(
        `<h2>Verification Failed</h2><p>Something went wrong.</p><p><a href="${frontendLoginUrl}">Go to login</a></p>`,
      );
  }
};

const logout = async (req, res) => {
  // console.log(req.user._id);
  await TokenModel.findOneAndDelete({ user: req.user._id });
  res.cookie("accessToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.cookie("refreshToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.status(StatusCodes.OK).json({ message: "user logged out!" });
};

const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const id = req.params.userId;

  if (!oldPassword || !newPassword) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Please provide new and old passwords",
      success: false,
    });
  }

  const user = await UserModel.findOne({ _id: id });

  if (!user) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "No Such User", success: false });
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);

  if (!isMatch) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: "Old password is incorrect",
    });
  }

  user.password = newPassword;

  await user.save();

  return res
    .status(StatusCodes.OK)
    .json({ success: true, message: "Password changed successfully" });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Please provide valid email" });
  }

  const user = await findUserByEmailInsensitive(normalizedEmail);

  if (user) {
    const passwordToken = crypto.randomBytes(70).toString("hex");

    const tenMinutes = 1000 * 60 * 10;
    const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes);

    user.passwordToken = passwordToken;
    user.passwordTokenExpirationDate = passwordTokenExpirationDate;
    await user.save();

    try {
      await sendResetPasswordEmail({
        name: user.name,
        email: user.email,
        token: passwordToken,
        role: user.role,
        origin: frontendOrigin,
      });
    } catch (error) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Unable to send reset email. Please try again." });
    }
  }

  res
    .status(StatusCodes.OK)
    .json({ message: "Please check your email for reset password link" });
};

const resetPassword = async (req, res) => {
  const { token, email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const normalizedToken = String(token || "").trim();
  const normalizedPassword = String(password || "").trim();

  if (!normalizedToken || !normalizedEmail || !normalizedPassword) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Please provide all fields" });
  }

  const user = await findUserByEmailInsensitive(normalizedEmail);
  if (!user) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "User not found" });
  }

  const currentDate = new Date();
  if (
    user.passwordToken !== normalizedToken ||
    !user.passwordTokenExpirationDate ||
    user.passwordTokenExpirationDate <= currentDate
  ) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Reset link is invalid or expired" });
  }

  user.password = normalizedPassword;
  user.passwordToken = null;
  user.passwordTokenExpirationDate = null;
  await user.save();

  return res
    .status(StatusCodes.OK)
    .json({ message: "Reset Password successful" });
};

// const toggleActivation = async (req, res) => {
//   const { id } = req.params;
//   const user = await UserModel.findOne({ _id: id });
//   if (!user) {
//     return res
//       .status(StatusCodes.NOT_FOUND)
//       .send({ message: `User Not Found!` });
//   }
//   const activated = !user.isActive;
//   try {
//     const user = await UserModel.findByIdAndUpdate(
//       { _id: id },
//       { isActive: activated }
//     );
//     if (!user) {
//       res.status(StatusCodes.NOT_FOUND).send({ message: `Student Not Found!` });
//     }

//     res.status(StatusCodes.OK).send({ message: `User Updated!` });
//   } catch (error) {
//     console.log(error);
//     res
//       .status(StatusCodes.BAD_REQUEST)
//       .send({ message: "Something went wrong, unable to Update." });
//   }
// };

// const adminPromotion = async (req, res) => {
//   const { id } = req.params;
//   const user = await UserModel.findOne({ _id: id });
//   if (!user) {
//     return res
//       .status(StatusCodes.NOT_FOUND)
//       .send({ message: `User Not Found!` });
//   }
//   if (user.role != "teacher") {
//     return res
//       .status(StatusCodes.NOT_FOUND)
//       .send({ message: `User can not be promoted!` });
//   }
//   const isAdmin = !user.isAdmin;
//   try {
//     const user = await UserModel.findByIdAndUpdate({ _id: id }, { isAdmin });
//     if (!user) {
//       res.status(StatusCodes.NOT_FOUND).send({ message: `Student Not Found!` });
//     }

//     res.status(StatusCodes.OK).send({ message: `User Updated!` });
//   } catch (error) {
//     console.log(error);
//     res
//       .status(StatusCodes.BAD_REQUEST)
//       .send({ message: "Something went wrong, unable to Update." });
//   }
// };

module.exports = {
  getMe,
  register,
  login,
  loginWithOtp,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  verifyEmailFromLink,
  logout,
};
