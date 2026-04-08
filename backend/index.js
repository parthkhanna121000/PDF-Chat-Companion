const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/database");
const path = require("path");
const { loadEmbeddingsFromDB } = require("./services/embeddingService");
const pdfRoutes = require("./routers/pdf");
const chatRoutes = require("./routers/chat");
// Load environment variables
dotenv.config();
// ✅ Connect to MongoDB
connectDB();
setTimeout(async () => {
  await loadEmbeddingsFromDB();
}, 2000);
// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // React frontend
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Static folder for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Use Routes
app.use("/api/pdf", pdfRoutes);
app.use("/api/chat", chatRoutes);

// ✅ Health check route
app.get("/", (req, res) => {
  res.json({
    status: "✅ PDF Chat Companion API is running",
    version: "1.0.0",
  });
});

// ✅ Health check with API key verification
app.get("/health", (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  res.json({
    status: "healthy",
    gemini_key_loaded: !!apiKey,
    key_preview: apiKey ? `${apiKey.slice(0, 8)}...` : "❌ NOT FOUND",
  });
});
// ✅ Just log that server is ready
setTimeout(() => {
  console.log("✅ Server ready — embeddings load on demand");
}, 2000);
// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  // console.log(`📚 PDF Chat Companion API ready!`);
});
