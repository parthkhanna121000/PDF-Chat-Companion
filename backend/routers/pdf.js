const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const path = require("path");
const fs = require("fs");

// ✅ Services
const { processPDF } = require("../services/pdfService");
const {
  storePDFEmbeddings,
  isFileEmbedded,
  getEmbeddedFiles,
  removeFileEmbeddings,
} = require("../services/embeddingService");
const { summarizePDF, generateFlashcards } = require("../services/chatService");

// ✅ Models
const Document = require("../models/Document");
const Embedding = require("../models/Embedding");

const getFileURL = (filename) => `http://localhost:5000/uploads/${filename}`;

// ==============================
// ✅ TEST ROUTE
// ==============================
router.get("/test", (req, res) => {
  res.json({ message: "✅ PDF router is working" });
});

// ==============================
// ✅ UPLOAD + AUTO PROCESS
// ==============================
router.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const filename = req.file.filename;
    const fileURL = getFileURL(filename);
    const filePath = req.file.path;

    console.log(`📁 File received: ${filename}`);

    await Document.findOneAndUpdate(
      { filename },
      {
        filename,
        originalName: req.file.originalname,
        size: req.file.size,
        fileUrl: fileURL,
        isEmbedded: false,
        status: "uploading",
        error: null,
      },
      { upsert: true, returnDocument: "after" },
    );

    res.status(200).json({
      message: "PDF uploaded! Processing in background...",
      file: {
        originalName: req.file.originalname,
        savedAs: filename,
        size: `${(req.file.size / 1024).toFixed(2)} KB`,
        sizeBytes: req.file.size,
        url: fileURL,
        uploadedAt: new Date().toISOString(),
        status: "processing",
      },
    });

    processAndEmbedInBackground(filename, filePath, req.file);
  } catch (error) {
    console.error("❌ Upload error:", error.message);
    res.status(500).json({ error: "Upload failed", details: error.message });
  }
});

// ==============================
// 🔥 BACKGROUND PROCESSING
// ==============================
const processAndEmbedInBackground = async (filename, filePath) => {
  try {
    console.log(`⚙️ Background processing: ${filename}`);

    await Document.findOneAndUpdate(
      { filename },
      { status: "processing" },
      { upsert: true, returnDocument: "after" },
    );
    console.log(`📋 Status → processing`);

    const processed = await processPDF(filePath);

    if (!processed.success) {
      console.error(`❌ Processing failed: ${processed.error}`);
      await Document.findOneAndUpdate(
        { filename },
        { status: "failed", error: processed.error },
        { returnDocument: "after" },
      );
      return;
    }

    console.log(`✅ Processed: ${processed.totalChunks} chunks`);

    await Document.findOneAndUpdate(
      { filename },
      {
        status: "embedding",
        pages: processed.metadata?.pages || 0,
        title: processed.metadata?.title || filename,
        author: processed.metadata?.author || "Unknown",
      },
      { returnDocument: "after" },
    );
    console.log(`📋 Status → embedding`);

    const embedded = await storePDFEmbeddings(filename, processed.chunks);

    if (!embedded.success) {
      console.error(`❌ Embedding failed: ${embedded.error}`);
      await Document.findOneAndUpdate(
        { filename },
        { status: "failed", error: embedded.error },
        { returnDocument: "after" },
      );
      return;
    }

    const updatedDoc = await Document.findOneAndUpdate(
      { filename },
      {
        status: "ready",
        isEmbedded: true,
        totalChunks: embedded.totalChunks,
        embeddedAt: new Date(),
        error: null,
      },
      { returnDocument: "after" },
    );

    console.log(`📋 Status → ready`);
    console.log(`🎉 ${filename} is ready! chunks: ${embedded.totalChunks}`);
    console.log(`✅ DB status: ${updatedDoc?.status}`);
  } catch (error) {
    console.error(`❌ Background error: ${error.message}`);
    try {
      await Document.findOneAndUpdate(
        { filename },
        { status: "failed", error: error.message },
        { returnDocument: "after" },
      );
    } catch (dbError) {
      console.error(`❌ Could not update status: ${dbError.message}`);
    }
  }
};

// ==============================
// ✅ STATUS
// ==============================
router.get("/status/:filename", async (req, res) => {
  try {
    const doc = await Document.findOne({ filename: req.params.filename });
    if (!doc) return res.status(404).json({ error: "File not found" });

    res.json({
      filename: doc.filename,
      status: doc.status || (doc.isEmbedded ? "ready" : "processing"),
      isEmbedded: doc.isEmbedded,
      totalChunks: doc.totalChunks,
      pages: doc.pages,
      title: doc.title,
      error: doc.error || null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==============================
// ✅ LIST FILES
// ==============================
router.get("/list", async (req, res) => {
  try {
    const docs = await Document.find().sort({ uploadedAt: -1 });
    res.json({ total: docs.length, files: docs });
  } catch (error) {
    res
      .status(500)
      .json({ error: "❌ Could not fetch files", details: error.message });
  }
});

// ==============================
// ✅ SINGLE FILE INFO
// ==============================
router.get("/info/:filename", async (req, res) => {
  try {
    const doc = await Document.findOne({ filename: req.params.filename });
    if (!doc) return res.status(404).json({ error: "❌ File not found" });

    res.json({
      filename: doc.filename,
      originalName: doc.originalName,
      size: `${(doc.size / 1024).toFixed(2)} KB`,
      sizeBytes: doc.size,
      url: doc.fileUrl,
      uploadedAt: doc.createdAt,
      isEmbedded: doc.isEmbedded,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==============================
// ✅ EMBEDDED FILES
// ==============================
router.get("/embedded", async (req, res) => {
  try {
    const files = await getEmbeddedFiles();
    res.json({ total: files.length, files });
  } catch (error) {
    res.status(500).json({
      error: "❌ Could not fetch embedded files",
      details: error.message,
    });
  }
});

// ==============================
// ✅ SUMMARIZE
// ==============================
router.post("/summarize/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const { type = "brief" } = req.body;

    const result = await summarizePDF(filename, type);
    if (!result.success) return res.status(400).json({ error: result.error });

    res.json({
      message: "PDF summarized successfully!",
      filename,
      summary: result.summary,
      type: result.type,
      cached: result.cached,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "❌ Summarize failed", details: error.message });
  }
});

// ==============================
// ✅ FLASHCARDS
// ==============================
router.post("/flashcards/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const { count = 10 } = req.body;

    const result = await generateFlashcards(filename, count);
    if (!result.success) return res.status(400).json({ error: result.error });

    res.json({
      message: "Flashcards generated successfully!",
      filename,
      total: result.total,
      flashcards: result.flashcards,
      cached: result.cached,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "❌ Flashcards failed", details: error.message });
  }
});

// ==============================
// ✅ FORCE RE-EMBED
// ==============================
router.post("/force-embed/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "../uploads", filename);

    if (!fs.existsSync(filePath))
      return res.status(404).json({ error: "❌ File not found" });

    await Embedding.deleteMany({ filename });
    await removeFileEmbeddings(filename);

    const processed = await processPDF(filePath);
    const embedded = await storePDFEmbeddings(filename, processed.chunks);

    res.json({
      message: "✅ Re-embedded successfully",
      filename,
      totalChunks: embedded.totalChunks,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "❌ Force embed failed", details: error.message });
  }
});

// ==============================
// ✅ DELETE
// ==============================
router.delete("/delete/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "../uploads", filename);

    if (!fs.existsSync(filePath))
      return res.status(404).json({ error: "❌ File not found" });

    fs.unlinkSync(filePath);
    await Document.findOneAndDelete({ filename });
    await Embedding.deleteMany({ filename });
    await removeFileEmbeddings(filename);

    res.json({ message: `✅ ${filename} deleted`, filename });
  } catch (error) {
    res.status(500).json({ error: "❌ Delete failed", details: error.message });
  }
});

// ==============================
// ✅ DEBUG
// ==============================
router.get("/debug", async (req, res) => {
  try {
    const totalEmbeddings = await Embedding.countDocuments();
    const totalDocs = await Document.countDocuments();
    const diskFiles = fs.readdirSync(path.join(__dirname, "../uploads"));

    res.json({
      mongodb: { totalEmbeddings, totalDocuments: totalDocs },
      disk: { totalFiles: diskFiles.length, files: diskFiles },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
