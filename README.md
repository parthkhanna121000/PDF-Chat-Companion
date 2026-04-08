# PDF Chat Companion 🤖📄

> An AI-powered full-stack application that lets you have natural language conversations with any PDF document — powered by Google Gemini and a custom RAG (Retrieval Augmented Generation) pipeline.

---

## ✨ Features

### Core AI Features

- **Conversational Q&A** — Ask any question about your PDF in plain English. The AI answers with source citations showing exactly which passage the answer came from, along with a semantic similarity percentage.
- **RAG Pipeline (from scratch)** — Custom Retrieval Augmented Generation implementation without LangChain. Text is chunked, embedded into 3072-dimensional vectors using `gemini-embedding-001`, and searched via cosine similarity on every query.
- **Real-Time Streaming** — Answers stream word-by-word via Server-Sent Events (SSE). Source citations appear instantly before the answer begins.
- **Multi-Turn Memory** — Conversations are context-aware. Follow-up questions like "explain that more simply" work correctly because the last 6 messages are injected into every prompt.
- **AI Summarization** — Generate brief, detailed, or bullet-point summaries of any uploaded PDF. Cached in MongoDB after first generation so repeat requests are instant.
- **Flashcard Generation** — Auto-generate study flashcards (question/answer pairs) from PDF content using structured JSON output from Gemini. Cached per document.
- **Multi-Document Chat** — Select multiple PDFs simultaneously. The RAG pipeline searches across all selected documents and cites the correct source for each answer.

### PDF Management

- **Drag-and-Drop Upload** — Upload PDFs via drag-and-drop or file picker. Supports multiple files simultaneously.
- **Non-Blocking Processing** — Upload returns instantly (HTTP 200). Text extraction, chunking, and embedding run in the background. Status updates via polling: `uploading → processing → embedding → ready`.
- **Real-Time Status Tracking** — Live progress display for each file card during processing pipeline.
- **Force Re-Embed** — Re-generate embeddings for any document without re-uploading (useful after model changes).
- **Delete with Cleanup** — Deletes the file from disk, MongoDB Document record, and all associated Embedding vectors.
- **PDF Viewer** — Inline PDF renderer with page navigation, zoom, and scroll tracking using `react-pdf`.

### Chat Management

- **Multiple Conversations** — Create, switch between, and search conversation sessions. Each session has its own isolated chat history.
- **Session Persistence** — Conversations stored in MongoDB. History survives server restarts.
- **Clear History** — Wipe a session's messages from both UI and database.
- **Auto-Titling** — Conversation titles auto-generate from the first user message.
- **Suggested Questions** — Quick-start buttons (Summarize, Key Findings, Methodology, Conclusions) when a PDF is selected but no messages exist yet.

### Technical & Performance

- **Two-Level Caching** — In-memory vector cache (lazy-loaded per file) + MongoDB cache for summaries and flashcards.
- **Rate-Limit-Safe Embedding** — Batch processing: 5 chunks per batch, 200ms between chunks, 500ms between batches to respect Gemini API limits.
- **Chunking Strategy** — 600-character overlapping chunks (100-char overlap) with sentence-boundary splitting. Capped at 50 chunks to control memory.
- **Cosine Similarity Search** — Pure JavaScript implementation. O(n) search across stored vectors for top-K relevant chunks.
- **SSE Streaming** — Uses Fetch API + ReadableStream (not EventSource) to support POST requests with JSON body.
- **Stale Closure Prevention** — `useRef` used alongside React state for SSE callback correctness.

---

## 🛠 Tech Stack

| Layer           | Technology               | Why                                                                                       |
| --------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| Backend Runtime | Node.js + Express 5      | Non-blocking I/O for concurrent embedding API calls. Express 5 async error handling.      |
| Database        | MongoDB Atlas + Mongoose | Single DB for metadata and vectors. Flexible schema for cached summaries/flashcards.      |
| AI Model        | Gemini 2.5 Flash-Lite    | Large context window, cost-efficient, fast for streaming.                                 |
| Embeddings      | gemini-embedding-001     | 3072 dimensions vs OpenAI ada-002's 1536 — finer semantic distinctions, better retrieval. |
| Frontend        | Next.js 14 + TypeScript  | App Router, SSR-ready, strong typing between API responses and UI state.                  |
| Styling         | Tailwind CSS             | Utility-first, no runtime overhead.                                                       |
| File Upload     | Multer                   | Disk storage, PDF filter, 10MB limit.                                                     |
| PDF Parsing     | pdf-parse                | Server-side text extraction with metadata (pages, author, title).                         |
| PDF Viewer      | react-pdf                | Lazy-loaded, IntersectionObserver page tracking, ResizeObserver width scaling.            |
| File Drop       | react-dropzone           | Drag-and-drop with validation and disabled state.                                         |
| Toasts          | react-hot-toast          | Upload and processing status notifications.                                               |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js Frontend                      │
│  PDFUploader → FileCard → ChatInterface → PDFViewer          │
│  lib/api.ts (typed fetch wrapper) ←→ lib/utils.ts            │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / SSE
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     Express 5 Backend                        │
│                                                             │
│  /api/pdf/*          /api/chat/*                            │
│  ┌──────────┐        ┌──────────────┐                       │
│  │ pdf.js   │        │   chat.js    │                       │
│  └────┬─────┘        └──────┬───────┘                       │
│       │                     │                               │
│  ┌────▼─────┐  ┌────────────▼──────┐  ┌──────────────────┐ │
│  │pdfService│  │   chatService     │  │embeddingService  │ │
│  │          │  │  RAG orchestrator │  │  cosine search   │ │
│  │pdf-parse │  │  prompt builder   │  │  batch embedder  │ │
│  │chunker   │  │  summary/cards    │  │  vector cache    │ │
│  └──────────┘  └────────────┬──────┘  └────────┬─────────┘ │
│                             │                  │           │
└─────────────────────────────┼──────────────────┼───────────┘
                              │                  │
                    ┌─────────▼──────────────────▼─────────┐
                    │           Google Gemini API            │
                    │   gemini-2.5-flash-lite (chat)         │
                    │   gemini-embedding-001 (vectors)       │
                    └────────────────────────────────────────┘
                              │
                    ┌─────────▼──────────────┐
                    │     MongoDB Atlas       │
                    │  Document (metadata)    │
                    │  Embedding (vectors)    │
                    │  Conversation (history) │
                    └────────────────────────┘
```

---

## 🔄 How RAG Works in This Project

```
INDEXING (on upload)
PDF File
  └─► pdf-parse extracts text (up to 100K chars, 50 pages)
        └─► Split into 600-char overlapping chunks (max 50)
              └─► Each chunk → gemini-embedding-001 → 3072-dim vector
                    └─► Stored in MongoDB Embedding collection

QUERYING (on chat)
User Question
  └─► Embed question → 3072-dim vector
        └─► Cosine similarity vs all stored chunk vectors
              └─► Top 5 most similar chunks retrieved
                    └─► Injected into Gemini prompt with conversation history
                          └─► Gemini streams answer based ONLY on that context
```

---

## 📡 API Reference

### PDF Endpoints

| Method   | Endpoint                         | Description                                               |
| -------- | -------------------------------- | --------------------------------------------------------- |
| `POST`   | `/api/pdf/upload`                | Upload PDF (returns immediately, processes in background) |
| `GET`    | `/api/pdf/status/:filename`      | Poll processing status                                    |
| `GET`    | `/api/pdf/list`                  | List all uploaded PDFs                                    |
| `GET`    | `/api/pdf/info/:filename`        | Single PDF metadata                                       |
| `GET`    | `/api/pdf/embedded`              | List only fully embedded PDFs                             |
| `POST`   | `/api/pdf/force-embed/:filename` | Delete and regenerate embeddings                          |
| `POST`   | `/api/pdf/summarize/:filename`   | Generate summary (type: brief/detailed/bullets)           |
| `POST`   | `/api/pdf/flashcards/:filename`  | Generate flashcards (count param)                         |
| `DELETE` | `/api/pdf/delete/:filename`      | Delete file, DB record, and vectors                       |
| `GET`    | `/api/pdf/debug`                 | Show disk files vs DB records                             |

### Chat Endpoints

| Method   | Endpoint                       | Description                      |
| -------- | ------------------------------ | -------------------------------- |
| `POST`   | `/api/chat/ask`                | RAG Q&A with history persistence |
| `POST`   | `/api/chat/stream`             | SSE streaming RAG response       |
| `POST`   | `/api/chat/summarize`          | Summarize via chat route         |
| `POST`   | `/api/chat/flashcards`         | Flashcards via chat route        |
| `GET`    | `/api/chat/history/:sessionId` | Get session messages             |
| `DELETE` | `/api/chat/history/:sessionId` | Clear session history            |
| `GET`    | `/api/chat/sessions`           | List all sessions                |
| `GET`    | `/api/chat/test-gemini`        | Test Gemini connection           |
| `GET`    | `/api/chat/test-embedding`     | Test embedding model             |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier works)
- Google AI Studio API key (free at [aistudio.google.com](https://aistudio.google.com))

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/pdf-chat-companion.git
cd pdf-chat-companion/backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit `.env`:

```env
MONGODB_URI=mongodb+srv://YOUR_CLUSTER_URL/pdf-chat-companion
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
```

```bash
# Start the backend
npm run dev
# Server runs on http://localhost:5000
```

### Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

```bash
# Start the frontend
npm run dev
# App runs on http://localhost:3000
```

### Verify Setup

```bash
# Check backend health
curl http://localhost:5000/health

# Test Gemini connection
curl http://localhost:5000/api/chat/test-gemini

# Test embedding model
curl http://localhost:5000/api/chat/test-embedding
```

---

## 📁 Project Structure

```
backend/
├── config/
│   ├── database.js          # MongoDB connection
│   └── gemini.js            # Gemini SDK wrappers (chat, summary, flashcard, embedding models)
├── middleware/
│   └── upload.js            # Multer config (disk storage, PDF filter, 10MB limit)
├── models/
│   ├── Document.js          # PDF metadata + summary/flashcard cache
│   ├── Embedding.js         # Vector storage (chunks with 3072-dim embeddings)
│   └── Conversation.js      # Chat session history
├── routers/
│   ├── pdf.js               # PDF upload, status, summarize, flashcards, delete
│   └── chat.js              # Ask, stream, history, sessions
├── services/
│   ├── pdfService.js        # Text extraction, chunking, document CRUD
│   ├── embeddingService.js  # Cosine similarity, vector storage, lazy cache
│   └── chatService.js       # RAG pipeline, prompt builder, summary, flashcards
├── uploads/                 # PDF files stored here
└── index.js                 # Express server entry point

frontend/
├── app/
│   ├── globals.css          # Tailwind + CSS variables
│   ├── layout.tsx           # Root layout with DM Sans font + Toaster
│   └── page.tsx             # Main shell: sidebar, conversations, PDF manager
├── components/
│   ├── ChatInterface.tsx    # SSE streaming chat, message history, source citations
│   ├── features/
│   │   ├── PDFUploader.tsx  # Dropzone, upload flow, status polling
│   │   └── PDFViewer.tsx    # react-pdf with IntersectionObserver page tracking
│   └── ui/
│       ├── FileCard.tsx     # Per-PDF card with status, actions, selection
│       ├── Badge.tsx        # Semantic status badges
│       ├── Button.tsx       # Reusable button variants
│       └── LoadingSpinner.tsx
├── lib/
│   ├── api.ts               # Typed axios/fetch wrappers for all endpoints
│   └── utils.ts             # cn(), formatTime(), generateSessionId(), getPDFUrl()
├── context/
│   └── ThemeContext.tsx     # Light/dark/system theme with FOFT prevention
└── types/
    └── index.ts             # Shared TypeScript interfaces
```

---

## ⚠️ Known Limitations

- **Scanned PDFs not supported** — `pdf-parse` requires selectable text. Image-only PDFs return empty.
- **50-chunk cap** — Very long documents (200+ pages) lose content past the first ~30-40 pages. Chunk count does not scale with document length.
- **Linear vector search** — O(n×m) cosine scan. Works for hundreds of chunks; would not scale to millions without an indexed ANN solution (HNSW).
- **Stream endpoint does not save history** — SSE streaming responses are not persisted to the Conversation collection.
- **Page numbers show 0** — `pdf-parse` does not provide per-chunk page attribution. All sources show `page: 0`.
- **No authentication** — Any client with the filename can access any PDF's vectors, summaries, and chat history.
- **Single-server architecture** — Background processing would fail across multiple instances. Requires a job queue (BullMQ) for horizontal scaling.

---

## 🔮 Planned Features

- [ ] JWT authentication — scope documents and conversations to users
- [ ] BullMQ job queue for PDF processing — retries, parallel workers, dead letter handling
- [ ] MongoDB Atlas Vector Search — replace linear scan with HNSW index
- [ ] Highlight-to-Ask — select PDF text to auto-populate chat input
- [ ] Cross-document contradiction detection — compare claims across multiple PDFs
- [ ] Spaced repetition (SRS) for flashcards — SM-2 algorithm with daily review scheduling
- [ ] Voice input + TTS output — Web Speech API integration
- [ ] PDF annotation export — generate highlighted PDFs showing source chunks used
- [ ] Prompt injection defense — sanitize extracted text, use Gemini system field for instructions
- [ ] Adaptive chunking — split at semantic boundaries rather than fixed character count

---

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first to discuss the proposed change.

---

## 📄 License

MIT
