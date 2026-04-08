// components/features/PDFUploader.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Loader2 } from "lucide-react";
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

const PDFUploader: React.FC<PDFUploaderProps> = ({
  onFilesChange,
  selectedFiles,
  onFileSelect,
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // ✅ Sync parent after every local files change — never call onFilesChange inside setFiles
  useEffect(() => {
    onFilesChange(files);
  }, [files, onFilesChange]);

  // ✅ Only touches local state — effect above handles parent sync
  const updateFile = useCallback(
    (filename: string, patch: Partial<UploadedFile>) => {
      setFiles((prev) =>
        prev.map((f) => (f.filename === filename ? { ...f, ...patch } : f))
      );
    },
    []
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setIsUploading(true);

      for (const file of acceptedFiles) {
        try {
          toast.loading(`Uploading ${file.name}...`, { id: file.name });

          const uploadRes = await pdfAPI.upload(file);
          const { savedAs, originalName, size } = uploadRes.file;

          const newFile: UploadedFile = {
            filename: savedAs,
            originalName,
            size,
            status: "uploading",
          };

          // ✅ No onFilesChange here — effect handles it
          setFiles((prev) => [...prev, newFile]);

          toast.loading(`Processing ${file.name}...`, { id: file.name });

          await pdfAPI.waitUntilReady(
            savedAs,
            (status) => updateFile(savedAs, { status })
          );

          const info = await pdfAPI.getInfo(savedAs);
          updateFile(savedAs, {
            status: "ready",
            totalChunks: info.totalChunks,
          });

          toast.success(`${file.name} ready — ${info.totalChunks} chunks`, {
            id: file.name,
          });
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : "Upload failed";
          toast.error(`${file.name}: ${msg}`, { id: file.name });
          const savedAs = (error as any)?.filename as string | undefined;
          if (savedAs) updateFile(savedAs, { status: "failed" });
        }
      }

      setIsUploading(false);
    },
    [updateFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: true,
    disabled: isUploading,
  });

  const handleForceReEmbed = async (filename: string) => {
    try {
      updateFile(filename, { status: "embedding" });
      toast.loading(`Re-embedding ${filename}...`, { id: filename });

      await pdfAPI.forceEmbed(filename);

      await pdfAPI.waitUntilReady(filename, (status) =>
        updateFile(filename, { status })
      );

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
      // ✅ No onFilesChange here — effect handles it
      setFiles((prev) => prev.filter((f) => f.filename !== filename));
      toast.success("File deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl
          p-8 text-center cursor-pointer glass
          transition-all duration-300 group
          ${isDragActive
            ? "border-accent bg-accent/10 scale-[1.01]"
            : "border-border hover:border-accent/40 bg-surface/50"
          }
          ${isUploading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div
            className={`p-4 rounded-2xl transition-all duration-300 ${
              isDragActive
                ? "bg-accent/20 scale-110 shadow-lg shadow-accent/20"
                : "bg-surface-2"
            }`}
          >
            {isUploading ? (
              <Loader2 className="h-8 w-8 text-accent animate-spin" />
            ) : (
              <Upload
                className={`h-8 w-8 transition-colors duration-300 ${
                  isDragActive ? "text-accent" : "text-text-secondary"
                } group-hover:text-accent`}
              />
            )}
          </div>
          <div className="space-y-1">
            {isDragActive ? (
              <p className="text-accent font-bold tracking-tight">
                Release to upload
              </p>
            ) : (
              <>
                <p className="text-text-primary font-semibold tracking-tight">
                  Click or drag PDF here
                </p>
                <p className="text-text-secondary text-xs uppercase tracking-widest font-medium opacity-60">
                  Max 10MB per file
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <p className="text-text-secondary text-xs font-bold uppercase tracking-widest">
                Repository ({files.length})
              </p>
            </div>
            <p className="text-text-secondary/40 text-[10px] font-medium uppercase tracking-tighter">
              Toggle selection to chat
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 max-h-[420px] overflow-y-auto pr-1 scrollbar-hide">
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
                      file.status === "failed"
                        ? "Processing failed — try re-embedding"
                        : `Still ${getStatusLabel(file.status).toLowerCase()}`,
                      { icon: "🧠" }
                    );
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {files.length === 0 && !isUploading && (
        <div className="text-center py-10 opacity-30">
          <FileText className="h-10 w-10 mx-auto mb-3 text-text-secondary" />
          <p className="text-text-secondary text-sm font-medium">
            Your library is empty
          </p>
        </div>
      )}
    </div>
  );
};

export default PDFUploader;