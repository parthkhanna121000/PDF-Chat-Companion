// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { PDFStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const generateSessionId = (): string => {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

export const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

export const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()?.toLowerCase() || "";
};

export const getStatusLabel = (status: PDFStatus): string => {
  const labels: Record<PDFStatus, string> = {
    uploading:  "Uploading...",
    processing: "Extracting text...",
    embedding:  "Generating embeddings...",
    ready:      "Ready",
    failed:     "Failed",
  };
  return labels[status];
};

export const isReady = (status: PDFStatus): boolean => status === "ready";

export const getPDFUrl = (filename: string): string => {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  return `${base}/uploads/${filename}`;
};