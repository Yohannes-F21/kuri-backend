const mongoose = require("mongoose");

const BlogSchema = mongoose.Schema({
  lang: {
    english: {
      title: {
        type: String,
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
    },
    amharic: {
      title: {
        type: String,
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
    },
  },
  category: {
    enum: ["news", "blog"],
    required: true,
    type: String,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  thumbnail: {
    type: String,
    default: "https://via.placeholder.com/150",
  },
  thumbnailPublicId: {
    type: String,
    default: null,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update the `updated` field before saving
BlogSchema.pre("save", function (next) {
  this.updated = Date.now(); // Update the `updated` field to the current date
  next();
});

// Middleware to update the `updated` field before updating (e.g., using findOneAndUpdate)
BlogSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updated: Date.now() }); // Update the `updated` field to the current date
  next();
});

const BlogModel = mongoose.model("blogs", BlogSchema);

module.exports = BlogModel;
