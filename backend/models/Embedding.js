const mongoose = require("mongoose");

const ChunkSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
    chunkIndex: { type: Number, required: true },
    pageNumber: { type: Number, default: 0 },
  },
  { _id: false },
); // ✅ No _id per chunk saves memory

const EmbeddingSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    unique: true, // ✅ Only define index here
  },
  chunks: [ChunkSchema],
  totalChunks: { type: Number, default: 0 },
  embeddingModel: {
    type: String,
    default: "gemini-embedding-001",
  },
  dimensions: { type: Number, default: 3072 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ✅ No separate schema.index() — already defined with unique: true
EmbeddingSchema.pre("save", function (next) {
  this.totalChunks = this.chunks.length;
  this.updatedAt = new Date();
  if (this.chunks.length > 0 && this.chunks[0].embedding) {
    this.dimensions = this.chunks[0].embedding.length;
  }
  next();
});

module.exports = mongoose.model("Embedding", EmbeddingSchema);
