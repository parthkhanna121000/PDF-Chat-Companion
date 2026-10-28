"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  FileText,
  Trash2,
  ChevronDown,
  Zap,
  Mic,
  Paperclip,
  Star,
  Share2,
  MoreHorizontal,
} from "lucide-react";

import { chatAPI } from "@/lib/api";
import { generateSessionId, formatTime } from "@/lib/utils";
import type { Message, Source } from "@/types";

/* ───────────────────────── Theme ───────────────────────── */

const theme = {
  bg: "#0b0c10",
  panel: "rgba(255,255,255,0.03)",
  panel2: "rgba(255,255,255,0.05)",
  border: "rgba(255,255,255,0.08)",
  text: "rgba(255,255,255,0.92)",
  muted: "rgba(255,255,255,0.55)",
  soft: "rgba(255,255,255,0.35)",
  accent: "#a855f7",
  accent2: "#ec4899",
};

/* ───────────────────────── Props ───────────────────────── */

interface ChatInterfaceProps {
  selectedFiles: string[];
  sessionId?: string;
  conversationLabel?: string;
  onFirstMessage?: (text: string) => void;
}

/* ───────────────────────── Typing ───────────────────────── */

function TypingBubble() {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        background: theme.panel,
        border: `1px solid ${theme.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Bot size={13} color="#a78bfa" />
      </div>

      <div style={{
        padding: "10px 14px",
        borderRadius: "6px 14px 14px 14px",
        background: theme.panel,
        border: `1px solid ${theme.border}`,
        display: "flex",
        gap: 6,
      }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#a78bfa",
              opacity: 0.5,
              animation: "ci-bounce 1s infinite",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── Message ───────────────────────── */

function MessageRow({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div style={{ display: "flex", gap: 10, flexDirection: isUser ? "row-reverse" : "row" }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: isUser
          ? `linear-gradient(135deg, #7c3aed, #ec4899)`
          : theme.panel,
        border: isUser ? "none" : `1px solid ${theme.border}`,
      }}>
        {isUser ? <User size={14} color="white" /> : <Bot size={14} color="#a78bfa" />}
      </div>

      <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", gap: 4 }}>
        <div
          style={{
            padding: "11px 14px",
            fontSize: 13.5,
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            borderRadius: isUser ? "14px 14px 4px 14px" : "4px 14px 14px 14px",
            background: isUser
              ? `linear-gradient(135deg, #7c3aed, #ec4899)`
              : theme.panel,
            border: isUser ? "none" : `1px solid ${theme.border}`,
            color: theme.text,
          }}
        >
          {message.content}
        </div>

        <span style={{ fontSize: 10, color: theme.soft }}>
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

/* ───────────────────────── Sources ───────────────────────── */

function SourcesPanel({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginTop: 6 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          fontSize: 11,
          color: theme.accent,
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        <FileText size={12} /> {sources.length} sources <ChevronDown size={12} />
      </button>

      {open && (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
          {sources.map((s, i) => (
            <div key={i} style={{
              padding: 10,
              borderRadius: 10,
              background: theme.panel,
              border: `1px solid ${theme.border}`,
              fontSize: 12,
            }}>
              <div style={{ color: "#a78bfa", fontWeight: 500 }}>
                {s.filename}
              </div>
              <div style={{ color: theme.muted }}>{s.preview}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Input ───────────────────────── */

function InputBar({
  input,
  setInput,
  onSend,
  canSend,
  isLoading,
}: any) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: 10,
      borderRadius: 14,
      background: theme.panel,
      border: `1px solid ${theme.border}`,
    }}>
      <Paperclip size={14} color={theme.muted} />

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask anything about your PDF..."
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          outline: "none",
          color: theme.text,
          fontSize: 13.5,
          resize: "none",
        }}
        rows={1}
      />

      <button
        onClick={onSend}
        disabled={!canSend}
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          border: "none",
          cursor: canSend ? "pointer" : "not-allowed",
          background: canSend
            ? `linear-gradient(135deg,#7c3aed,#ec4899)`
            : theme.panel2,
        }}
      >
        {isLoading ? (
          <span style={{
            width: 12,
            height: 12,
            border: "2px solid white",
            borderTop: "2px solid transparent",
            borderRadius: "50%",
            display: "block",
            animation: "spin 1s linear infinite",
          }} />
        ) : (
          <Send size={14} color="white" />
        )}
      </button>
    </div>
  );
}

/* ───────────────────────── Main ───────────────────────── */

export default function ChatInterface({
  selectedFiles,
  sessionId: injectedSessionId,
  conversationLabel,
  onFirstMessage,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sessionIdRef = useRef(injectedSessionId ?? generateSessionId());
  const sessionId = sessionIdRef.current;

  const handleSend = async () => {
    if (!input.trim()) return;

    const msg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((p) => [...p, msg]);
    setInput("");
    setIsLoading(true);

    let acc = "";

    chatAPI.stream(
      input,
      selectedFiles,
      sessionId,
      () => {},
      (t) => (acc += t),
      () => {
        setMessages((p) => [
          ...p,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: acc,
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
      }
    );
  };

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: theme.bg,
      fontFamily: "DM Sans",
    }}>

      {/* HEADER */}
      <div style={{
        padding: 16,
        borderBottom: `1px solid ${theme.border}`,
        display: "flex",
        justifyContent: "space-between",
      }}>
        <div style={{ color: theme.text, fontWeight: 600 }}>
          {conversationLabel || "PDF Chat"}
        </div>

        <Trash2 size={16} color={theme.soft} />
      </div>

      {/* CHAT */}
      <div style={{
        flex: 1,
        padding: 20,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}>
        {messages.map((m) => (
          <MessageRow key={m.id} message={m} />
        ))}

        {isLoading && <TypingBubble />}
      </div>

      {/* INPUT */}
      <div style={{ padding: 14 }}>
        <InputBar
          input={input}
          setInput={setInput}
          onSend={handleSend}
          canSend={input.trim()}
          isLoading={isLoading}
        />
      </div>

      {/* animations */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes ci-bounce {
          0%,100%{transform:translateY(0);opacity:.4}
          50%{transform:translateY(-5px);opacity:1}
        }
      `}</style>
    </div>
  );
}