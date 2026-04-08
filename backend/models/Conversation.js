const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  sources: [{ filename: String, similarity: String, preview: String }],
  timestamp: { type: Date, default: Date.now },
});

const ConversationSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  title: { type: String, default: "New Chat" },
  messages: [MessageSchema],
  filesUsed: [{ type: String }],
  totalMessages: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ✅ Single async hook — no next() needed in Mongoose 9
ConversationSchema.pre("save", async function () {
  this.totalMessages = this.messages.length;
  this.updatedAt = new Date();

  if (this.messages.length > 0 && this.title === "New Chat") {
    const firstUserMsg = this.messages.find((m) => m.role === "user");
    if (firstUserMsg) {
      this.title =
        firstUserMsg.content.slice(0, 50) +
        (firstUserMsg.content.length > 50 ? "…" : "");
    }
  }
});

module.exports = mongoose.model("Conversation", ConversationSchema);
