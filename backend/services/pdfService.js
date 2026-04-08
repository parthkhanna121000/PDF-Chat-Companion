const fs = require("fs");
const path = require("path");
const Document = require("../models/Document");
const { getFileURL } = require("../middleware/upload");

// ✅ Extract text from PDF with memory limit
const extractTextFromPDF = async (filePath) => {
  try {
    // ✅ Check file size first
    const stat = fs.statSync(filePath);
    const fileSizeMB = stat.size / (1024 * 1024);

    console.log(`📊 PDF size: ${fileSizeMB.toFixed(2)} MB`);

    if (fileSizeMB > 15) {
      throw new Error(
        `PDF too large (${fileSizeMB.toFixed(1)}MB). ` +
          `Maximum size is 15MB.`,
      );
    }

    // ✅ Dynamically require pdf-parse
    const pdfParse = require("pdf-parse");

    // ✅ Read file
    const dataBuffer = fs.readFileSync(filePath);

    // ✅ Parse with options to limit processing
    const data = await pdfParse(dataBuffer, {
      max: 50, // ✅ Max 50 pages to process
    });

    // ✅ Free buffer immediately
    dataBuffer.fill(0);

    // ✅ Clean text
    const cleanText = data.text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\f/g, "\n")
      .replace(/\u0000/g, "")
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\s+/g, " ")
      .trim();

    // ✅ Limit text size
    const maxChars = 100000; // 100K characters max
    const limitedText =
      cleanText.length > maxChars ? cleanText.slice(0, maxChars) : cleanText;

    if (limitedText.length < 10) {
      throw new Error(
        "PDF appears empty or scanned. " +
          "Only text-based PDFs are supported.",
      );
    }

    console.log(
      `✅ Extracted ${limitedText.length} characters from ${data.numpages} pages`,
    );

    return {
      success: true,
      text: limitedText,
      pages: data.numpages,
      wordCount: limitedText.split(/\s+/).length,
      metadata: {
        pages: data.numpages,
        author: data.info?.Author || "Unknown",
        title: data.info?.Title || path.basename(filePath),
        subject: data.info?.Subject || "",
        keywords: data.info?.Keywords || "",
        creator: data.info?.Creator || "",
        createdAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// ✅ Split text into small chunks
const splitTextIntoChunks = (
  text,
  chunkSize = 600, // ✅ Smaller chunks
  overlap = 100, // ✅ Less overlap
) => {
  const chunks = [];
  let start = 0;

  const cleanText = text.trim();
  if (cleanText.length === 0) return chunks;

  // ✅ Max 50 chunks per PDF
  const maxChunks = 50;

  while (start < cleanText.length && chunks.length < maxChunks) {
    const end = Math.min(start + chunkSize, cleanText.length);
    let chunk = cleanText.slice(start, end);

    // Try to end at sentence boundary
    if (end < cleanText.length) {
      const lastPeriod = chunk.lastIndexOf(". ");
      const lastNewline = chunk.lastIndexOf("\n");
      const boundary = Math.max(lastPeriod, lastNewline);

      if (boundary > chunkSize * 0.5) {
        chunk = chunk.slice(0, boundary + 1);
      }
    }

    if (chunk.trim().length > 30) {
      chunks.push({
        text: chunk.trim(),
        startIndex: start,
        endIndex: start + chunk.length,
        chunkIndex: chunks.length,
        pageNumber: 0,
      });
    }

    start = start + chunk.length - overlap;
    if (start >= cleanText.length) break;
    if (chunk.length === 0) break;
  }

  console.log(`✅ Created ${chunks.length} chunks`);
  return chunks;
};

// ✅ Process PDF
const processPDF = async (filePath) => {
  try {
    console.log(`📄 Processing: ${path.basename(filePath)}`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const stat = fs.statSync(filePath);
    if (stat.size === 0) {
      throw new Error("PDF file is empty");
    }

    // ✅ Extract text
    const extracted = await extractTextFromPDF(filePath);

    if (!extracted.success) {
      throw new Error(extracted.error);
    }

    // ✅ Split into chunks
    const chunks = splitTextIntoChunks(extracted.text);

    if (chunks.length === 0) {
      throw new Error("Could not extract text chunks from PDF");
    }

    // ✅ Free extracted text from memory
    const result = {
      success: true,
      filename: path.basename(filePath),
      metadata: extracted.metadata,
      totalChunks: chunks.length,
      totalCharacters: extracted.text.length,
      wordCount: extracted.wordCount,
      chunks,
    };

    return result;
  } catch (error) {
    console.error(`❌ processPDF error: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ✅ Save document to MongoDB
const saveDocumentToDB = async (fileData) => {
  try {
    const existing = await Document.findOne({
      filename: fileData.filename,
    });
    if (existing) return existing;

    const fileURL = getFileURL(fileData.filename);

    const doc = new Document({
      filename: fileData.filename,
      originalName: fileData.originalName,
      size: fileData.size,
      pages: fileData.pages || 0,
      title: fileData.title || fileData.originalName,
      author: fileData.author || "Unknown",
      isEmbedded: false,
      totalChunks: 0,
      fileUrl: fileURL,
    });

    await doc.save();
    console.log(`✅ Document saved: ${fileData.filename}`);
    return doc;
  } catch (error) {
    console.error(`❌ saveDocumentToDB: ${error.message}`);
    throw error;
  }
};

// ✅ Mark as embedded
const markDocumentAsEmbedded = async (filename, totalChunks, metadata) => {
  try {
    const fileURL = getFileURL(filename);

    await Document.findOneAndUpdate(
      { filename },
      {
        isEmbedded: true,
        totalChunks,
        pages: metadata?.pages || 0,
        title: metadata?.title || filename,
        author: metadata?.author || "Unknown",
        fileUrl: fileURL,
        embeddedAt: new Date(),
      },
      { upsert: true, returnDocument: "after" },
    );

    console.log(`✅ Marked embedded: ${filename}`);
  } catch (error) {
    console.error(`❌ markDocumentAsEmbedded: ${error.message}`);
    throw error;
  }
};

// ✅ Get all documents
const getAllDocuments = async () => {
  try {
    return await Document.find().sort({ uploadedAt: -1 });
  } catch (error) {
    throw error;
  }
};

// ✅ Get single document
const getDocument = async (filename) => {
  try {
    return await Document.findOne({ filename });
  } catch (error) {
    throw error;
  }
};

// ✅ Update summary cache
const updateDocumentSummary = async (filename, type, summary) => {
  try {
    await Document.findOneAndUpdate(
      { filename },
      {
        [`summary.${type}`]: summary,
        "summary.generatedAt": new Date(),
      },
    );
  } catch (error) {
    console.error(`❌ updateDocumentSummary: ${error.message}`);
  }
};

// ✅ Update flashcards cache
const updateDocumentFlashcards = async (filename, flashcards) => {
  try {
    await Document.findOneAndUpdate({ filename }, { flashcards });
  } catch (error) {
    console.error(`❌ updateDocumentFlashcards: ${error.message}`);
  }
};

// ✅ Delete document
const deleteDocumentFromDB = async (filename) => {
  try {
    await Document.findOneAndDelete({ filename });
    console.log(`✅ Document deleted: ${filename}`);
  } catch (error) {
    console.error(`❌ deleteDocumentFromDB: ${error.message}`);
    throw error;
  }
};

// ✅ Get full PDF text
const getFullPDFText = async (filePath) => {
  try {
    const extracted = await extractTextFromPDF(filePath);
    if (!extracted.success) {
      throw new Error(extracted.error);
    }
    return {
      success: true,
      text: extracted.text,
      wordCount: extracted.wordCount,
      metadata: extracted.metadata,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ✅ Check if text-based PDF
const isTextBasedPDF = async (filePath) => {
  try {
    const result = await extractTextFromPDF(filePath);
    if (!result.success) return false;
    return result.text.trim().length > 100;
  } catch {
    return false;
  }
};

module.exports = {
  extractTextFromPDF,
  splitTextIntoChunks,
  processPDF,
  saveDocumentToDB,
  markDocumentAsEmbedded,
  getAllDocuments,
  getDocument,
  updateDocumentSummary,
  updateDocumentFlashcards,
  deleteDocumentFromDB,
  getFullPDFText,
  isTextBasedPDF,
};
