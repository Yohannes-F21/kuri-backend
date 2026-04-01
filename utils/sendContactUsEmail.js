const sendEmail = require("./sendEmail");

const CONTACT_DESTINATION =
  process.env.CONTACT_EMAIL_TO ||
  process.env.EMAIL_TO ||
  process.env.EMAIL_USER ||
  process.env.EMAIL;

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const sendContactUsMail = async ({
  name,
  email,
  message,
  subject,
  inquiryType,
  organizationName,
  partnershipType,
}) => {
  const safeName = String(name || "").trim();
  const safeEmail = String(email || "").trim();
  const safeMessage = String(message || "").trim();
  const safeInquiryType = String(inquiryType || "General Inquiry").trim();
  const safeOrganizationName = String(organizationName || "").trim();
  const safePartnershipType = String(partnershipType || "").trim();
  const isPartnership =
    safeInquiryType.toLowerCase().includes("partnership") ||
    Boolean(safeOrganizationName) ||
    Boolean(safePartnershipType);

  const emailSubject =
    subject ||
    (isPartnership
      ? `Partnership Inquiry - ${safePartnershipType || "General"}`
      : `Message from Website - ${safeInquiryType}`);

  const textLines = [
    `Inquiry Type: ${safeInquiryType}`,
    `Name: ${safeName}`,
    `Email: ${safeEmail}`,
  ];

  if (isPartnership) {
    textLines.push(`Organization: ${safeOrganizationName || "N/A"}`);
    textLines.push(`Partnership Type: ${safePartnershipType || "N/A"}`);
  }

  textLines.push("", "Message:", safeMessage);

  const html = `
    <h2>${escapeHtml(emailSubject)}</h2>
    <p><strong>Inquiry Type:</strong> ${escapeHtml(safeInquiryType)}</p>
    <p><strong>Name:</strong> ${escapeHtml(safeName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(safeEmail)}</p>
    ${
      isPartnership
        ? `<p><strong>Organization:</strong> ${escapeHtml(
            safeOrganizationName || "N/A",
          )}</p>
           <p><strong>Partnership Type:</strong> ${escapeHtml(
             safePartnershipType || "N/A",
           )}</p>`
        : ""
    }
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(safeMessage).replace(/\n/g, "<br>")}</p>
  `;

  return sendEmail({
    to: CONTACT_DESTINATION,
    subject: emailSubject,
    text: textLines.join("\n"),
    html,
    replyTo: safeEmail || undefined,
  });
};

module.exports = sendContactUsMail;
