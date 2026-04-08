const { geminiEmbeddings } = require("../config/gemini");
const Embedding = require("../models/Embedding");

// ✅ Only cache FILENAMES — lightweight
let embeddedFilenames = new Set();
let vectorCache = {}; // only for search

// ==============================
// ✅ LOAD INDEX (LIGHTWEIGHT)
// ==============================
const loadEmbeddingsFromDB = async () => {
  try {
    console.log("📂 Loading embedding index from MongoDB...");

    const embeddings = await Embedding.find()
      .select("filename totalChunks createdAt")
      .lean();

    embeddedFilenames = new Set(embeddings.map((e) => e.filename));

    console.log(`✅ Indexed ${embeddings.length} embedded files`);
    return embeddings;
  } catch (error) {
    console.error(`❌ Error loading index: ${error.message}`);
  }
};

// ==============================
// ✅ LOAD FILE VECTORS (LAZY)
// ==============================
const loadFileVectorsFromDB = async (filename) => {
  try {
    if (vectorCache[filename]) {
      return vectorCache[filename];
    }

    console.log(`📂 Loading vectors for: ${filename}`);

    const doc = await Embedding.findOne({ filename })
      .select("chunks createdAt")
      .lean();

    if (!doc) return null;

    vectorCache[filename] = {
      chunks: doc.chunks,
      createdAt: doc.createdAt,
    };

    console.log(`✅ Loaded ${doc.chunks.length} vectors`);
    return vectorCache[filename];
  } catch (error) {
    console.error(`❌ loadFileVectorsFromDB error: ${error.message}`);
    return null;
  }
};

// ==============================
// ✅ EMBED TEXT
// ==============================
const embedText = async (text) => {
  try {
    let textStr = "";

    if (typeof text === "string") textStr = text;
    else if (Array.isArray(text)) textStr = text.join(" ");
    else textStr = String(text);

    textStr = textStr.trim();

    if (!textStr) {
      throw new Error("Empty text");
    }

    if (textStr.length > 8000) {
      textStr = textStr.slice(0, 8000);
    }

    const embedding = await geminiEmbeddings.embedQuery(textStr);

    if (!Array.isArray(embedding)) {
      throw new Error("Invalid embedding response");
    }

    return embedding;
  } catch (error) {
    console.error("❌ embedText error:", error.message);
    throw error;
  }
};

// ==============================
// ✅ COSINE SIMILARITY
// ==============================
const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length !== b.length) return 0;

  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

  if (!magA || !magB) return 0;

  return dot / (magA * magB);
};

// ==============================
// 🔥 UPDATED STORE EMBEDDINGS (BATCH + LOW MEMORY)
// ==============================
const storePDFEmbeddings = async (filename, chunks) => {
  try {
    console.log(`📊 Embedding ${chunks.length} chunks for ${filename}...`);

    const BATCH_SIZE = 5;
    const allEmbeddedChunks = [];
    let failedChunks = 0;

    for (let batch = 0; batch < chunks.length; batch += BATCH_SIZE) {
      const batchChunks = chunks.slice(batch, batch + BATCH_SIZE);

      console.log(
        `   Batch ${Math.floor(batch / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}`,
      );

      for (let i = 0; i < batchChunks.length; i++) {
        const chunk = batchChunks[i];
        const chunkText =
          typeof chunk === "string" ? chunk : String(chunk.text || "");

        if (!chunkText.trim()) {
          failedChunks++;
          continue;
        }

        try {
          const embedding = await embedText(chunkText);

          allEmbeddedChunks.push({
            text: chunkText,
            embedding,
            chunkIndex: batch + i,
            pageNumber: chunk.pageNumber || 0,
          });
        } catch (err) {
          console.warn(`⚠️ Chunk ${batch + i + 1} failed: ${err.message}`);
          failedChunks++;
        }

        // ✅ Small delay (rate limit + GC breathing)
        await new Promise((r) => setTimeout(r, 200));
      }

      // ✅ Pause between batches
      await new Promise((r) => setTimeout(r, 500));

      // ✅ Optional: manual GC for very large PDFs
      if (global.gc) global.gc();
    }

    if (allEmbeddedChunks.length === 0) {
      throw new Error("No chunks were successfully embedded");
    }

    console.log(
      `✅ Embedded ${allEmbeddedChunks.length}/${chunks.length} chunks`,
    );

    // ✅ Save to MongoDB
    const savedDoc = await Embedding.findOneAndUpdate(
      { filename },
      {
        filename,
        chunks: allEmbeddedChunks,
        totalChunks: allEmbeddedChunks.length,
        embeddingModel: "gemini-embedding-001",
        dimensions: allEmbeddedChunks[0]?.embedding?.length || 3072,
        updatedAt: new Date(),
      },
      { upsert: true, returnDocument: "after" },
    );

    console.log(`💾 Saved to MongoDB: ${savedDoc._id}`);

    // ✅ Update filename index only
    embeddedFilenames.add(filename);

    // ✅ Don't cache — free memory immediately
    // Vectors will load from DB when needed for search

    console.log(`🎉 ${filename} ready!`);

    return {
      success: true,
      totalChunks: allEmbeddedChunks.length,
      failedChunks,
    };
  } catch (error) {
    console.error("❌ storePDFEmbeddings error:", error.message);
    return { success: false, error: error.message };
  }
};

// ==============================
// ✅ SEARCH
// ==============================
const searchSimilarChunks = async (query, filenames = [], topK = 5) => {
  try {
    const queryEmbedding = await embedText(query);
    const results = [];

    const filesToSearch =
      filenames.length > 0 ? filenames : Array.from(embeddedFilenames);

    for (const filename of filesToSearch) {
      const fileData = await loadFileVectorsFromDB(filename);
      if (!fileData) continue;

      for (const chunk of fileData.chunks) {
        if (!chunk.embedding) continue;

        const score = cosineSimilarity(queryEmbedding, chunk.embedding);

        results.push({
          filename,
          text: chunk.text,
          similarity: score,
          chunkIndex: chunk.chunkIndex,
          pageNumber: chunk.pageNumber || 0,
        });
      }
    }

    return {
      success: true,
      results: results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK),
    };
  } catch (error) {
    console.error("❌ search error:", error.message);
    return { success: false, error: error.message };
  }
};
// ==============================
// ✅ GET ALL CHUNKS AS TEXT
// ==============================
const getAllChunksForFile = async (filename) => {
  try {
    const fileData = await loadFileVectorsFromDB(filename);
    if (!fileData) return null;
    return fileData.chunks.map((c) => c.text).join("\n\n");
  } catch (error) {
    console.error("❌ getAllChunksForFile error:", error.message);
    return null;
  }
};
// ==============================
// EXPORTS
// ==============================
module.exports = {
  storePDFEmbeddings,
  searchSimilarChunks,
  getAllChunksForFile, // ✅ added
  isFileEmbedded: async (filename) => {
    if (embeddedFilenames.has(filename)) return true;

    const doc = await Embedding.findOne({ filename }).lean();
    if (doc) {
      embeddedFilenames.add(filename);
      return true;
    }

    return false;
  },
  getEmbeddedFiles: async () => {
    const docs = await Embedding.find()
      .select("filename totalChunks createdAt")
      .lean();

    embeddedFilenames = new Set(docs.map((d) => d.filename));

    return docs;
  },
  removeFileEmbeddings: async (filename) => {
    await Embedding.findOneAndDelete({ filename });
    embeddedFilenames.delete(filename);
    delete vectorCache[filename];
    return true;
  },
  loadEmbeddingsFromDB,
};
