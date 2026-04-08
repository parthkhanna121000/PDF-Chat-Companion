const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  pages: {
    type: Number,
    default: 0,
  },
  title: {
    type: String,
    default: "",
  },
  author: {
    type: String,
    default: "Unknown",
  },
  isEmbedded: {
    type: Boolean,
    default: false,
    index: true,
  },
  totalChunks: {
    type: Number,
    default: 0,
  },
  // ✅ Store file URL for frontend PDF viewer
  fileUrl: {
    type: String,
    default: "",
  },
  // ✅ Summary cache
  summary: {
    brief: { type: String, default: "" },
    detailed: { type: String, default: "" },
    generatedAt: { type: Date },
  },
  // ✅ Flashcards cache
  flashcards: [
    {
      id: String,
      question: String,
      answer: String,
    },
  ],
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  embeddedAt: {
    type: Date,
  },
});

// ✅ Virtual for size in KB
DocumentSchema.virtual("sizeKB").get(function () {
  return (this.size / 1024).toFixed(2) + " KB";
});

// ✅ Update embeddedAt when isEmbedded changes
DocumentSchema.pre("save", function (next) {
  if (this.isModified("isEmbedded") && this.isEmbedded) {
    this.embeddedAt = new Date();
  }
  next();
});

module.exports = mongoose.model("Document", DocumentSchema);
