const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();
console.log("✅ gemini.js loaded — raw SDK");

if (!process.env.GEMINI_API_KEY) {
  throw new Error("❌ GEMINI_API_KEY is missing in .env file!");
}

const googleAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ One reusable function to get a model
const getModel = (modelName = "gemini-2.5-flash-lite") =>
  googleAI.getGenerativeModel({ model: modelName });

// ==============================
// ✅ Chat/RAG model with full debug
// ==============================
const geminiModel = {
  invoke: async (messages) => {
    try {
      const model = getModel();
      const prompt = messages.map((m) => m.content).join("\n");

      // 🔹 Debug prompt
      console.log("📝 Prompt length:", prompt.length);
      console.log("📝 Prompt preview:", prompt.slice(0, 100));

      // 🔹 Original call (may fail)
      // const result = await model.generateContent(prompt);

      // 🔹 Updated v0.24 explicit format
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      });

      return { content: result.response.text() };
    } catch (err) {
      console.error("❌ FULL STACK:", err.stack); // FULL SDK stack trace
      throw err;
    }
  },
};

// ==============================
// ✅ Summary model
// ==============================
const geminiSummaryModel = {
  invoke: async (messages) => {
    const model = getModel();
    const prompt = messages.map((m) => m.content).join("\n");

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    return { content: result.response.text() };
  },
};

// ==============================
// ✅ Flashcard model
// ==============================
const geminiFlashcardModel = {
  invoke: async (messages) => {
    const model = getModel();
    const prompt = messages.map((m) => m.content).join("\n");

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    return { content: result.response.text() };
  },
};

// ==============================
// ✅ Embeddings
// ==============================
const embeddingModel = getModel("gemini-embedding-001");
const geminiEmbeddings = {
  embedQuery: async (text) => {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  },
  embedDocuments: async (texts) => {
    const embeddings = [];
    for (const text of texts) {
      const result = await embeddingModel.embedContent(text);
      embeddings.push(result.embedding.values);
    }
    return embeddings;
  },
};

// ==============================
// ✅ Test functions
// ==============================
const testGeminiConnection = async () => {
  try {
    const result = await geminiModel.invoke([
      { role: "user", content: "Say 'Gemini connected!' in exactly 3 words." },
    ]);
    return { success: true, message: result.content };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const testEmbeddingConnection = async () => {
  try {
    const result = await embeddingModel.embedContent("test");
    return { success: true, dimensions: result.embedding.values.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  geminiModel,
  geminiSummaryModel,
  geminiFlashcardModel,
  geminiEmbeddings,
  testGeminiConnection,
  testEmbeddingConnection,
};
