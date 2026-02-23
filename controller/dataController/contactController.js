const { StatusCodes } = require("http-status-codes");
const sendContactUsMail = require("../../utils/sendContactUsEmail");
const sendContactUsMailController = async (req, res) => {
  const { name, email, message, subject } = req.body;
  console.log(name, email, message);

  try {
    if (!name || !email || !message || !subject) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Please provide valid details" });
    }
    await sendContactUsMail({ name, email, message, subject });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error sending mail", error });
  }

  res
    .status(StatusCodes.OK)
    .json({ message: "Contact us mail sent successfully" });
};

module.exports = { sendContactUsMailController };
