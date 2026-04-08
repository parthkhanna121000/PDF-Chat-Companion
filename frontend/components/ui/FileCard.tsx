// components/ui/FileCard.tsx
import React from "react";
import {
  FileText, Trash2, RefreshCcw, CheckCircle2,
  Layers, ChevronRight, AlertTriangle, Clock,
} from "lucide-react";
import type { PDFStatus } from "@/types";

interface FileCardProps {
  filename:     string;
  originalName?: string;
  size?:         string;
  status:        PDFStatus;          // single source of truth — replaces isEmbedded/isEmbedding
  statusLabel:   string;             // human-readable label from getStatusLabel()
  isReady:       boolean;            // true only when status === "ready"
  totalChunks?:  number;
  isSelected?:   boolean;
  onReEmbed?:    () => void;         // only shown on "failed" status
  onDelete?:     () => void;
  onSelect?:     () => void;
}

// Maps each PDFStatus to icon + colors for the file icon well
const statusIconConfig: Record<PDFStatus, {
  bg: string; border: string;
  icon: React.ReactNode;
}> = {
  uploading: {
    bg: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.2)",
    icon: <div style={{ width:16, height:16, borderRadius:"50%", border:"2px solid rgba(108,99,255,0.3)", borderTopColor:"#6c63ff", animation:"fc-spin 0.7s linear infinite" }} />,
  },
  processing: {
    bg: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.2)",
    icon: <div style={{ width:16, height:16, borderRadius:"50%", border:"2px solid rgba(108,99,255,0.3)", borderTopColor:"#6c63ff", animation:"fc-spin 0.7s linear infinite" }} />,
  },
  embedding: {
    bg: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)",
    icon: <div style={{ width:16, height:16, borderRadius:"50%", border:"2px solid rgba(167,139,250,0.3)", borderTopColor:"#a78bfa", animation:"fc-spin 0.7s linear infinite" }} />,
  },
  ready: {
    bg: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.22)",
    icon: <CheckCircle2 style={{ width:17, height:17, color:"#34d399" }} />,
  },
  failed: {
    bg: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)",
    icon: <AlertTriangle style={{ width:17, height:17, color:"#f87171" }} />,
  },
};

// Maps each PDFStatus to the pill badge appearance
const statusBadgeConfig: Record<PDFStatus, {
  color: string; bg: string; border: string; dotBg: string; pulse: boolean;
}> = {
  uploading:  { color:"#a78bfa", bg:"rgba(108,99,255,0.08)",  border:"rgba(108,99,255,0.2)",  dotBg:"#6c63ff",  pulse:true  },
  processing: { color:"#a78bfa", bg:"rgba(108,99,255,0.08)",  border:"rgba(108,99,255,0.2)",  dotBg:"#6c63ff",  pulse:true  },
  embedding:  { color:"#a78bfa", bg:"rgba(167,139,250,0.08)", border:"rgba(167,139,250,0.2)", dotBg:"#a78bfa",  pulse:true  },
  ready:      { color:"#34d399", bg:"rgba(52,211,153,0.08)",  border:"rgba(52,211,153,0.18)", dotBg:"#34d399",  pulse:false },
  failed:     { color:"#f87171", bg:"rgba(248,113,113,0.07)", border:"rgba(248,113,113,0.2)", dotBg:"#f87171",  pulse:false },
};

const FileCard: React.FC<FileCardProps> = ({
  filename,
  originalName,
  size,
  status,
  statusLabel,
  isReady,
  totalChunks,
  isSelected = false,
  onReEmbed,
  onDelete,
  onSelect,
}) => {
  const [hovered, setHovered] = React.useState(false);

  const displayName = originalName || filename;
  const shortName   = displayName.length > 28 ? displayName.slice(0, 28) + "…" : displayName;

  const iconConf  = statusIconConfig[status];
  const badgeConf = statusBadgeConfig[status];

  const isInProgress = status === "uploading" || status === "processing" || status === "embedding";

  return (
    <div
      onClick={isReady ? onSelect : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        borderRadius: "14px",
        overflow: "hidden",
        cursor: isReady ? "pointer" : "default",
        transition: "all 0.2s ease",
        background: isSelected
          ? "rgba(108,99,255,0.08)"
          : hovered && isReady
          ? "rgba(255,255,255,0.035)"
          : "rgba(255,255,255,0.02)",
        border: isSelected
          ? "1px solid rgba(108,99,255,0.4)"
          : hovered && isReady
          ? "1px solid rgba(255,255,255,0.09)"
          : "1px solid rgba(255,255,255,0.055)",
        boxShadow: isSelected
          ? "0 0 0 3px rgba(108,99,255,0.08), 0 4px 20px rgba(108,99,255,0.1)"
          : hovered && isReady
          ? "0 4px 16px rgba(0,0,0,0.2)"
          : "none",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* Selected accent strip */}
      {isSelected && (
        <div style={{
          position: "absolute", left:0, top:0, bottom:0, width:"3px",
          borderRadius: "14px 0 0 14px",
          background: "linear-gradient(180deg, #6c63ff 0%, #9333ea 100%)",
        }} />
      )}

      <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:"12px" }}>

        {/* ── Top row: icon + name + selected check ── */}
        <div style={{ display:"flex", alignItems:"flex-start", gap:"12px" }}>

          {/* File icon well */}
          <div style={{
            flexShrink:0, height:38, width:38, borderRadius:"10px",
            display:"flex", alignItems:"center", justifyContent:"center",
            background: iconConf.bg, border: iconConf.border,
            transition: "all 0.2s ease",
          }}>
            {iconConf.icon}
          </div>

          {/* Name + meta */}
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:13, fontWeight:500, color:"#e2e0ff", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", lineHeight:1.3 }}>
              {shortName}
            </p>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
              {size && <span style={{ fontSize:11, color:"#3d4157" }}>{size}</span>}
              {isReady && totalChunks && (
                <>
                  <span style={{ color:"#2e3250", fontSize:10 }}>·</span>
                  <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, color:"#34d399" }}>
                    <Layers style={{ width:10, height:10 }} />
                    {totalChunks} chunks
                  </span>
                </>
              )}
              {isInProgress && (
                <span style={{ fontSize:11, color:"#6c63ff" }}>{statusLabel}</span>
              )}
            </div>
          </div>

          {/* Selected checkmark */}
          {isSelected && (
            <div style={{
              flexShrink:0, height:20, width:20, borderRadius:"50%",
              background: "linear-gradient(135deg, #6c63ff, #9333ea)",
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow: "0 0 10px rgba(108,99,255,0.35)",
            }}>
              <CheckCircle2 style={{ width:12, height:12, color:"#fff" }} />
            </div>
          )}
        </div>

        {/* ── Status badge ── */}
        <div>
          <span style={{
            display:"inline-flex", alignItems:"center", gap:5,
            fontSize:11, fontWeight:500,
            color:   badgeConf.color,
            background: badgeConf.bg,
            border:  `1px solid ${badgeConf.border}`,
            padding: "3px 9px", borderRadius:"99px",
          }}>
            <span style={{
              width:5, height:5, borderRadius:"50%",
              background: badgeConf.dotBg,
              ...(badgeConf.pulse
                ? { boxShadow:`0 0 6px ${badgeConf.dotBg}`, animation:"fc-pulse 1.2s ease-in-out infinite" }
                : status === "ready"
                ? { boxShadow:"0 0 6px rgba(52,211,153,0.7)" }
                : {}),
            }} />
            {statusLabel}
          </span>
        </div>

        {/* ── Actions ── */}
        <div style={{ display:"flex", gap:8 }}>

          {/* Re-embed button — only for failed files */}
          {status === "failed" && onReEmbed && (
            <button
              onClick={(e) => { e.stopPropagation(); onReEmbed(); }}
              style={{
                flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                padding:"7px 12px", borderRadius:10, fontSize:12, fontWeight:500,
                fontFamily:"'DM Sans', system-ui, sans-serif", cursor:"pointer",
                border:"1px solid rgba(248,113,113,0.3)",
                background:"rgba(248,113,113,0.08)", color:"#f87171",
                transition:"all 0.18s ease",
              }}
              onMouseEnter={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.background = "rgba(248,113,113,0.16)";
                b.style.borderColor = "rgba(248,113,113,0.5)";
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.background = "rgba(248,113,113,0.08)";
                b.style.borderColor = "rgba(248,113,113,0.3)";
              }}
            >
              <RefreshCcw style={{ width:13, height:13 }} />
              Retry
            </button>
          )}

          {/* Select / Active toggle — only when ready */}
          {isReady && onSelect && (
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
              style={{
                flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                padding:"7px 12px", borderRadius:10, fontSize:12, fontWeight:500,
                fontFamily:"'DM Sans', system-ui, sans-serif", cursor:"pointer",
                transition:"all 0.18s ease",
                ...(isSelected
                  ? { border:"1px solid rgba(108,99,255,0.45)", background:"rgba(108,99,255,0.18)", color:"#c4b5fd" }
                  : { border:"1px solid rgba(52,211,153,0.22)", background:"rgba(52,211,153,0.07)", color:"#34d399" }),
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.8"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
            >
              {isSelected
                ? <><CheckCircle2 style={{ width:13, height:13 }} /> Active</>
                : <><ChevronRight  style={{ width:13, height:13 }} /> Select</>
              }
            </button>
          )}

          {/* In-progress placeholder — keeps layout stable while processing */}
          {isInProgress && (
            <div style={{
              flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              padding:"7px 12px", borderRadius:10, fontSize:12,
              border:"1px solid rgba(108,99,255,0.15)",
              background:"rgba(108,99,255,0.04)", color:"#4b5268",
            }}>
              <Clock style={{ width:13, height:13 }} />
              Processing…
            </div>
          )}

          {/* Delete */}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              style={{
                height:34, width:34, flexShrink:0,
                display:"flex", alignItems:"center", justifyContent:"center",
                borderRadius:10, cursor:"pointer",
                border:"1px solid rgba(255,255,255,0.06)",
                background:"transparent", color:"#3d4157",
                transition:"all 0.18s ease",
              }}
              onMouseEnter={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.color = "#f87171";
                b.style.borderColor = "rgba(248,113,113,0.3)";
                b.style.background = "rgba(248,113,113,0.08)";
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.color = "#3d4157";
                b.style.borderColor = "rgba(255,255,255,0.06)";
                b.style.background = "transparent";
              }}
            >
              <Trash2 style={{ width:14, height:14 }} />
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fc-spin  { to { transform: rotate(360deg); } }
        @keyframes fc-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.75); }
        }
      `}</style>
    </div>
  );
};

export default FileCard;