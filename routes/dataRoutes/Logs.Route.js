const express = require("express");
const router = express.Router();
const {
  getLogs,
} = require("../../controller/dataController/logDataController");
const {
  authenticateUser,
  authorizePermissions,
} = require("../../middlewares/authentication");

router.get("/", authenticateUser, authorizePermissions("admin"), getLogs);

module.exports = router;
