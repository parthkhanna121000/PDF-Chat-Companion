// // components/features/PDFUploader.tsx
// "use client";

// import { useState, useCallback, useEffect } from "react";
// import { useDropzone } from "react-dropzone";
// import { Upload, FileText, Loader2 } from "lucide-react";
// import { pdfAPI } from "@/lib/api";
// import { getStatusLabel, isReady } from "@/lib/utils";
// import { PDFStatus } from "@/types";
// import { FileCard } from "../ui";
// import toast from "react-hot-toast";

// interface UploadedFile {
//   filename: string;
//   originalName: string;
//   size: string;
//   status: PDFStatus;
//   totalChunks?: number;
// }

// interface PDFUploaderProps {
//   onFilesChange: (files: UploadedFile[]) => void;
//   selectedFiles: string[];
//   onFileSelect: (filename: string) => void;
// }

// const PDFUploader: React.FC<PDFUploaderProps> = ({
//   onFilesChange,
//   selectedFiles,
//   onFileSelect,
// }) => {
//   const [files, setFiles] = useState<UploadedFile[]>([]);
//   const [isUploading, setIsUploading] = useState(false);

//   useEffect(() => {
//     onFilesChange(files);
//   }, [files, onFilesChange]);

//   const updateFile = useCallback(
//     (filename: string, patch: Partial<UploadedFile>) => {
//       setFiles((prev) =>
//         prev.map((f) => (f.filename === filename ? { ...f, ...patch } : f))
//       );
//     },
//     []
//   );

//   const onDrop = useCallback(
//     async (acceptedFiles: File[]) => {
//       if (acceptedFiles.length === 0) return;
//       setIsUploading(true);

//       for (const file of acceptedFiles) {
//         try {
//           toast.loading(`Uploading ${file.name}...`, { id: file.name });

//           const uploadRes = await pdfAPI.upload(file);
//           const { savedAs, originalName, size } = uploadRes.file;

//           const newFile: UploadedFile = {
//             filename: savedAs,
//             originalName,
//             size,
//             status: "uploading",
//           };

//           setFiles((prev) => [...prev, newFile]);
//           toast.loading(`Processing ${file.name}...`, { id: file.name });

//           await pdfAPI.waitUntilReady(savedAs, (status) =>
//             updateFile(savedAs, { status })
//           );

//           const info = await pdfAPI.getInfo(savedAs);
//           updateFile(savedAs, { status: "ready", totalChunks: info.totalChunks });

//           toast.success(`${file.name} ready — ${info.totalChunks} chunks`, {
//             id: file.name,
//           });
//         } catch (error: unknown) {
//           const msg = error instanceof Error ? error.message : "Upload failed";
//           toast.error(`${file.name}: ${msg}`, { id: file.name });
//           const savedAs = (error as any)?.filename as string | undefined;
//           if (savedAs) updateFile(savedAs, { status: "failed" });
//         }
//       }

//       setIsUploading(false);
//     },
//     [updateFile]
//   );

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     onDrop,
//     accept: { "application/pdf": [".pdf"] },
//     multiple: true,
//     disabled: isUploading,
//   });

//   const handleForceReEmbed = async (filename: string) => {
//     try {
//       updateFile(filename, { status: "embedding" });
//       toast.loading(`Re-embedding ${filename}...`, { id: filename });

//       await pdfAPI.forceEmbed(filename);

//       await pdfAPI.waitUntilReady(filename, (status) =>
//         updateFile(filename, { status })
//       );

//       const info = await pdfAPI.getInfo(filename);
//       updateFile(filename, { status: "ready", totalChunks: info.totalChunks });
//       toast.success(`Re-embedded — ${info.totalChunks} chunks`, { id: filename });
//     } catch {
//       updateFile(filename, { status: "failed" });
//       toast.error("Re-embedding failed", { id: filename });
//     }
//   };

//   const handleDelete = async (filename: string) => {
//     try {
//       await pdfAPI.delete(filename);
//       setFiles((prev) => prev.filter((f) => f.filename !== filename));
//       toast.success("File deleted");
//     } catch {
//       toast.error("Delete failed");
//     }
//   };

//   return (
//     <>
//       <style>{`
//         @keyframes pdfup-pulse {
//           0%, 100% { opacity: 0.5; transform: scale(1); }
//           50% { opacity: 1; transform: scale(1.04); }
//         }
//         @keyframes pdfup-shimmer {
//           0%   { background-position: -200% center; }
//           100% { background-position: 200% center; }
//         }
//         @keyframes pdfup-fadeIn {
//           from { opacity: 0; transform: translateY(6px); }
//           to   { opacity: 1; transform: translateY(0); }
//         }
//         .pdfup-scrollbar::-webkit-scrollbar { width: 3px; }
//         .pdfup-scrollbar::-webkit-scrollbar-track { background: transparent; }
//         .pdfup-scrollbar::-webkit-scrollbar-thumb {
//           background: rgba(168,85,247,0.18); border-radius: 4px;
//         }
//         .pdfup-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(168,85,247,0.18) transparent; }
//         .pdfup-dropzone-idle:hover {
//           border-color: rgba(168,85,247,0.3) !important;
//           background: rgba(168,85,247,0.03) !important;
//         }
//       `}</style>

//       <div className="flex flex-col gap-5" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

//         {/* ── Dropzone ── */}
//         <div
//           {...getRootProps()}
//           className={`pdfup-dropzone-idle relative rounded-2xl p-7 text-center cursor-pointer transition-all duration-300 ${isUploading ? "pointer-events-none" : ""}`}
//           style={{
//             border: isDragActive
//               ? "1.5px dashed rgba(168,85,247,0.6)"
//               : "1.5px dashed rgba(255,255,255,0.1)",
//             background: isDragActive
//               ? "rgba(168,85,247,0.07)"
//               : "rgba(255,255,255,0.02)",
//             opacity: isUploading ? 0.5 : 1,
//             backdropFilter: "blur(8px)",
//             transform: isDragActive ? "scale(1.01)" : "scale(1)",
//           }}
//         >
//           <input {...getInputProps()} />

//           {/* Drag glow */}
//           {isDragActive && (
//             <div
//               className="absolute inset-0 rounded-2xl pointer-events-none"
//               style={{ boxShadow: "inset 0 0 30px rgba(168,85,247,0.08)", border: "none" }}
//             />
//           )}

//           <div className="flex flex-col items-center gap-4">
//             <div
//               className="p-4 rounded-2xl transition-all duration-300"
//               style={{
//                 background: isDragActive
//                   ? "rgba(168,85,247,0.15)"
//                   : "rgba(255,255,255,0.04)",
//                 border: isDragActive
//                   ? "0.5px solid rgba(168,85,247,0.35)"
//                   : "0.5px solid rgba(255,255,255,0.08)",
//                 transform: isDragActive ? "scale(1.1)" : "scale(1)",
//               }}
//             >
//               {isUploading ? (
//                 <Loader2
//                   className="h-7 w-7 animate-spin"
//                   style={{ color: "#c084fc" }}
//                 />
//               ) : (
//                 <Upload
//                   className="h-7 w-7 transition-colors duration-300"
//                   style={{ color: isDragActive ? "#c084fc" : "rgba(255,255,255,0.25)" }}
//                 />
//               )}
//             </div>

//             <div className="space-y-1">
//               {isDragActive ? (
//                 <p
//                   className="font-semibold text-sm tracking-tight"
//                   style={{
//                     background: "linear-gradient(135deg, #c084fc, #f472b6)",
//                     WebkitBackgroundClip: "text",
//                     WebkitTextFillColor: "transparent",
//                   }}
//                 >
//                   Release to upload
//                 </p>
//               ) : (
//                 <>
//                   <p className="font-semibold text-sm tracking-tight" style={{ color: "rgba(255,255,255,0.7)" }}>
//                     Click or drag PDF here
//                   </p>
//                   <p className="text-[10px] uppercase tracking-widest font-medium" style={{ color: "rgba(255,255,255,0.2)" }}>
//                     Max 10 MB per file
//                   </p>
//                 </>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* ── File List ── */}
//         {files.length > 0 && (
//           <div className="flex flex-col gap-3" style={{ animation: "pdfup-fadeIn 0.25s ease" }}>
//             {/* Section header */}
//             <div className="flex items-center justify-between px-1">
//               <div className="flex items-center gap-2">
//                 <span
//                   className="w-[5px] h-[5px] rounded-full"
//                   style={{ background: "#c084fc", boxShadow: "0 0 6px rgba(192,132,252,0.6)", animation: "pdfup-pulse 2s ease infinite" }}
//                 />
//                 <p
//                   className="text-[10px] font-semibold uppercase tracking-widest"
//                   style={{ color: "rgba(255,255,255,0.3)" }}
//                 >
//                   Library ({files.length})
//                 </p>
//               </div>
//               <p className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.15)" }}>
//                 Tap to select
//               </p>
//             </div>

//             {/* Cards */}
//             <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1 pdfup-scrollbar">
//               {files.map((file) => (
//                 <FileCard
//                   key={file.filename}
//                   filename={file.filename}
//                   originalName={file.originalName}
//                   size={file.size}
//                   status={file.status}
//                   statusLabel={getStatusLabel(file.status)}
//                   isReady={isReady(file.status)}
//                   totalChunks={file.totalChunks}
//                   isSelected={selectedFiles.includes(file.filename)}
//                   onReEmbed={() => handleForceReEmbed(file.filename)}
//                   onDelete={() => handleDelete(file.filename)}
//                   onSelect={() => {
//                     if (isReady(file.status)) {
//                       onFileSelect(file.filename);
//                     } else {
//                       toast.error(
//                         file.status === "failed"
//                           ? "Processing failed — try re-embedding"
//                           : `Still ${getStatusLabel(file.status).toLowerCase()}`,
//                         { icon: "🧠" }
//                       );
//                     }
//                   }}
//                 />
//               ))}
//             </div>
//           </div>
//         )}

//         {/* ── Empty State ── */}
//         {files.length === 0 && !isUploading && (
//           <div className="text-center py-10" style={{ opacity: 0.25 }}>
//             <div
//               className="mx-auto mb-3 h-10 w-10 rounded-xl flex items-center justify-center"
//               style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}
//             >
//               <FileText className="h-5 w-5" style={{ color: "rgba(255,255,255,0.4)" }} />
//             </div>
//             <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
//               Your library is empty
//             </p>
//             <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>
//               Upload your first PDF above
//             </p>
//           </div>
//         )}
//       </div>
//     </>
//   );
// };

// export default PDFUploader;
// components/features/PDFUploader.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Loader2, CloudUpload } from "lucide-react";
import { pdfAPI } from "@/lib/api";
import { getStatusLabel, isReady } from "@/lib/utils";
import { PDFStatus } from "@/types";
import { FileCard } from "../ui";
import toast from "react-hot-toast";

interface UploadedFile {
  filename: string;
  originalName: string;
  size: string;
  status: PDFStatus;
  totalChunks?: number;
}

interface PDFUploaderProps {
  onFilesChange: (files: UploadedFile[]) => void;
  selectedFiles: string[];
  onFileSelect: (filename: string) => void;
}

const PDFUploader: React.FC<PDFUploaderProps> = ({ onFilesChange, selectedFiles, onFileSelect }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => { onFilesChange(files); }, [files, onFilesChange]);

  const updateFile = useCallback((filename: string, patch: Partial<UploadedFile>) => {
    setFiles((prev) => prev.map((f) => (f.filename === filename ? { ...f, ...patch } : f)));
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setIsUploading(true);
    for (const file of acceptedFiles) {
      try {
        toast.loading(`Uploading ${file.name}...`, { id: file.name });
        const uploadRes = await pdfAPI.upload(file);
        const { savedAs, originalName, size } = uploadRes.file;
        setFiles((prev) => [...prev, { filename: savedAs, originalName, size, status: "uploading" }]);
        toast.loading(`Processing ${file.name}...`, { id: file.name });
        await pdfAPI.waitUntilReady(savedAs, (status) => updateFile(savedAs, { status }));
        const info = await pdfAPI.getInfo(savedAs);
        updateFile(savedAs, { status: "ready", totalChunks: info.totalChunks });
        toast.success(`${file.name} ready — ${info.totalChunks} chunks`, { id: file.name });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Upload failed";
        toast.error(`${file.name}: ${msg}`, { id: file.name });
        const savedAs = (error as any)?.filename as string | undefined;
        if (savedAs) updateFile(savedAs, { status: "failed" });
      }
    }
    setIsUploading(false);
  }, [updateFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "application/pdf": [".pdf"] }, multiple: true, disabled: isUploading,
  });

  const handleForceReEmbed = async (filename: string) => {
    try {
      updateFile(filename, { status: "embedding" });
      toast.loading(`Re-embedding ${filename}...`, { id: filename });
      await pdfAPI.forceEmbed(filename);
      await pdfAPI.waitUntilReady(filename, (status) => updateFile(filename, { status }));
      const info = await pdfAPI.getInfo(filename);
      updateFile(filename, { status: "ready", totalChunks: info.totalChunks });
      toast.success(`Re-embedded — ${info.totalChunks} chunks`, { id: filename });
    } catch {
      updateFile(filename, { status: "failed" });
      toast.error("Re-embedding failed", { id: filename });
    }
  };

  const handleDelete = async (filename: string) => {
    try {
      await pdfAPI.delete(filename);
      setFiles((prev) => prev.filter((f) => f.filename !== filename));
      toast.success("File deleted");
    } catch { toast.error("Delete failed"); }
  };

  return (
    <>
      <style>{`
        @keyframes pdfup-fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pdfup-pulse-dot { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.15)} }
        @keyframes pdfup-spin { to{transform:rotate(360deg)} }
        .pdfup-dz:hover { border-color: rgba(139,92,246,0.3) !important; background: rgba(139,92,246,0.03) !important; }
        .pdfup-scroll::-webkit-scrollbar{width:3px}
        .pdfup-scroll::-webkit-scrollbar-thumb{background:rgba(139,92,246,0.18);border-radius:4px}
        .pdfup-scroll{scrollbar-width:thin;scrollbar-color:rgba(139,92,246,0.18) transparent}
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif" }}>

        {/* ── DROPZONE ── */}
        <div
          {...getRootProps()}
          className={isUploading ? "" : "pdfup-dz"}
          style={{
            position: "relative", borderRadius: 16, padding: "32px 24px", textAlign: "center",
            cursor: isUploading ? "not-allowed" : "pointer", transition: "all 0.25s",
            border: isDragActive ? "1.5px dashed rgba(139,92,246,0.6)" : "1.5px dashed rgba(255,255,255,0.1)",
            background: isDragActive ? "rgba(139,92,246,0.07)" : "rgba(255,255,255,0.02)",
            opacity: isUploading ? 0.55 : 1,
            transform: isDragActive ? "scale(1.01)" : "scale(1)",
          }}
        >
          <input {...getInputProps()} />

          {/* inner glow on drag */}
          {isDragActive && (
            <div style={{ position: "absolute", inset: 0, borderRadius: 16, boxShadow: "inset 0 0 40px rgba(139,92,246,0.08)", pointerEvents: "none" }} />
          )}

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            {/* icon */}
            <div style={{
              width: 56, height: 56, borderRadius: 16, transition: "all 0.25s",
              background: isDragActive ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.04)",
              border: isDragActive ? "1px solid rgba(139,92,246,0.35)" : "1px solid rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transform: isDragActive ? "scale(1.1)" : "scale(1)",
              boxShadow: isDragActive ? "0 8px 30px rgba(139,92,246,0.15)" : "none",
            }}>
              {isUploading
                ? <Loader2 size={22} style={{ color: "#a78bfa", animation: "pdfup-spin 0.8s linear infinite" }} />
                : <CloudUpload size={22} style={{ color: isDragActive ? "#c084fc" : "rgba(255,255,255,0.25)", transition: "color 0.25s" }} />}
            </div>

            {/* text */}
            <div>
              {isDragActive ? (
                <p style={{ fontSize: 14, fontWeight: 600, background: "linear-gradient(135deg,#c084fc,#f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
                  Release to upload
                </p>
              ) : (
                <>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", margin: 0 }}>
                    Click or drag PDF here
                  </p>
                  <p style={{ fontSize: 10, letterSpacing: "0.1em", fontWeight: 500, color: "rgba(255,255,255,0.2)", marginTop: 5, textTransform: "uppercase" }}>
                    Max 10 MB per file · Multiple files supported
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── FILE LIST ── */}
        {files.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "pdfup-fadeIn 0.25s ease" }}>
            {/* section header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", boxShadow: "0 0 8px rgba(167,139,250,0.6)", animation: "pdfup-pulse-dot 2s ease infinite", display: "block" }} />
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
                  Library ({files.length})
                </span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.15)" }}>
                Tap to select
              </span>
            </div>

            {/* cards */}
            <div className="pdfup-scroll" style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 420, overflowY: "auto", paddingRight: 2 }}>
              {files.map((file) => (
                <FileCard
                  key={file.filename}
                  filename={file.filename}
                  originalName={file.originalName}
                  size={file.size}
                  status={file.status}
                  statusLabel={getStatusLabel(file.status)}
                  isReady={isReady(file.status)}
                  totalChunks={file.totalChunks}
                  isSelected={selectedFiles.includes(file.filename)}
                  onReEmbed={() => handleForceReEmbed(file.filename)}
                  onDelete={() => handleDelete(file.filename)}
                  onSelect={() => {
                    if (isReady(file.status)) {
                      onFileSelect(file.filename);
                    } else {
                      toast.error(
                        file.status === "failed" ? "Processing failed — try re-embedding" : `Still ${getStatusLabel(file.status).toLowerCase()}`,
                        { icon: "🧠" }
                      );
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {files.length === 0 && !isUploading && (
          <div style={{ textAlign: "center", padding: "36px 16px", opacity: 0.25 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <FileText size={20} style={{ color: "rgba(255,255,255,0.4)" }} />
            </div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)", margin: 0 }}>Your library is empty</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 5 }}>Upload your first PDF above</p>
          </div>
        )}
      </div>
    </>
  );
};

export default PDFUploader;