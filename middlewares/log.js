const { LogModel } = require("../models/Log.model");
const { TokenModel } = require("../models/Token.model");
const { UserModel } = require("../models/User.model");
const { isTokenValid } = require("../utils");

const logActivity = (action) => {
  // roles param can be a single role, or an array of roles
  return async (req, res, next) => {
    console.log(req.signedCookies);
    const { refreshToken } = req.signedCookies;
    console.log(refreshToken, "Refresh Token");
    const payload = isTokenValid(refreshToken);
    console.log(payload, "payload");
    const user = await UserModel.findOne({
      _id: payload.user._id
    }) 
    console.log(user, 'user in token');
      const log = await LogModel.create({
        username: user.name,
        email: user.email,
        userId: user._id,
        role: user.role,
        ipAddress: req.ip,
        action,
        time: new Date(),
      });
      next();
    
  };
};

module.exports = {
  logActivity,
};
