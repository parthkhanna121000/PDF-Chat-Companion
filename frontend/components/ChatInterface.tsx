// // components/ChatInterface.tsx
// "use client";

// import { useState, useRef, useEffect } from "react";
// import {
//   Send, Bot, User, FileText, Trash2,
//   ChevronDown, ChevronRight, Zap, Sparkles, Mic,
// } from "lucide-react";
// import { chatAPI } from "@/lib/api";
// import { generateSessionId, formatTime } from "@/lib/utils";
// import type { Message, Source } from "@/types";

// interface ChatInterfaceProps {
//   selectedFiles: string[];
//   sessionId?: string;
//   conversationLabel?: string;
//   onFirstMessage?: (text: string) => void;
// }

// /* ── Typing Bubble ─────────────────────────────────────────────────────────── */
// function TypingBubble() {
//   return (
//     <div className="flex gap-3 items-end">
//       <div className="pdfchat-ai-avatar shrink-0">
//         <Bot className="h-[13px] w-[13px]" style={{ color: "#c084fc" }} />
//       </div>
//       <div className="pdfchat-ai-bubble flex items-center gap-[5px] px-4 py-3.5">
//         {[0, 1, 2].map((i) => (
//           <span
//             key={i}
//             className="block rounded-full"
//             style={{
//               width: 6, height: 6,
//               background: "rgba(192,132,252,0.7)",
//               animation: "pdfchat-bounce 0.9s ease infinite",
//               animationDelay: `${i * 0.15}s`,
//             }}
//           />
//         ))}
//       </div>
//     </div>
//   );
// }

// /* ── Source Card ───────────────────────────────────────────────────────────── */
// function SourceCard({ source }: { source: Source }) {
//   return (
//     <div className="p-3 rounded-xl text-xs transition-all duration-150" style={{
//       background: "rgba(168,85,247,0.06)",
//       border: "0.5px solid rgba(168,85,247,0.18)",
//     }}>
//       <div className="flex items-center justify-between mb-[6px]">
//         <span className="font-medium truncate max-w-[65%]" style={{ color: "#c084fc" }}>
//           {source.filename}
//         </span>
//         <div className="flex items-center gap-2 shrink-0 ml-2">
//           {source.pageNumber > 0 && (
//             <span className="px-2 py-[2px] rounded-full font-medium text-[10px]" style={{
//               background: "rgba(168,85,247,0.12)", color: "#c084fc",
//               border: "0.5px solid rgba(168,85,247,0.25)",
//             }}>
//               p.{source.pageNumber}
//             </span>
//           )}
//           <span className="px-2 py-[2px] rounded-full font-semibold text-[10px]" style={{
//             background: "rgba(52,211,153,0.1)", color: "#4ade80",
//             border: "0.5px solid rgba(52,211,153,0.22)",
//           }}>
//             {source.similarity}
//           </span>
//         </div>
//       </div>
//       <p className="leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{source.preview}</p>
//     </div>
//   );
// }

// /* ── Sources Panel ─────────────────────────────────────────────────────────── */
// function SourcesPanel({ sources }: { sources: Source[] }) {
//   const [open, setOpen] = useState(false);
//   return (
//     <div className="w-full mt-2">
//       <button
//         onClick={() => setOpen((v) => !v)}
//         className="flex items-center gap-[5px] text-xs px-1 py-1 rounded transition-colors duration-150"
//         style={{ color: "rgba(168,85,247,0.7)" }}
//         onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#c084fc")}
//         onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "rgba(168,85,247,0.7)")}
//         aria-expanded={open}
//       >
//         <FileText className="h-3 w-3" />
//         {sources.length} source{sources.length > 1 ? "s" : ""}
//         <ChevronDown
//           className="h-3 w-3 transition-transform duration-200"
//           style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
//         />
//       </button>
//       {open && (
//         <div className="mt-2 flex flex-col gap-2">
//           {sources.map((s, i) => <SourceCard key={i} source={s} />)}
//         </div>
//       )}
//     </div>
//   );
// }

// /* ── Message Row ───────────────────────────────────────────────────────────── */
// function MessageRow({ message }: { message: Message }) {
//   const isUser = message.role === "user";
//   return (
//     <div
//       className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
//       style={{ animation: "pdfchat-slideUp 0.25s cubic-bezier(0.16,1,0.3,1) forwards" }}
//     >
//       <div
//         className="shrink-0 h-8 w-8 rounded-xl flex items-center justify-center"
//         style={isUser ? {
//           background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
//           boxShadow: "0 2px 12px rgba(168,85,247,0.35)",
//         } : {
//           background: "rgba(168,85,247,0.1)",
//           border: "0.5px solid rgba(168,85,247,0.25)",
//         }}
//       >
//         {isUser
//           ? <User className="h-[13px] w-[13px] text-white" />
//           : <Bot className="h-[13px] w-[13px]" style={{ color: "#c084fc" }} />
//         }
//       </div>

//       <div className={`flex flex-col gap-1 max-w-[76%] ${isUser ? "items-end" : "items-start"}`}>
//         <div
//           className="px-4 py-[10px] text-[13px] leading-relaxed whitespace-pre-wrap"
//           style={isUser ? {
//             background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
//             color: "rgba(255,255,255,0.95)",
//             borderRadius: "18px 18px 4px 18px",
//             boxShadow: "0 4px 20px rgba(168,85,247,0.25)",
//           } : {
//             background: "rgba(255,255,255,0.04)",
//             border: "0.5px solid rgba(255,255,255,0.09)",
//             color: "rgba(255,255,255,0.85)",
//             borderRadius: "4px 18px 18px 18px",
//             backdropFilter: "blur(12px)",
//           }}
//         >
//           {message.content}
//         </div>

//         <span className="text-[10px] px-1" style={{ color: "rgba(255,255,255,0.2)" }}>
//           {formatTime(message.timestamp)}
//         </span>

//         {message.sources && message.sources.length > 0 && (
//           <SourcesPanel sources={message.sources} />
//         )}
//       </div>
//     </div>
//   );
// }

// /* ── Suggested Questions ────────────────────────────────────────────────────── */
// function SuggestedQuestions({ onSelect }: { onSelect: (q: string) => void }) {
//   const suggestions = [
//     { icon: "📄", label: "Summarize main points",  query: "Summarize the main points" },
//     { icon: "🔍", label: "Key findings",            query: "What are the key findings?" },
//     { icon: "🧪", label: "Methodology explained",   query: "Explain the methodology" },
//     { icon: "✅", label: "List conclusions",         query: "List all conclusions" },
//   ];
//   return (
//     <div className="grid grid-cols-2 gap-2 w-full max-w-[380px]">
//       {suggestions.map((s, i) => (
//         <button
//           key={i}
//           onClick={() => onSelect(s.query)}
//           className="group relative text-left rounded-xl transition-all duration-200 overflow-hidden"
//           style={{
//             padding: "11px 13px",
//             background: "rgba(168,85,247,0.06)",
//             border: "0.5px solid rgba(168,85,247,0.15)",
//           }}
//           onMouseEnter={(e) => {
//             const el = e.currentTarget as HTMLButtonElement;
//             el.style.background = "rgba(168,85,247,0.12)";
//             el.style.borderColor = "rgba(168,85,247,0.3)";
//             el.style.transform = "translateY(-1px)";
//             el.style.boxShadow = "0 6px 20px rgba(168,85,247,0.1)";
//           }}
//           onMouseLeave={(e) => {
//             const el = e.currentTarget as HTMLButtonElement;
//             el.style.background = "rgba(168,85,247,0.06)";
//             el.style.borderColor = "rgba(168,85,247,0.15)";
//             el.style.transform = "translateY(0)";
//             el.style.boxShadow = "none";
//           }}
//         >
//           <span className="block text-sm mb-[5px]">{s.icon}</span>
//           <span className="block text-[12px] font-medium leading-snug" style={{ color: "rgba(196,181,253,0.8)" }}>
//             {s.label}
//           </span>
//           <ChevronRight
//             className="absolute bottom-2 right-2 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
//             style={{ color: "#a855f7" }}
//           />
//         </button>
//       ))}
//     </div>
//   );
// }

// /* ── Empty State ───────────────────────────────────────────────────────────── */
// function EmptyState({ hasFiles, onSuggest }: { hasFiles: boolean; onSuggest: (q: string) => void }) {
//   return (
//     <div className="flex flex-col items-center justify-center flex-1 gap-8 pb-6">
//       <div className="flex flex-col items-center gap-5">
//         <div
//           className="relative h-[72px] w-[72px] rounded-[22px] flex items-center justify-center"
//           style={{
//             background: "linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(236,72,153,0.08) 100%)",
//             border: "0.5px solid rgba(168,85,247,0.3)",
//             boxShadow: "0 0 50px rgba(168,85,247,0.1), 0 20px 50px rgba(0,0,0,0.4)",
//           }}
//         >
//           <FileText className="h-8 w-8" style={{ color: "#c084fc" }} />
//           <div
//             className="absolute -top-[5px] -right-[5px] h-5 w-5 rounded-full flex items-center justify-center"
//             style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)" }}
//           >
//             <Zap className="h-[10px] w-[10px] text-white" />
//           </div>
//         </div>
//         <div className="text-center">
//           <h3 className="font-semibold text-[15px] tracking-tight" style={{ color: "rgba(255,255,255,0.9)" }}>
//             Ask anything about your PDFs
//           </h3>
//           <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
//             Semantic search · Multi-document · Context-aware
//           </p>
//         </div>
//       </div>

//       {hasFiles ? (
//         <SuggestedQuestions onSelect={onSuggest} />
//       ) : (
//         <div
//           className="flex items-start gap-3 px-4 py-[14px] rounded-xl max-w-[280px] text-[13px]"
//           style={{
//             background: "rgba(251,191,36,0.04)",
//             border: "0.5px solid rgba(251,191,36,0.12)",
//             color: "rgba(255,255,255,0.4)",
//           }}
//         >
//           <span className="text-base mt-px">📎</span>
//           <span>Upload a PDF first, then select it to start chatting.</span>
//         </div>
//       )}
//     </div>
//   );
// }

// /* ── Streaming Bubble ──────────────────────────────────────────────────────── */
// function StreamingBubble({ text }: { text: string }) {
//   return (
//     <div className="flex gap-3 flex-row" style={{ animation: "pdfchat-slideUp 0.25s cubic-bezier(0.16,1,0.3,1) forwards" }}>
//       <div
//         className="shrink-0 h-8 w-8 rounded-xl flex items-center justify-center"
//         style={{ background: "rgba(168,85,247,0.1)", border: "0.5px solid rgba(168,85,247,0.25)" }}
//       >
//         <Bot className="h-[13px] w-[13px]" style={{ color: "#c084fc" }} />
//       </div>
//       <div
//         className="px-4 py-[10px] text-[13px] leading-relaxed whitespace-pre-wrap max-w-[76%]"
//         style={{
//           background: "rgba(255,255,255,0.04)",
//           border: "0.5px solid rgba(255,255,255,0.09)",
//           color: "rgba(255,255,255,0.85)",
//           borderRadius: "4px 18px 18px 18px",
//           backdropFilter: "blur(12px)",
//         }}
//       >
//         {text}
//         <span
//           className="inline-block ml-[2px] align-middle rounded-sm"
//           style={{ width: 2, height: 13, background: "#a855f7", animation: "pdfchat-blink 1s step-end infinite" }}
//         />
//       </div>
//     </div>
//   );
// }

// /* ── Main ──────────────────────────────────────────────────────────────────── */
// const ChatInterface: React.FC<ChatInterfaceProps> = ({
//   selectedFiles,
//   sessionId: injectedSessionId,
//   conversationLabel,
//   onFirstMessage,
// }) => {
//   const [messages, setMessages]                 = useState<Message[]>([]);
//   const [input, setInput]                       = useState("");
//   const [isLoading, setIsLoading]               = useState(false);
//   const [isFocused, setIsFocused]               = useState(false);
//   const [streamingText, setStreamingText]       = useState<string | null>(null);
//   const [streamingSources, setStreamingSources] = useState<Source[]>([]);
//   const firstMessageSentRef                     = useRef(false);

//   const sessionIdRef = useRef(injectedSessionId ?? generateSessionId());
//   const sessionId    = sessionIdRef.current;

//   const messagesEndRef  = useRef<HTMLDivElement>(null);
//   const inputRef        = useRef<HTMLTextAreaElement>(null);
//   const cancelStreamRef = useRef<(() => void) | null>(null);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, isLoading, streamingText]);

//   useEffect(() => {
//     return () => { cancelStreamRef.current?.(); };
//   }, []);

//   const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     setInput(e.target.value);
//     e.target.style.height = "auto";
//     e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
//   };

//   const handleSuggest = (q: string) => {
//     setInput(q);
//     inputRef.current?.focus();
//   };

//   const handleSend = async () => {
//     const question = input.trim();
//     if (!question || isLoading || selectedFiles.length === 0) return;

//     if (!firstMessageSentRef.current) {
//       firstMessageSentRef.current = true;
//       onFirstMessage?.(question);
//     }

//     const userMsg: Message = {
//       id: Date.now().toString(),
//       role: "user",
//       content: question,
//       timestamp: new Date(),
//     };

//     setMessages((prev) => [...prev, userMsg]);
//     setInput("");
//     if (inputRef.current) inputRef.current.style.height = "auto";
//     setIsLoading(true);
//     setStreamingText("");
//     setStreamingSources([]);

//     let accumulated = "";

//     const cancel = chatAPI.stream(
//       question, selectedFiles, sessionId,
//       (sources) => setStreamingSources(sources),
//       (text) => { accumulated += text; setStreamingText(accumulated); },
//       () => {
//         const assistantMsg: Message = {
//           id: (Date.now() + 1).toString(),
//           role: "assistant",
//           content: accumulated,
//           timestamp: new Date(),
//           sources: streamingSources,
//         };
//         setMessages((prev) => [...prev, assistantMsg]);
//         setStreamingText(null);
//         setStreamingSources([]);
//         setIsLoading(false);
//         cancelStreamRef.current = null;
//       },
//       (err) => {
//         console.error("Stream error:", err);
//         const errMsg: Message = {
//           id: (Date.now() + 1).toString(),
//           role: "assistant",
//           content: "Something went wrong. Please try again.",
//           timestamp: new Date(),
//         };
//         setMessages((prev) => [...prev, errMsg]);
//         setStreamingText(null);
//         setIsLoading(false);
//         cancelStreamRef.current = null;
//       }
//     );

//     cancelStreamRef.current = cancel;
//   };

//   const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
//     if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
//   };

//   const handleClear = async () => {
//     cancelStreamRef.current?.();
//     cancelStreamRef.current = null;
//     try { await chatAPI.clearHistory(sessionId); } catch { /* ignore */ }
//     setMessages([]);
//     setStreamingText(null);
//     setIsLoading(false);
//     firstMessageSentRef.current = false;
//   };

//   const canSend     = input.trim().length > 0 && !isLoading && selectedFiles.length > 0;
//   const hasMessages = messages.length > 0 || streamingText !== null;

//   const headerLabel = conversationLabel && conversationLabel !== "New conversation"
//     ? conversationLabel
//     : "PDF Chat";

//   return (
//     <>
//       <style>{`
//         @keyframes pdfchat-slideUp {
//           from { opacity: 0; transform: translateY(12px); }
//           to   { opacity: 1; transform: translateY(0); }
//         }
//         @keyframes pdfchat-bounce {
//           0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
//           30% { transform: translateY(-5px); opacity: 1; }
//         }
//         @keyframes pdfchat-ping {
//           0%, 100% { opacity: .35; transform: scale(1); }
//           50%       { opacity: 0;   transform: scale(1.6); }
//         }
//         @keyframes pdfchat-blink {
//           0%, 100% { opacity: 1; }
//           50%       { opacity: 0; }
//         }
//         @keyframes pdfchat-shimmer {
//           0%   { background-position: -200% center; }
//           100% { background-position: 200% center; }
//         }
//         .pdfchat-scrollbar::-webkit-scrollbar { width: 3px; }
//         .pdfchat-scrollbar::-webkit-scrollbar-track { background: transparent; }
//         .pdfchat-scrollbar::-webkit-scrollbar-thumb {
//           background: rgba(168,85,247,0.18);
//           border-radius: 4px;
//         }
//         .pdfchat-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(168,85,247,0.18) transparent; }
//         .pdfchat-input::placeholder { color: rgba(255,255,255,0.2); }
//         .pdfchat-ai-avatar {
//           height: 32px; width: 32px;
//           border-radius: 10px;
//           display: flex; align-items: center; justify-content: center;
//           background: rgba(168,85,247,0.1);
//           border: 0.5px solid rgba(168,85,247,0.25);
//         }
//         .pdfchat-ai-bubble {
//           background: rgba(255,255,255,0.04);
//           border: 0.5px solid rgba(255,255,255,0.09);
//           border-radius: 4px 18px 18px 18px;
//           backdrop-filter: blur(12px);
//         }
//       `}</style>

//       <div
//         className="flex flex-col h-full relative overflow-hidden"
//         style={{ background: "#09090f", fontFamily: "'DM Sans', system-ui, sans-serif" }}
//       >
//         {/* Ambient blobs */}
//         <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
//           <div style={{
//             position: "absolute", top: "-60px", right: "-60px",
//             width: 360, height: 360, borderRadius: "50%",
//             background: "#a855f7", filter: "blur(80px)", opacity: 0.05,
//           }} />
//           <div style={{
//             position: "absolute", bottom: "-40px", left: "-40px",
//             width: 240, height: 240, borderRadius: "50%",
//             background: "#ec4899", filter: "blur(70px)", opacity: 0.04,
//           }} />
//           <div style={{
//             position: "absolute", top: "40%", left: "50%", transform: "translateX(-50%)",
//             width: "80%", height: "1px",
//             background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.06), transparent)",
//           }} />
//         </div>

//         {/* ── Header ── */}
//         <header
//           className="relative z-10 flex items-center justify-between px-5"
//           style={{
//             height: 58,
//             borderBottom: "0.5px solid rgba(255,255,255,0.07)",
//             background: "rgba(9,9,15,0.8)",
//             backdropFilter: "blur(20px)",
//             flexShrink: 0,
//           }}
//         >
//           <div className="flex items-center gap-3">
//             <div
//               className="relative h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
//               style={{
//                 background: "linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(236,72,153,0.1) 100%)",
//                 border: "0.5px solid rgba(168,85,247,0.35)",
//               }}
//             >
//               <span
//                 className="absolute inset-0 rounded-xl"
//                 style={{ background: "rgba(168,85,247,0.1)", animation: "pdfchat-ping 3s ease-in-out infinite" }}
//               />
//               <Sparkles className="relative h-4 w-4" style={{ color: "#c084fc" }} />
//             </div>
//             <div>
//               <p
//                 className="text-[13px] font-semibold tracking-tight leading-none max-w-[300px] truncate"
//                 style={{ color: "rgba(255,255,255,0.9)" }}
//                 title={headerLabel}
//               >
//                 {headerLabel}
//               </p>
//               <div className="flex items-center gap-[5px] mt-[5px]">
//                 <span
//                   className="h-[5px] w-[5px] rounded-full"
//                   style={selectedFiles.length > 0
//                     ? { background: "#4ade80", boxShadow: "0 0 6px rgba(74,222,128,0.6)" }
//                     : { background: "rgba(255,255,255,0.15)" }}
//                 />
//                 <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
//                   {selectedFiles.length > 0
//                     ? `${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} active`
//                     : "No files selected"}
//                 </span>
//               </div>
//             </div>
//           </div>

//           {hasMessages && (
//             <button
//               onClick={handleClear}
//               className="flex items-center gap-[5px] px-3 py-[6px] rounded-lg text-[11px] font-medium transition-all duration-200"
//               style={{
//                 color: "rgba(255,255,255,0.3)",
//                 border: "0.5px solid rgba(255,255,255,0.08)",
//                 background: "rgba(255,255,255,0.025)",
//               }}
//               onMouseEnter={(e) => {
//                 const el = e.currentTarget as HTMLButtonElement;
//                 el.style.color = "#f87171";
//                 el.style.borderColor = "rgba(248,113,113,0.25)";
//                 el.style.background = "rgba(248,113,113,0.06)";
//               }}
//               onMouseLeave={(e) => {
//                 const el = e.currentTarget as HTMLButtonElement;
//                 el.style.color = "rgba(255,255,255,0.3)";
//                 el.style.borderColor = "rgba(255,255,255,0.08)";
//                 el.style.background = "rgba(255,255,255,0.025)";
//               }}
//             >
//               <Trash2 className="h-[12px] w-[12px]" /> Clear
//             </button>
//           )}
//         </header>

//         {/* ── Messages ── */}
//         <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-5 relative z-10 pdfchat-scrollbar">
//           {!hasMessages ? (
//             <EmptyState hasFiles={selectedFiles.length > 0} onSuggest={handleSuggest} />
//           ) : (
//             <>
//               {messages.map((msg) => <MessageRow key={msg.id} message={msg} />)}
//               {streamingText !== null && <StreamingBubble text={streamingText} />}
//               {isLoading && streamingText === null && <TypingBubble />}
//               <div ref={messagesEndRef} />
//             </>
//           )}
//         </div>

//         {/* ── Input ── */}
//         <div
//           className="relative z-10 px-4 pb-4 pt-3"
//           style={{
//             borderTop: "0.5px solid rgba(255,255,255,0.06)",
//             background: "rgba(9,9,15,0.7)",
//             backdropFilter: "blur(20px)",
//             flexShrink: 0,
//           }}
//         >
//           {/* Focus glow line */}
//           <div
//             className="absolute top-0 left-1/2 -translate-x-1/2 h-px pointer-events-none transition-all duration-500"
//             style={{
//               width: isFocused ? "60%" : "0%",
//               background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.6), rgba(236,72,153,0.4), transparent)",
//             }}
//           />

//           <div
//             className="flex items-end gap-2 px-3 py-[10px] rounded-2xl transition-all duration-300"
//             style={{
//               background: isFocused ? "rgba(168,85,247,0.04)" : "rgba(255,255,255,0.03)",
//               border: isFocused ? "0.5px solid rgba(168,85,247,0.4)" : "0.5px solid rgba(255,255,255,0.09)",
//               boxShadow: isFocused ? "0 0 0 3px rgba(168,85,247,0.07), 0 0 28px rgba(168,85,247,0.05)" : "none",
//             }}
//           >
//             <textarea
//               ref={inputRef}
//               value={input}
//               onChange={handleInputChange}
//               onKeyDown={handleKeyDown}
//               onFocus={() => setIsFocused(true)}
//               onBlur={() => setIsFocused(false)}
//               placeholder={selectedFiles.length > 0 ? "Ask anything about your PDF…" : "Select a PDF file first…"}
//               disabled={isLoading || selectedFiles.length === 0}
//               rows={1}
//               className="flex-1 bg-transparent text-[13px] resize-none outline-none leading-relaxed disabled:opacity-35 disabled:cursor-not-allowed pdfchat-input"
//               style={{ color: "rgba(255,255,255,0.85)", maxHeight: "120px", caretColor: "#a855f7" }}
//             />

//             {/* Mic */}
//             <button
//               className="shrink-0 h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-200"
//               style={{ border: "0.5px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.25)" }}
//               onMouseEnter={(e) => {
//                 const el = e.currentTarget as HTMLButtonElement;
//                 el.style.borderColor = "rgba(168,85,247,0.3)";
//                 el.style.background = "rgba(168,85,247,0.08)";
//                 el.style.color = "#c084fc";
//               }}
//               onMouseLeave={(e) => {
//                 const el = e.currentTarget as HTMLButtonElement;
//                 el.style.borderColor = "rgba(255,255,255,0.08)";
//                 el.style.background = "rgba(255,255,255,0.03)";
//                 el.style.color = "rgba(255,255,255,0.25)";
//               }}
//             >
//               <Mic className="h-[13px] w-[13px]" />
//             </button>

//             {/* Send */}
//             <button
//               onClick={handleSend}
//               disabled={!canSend}
//               className="shrink-0 h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed"
//               style={{
//                 background: canSend
//                   ? "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)"
//                   : "rgba(255,255,255,0.06)",
//                 boxShadow: canSend ? "0 3px 16px rgba(168,85,247,0.35)" : "none",
//               }}
//               onMouseEnter={(e) => { if (canSend) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)"; }}
//               onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
//             >
//               {isLoading && streamingText === null ? (
//                 <span
//                   className="h-[13px] w-[13px] rounded-full border-2 animate-spin"
//                   style={{ borderColor: "rgba(255,255,255,0.4)", borderTopColor: "transparent" }}
//                 />
//               ) : (
//                 <Send className="h-[13px] w-[13px] text-white" />
//               )}
//             </button>
//           </div>

//           <p className="text-center mt-[7px] text-[10px]" style={{ color: "rgba(255,255,255,0.12)" }}>
//             ↵ Enter to send &nbsp;·&nbsp; Shift+↵ for new line
//           </p>
//         </div>
//       </div>
//     </>
//   );
// };

// export default ChatInterface;
// components/ChatInterface.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send, Bot, FileText, Trash2, ChevronDown,
  Zap, Mic, Paperclip, Star, User, Share2, MoreHorizontal,
} from "lucide-react";
import { chatAPI } from "@/lib/api";
import { generateSessionId, formatTime } from "@/lib/utils";
import type { Message, Source } from "@/types";

interface ChatInterfaceProps {
  selectedFiles: string[];
  sessionId?: string;
  conversationLabel?: string;
  onFirstMessage?: (text: string) => void;
}

const T = {
  ink:     "#0c0c10",
  surface: "#111117",
  panel:   "#16161e",
  card:    "#1c1c26",
  border:  "rgba(255,255,255,0.07)",
  border2: "rgba(255,255,255,0.12)",
  t1:      "rgba(255,255,255,0.92)",
  t2:      "rgba(255,255,255,0.5)",
  t3:      "rgba(255,255,255,0.25)",
  t4:      "rgba(255,255,255,0.12)",
} as const;

function TypingBubble() {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
      <div style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Bot size={13} style={{ color: "#a78bfa" }} />
      </div>
      <div style={{ padding: "12px 16px", borderRadius: "4px 16px 16px 16px", background: "#1c1c26", border: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 5, alignItems: "center" }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(139,92,246,0.5)", display: "block", animation: "ci-bop 1s ease infinite", animationDelay: `${i * 0.18}s` }} />
        ))}
      </div>
    </div>
  );
}

function SourceCard({ source }: { source: Source }) {
  return (
    <div style={{ padding: "10px 12px", borderRadius: 10, fontSize: 12, background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.15)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ color: "#a78bfa", fontWeight: 500, maxWidth: "65%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{source.filename}</span>
        <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 8 }}>
          {source.pageNumber > 0 && <span style={{ padding: "1px 7px", borderRadius: 5, fontSize: 10, fontWeight: 600, background: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "0.5px solid rgba(139,92,246,0.2)" }}>p.{source.pageNumber}</span>}
          <span style={{ padding: "1px 7px", borderRadius: 5, fontSize: 10, fontWeight: 600, background: "rgba(16,185,129,0.1)", color: "#34d399", border: "0.5px solid rgba(16,185,129,0.2)" }}>{source.similarity}</span>
        </div>
      </div>
      <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{source.preview}</p>
    </div>
  );
}

function SourcesPanel({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 8, width: "100%" }}>
      <button onClick={() => setOpen((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(139,92,246,0.7)", background: "none", border: "none", cursor: "pointer", padding: "2px 0", fontFamily: "inherit" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#a78bfa")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(139,92,246,0.7)")}>
        <FileText size={11} />
        {sources.length} source{sources.length > 1 ? "s" : ""}
        <ChevronDown size={11} style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
      </button>
      {open && <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>{sources.map((s, i) => <SourceCard key={i} source={s} />)}</div>}
    </div>
  );
}

function MessageRow({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div style={{ display: "flex", gap: 10, flexDirection: isUser ? "row-reverse" : "row", animation: "ci-rise 0.28s cubic-bezier(0.16,1,0.3,1) forwards" }}>
      <div style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", ...(isUser ? { background: "linear-gradient(135deg,#7c3aed,#db2777)", boxShadow: "0 2px 12px rgba(124,58,237,0.3)" } : { background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }) }}>
        {isUser ? <User size={13} color="white" /> : <Bot size={13} style={{ color: "#a78bfa" }} />}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: "76%", alignItems: isUser ? "flex-end" : "flex-start" }}>
        <div style={{ padding: "11px 15px", fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word", ...(isUser ? { background: "linear-gradient(135deg,#7c3aed,#db2777)", color: "rgba(255,255,255,0.95)", borderRadius: "16px 16px 4px 16px", boxShadow: "0 6px 24px rgba(124,58,237,0.3)" } : { background: "#1c1c26", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.92)", borderRadius: "4px 16px 16px 16px" }) }}>
          {message.content}
        </div>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", padding: "0 2px" }}>{formatTime(message.timestamp)}</span>
        {message.sources && message.sources.length > 0 && <SourcesPanel sources={message.sources} />}
      </div>
    </div>
  );
}

function StreamingBubble({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", gap: 10, animation: "ci-rise 0.28s cubic-bezier(0.16,1,0.3,1) forwards" }}>
      <div style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, marginTop: 2, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Bot size={13} style={{ color: "#a78bfa" }} />
      </div>
      <div style={{ padding: "11px 15px", fontSize: 13, lineHeight: 1.65, maxWidth: "76%", background: "#1c1c26", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.92)", borderRadius: "4px 16px 16px 16px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {text}
        <span style={{ display: "inline-block", width: 2, height: 13, borderRadius: 2, background: "#8b5cf6", marginLeft: 2, verticalAlign: "middle", animation: "ci-blink 1s step-end infinite" }} />
      </div>
    </div>
  );
}

function SuggestedQuestions({ onSelect }: { onSelect: (q: string) => void }) {
  const suggestions = [
    { emoji: "📄", label: "Summarize main points",  q: "Summarize the main points" },
    { emoji: "🔍", label: "Key findings",            q: "What are the key findings?" },
    { emoji: "🧪", label: "Explain methodology",     q: "Explain the methodology" },
    { emoji: "✅", label: "List all conclusions",    q: "List all conclusions" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%", maxWidth: 380 }}>
      {suggestions.map((s, i) => (
        <button key={i} onClick={() => onSelect(s.q)}
          style={{ textAlign: "left", padding: "11px 13px", borderRadius: 12, background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.14)", cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit" }}
          onMouseEnter={(e) => { const el = e.currentTarget; el.style.background = "rgba(139,92,246,0.12)"; el.style.borderColor = "rgba(139,92,246,0.32)"; el.style.transform = "translateY(-2px)"; el.style.boxShadow = "0 8px 24px rgba(139,92,246,0.12)"; }}
          onMouseLeave={(e) => { const el = e.currentTarget; el.style.background = "rgba(139,92,246,0.06)"; el.style.borderColor = "rgba(139,92,246,0.14)"; el.style.transform = "translateY(0)"; el.style.boxShadow = "none"; }}>
          <span style={{ display: "block", fontSize: 16, marginBottom: 5 }}>{s.emoji}</span>
          <span style={{ display: "block", fontSize: 12, fontWeight: 500, color: "rgba(196,181,253,0.8)", lineHeight: 1.4 }}>{s.label}</span>
        </button>
      ))}
    </div>
  );
}

function EmptyState({ hasFiles, onSuggest }: { hasFiles: boolean; onSuggest: (q: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 32, paddingBottom: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div style={{ position: "relative" }}>
          <div style={{ width: 72, height: 72, borderRadius: 22, background: "linear-gradient(135deg,rgba(139,92,246,0.15),rgba(244,63,94,0.08))", border: "1px solid rgba(139,92,246,0.28)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 60px rgba(139,92,246,0.1), 0 20px 50px rgba(0,0,0,0.4)" }}>
            <FileText size={28} style={{ color: "#a78bfa" }} />
          </div>
          <div style={{ position: "absolute", top: -4, right: -4, width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg,#8b5cf6,#f43f5e)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={10} color="white" />
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.01em", margin: 0 }}>Ask anything about your PDFs</h3>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 6 }}>Semantic search · Multi-document · Context-aware</p>
        </div>
      </div>
      {hasFiles ? <SuggestedQuestions onSelect={onSuggest} /> : (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", borderRadius: 12, maxWidth: 280, fontSize: 13, background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.12)", color: "rgba(255,255,255,0.5)" }}>
          <Paperclip size={15} style={{ color: "rgba(245,158,11,0.5)", flexShrink: 0, marginTop: 1 }} />
          Upload a PDF first, then select it to start chatting.
        </div>
      )}
    </div>
  );
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ selectedFiles, sessionId: injectedSessionId, conversationLabel, onFirstMessage }) => {
  const [messages, setMessages]                 = useState<Message[]>([]);
  const [input, setInput]                       = useState("");
  const [isLoading, setIsLoading]               = useState(false);
  const [isFocused, setIsFocused]               = useState(false);
  const [streamingText, setStreamingText]       = useState<string | null>(null);
  const [streamingSources, setStreamingSources] = useState<Source[]>([]);
  const firstMessageSentRef                     = useRef(false);
  const sessionIdRef    = useRef(injectedSessionId ?? generateSessionId());
  const sessionId       = sessionIdRef.current;
  const messagesEndRef  = useRef<HTMLDivElement>(null);
  const inputRef        = useRef<HTMLTextAreaElement>(null);
  const cancelStreamRef = useRef<(() => void) | null>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading, streamingText]);
  useEffect(() => () => { cancelStreamRef.current?.(); }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleSuggest = (q: string) => { setInput(q); inputRef.current?.focus(); };

  const handleSend = async () => {
    const question = input.trim();
    if (!question || isLoading || selectedFiles.length === 0) return;
    if (!firstMessageSentRef.current) { firstMessageSentRef.current = true; onFirstMessage?.(question); }
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: question, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setIsLoading(true); setStreamingText(""); setStreamingSources([]);
    let accumulated = "";
    const cancel = chatAPI.stream(question, selectedFiles, sessionId,
      (sources) => setStreamingSources(sources),
      (text) => { accumulated += text; setStreamingText(accumulated); },
      () => {
        setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: accumulated, timestamp: new Date(), sources: streamingSources }]);
        setStreamingText(null); setStreamingSources([]); setIsLoading(false); cancelStreamRef.current = null;
      },
      (err) => {
        console.error(err);
        setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: "Something went wrong. Please try again.", timestamp: new Date() }]);
        setStreamingText(null); setIsLoading(false); cancelStreamRef.current = null;
      }
    );
    cancelStreamRef.current = cancel;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleClear = async () => {
    cancelStreamRef.current?.(); cancelStreamRef.current = null;
    try { await chatAPI.clearHistory(sessionId); } catch { }
    setMessages([]); setStreamingText(null); setIsLoading(false); firstMessageSentRef.current = false;
  };

  const canSend     = input.trim().length > 0 && !isLoading && selectedFiles.length > 0;
  const hasMessages = messages.length > 0 || streamingText !== null;
  const headerLabel = conversationLabel && conversationLabel !== "New conversation" ? conversationLabel : "PDF Chat";

  return (
    <>
      <style>{`
        @keyframes ci-rise { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ci-bop { 0%,60%,100%{transform:translateY(0);opacity:.4} 30%{transform:translateY(-6px);opacity:1} }
        @keyframes ci-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes ci-ping { 0%,100%{opacity:.3;transform:scale(1)} 50%{opacity:0;transform:scale(1.7)} }
        @keyframes ci-pulse-dot { 0%,100%{box-shadow:0 0 6px rgba(16,185,129,0.5)} 50%{box-shadow:0 0 12px rgba(16,185,129,0.9)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .ci-scroll::-webkit-scrollbar{width:3px}
        .ci-scroll::-webkit-scrollbar-thumb{background:rgba(139,92,246,0.18);border-radius:4px}
        .ci-scroll{scrollbar-width:thin;scrollbar-color:rgba(139,92,246,0.18) transparent}
        .ci-ta::placeholder{color:rgba(255,255,255,0.2)}
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "#0c0c10", fontFamily: "'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", position: "relative" }}>
        {/* Ambient glows */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
          <div style={{ position: "absolute", top: -80, right: -80, width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,0.07),transparent 70%)" }} />
          <div style={{ position: "absolute", bottom: -80, left: -40, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle,rgba(244,63,94,0.04),transparent 70%)" }} />
        </div>

        {/* HEADER */}
        <header style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(12,12,16,0.85)", backdropFilter: "blur(20px)", flexShrink: 0, position: "relative", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative", width: 36, height: 36 }}>
              <span style={{ position: "absolute", inset: 0, borderRadius: 11, background: "rgba(139,92,246,0.12)", animation: "ci-ping 3s ease-in-out infinite" }} />
              <div style={{ position: "relative", width: 36, height: 36, borderRadius: 11, background: "linear-gradient(135deg,rgba(139,92,246,0.2),rgba(244,63,94,0.1))", border: "1px solid rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Star size={15} style={{ color: "#c084fc" }} />
              </div>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.01em", margin: 0, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={headerLabel}>{headerLabel}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: selectedFiles.length > 0 ? "#10b981" : "rgba(255,255,255,0.12)", animation: selectedFiles.length > 0 ? "ci-pulse-dot 2s ease infinite" : "none", flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{selectedFiles.length > 0 ? `${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} active` : "No files selected"}</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {[Share2, MoreHorizontal].map((Icon, i) => (
              <button key={i} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}>
                <Icon size={13} style={{ color: "rgba(255,255,255,0.5)" }} />
              </button>
            ))}
            {hasMessages && (
              <button onClick={handleClear} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 8, background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.15)", color: "rgba(251,113,133,0.7)", fontSize: 11, fontWeight: 500, cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(244,63,94,0.12)"; e.currentTarget.style.color = "#fb7185"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(244,63,94,0.06)"; e.currentTarget.style.color = "rgba(251,113,133,0.7)"; }}>
                <Trash2 size={12} style={{ color: "currentColor" }} /> Clear
              </button>
            )}
          </div>
        </header>

        {/* MESSAGES */}
        <div className="ci-scroll" style={{ flex: 1, overflowY: "auto", padding: "28px 28px 16px", display: "flex", flexDirection: "column", gap: 20, position: "relative", zIndex: 1 }}>
          {!hasMessages ? (
            <EmptyState hasFiles={selectedFiles.length > 0} onSuggest={handleSuggest} />
          ) : (
            <>
              {messages.map((msg) => <MessageRow key={msg.id} message={msg} />)}
              {streamingText !== null && <StreamingBubble text={streamingText} />}
              {isLoading && streamingText === null && <TypingBubble />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* INPUT */}
        <div style={{ flexShrink: 0, padding: "12px 20px 18px", borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(12,12,16,0.85)", backdropFilter: "blur(20px)", position: "relative", zIndex: 10 }}>
          <div style={{ height: 1, margin: "0 auto 10px", width: isFocused ? "55%" : "0%", background: "linear-gradient(90deg,transparent,#8b5cf6,#f43f5e,transparent)", transition: "width 0.4s ease", borderRadius: 1 }} />
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, padding: "10px 12px", borderRadius: 14, background: isFocused ? "rgba(139,92,246,0.04)" : "#16161e", border: isFocused ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.12)", boxShadow: isFocused ? "0 0 0 3px rgba(139,92,246,0.06)" : "none", transition: "all 0.25s" }}>
            <button style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}>
              <Paperclip size={13} style={{ color: "rgba(255,255,255,0.5)" }} />
            </button>
            <textarea ref={inputRef} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
              placeholder={selectedFiles.length > 0 ? "Ask anything about your PDF…" : "Select a PDF file first…"}
              disabled={isLoading || selectedFiles.length === 0} rows={1} className="ci-ta"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13.5, color: "rgba(255,255,255,0.92)", resize: "none", lineHeight: 1.55, maxHeight: 120, caretColor: "#8b5cf6", fontFamily: "inherit", opacity: (isLoading || selectedFiles.length === 0) ? 0.35 : 1, cursor: (isLoading || selectedFiles.length === 0) ? "not-allowed" : "text" }} />
            <button style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.1)"; e.currentTarget.style.borderColor = "rgba(139,92,246,0.25)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}>
              <Mic size={13} style={{ color: "rgba(255,255,255,0.5)" }} />
            </button>
            <button onClick={handleSend} disabled={!canSend}
              style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, border: "none", cursor: canSend ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", background: canSend ? "linear-gradient(135deg,#8b5cf6,#f43f5e)" : "rgba(255,255,255,0.06)", boxShadow: canSend ? "0 4px 16px rgba(139,92,246,0.4)" : "none", opacity: canSend ? 1 : 0.3, transition: "all 0.2s" }}
              onMouseEnter={(e) => { if (canSend) { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(139,92,246,0.55)"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = canSend ? "0 4px 16px rgba(139,92,246,0.4)" : "none"; }}>
              {isLoading && streamingText === null
                ? <span style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "transparent", display: "block", animation: "spin 0.7s linear infinite" }} />
                : <Send size={13} color="white" />}
            </button>
          </div>
          <p style={{ textAlign: "center", marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.1)", letterSpacing: "0.02em" }}>↵ Enter to send &nbsp;·&nbsp; Shift+↵ new line &nbsp;·&nbsp; @ to reference a file</p>
        </div>
      </div>
    </>
  );
};

export default ChatInterface;