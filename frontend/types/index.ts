// ── Processing status (matches backend status field exactly)
export type PDFStatus = "uploading" | "processing" | "embedding" | "ready" | "failed";

// ── PDF Document — unified shape for /list, /embedded, /info responses
export interface PDFDocument {
  filename: string;
  originalName: string;
  size: string;
  status: PDFStatus;
  isEmbedded: boolean;
  totalChunks: number;
  pages?: number;
  title?: string;
  author?: string;
  fileUrl?: string;
  uploadedAt?: string;
  createdAt?: string;
  embeddedAt?: string;
  error?: string;
  summary?: {
    brief?: string;
    detailed?: string;
    bullets?: string;
    generatedAt?: string;
  };
  flashcards?: Flashcard[];
}

// ── Flashcard shape (used in PDFDocument.flashcards and FlashcardResponse)
export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

// ── Source chunk returned alongside chat answers
export interface Source {
  filename: string;
  similarity: string;
  preview: string;
  pageNumber: number; // backend always includes this (currently always 0)
}

// ── Chat message (client-side, includes generated id + timestamp)
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: Source[];
}

// ── POST /api/chat/ask response
export interface ChatResponse {
  success: boolean;
  question: string;
  answer: string;
  sources: Source[];
  sessionId: string;
}

// ── POST /api/pdf/upload response
export interface UploadResponse {
  message: string;
  file: {
    originalName: string;
    savedAs: string;
    size: string;
    path: string;
    uploadedAt: string;
  };
}

// ── GET /api/pdf/status/:filename response — use this for polling
export interface StatusResponse {
  status: PDFStatus;
  isEmbedded: boolean;
  totalChunks?: number;
  error?: string;
}

// ── POST /api/pdf/summarize/:filename response
export interface SummaryResponse {
  summary: string;
  type: "brief" | "detailed" | "bullets";
  cached: boolean;
}

// ── POST /api/pdf/flashcards/:filename response
export interface FlashcardResponse {
  flashcards: Flashcard[];
  total: number;
  cached: boolean;
}

// ── Chat session (from GET /api/chat/sessions)
export interface ChatSession {
  sessionId: string;
  title: string;
  totalMessages: number;
  filesUsed: string[];
  createdAt?: string;
  updatedAt?: string;
}

// ── EmbedResponse kept only if you call /api/pdf/force-embed directly
// Backend doesn't actually return this shape from any standard flow — safe to remove if unused
export interface EmbedResponse {
  message: string;
  filename: string;
  metadata: {
    pages: number;
    title: string;
    author: string;
  };
  totalChunks: number;
}