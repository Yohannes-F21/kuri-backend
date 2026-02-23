const express = require("express");
const router = express.Router();

const {
  register,
  login,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  sendOTP,
  changePassword,
  getMe,
} = require("../../controller/authController/userAuthController");
const { authenticateUser } = require("../../middlewares/authentication");
// const { logActivity } = require("../../middlewares/log");

router.get("/me", authenticateUser, getMe);
router.post("/register", register);
router.post("/login", sendOTP);
router.post("/login-otp", login);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password/:userId", authenticateUser, changePassword);
router.delete("/logout", authenticateUser, logout);
router.get("/get-session", authenticateUser, (req, res) => {
  res.status(200).json({ message: "Session is valid" });
});

module.exports = router;
