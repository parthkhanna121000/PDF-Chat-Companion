// app/page.tsx
"use client";

import { useState, useCallback } from "react";
import {
  FileText, MessageSquare, Layers,
  PanelLeftClose, PanelLeftOpen, Plus, Search, MessagesSquare,
} from "lucide-react";
import PDFUploader   from "@/components/features/PDFUploader";
import ChatInterface from "@/components/ChatInterface";
import { generateSessionId } from "@/lib/utils";
import type { PDFStatus } from "@/types";

interface UploadedFile {
  filename:     string;
  originalName: string;
  size:         string;
  status:       PDFStatus;
  totalChunks?: number;
}

interface Conversation {
  id:        string;
  label:     string;
  timestamp: Date;
}

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Home() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [sidebarOpen,   setSidebarOpen]   = useState(true);
  const [searchQuery,   setSearchQuery]   = useState("");

  // ── Conversation management ──────────────────────────────────────────────
  const [conversations, setConversations] = useState<Conversation[]>(() => [
    { id: generateSessionId(), label: "New conversation", timestamp: new Date() },
  ]);
  const [activeConvId, setActiveConvId] = useState<string>(
    () => conversations[0].id
  );

  const activeConv = conversations.find((c) => c.id === activeConvId) ?? conversations[0];

  const handleNewConversation = useCallback(() => {
    const newConv: Conversation = {
      id:        generateSessionId(),
      label:     "New conversation",
      timestamp: new Date(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newConv.id);
  }, []);

  const handleSwitchConversation = useCallback((id: string) => {
    setActiveConvId(id);
  }, []);

  /** Called by ChatInterface when the first user message is sent */
  const handleFirstMessage = useCallback((text: string, convId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? { ...c, label: text.length > 42 ? text.slice(0, 42) + "…" : text }
          : c
      )
    );
  }, []);

  // ── PDF management ───────────────────────────────────────────────────────
  const handleFilesChange = useCallback((files: UploadedFile[]) => {
    setUploadedFiles(files);
    setSelectedFiles((prev) =>
      prev.filter((f) => files.some((file) => file.filename === f))
    );
  }, []);

  const handleFileSelect = useCallback((filename: string) => {
    setSelectedFiles((prev) =>
      prev.includes(filename)
        ? prev.filter((f) => f !== filename)
        : [...prev, filename]
    );
  }, []);

  // ── Stats ────────────────────────────────────────────────────────────────
  const readyCount    = uploadedFiles.filter((f) => f.status === "ready").length;
  const selectedCount = selectedFiles.length;

  const stats = [
    { label: "Files",   value: uploadedFiles.length, icon: FileText,      accent: "#7c6cf0" },
    { label: "Indexed", value: readyCount,            icon: Layers,        accent: "#34d399" },
    { label: "Active",  value: selectedCount,         icon: MessageSquare, accent: "#f59e0b" },
  ];

  const filteredConvs = conversations.filter((c) =>
    c.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{
        background: "#07090f",
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
        color: "#e8e6ff",
      }}
    >
      {/* ── Ambient blobs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{
          position: "absolute", top: "-15%", left: "-10%",
          width: "55vw", height: "55vw", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,108,240,0.06) 0%, transparent 65%)",
        }} />
        <div style={{
          position: "absolute", bottom: "-20%", right: "-5%",
          width: "45vw", height: "45vw", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232,121,160,0.05) 0%, transparent 65%)",
        }} />
        <div style={{
          position: "absolute", top: "40%", left: "40%",
          width: "30vw", height: "30vw", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(52,211,153,0.03) 0%, transparent 65%)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
        }} />
      </div>

      {/* ══ NAVBAR ══ */}
      <header
        className="relative z-20 shrink-0 flex items-center justify-between"
        style={{
          padding: "0 20px",
          height: "52px",
          borderBottom: "1px solid rgba(255,255,255,0.055)",
          background: "rgba(7,9,15,0.92)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Close panel" : "Open panel"}
            style={{
              height: 30, width: 30, borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.03)",
              color: "#4b5268",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all 0.18s ease", flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.color = "#c4b5fd";
              b.style.borderColor = "rgba(124,108,240,0.35)";
              b.style.background = "rgba(124,108,240,0.08)";
            }}
            onMouseLeave={(e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.color = "#4b5268";
              b.style.borderColor = "rgba(255,255,255,0.07)";
              b.style.background = "rgba(255,255,255,0.03)";
            }}
          >
            {sidebarOpen
              ? <PanelLeftClose style={{ width: 14, height: 14 }} />
              : <PanelLeftOpen  style={{ width: 14, height: 14 }} />
            }
          </button>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: 28, height: 28, borderRadius: 9,
              background: "linear-gradient(135deg, #7c6cf0 0%, #e879a0 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 18px rgba(124,108,240,0.4), inset 0 1px 0 rgba(255,255,255,0.18)",
              flexShrink: 0,
            }}>
              <FileText style={{ width: 13, height: 13, color: "#fff" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1, gap: 2 }}>
              <span style={{
                fontSize: 13, fontWeight: 700, letterSpacing: "-0.03em",
                background: "linear-gradient(90deg, #f1f0ff 30%, #a78bfa 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                PDF Chat Companion
              </span>
              <span style={{ fontSize: 9, color: "#3d4157", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                RAG · Semantic Search
              </span>
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Stats pills */}
          <div className="hidden sm:flex" style={{ gap: "5px" }}>
            {stats.map(({ label, value, icon: Icon, accent }) => (
              <div
                key={label}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "4px 10px", borderRadius: "99px",
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  fontSize: 11,
                }}
              >
                <Icon style={{ width: 10, height: 10, color: accent }} />
                <span style={{ color: "#e8e6ff", fontWeight: 600 }}>{value}</span>
                <span style={{ color: "#3d4157" }}>{label}</span>
              </div>
            ))}
          </div>

          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.06)" }} />

          {/* Model pill */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "4px 12px", borderRadius: "99px",
            background: "rgba(52,211,153,0.06)",
            border: "1px solid rgba(52,211,153,0.15)",
            fontSize: 11,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#34d399",
              boxShadow: "0 0 8px rgba(52,211,153,0.8)",
              animation: "pulse-dot 2s ease-in-out infinite",
              flexShrink: 0,
            }} />
            <span style={{ color: "#6b7280" }} className="hidden sm:inline">
              Gemini 2.5 Flash-Lite
            </span>
          </div>
        </div>
      </header>

      {/* ══ BODY ══ */}
      <div className="relative z-10 flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <aside
          style={{
            width:    sidebarOpen ? "280px" : "0px",
            minWidth: sidebarOpen ? "280px" : "0px",
            transition: "width 0.28s cubic-bezier(0.4,0,0.2,1), min-width 0.28s cubic-bezier(0.4,0,0.2,1)",
            overflow: "hidden",
            borderRight: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(13,16,23,0.95)",
            backdropFilter: "blur(20px)",
            display: "flex", flexDirection: "column",
            flexShrink: 0,
          }}
        >
          <div style={{ width: "280px", height: "100%", display: "flex", flexDirection: "column" }}>

            {/* ── New conversation button ── */}
            <div style={{ padding: "14px 14px 10px", flexShrink: 0 }}>
              <button
                onClick={handleNewConversation}
                style={{
                  width: "100%",
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "9px 13px", borderRadius: 12,
                  background: "linear-gradient(135deg, rgba(124,108,240,0.18), rgba(232,121,160,0.1))",
                  border: "1px solid rgba(124,108,240,0.28)",
                  color: "#c4b5fd", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.18s ease",
                  letterSpacing: "-0.01em",
                }}
                onMouseEnter={(e) => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.background = "linear-gradient(135deg, rgba(124,108,240,0.28), rgba(232,121,160,0.18))";
                  b.style.borderColor = "rgba(124,108,240,0.5)";
                  b.style.boxShadow = "0 0 20px rgba(124,108,240,0.18)";
                }}
                onMouseLeave={(e) => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.background = "linear-gradient(135deg, rgba(124,108,240,0.18), rgba(232,121,160,0.1))";
                  b.style.borderColor = "rgba(124,108,240,0.28)";
                  b.style.boxShadow = "none";
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 6,
                  background: "rgba(124,108,240,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Plus style={{ width: 12, height: 12 }} />
                </div>
                New conversation
              </button>
            </div>

            {/* ── Search ── */}
            <div style={{ padding: "0 14px 10px", flexShrink: 0 }}>
              <div style={{ position: "relative" }}>
                <Search style={{
                  position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                  width: 12, height: 12, color: "#3d4157", pointerEvents: "none",
                }} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations…"
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 10, padding: "7px 12px 7px 30px",
                    fontSize: 12, color: "#8b87a8", outline: "none",
                    transition: "all 0.18s ease",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(124,108,240,0.3)";
                    e.currentTarget.style.background = "rgba(124,108,240,0.04)";
                    e.currentTarget.style.color = "#e8e6ff";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    e.currentTarget.style.color = "#8b87a8";
                  }}
                />
              </div>
            </div>

            {/* ── Conversation list ── */}
            <div style={{
              padding: "0 10px",
              flexShrink: 0,
              maxHeight: "220px",
              overflowY: "auto",
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}>
              {/* Section label */}
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "0 4px 6px",
              }}>
                <MessagesSquare style={{ width: 10, height: 10, color: "#3d4157" }} />
                <span style={{
                  fontSize: 9, fontWeight: 600,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  color: "#3d4157",
                }}>
                  Conversations
                </span>
                <span style={{
                  marginLeft: "auto",
                  fontSize: 9, fontWeight: 600,
                  padding: "1px 6px", borderRadius: 99,
                  background: "rgba(124,108,240,0.1)",
                  border: "1px solid rgba(124,108,240,0.18)",
                  color: "#7c6cf0",
                }}>
                  {conversations.length}
                </span>
              </div>

              {filteredConvs.length === 0 ? (
                <div style={{
                  padding: "12px 8px",
                  fontSize: 11, color: "#3d4157", textAlign: "center",
                }}>
                  No conversations found
                </div>
              ) : (
                filteredConvs.map((conv) => {
                  const isActive = conv.id === activeConvId;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSwitchConversation(conv.id)}
                      style={{
                        width: "100%", textAlign: "left",
                        display: "flex", alignItems: "flex-start", gap: 9,
                        padding: "9px 10px", borderRadius: 10, marginBottom: 2,
                        border: isActive
                          ? "1px solid rgba(124,108,240,0.3)"
                          : "1px solid transparent",
                        background: isActive
                          ? "rgba(124,108,240,0.1)"
                          : "transparent",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          const b = e.currentTarget as HTMLButtonElement;
                          b.style.background = "rgba(255,255,255,0.03)";
                          b.style.borderColor = "rgba(255,255,255,0.06)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          const b = e.currentTarget as HTMLButtonElement;
                          b.style.background = "transparent";
                          b.style.borderColor = "transparent";
                        }
                      }}
                    >
                      {/* Icon */}
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: isActive
                          ? "linear-gradient(135deg, rgba(124,108,240,0.3), rgba(232,121,160,0.15))"
                          : "rgba(255,255,255,0.04)",
                        border: isActive
                          ? "1px solid rgba(124,108,240,0.35)"
                          : "1px solid rgba(255,255,255,0.06)",
                        marginTop: 1,
                      }}>
                        <MessageSquare style={{
                          width: 12, height: 12,
                          color: isActive ? "#a78bfa" : "#4b5268",
                        }} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12, fontWeight: isActive ? 600 : 400,
                          color: isActive ? "#e8e6ff" : "#8b87a8",
                          whiteSpace: "nowrap", overflow: "hidden",
                          textOverflow: "ellipsis",
                          lineHeight: 1.3,
                        }}>
                          {conv.label}
                        </div>
                        <div style={{
                          fontSize: 10, color: "#3d4157",
                          marginTop: 2,
                        }}>
                          {formatRelativeTime(conv.timestamp)}
                        </div>
                      </div>

                      {isActive && (
                        <div style={{
                          width: 5, height: 5, borderRadius: "50%",
                          background: "#7c6cf0",
                          boxShadow: "0 0 8px rgba(124,108,240,0.7)",
                          flexShrink: 0, marginTop: 5,
                        }} />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* ── Divider ── */}
            <div style={{
              margin: "10px 14px",
              height: 1,
              background: "rgba(255,255,255,0.04)",
              flexShrink: 0,
            }} />

            {/* ── PDF Manager label ── */}
            <div style={{
              padding: "0 14px 8px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "linear-gradient(135deg, #7c6cf0, #e879a0)",
                  boxShadow: "0 0 8px rgba(124,108,240,0.6)",
                }} />
                <span style={{
                  fontSize: 9, fontWeight: 600,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  color: "#3d4157",
                }}>
                  PDF Manager
                </span>
              </div>
              {selectedFiles.length > 0 && (
                <button
                  onClick={() => setSelectedFiles([])}
                  style={{
                    fontSize: 10, cursor: "pointer",
                    padding: "3px 8px", borderRadius: 6,
                    border: "1px solid rgba(248,113,113,0.18)",
                    background: "rgba(248,113,113,0.06)",
                    color: "#f87171", transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.14)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.06)"; }}
                >
                  Deselect all
                </button>
              )}
            </div>

            {/* ── Scrollable uploader area ── */}
            <div style={{
              flex: 1, overflowY: "auto",
              padding: "0 14px 20px",
              msOverflowStyle: "none", scrollbarWidth: "none",
            }}>
              <PDFUploader
                onFilesChange={handleFilesChange}
                selectedFiles={selectedFiles}
                onFileSelect={handleFileSelect}
              />
            </div>

            {/* ── User profile row ── */}
            <div style={{
              padding: "10px 12px 12px",
              borderTop: "1px solid rgba(255,255,255,0.04)",
              flexShrink: 0,
            }}>
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "7px 10px", borderRadius: 10,
                  border: "1px solid transparent",
                  cursor: "pointer", transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  const d = e.currentTarget as HTMLDivElement;
                  d.style.background = "rgba(255,255,255,0.03)";
                  d.style.borderColor = "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  const d = e.currentTarget as HTMLDivElement;
                  d.style.background = "transparent";
                  d.style.borderColor = "transparent";
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "linear-gradient(135deg, #7c6cf0, #e879a0)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0,
                }}>
                  A
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#e8e6ff" }}>Alex Chen</div>
                  <div style={{ fontSize: 10, color: "#3d4157" }}>Pro plan</div>
                </div>
                <div
                  style={{
                    width: 24, height: 24, borderRadius: 6,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#3d4157", border: "1px solid transparent",
                    transition: "all 0.15s ease", cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    const d = e.currentTarget as HTMLDivElement;
                    d.style.background = "rgba(255,255,255,0.04)";
                    d.style.borderColor = "rgba(255,255,255,0.06)";
                    d.style.color = "#8b87a8";
                  }}
                  onMouseLeave={(e) => {
                    const d = e.currentTarget as HTMLDivElement;
                    d.style.background = "transparent";
                    d.style.borderColor = "transparent";
                    d.style.color = "#3d4157";
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                </div>
              </div>
            </div>

          </div>
        </aside>

        {/* ── Chat ── */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          {/*
            key={activeConvId} forces a full remount on conversation switch,
            giving each conversation its own isolated state + new session.
          */}
          <ChatInterface
            key={activeConvId}
            selectedFiles={selectedFiles}
            sessionId={activeConvId}
            conversationLabel={activeConv.label}
            onFirstMessage={(text) => handleFirstMessage(text, activeConvId)}
          />
        </main>
      </div>

      {/* ══ FOOTER ══ */}
      <footer style={{
        position: "relative", zIndex: 20, height: 30,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 16,
        borderTop: "1px solid rgba(255,255,255,0.04)",
        background: "rgba(7,9,15,0.8)", backdropFilter: "blur(12px)",
        flexShrink: 0,
      }}>
        <div style={{ flex: 1, height: 1, maxWidth: 120, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05))" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 10, color: "#252836", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            PDF Chat Companion
          </span>
          <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#252836" }} />
          <span style={{ fontSize: 10, color: "#252836", letterSpacing: "0.04em" }}>
            Powered by Gemini 2.5 Flash-Lite + RAG
          </span>
        </div>
        <div style={{ flex: 1, height: 1, maxWidth: 120, background: "linear-gradient(90deg, rgba(255,255,255,0.05), transparent)" }} />
      </footer>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1;   box-shadow: 0 0 8px rgba(52,211,153,0.8); }
          50%       { opacity: 0.5; box-shadow: 0 0 3px rgba(52,211,153,0.3); }
        }
        aside ::-webkit-scrollbar { display: none; }
        input::placeholder { color: #3d4157 !important; }
      `}</style>
    </div>
  );
}