const express = require("express");
const router = express.Router();
const {
  sendContactUsMailController,
} = require("../../controller/dataController/contactController");

router.route("/").post(sendContactUsMailController);

module.exports = router;
