const { StatusCodes } = require("http-status-codes");
const sendContactUsMail = require("../../utils/sendContactUsEmail");

const buildContactPayload = (body) => {
  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  const mergedName = [firstName, lastName].filter(Boolean).join(" ").trim();

  const name = String(
    body.name || body.contactPerson || mergedName || "",
  ).trim();
  const email = String(body.email || "").trim();
  const message = String(body.message || "").trim();
  const inquiryType = String(
    body.inquiryType ||
      (body.organizationName || body.partnershipType
        ? "Partnership Inquiry"
        : "General Inquiry"),
  ).trim();
  const organizationName = String(
    body.organizationName || body.organization || "",
  ).trim();
  const partnershipType = String(body.partnershipType || "").trim();
  const isPartnership =
    inquiryType.toLowerCase().includes("partnership") ||
    Boolean(organizationName) ||
    Boolean(partnershipType);

  return {
    name,
    email,
    message,
    inquiryType,
    organizationName,
    partnershipType,
    isPartnership,
  };
};

const sendContactUsMailController = async (req, res) => {
  const {
    name,
    email,
    message,
    inquiryType,
    organizationName,
    partnershipType,
    isPartnership,
  } = buildContactPayload(req.body);

  try {
    if (!name || !email || !message) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Please provide name, email, and message" });
    }

    if (isPartnership && (!organizationName || !partnershipType)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message:
          "Please provide organizationName and partnershipType for partnership inquiries",
      });
    }

    await sendContactUsMail({
      name,
      email,
      message,
      inquiryType,
      organizationName,
      partnershipType,
    });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error sending mail", error: error.message });
  }

  res
    .status(StatusCodes.OK)
    .json({ message: "Inquiry email sent successfully" });
};

module.exports = { sendContactUsMailController };
