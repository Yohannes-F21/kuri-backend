const { isTokenValid, attachCookiesToResponse } = require("../utils/jwt");
const { TokenModel } = require("../models/Token.model");
const { StatusCodes } = require("http-status-codes");
const { ObjectId } = require("mongodb");

const authenticateUser = async (req, res, next) => {
  const { refreshToken, accessToken } = req.signedCookies;
  try {
    if (accessToken) {
      const payload = isTokenValid(accessToken);
      req.user = payload.user;
      return next();
    }
    const payload = isTokenValid(refreshToken);
    // console.log(payload.refreshToken, payload.user._id, "here");

    const userId = new ObjectId(payload.user._id);
    const existingToken = await TokenModel.findOne({
      user: userId,
      refreshToken: payload.refreshToken,
    });

    if (!existingToken || !existingToken?.isValid) {
      throw new Error("Invalid token or session expired");
    }

    attachCookiesToResponse({
      res,
      user: payload.user,
      refreshToken: existingToken.refreshToken,
    });
    req.user = payload.user;
    next();
  } catch (error) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Invalid! No logged in session" });
  }
};

const checkIfUserExists = async (req, res, next) => {
  const { refreshToken, accessToken } = req.signedCookies;
  try {
    if (refreshToken) {
      const payload = isTokenValid(refreshToken);
      const userId = new ObjectId(payload.user._id);
      const existingToken = await TokenModel.findOne({
        user: userId,
        refreshToken: payload.refreshToken,
      });
      if (existingToken) {
        return res
          .status(StatusCodes.FORBIDDEN)
          .json({ message: "There is already a logged in session!" });
      }
    }
    next();
  } catch (error) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Invalid! No logged in session" });
  }
};

const authorizePermissions = (...roles) => {
  // roles param can be a single role, or an array of roles
  return (req, res, next) => {
    if (!roles.includes(req.user.role.toLowerCase())) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: "Unauthorized to access this route" });
    }
    next();
  };
};

module.exports = {
  authenticateUser,
  authorizePermissions,
  checkIfUserExists,
};
