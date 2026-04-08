// lib/api.ts
import axios from "axios";
import {
  ChatResponse,
  UploadResponse,
  StatusResponse,
  SummaryResponse,
  FlashcardResponse,
  ChatSession,
  PDFDocument,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// ── PDF APIs ──────────────────────────────────────────────────────────────────

export const pdfAPI = {

  // Upload a PDF (returns immediately — poll status until "ready")
  upload: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("pdf", file);
    const response = await api.post("/api/pdf/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Poll this after upload until status === "ready" or "failed"
  getStatus: async (filename: string): Promise<StatusResponse> => {
    const response = await api.get(`/api/pdf/status/${filename}`);
    return response.data;
  },

  // Convenience: poll every 2s, resolves when ready, rejects on failure
  waitUntilReady: (
    filename: string,
    onProgress?: (status: StatusResponse["status"]) => void,
    intervalMs = 2000
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const timer = setInterval(async () => {
        try {
          const { status, error } = await pdfAPI.getStatus(filename);
          onProgress?.(status);
          if (status === "ready") {
            clearInterval(timer);
            resolve();
          } else if (status === "failed") {
            clearInterval(timer);
            reject(new Error(error || "PDF processing failed"));
          }
        } catch (err) {
          clearInterval(timer);
          reject(err);
        }
      }, intervalMs);
    });
  },

  // All uploaded PDFs (regardless of embed status)
  list: async (): Promise<{ total: number; files: PDFDocument[] }> => {
    const response = await api.get("/api/pdf/list");
    return response.data;
  },

  // Single PDF metadata
  getInfo: async (filename: string): Promise<PDFDocument> => {
    const response = await api.get(`/api/pdf/info/${filename}`);
    return response.data;
  },

  // Only fully embedded PDFs (safe to use in chat)
  getEmbedded: async (): Promise<{ total: number; files: PDFDocument[] }> => {
    const response = await api.get("/api/pdf/embedded");
    return response.data;
  },

  // Force re-embed (deletes existing vectors and regenerates)
  forceEmbed: async (filename: string): Promise<{ message: string }> => {
    const response = await api.post(`/api/pdf/force-embed/${filename}`);
    return response.data;
  },

  // Generate summary — second call for same type returns cached result instantly
  summarize: async (
    filename: string,
    type: "brief" | "detailed" | "bullets"
  ): Promise<SummaryResponse> => {
    const response = await api.post(`/api/pdf/summarize/${filename}`, { type });
    return response.data;
  },

  // Generate flashcards — cached after first call
  flashcards: async (
    filename: string,
    count = 10
  ): Promise<FlashcardResponse> => {
    const response = await api.post(`/api/pdf/flashcards/${filename}`, { count });
    return response.data;
  },

  // Delete file + DB records + embeddings
  delete: async (filename: string): Promise<{ message: string }> => {
    const response = await api.delete(`/api/pdf/delete/${filename}`);
    return response.data;
  },
};

// ── Chat APIs ─────────────────────────────────────────────────────────────────

export const chatAPI = {

  // Standard ask — saves conversation history, returns full response
  ask: async (
    question: string,
    filenames: string[],
    sessionId: string
  ): Promise<ChatResponse> => {
    const response = await api.post("/api/chat/ask", {
      question,
      filenames,
      sessionId,
    });
    return response.data;
  },

  // Streaming ask via SSE — does NOT save history (use ask for persistence)
  // Returns a ReadableStream; use the helper below for easy consumption
  stream: (
    question: string,
    filenames: string[],
    sessionId: string,
    onSources: (sources: ChatResponse["sources"]) => void,
    onChunk: (text: string) => void,
    onDone: (sessionId: string) => void,
    onError?: (err: Error) => void
  ): (() => void) => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(`${API_URL}/api/chat/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, filenames, sessionId }),
        });

        if (!response.ok) throw new Error(`Stream error: ${response.status}`);
        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const payload = JSON.parse(line.slice(6));
              if (payload.sources) onSources(payload.sources);
              else if (payload.text !== undefined) onChunk(payload.text);
              else if (payload.sessionId) onDone(payload.sessionId);
            } catch {
              // skip malformed SSE lines
            }
          }
        }
      } catch (err) {
        if (!cancelled) onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    })();

    // Return a cancel function
    return () => { cancelled = true; };
  },

  // All messages for a session
  getHistory: async (sessionId: string) => {
    const response = await api.get(`/api/chat/history/${sessionId}`);
    return response.data;
  },

  // Clear a session's messages
  clearHistory: async (sessionId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/api/chat/history/${sessionId}`);
    return response.data;
  },

  // List all past sessions
  getSessions: async (): Promise<{ sessions: ChatSession[] }> => {
    const response = await api.get("/api/chat/sessions");
    return response.data;
  },
};

// ── System ────────────────────────────────────────────────────────────────────

export const systemAPI = {
  health: async () => {
    const response = await api.get("/health");
    return response.data;
  },
  testGemini: async () => {
    const response = await api.get("/api/chat/test-gemini");
    return response.data;
  },
};