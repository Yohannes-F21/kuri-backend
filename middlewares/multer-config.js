const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinary");
const crypto = require("crypto");
const path = require("path");

const buildPublicId = (file) => {
  const originalName = String(file?.originalname || "");
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  const safeBase = base
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  const unique = crypto.randomBytes(8).toString("hex");
  return `kuri/${safeBase || "image"}-${Date.now()}-${unique}`;
};

// Configure multer storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    public_id: (req, file) => buildPublicId(file),
  },
});

const upload = multer({ storage });

module.exports = upload;
