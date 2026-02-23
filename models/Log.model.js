const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  time: { type: String, required: true },
  ipAddress: { type: String, required: true },
  action: { type: String, required: true },
  role: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
});

const LogModel = mongoose.model("logs", logSchema);

module.exports = { LogModel };
