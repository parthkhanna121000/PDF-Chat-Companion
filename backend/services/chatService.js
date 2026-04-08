const {
  geminiModel,
  geminiSummaryModel,
  geminiFlashcardModel,
} = require("../config/gemini");
const {
  searchSimilarChunks,
  getAllChunksForFile,
} = require("./embeddingService");
const Conversation = require("../models/Conversation");
const Document = require("../models/Document");

// ✅ Build RAG prompt with PDF context
const buildPromptWithContext = (question, relevantChunks, chatHistory) => {
  const context = relevantChunks
    .map(
      (chunk, i) =>
        `[Source ${i + 1} from "${chunk.filename}"]:\n${chunk.text}`,
    )
    .join("\n\n");

  const historyText = chatHistory
    .slice(-6)
    .map(
      (msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`,
    )
    .join("\n");

  return `You are a helpful AI assistant that answers questions based on PDF documents.

INSTRUCTIONS:
- Answer questions ONLY based on the provided PDF context below
- If the answer is not in the context, say "I couldn't find this information in the uploaded PDFs"
- Be concise, clear, and accurate
- Use markdown formatting for better readability
- Reference which source you used when possible

PDF CONTEXT:
${context}

${historyText ? `PREVIOUS CONVERSATION:\n${historyText}\n` : ""}
Now answer the following question:`;
};

// ✅ Main chat function
const chatWithPDF = async (question, filenames = [], sessionId = "default") => {
  try {
    // Step 1: Search relevant chunks
    console.log(`🔍 Searching for: "${question}"`);
    const searchResult = await searchSimilarChunks(question, filenames, 5);

    if (!searchResult.success) {
      throw new Error(searchResult.error);
    }

    if (searchResult.results.length === 0) {
      return {
        success: false,
        error:
          "No relevant content found. Please upload and embed a PDF first.",
      };
    }

    // Step 2: Get or create conversation
    let conversation = await Conversation.findOne({ sessionId });

    if (!conversation) {
      conversation = new Conversation({
        sessionId,
        messages: [],
        filesUsed: filenames,
      });
    }

    // Step 3: Build prompt
    const prompt = buildPromptWithContext(
      question,
      searchResult.results,
      conversation.messages,
    );

    // Step 4: Send to Gemini
    console.log(`🤖 Sending to Gemini...`);
    const response = await geminiModel.invoke([
      {
        role: "user",
        content: prompt + "\n\nQuestion: " + question,
      },
    ]);

    const answer = response.content;

    // Step 5: Prepare sources
    const sources = searchResult.results.map((r) => ({
      filename: r.filename,
      similarity: (r.similarity * 100).toFixed(1) + "%",
      preview: r.text.slice(0, 150) + "...",
      pageNumber: r.pageNumber || 0,
    }));

    // Step 6: Save to MongoDB
    conversation.messages.push(
      { role: "user", content: question },
      {
        role: "assistant",
        content: answer,
        sources,
      },
    );

    conversation.updatedAt = new Date();

    for (const filename of filenames) {
      if (!conversation.filesUsed.includes(filename)) {
        conversation.filesUsed.push(filename);
      }
    }

    await conversation.save();
    console.log(`✅ Conversation saved`);

    return {
      success: true,
      question,
      answer,
      sources,
      sessionId,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ chatWithPDF error:", error.message);
    return { success: false, error: error.message };
  }
};

// ✅ Summarize PDF
const summarizePDF = async (filename, type = "brief") => {
  try {
    console.log(`📝 Summarizing ${filename} (${type})...`);

    // ✅ Check cache in MongoDB first
    const docRecord = await Document.findOne({ filename });

    if (docRecord?.summary?.[type]) {
      console.log(`✅ Using cached ${type} summary`);
      return {
        success: true,
        summary: docRecord.summary[type],
        cached: true,
      };
    }

    // ✅ Get all text from embeddings
    const fullText = await getAllChunksForFile(filename);

    if (!fullText) {
      return {
        success: false,
        error: "PDF not embedded yet. Please embed first.",
      };
    }

    // ✅ Build summary prompt
    const prompts = {
      brief: `Summarize the following document in 3-5 concise paragraphs.
Focus on the main topics, key findings, and important conclusions.
Use clear, professional language.

DOCUMENT CONTENT:
${fullText.slice(0, 15000)}

Provide a clear, well-structured summary:`,

      detailed: `Provide a comprehensive, detailed summary of the following document.
Include:
1. Main topics and themes
2. Key findings and insights
3. Important data or statistics mentioned
4. Conclusions and recommendations
5. Any notable methodology or approach

DOCUMENT CONTENT:
${fullText.slice(0, 20000)}

Provide a detailed, well-structured summary with headings:`,

      bullets: `Summarize the following document as a clear bullet-point list.
Extract the most important points, findings, and key information.
Format as markdown bullet points grouped by topic.

DOCUMENT CONTENT:
${fullText.slice(0, 15000)}

Bullet-point summary:`,
    };

    const prompt = prompts[type] || prompts.brief;

    // ✅ Generate summary
    const response = await geminiSummaryModel.invoke([
      { role: "user", content: prompt },
    ]);

    const summary = response.content;

    // ✅ Cache in MongoDB
    try {
      await Document.findOneAndUpdate(
        { filename },
        {
          [`summary.${type}`]: summary,
          "summary.generatedAt": new Date(),
        },
        { upsert: true },
      );
    } catch (cacheError) {
      console.warn("⚠️ Could not cache summary:", cacheError.message);
    }

    console.log(`✅ Summary generated (${summary.length} chars)`);

    return {
      success: true,
      summary,
      type,
      cached: false,
    };
  } catch (error) {
    console.error("❌ summarizePDF error:", error.message);
    return { success: false, error: error.message };
  }
};

// ✅ Generate flashcards
const generateFlashcards = async (filename, count = 10) => {
  try {
    console.log(`🃏 Generating ${count} flashcards for ${filename}...`);

    // ✅ Check cache
    const docRecord = await Document.findOne({ filename });

    if (docRecord?.flashcards?.length > 0) {
      console.log(`✅ Using cached flashcards`);
      return {
        success: true,
        flashcards: docRecord.flashcards.slice(0, count),
        cached: true,
      };
    }

    // ✅ Get all text
    const fullText = await getAllChunksForFile(filename);

    if (!fullText) {
      return {
        success: false,
        error: "PDF not embedded yet. Please embed first.",
      };
    }

    // ✅ Build flashcard prompt
    const prompt = `You are an expert educator. Create exactly ${count} high-quality flashcards from the following document.

RULES:
- Each flashcard must have a clear, specific question and a concise answer
- Questions should test understanding, not just memory
- Answers should be 1-3 sentences maximum
- Cover the most important concepts in the document
- Return ONLY valid JSON, no other text

DOCUMENT CONTENT:
${fullText.slice(0, 15000)}

Return this exact JSON format:
{
  "flashcards": [
    {
      "id": "1",
      "question": "What is...?",
      "answer": "It is..."
    }
  ]
}`;

    const response = await geminiFlashcardModel.invoke([
      { role: "user", content: prompt },
    ]);

    // ✅ Parse JSON response
    let flashcards = [];
    try {
      const rawText = response.content;
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      flashcards = parsed.flashcards || [];

      // ✅ Ensure IDs are strings
      flashcards = flashcards.map((card, i) => ({
        id: String(card.id || i + 1),
        question: card.question || "",
        answer: card.answer || "",
      }));
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError.message);
      return {
        success: false,
        error: "Failed to parse flashcards from AI response",
      };
    }

    if (flashcards.length === 0) {
      return {
        success: false,
        error: "No flashcards generated",
      };
    }

    // ✅ Cache in MongoDB
    try {
      await Document.findOneAndUpdate(
        { filename },
        { flashcards },
        { upsert: true },
      );
    } catch (cacheError) {
      console.warn("⚠️ Could not cache flashcards:", cacheError.message);
    }

    console.log(`✅ Generated ${flashcards.length} flashcards`);

    return {
      success: true,
      flashcards,
      total: flashcards.length,
      cached: false,
    };
  } catch (error) {
    console.error("❌ generateFlashcards error:", error.message);
    return { success: false, error: error.message };
  }
};

// ✅ Get chat history
const getChatHistory = async (sessionId = "default") => {
  try {
    const conversation = await Conversation.findOne({ sessionId });
    return conversation ? conversation.messages : [];
  } catch (error) {
    console.error("❌ getChatHistory error:", error.message);
    return [];
  }
};

// ✅ Clear chat history
const clearChatHistory = async (sessionId = "default") => {
  try {
    await Conversation.findOneAndUpdate(
      { sessionId },
      {
        messages: [],
        updatedAt: new Date(),
        title: "New Chat",
      },
    );
    return true;
  } catch (error) {
    console.error("❌ clearChatHistory error:", error.message);
    return false;
  }
};

// ✅ Get all sessions
const getAllSessions = async () => {
  try {
    const conversations = await Conversation.find()
      .select("sessionId title filesUsed totalMessages createdAt updatedAt")
      .sort({ updatedAt: -1 });

    return conversations.map((c) => ({
      sessionId: c.sessionId,
      title: c.title || "New Chat",
      messageCount: c.totalMessages || 0,
      filesUsed: c.filesUsed,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  } catch (error) {
    console.error("❌ getAllSessions error:", error.message);
    return [];
  }
};

module.exports = {
  chatWithPDF,
  summarizePDF,
  generateFlashcards,
  getChatHistory,
  clearChatHistory,
  getAllSessions,
};
