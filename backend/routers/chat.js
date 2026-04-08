const express = require("express");
const router = express.Router();
const {
  testGeminiConnection,
  testEmbeddingConnection,
  geminiModel,
} = require("../config/gemini");

const {
  chatWithPDF,
  summarizePDF,
  generateFlashcards,
  getChatHistory,
  clearChatHistory,
  getAllSessions,
} = require("../services/chatService");

const { searchSimilarChunks } = require("../services/embeddingService");

// ✅ Test route
router.get("/test", (req, res) => {
  res.json({ message: "✅ Chat router is working" });
});

// ✅ Test Gemini connection
router.get("/test-gemini", async (req, res) => {
  try {
    const result = await testGeminiConnection();
    if (!result.success) {
      return res
        .status(500)
        .json({ error: "❌ Gemini connection failed", details: result.error });
    }
    res.json({
      message: "✅ Gemini AI connected successfully!",
      geminiSays: result.message,
    });
  } catch (error) {
    res.status(500).json({ error: "❌ Test failed", details: error.message });
  }
});

// ✅ Test embedding connection
router.get("/test-embedding", async (req, res) => {
  try {
    const result = await testEmbeddingConnection();
    if (!result.success) {
      return res.status(500).json({
        error: "❌ Embedding connection failed",
        details: result.error,
      });
    }
    res.json({
      message: "✅ Embedding model connected!",
      model: "gemini-embedding-001",
      dimensions: result.dimensions,
    });
  } catch (error) {
    res.status(500).json({ error: "❌ Test failed", details: error.message });
  }
});

// ✅ Main chat endpoint
router.post("/ask", async (req, res) => {
  try {
    const { question, filenames, sessionId } = req.body;
    if (!question || question.trim().length === 0) {
      return res.status(400).json({ error: "❌ Please provide a question" });
    }
    console.log(`💬 Question received: "${question}"`);
    const result = await chatWithPDF(
      question,
      filenames || [],
      sessionId || "default",
    );
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({
      success: true,
      question: result.question,
      answer: result.answer,
      sources: result.sources,
      sessionId: result.sessionId,
    });
  } catch (error) {
    res.status(500).json({ error: "❌ Chat failed", details: error.message });
  }
});

// ✅ Stream chat response (SSE)
router.post("/stream", async (req, res) => {
  try {
    const { question, filenames, sessionId } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ error: "❌ Please provide a question" });
    }

    // ✅ Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const send = (event, data) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // ✅ Search relevant chunks
    const searchResult = await searchSimilarChunks(
      question,
      filenames || [],
      5,
    );

    if (!searchResult.success || searchResult.results.length === 0) {
      send("error", { message: "No relevant content found." });
      return res.end();
    }

    // ✅ Send sources first
    const sources = searchResult.results.map((r) => ({
      filename: r.filename,
      similarity: (r.similarity * 100).toFixed(1) + "%",
      preview: r.text.slice(0, 150) + "...",
      pageNumber: r.pageNumber || 0,
    }));
    send("sources", { sources });

    // ✅ Build prompt
    const context = searchResult.results
      .map(
        (chunk, i) =>
          `[Source ${i + 1} from "${chunk.filename}"]:\n${chunk.text}`,
      )
      .join("\n\n");

    const prompt = `You are a helpful AI assistant that answers questions based on PDF documents.
Answer ONLY based on the provided context. Be concise and clear.

PDF CONTEXT:
${context}

Question: ${question}`;

    // ✅ Stream from Gemini
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const googleAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = googleAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
    });

    const streamResult = await model.generateContentStream(prompt);

    for await (const chunk of streamResult.stream) {
      const text = chunk.text();
      if (text) send("chunk", { text });
    }

    send("done", { sessionId: sessionId || "default" });
    res.end();
  } catch (error) {
    console.error("❌ Stream error:", error.message);
    res.write(
      `event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`,
    );
    res.end();
  }
});

// ✅ Summarize via chat
router.post("/summarize", async (req, res) => {
  try {
    const { filename, type = "brief" } = req.body;
    if (!filename)
      return res.status(400).json({ error: "❌ filename is required" });

    const result = await summarizePDF(filename, type);
    if (!result.success) return res.status(400).json({ error: result.error });

    res.json({
      success: true,
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

// ✅ Flashcards via chat
router.post("/flashcards", async (req, res) => {
  try {
    const { filename, count = 10 } = req.body;
    if (!filename)
      return res.status(400).json({ error: "❌ filename is required" });

    const result = await generateFlashcards(filename, count);
    if (!result.success) return res.status(400).json({ error: result.error });

    res.json({
      success: true,
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

// ✅ Get chat history
router.get("/history/:sessionId", async (req, res) => {
  const history = await getChatHistory(req.params.sessionId);
  res.json({
    sessionId: req.params.sessionId,
    totalMessages: history.length,
    history,
  });
});

// ✅ Clear chat history
router.delete("/history/:sessionId", async (req, res) => {
  await clearChatHistory(req.params.sessionId);
  res.json({
    message: `✅ Chat history cleared for session: ${req.params.sessionId}`,
  });
});

// ✅ Get all sessions
router.get("/sessions", async (req, res) => {
  const sessions = await getAllSessions();
  res.json({ total: sessions.length, sessions });
});

module.exports = router;
