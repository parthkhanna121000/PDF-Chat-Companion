// components/features/PDFViewer.tsx
"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
  type ComponentType,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, AlertTriangle, Loader2, ChevronUp, ChevronDown, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPDFUrl } from "@/lib/utils"; // ← was wrongly imported from @/lib/api

export interface PDFViewerHandle {
  goToPage: (page: number) => void;
  scrollToTop: () => void;
}

export interface PDFViewerProps {
  filename: string;
  currentPage: number;
  zoom: number;
  onPageChange: (page: number) => void;
  onTotalPages: (total: number) => void;
  onLoadSuccess?: () => void;
  onLoadError?: (err: Error) => void;
  className?: string;
}

type AnyComponent = ComponentType<any>;

interface ReactPDFModule {
  Document: AnyComponent;
  Page: AnyComponent;
  pdfjs: {
    version: string;
    GlobalWorkerOptions: { workerSrc: string };
  };
}

function LoadingSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-8 py-12 px-6"
    >
      <div className="flex items-center gap-3 px-4 py-2 bg-surface-2 rounded-full border border-border">
        <Loader2 size={16} className="animate-spin text-accent" />
        <span className="text-xs text-text-secondary font-medium uppercase tracking-wider">
          Initializing renderer...
        </span>
      </div>
      {[1, 0.9, 0.8].map((op, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: op, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="w-full max-w-[700px] aspect-[1/1.41] bg-surface-2 rounded-xl border border-border animate-pulse"
        />
      ))}
    </motion.div>
  );
}

function ErrorState({
  message,
  filename,
  onRetry,
}: {
  message: string | null;
  filename: string;
  onRetry: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center"
    >
      <div className="w-20 h-20 rounded-3xl bg-error/10 border border-error/20 flex items-center justify-center">
        <AlertTriangle size={32} className="text-error" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-text-primary">
          Unable to display PDF
        </h3>
        <p className="text-sm text-text-secondary max-w-xs mx-auto">
          {message ?? "This document could not be processed. Please check if the file is corrupted."}
        </p>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 bg-surface-2 rounded-lg border border-border font-mono text-[10px] text-text-secondary">
        <FileText size={14} /> {filename}
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold text-sm transition-all"
      >
        <RefreshCcw size={16} /> Try again
      </button>
    </motion.div>
  );
}

function MiniNavigator({
  current,
  total,
  onPrev,
  onNext,
}: {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const progress = current / Math.max(total, 1);
  const circumference = 88;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 glass flex items-center gap-4 px-4 py-2.5 rounded-2xl shadow-2xl"
    >
      <button
        onClick={onPrev}
        disabled={current <= 1}
        className="p-1.5 hover:bg-surface-2 rounded-lg text-text-secondary disabled:opacity-20 transition-colors"
      >
        <ChevronUp size={20} />
      </button>

      <div className="flex items-center gap-3 px-2 border-x border-border">
        <div className="relative w-8 h-8 flex items-center justify-center">
          <svg className="absolute inset-0 -rotate-90 w-8 h-8">
            <circle
              cx="16" cy="16" r="14"
              fill="none" stroke="var(--border)" strokeWidth="3"
            />
            <motion.circle
              cx="16" cy="16" r="14"
              fill="none" stroke="var(--accent)" strokeWidth="3"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: circumference - circumference * progress }}
            />
          </svg>
          <span className="text-[10px] font-bold text-text-primary z-10">
            {current}
          </span>
        </div>
        <span className="text-xs font-medium text-text-secondary">
          of {total}
        </span>
      </div>

      <button
        onClick={onNext}
        disabled={current >= total}
        className="p-1.5 hover:bg-surface-2 rounded-lg text-text-secondary disabled:opacity-20 transition-colors"
      >
        <ChevronDown size={20} />
      </button>
    </motion.div>
  );
}

export const PDFViewer = forwardRef<PDFViewerHandle, PDFViewerProps>(
  (props, ref) => {
    const {
      filename,
      currentPage,
      zoom,
      onPageChange,
      onTotalPages,
      onLoadSuccess,
      onLoadError,
      className,
    } = props;

    const [pdfModule, setPdfModule] = useState<ReactPDFModule | null>(null);
    const [numPages, setNumPages] = useState(0);
    const [containerW, setContainerW] = useState(0);
    const [loadState, setLoadState] = useState<"loading" | "success" | "error">("loading");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [visiblePage, setVisiblePage] = useState(1);
    const [retryKey, setRetryKey] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
    const scrollingTo = useRef(false);

    const pdfUrl = getPDFUrl(filename);

    // Lazy-load react-pdf + configure worker
    useEffect(() => {
      let cancelled = false;
      (async () => {
        try {
          // These CSS modules need a type shim (see declarations.d.ts note below)
          await import("react-pdf/dist/Page/AnnotationLayer.css");
          await import("react-pdf/dist/Page/TextLayer.css");
          const mod = (await import("react-pdf")) as unknown as ReactPDFModule;
          if (cancelled) return;
          mod.pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${mod.pdfjs.version}/pdf.worker.min.js`;
          setPdfModule(mod);
        } catch {
          if (!cancelled) {
            setLoadState("error");
            setErrorMsg("PDF engine failed to initialize");
          }
        }
      })();
      return () => { cancelled = true; };
    }, []);

    // Measure container width via ResizeObserver so pageWidth stays accurate
    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const ro = new ResizeObserver(([entry]) => {
        setContainerW(entry.contentRect.width);
      });
      ro.observe(el);
      // Set immediately on mount so first render isn't 0-width
      setContainerW(el.clientWidth);
      return () => ro.disconnect();
    }, []);

    // Track visible page via IntersectionObserver
    useEffect(() => {
      if (loadState !== "success" || numPages === 0) return;

      observerRef.current?.disconnect();

      const observer = new IntersectionObserver(
        (entries) => {
          if (scrollingTo.current) return;
          // Pick the entry with the highest intersection ratio
          const best = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (!best) return;
          const idx = pageRefs.current.indexOf(best.target as HTMLDivElement);
          if (idx !== -1) {
            const page = idx + 1;
            setVisiblePage(page);
            onPageChange(page);
          }
        },
        { root: containerRef.current, threshold: [0.3, 0.6] }
      );

      pageRefs.current.forEach((el) => { if (el) observer.observe(el); });
      observerRef.current = observer;

      return () => observer.disconnect();
    }, [loadState, numPages, onPageChange]);

    const observerRef = useRef<IntersectionObserver | null>(null);

    const scrollToPage = useCallback((page: number) => {
      const el = pageRefs.current[page - 1];
      if (!el || !containerRef.current) return;
      scrollingTo.current = true;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setVisiblePage(page);
      setTimeout(() => { scrollingTo.current = false; }, 800);
    }, []);

    // Respond to external currentPage changes
    useEffect(() => {
      if (currentPage !== visiblePage && loadState === "success") {
        scrollToPage(currentPage);
      }
    }, [currentPage, loadState, scrollToPage, visiblePage]);

    useImperativeHandle(ref, () => ({
      goToPage: scrollToPage,
      scrollToTop: () =>
        containerRef.current?.scrollTo({ top: 0, behavior: "smooth" }),
    }));

    const PAGE_MARGIN = 32;
    const pageWidth =
      containerW > 0 ? (containerW - PAGE_MARGIN * 2) * zoom : 600;

    return (
      <div className={cn("relative flex flex-col w-full h-full bg-background", className)}>
        <div
          ref={containerRef}
          className="flex-1 overflow-auto scrollbar-hide bg-[#0b0d12]"
        >
          <AnimatePresence mode="wait">
            {(!pdfModule || loadState === "loading") && (
              <LoadingSkeleton key="loader" />
            )}

            {loadState === "error" && (
              <ErrorState
                key="error"
                message={errorMsg}
                filename={filename}
                onRetry={() => {
                  setLoadState("loading");
                  setErrorMsg(null);
                  setRetryKey((k) => k + 1);
                }}
              />
            )}

            {pdfModule && (
              <pdfModule.Document
                key={`${filename}-${retryKey}`}
                file={pdfUrl}
                onLoadSuccess={({ numPages: n }: { numPages: number }) => {
                  setNumPages(n);
                  // Pre-size the refs array so all page slots exist immediately
                  pageRefs.current = Array(n).fill(null);
                  setLoadState("success");
                  onTotalPages(n);
                  onLoadSuccess?.();
                }}
                onLoadError={(err: Error) => {
                  setLoadState("error");
                  setErrorMsg(err.message);
                  onLoadError?.(err);
                }}
                className={cn(
                  "flex flex-col items-center py-12",
                  loadState !== "success" && "hidden"
                )}
              >
                {Array.from({ length: numPages }, (_, i) => (
                  <div
                    key={i + 1}
                    ref={(el) => { pageRefs.current[i] = el; }}
                    className="mb-8 relative"
                  >
                    <div className="absolute -left-12 top-0 text-[10px] font-mono text-text-secondary opacity-50">
                      P.{String(i + 1).padStart(2, "0")}
                    </div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className={cn(
                        "transition-all duration-500 rounded-lg overflow-hidden",
                        visiblePage === i + 1
                          ? "ring-2 ring-accent ring-offset-4 ring-offset-[#0b0d12] shadow-2xl shadow-accent/10"
                          : "shadow-xl"
                      )}
                    >
                      <pdfModule.Page
                        pageNumber={i + 1}
                        width={pageWidth}
                        renderTextLayer
                        renderAnnotationLayer
                      />
                    </motion.div>
                  </div>
                ))}
              </pdfModule.Document>
            )}
          </AnimatePresence>
        </div>

        {loadState === "success" && (
          <MiniNavigator
            current={visiblePage}
            total={numPages}
            onPrev={() => scrollToPage(visiblePage - 1)}
            onNext={() => scrollToPage(visiblePage + 1)}
          />
        )}
      </div>
    );
  }
);

PDFViewer.displayName = "PDFViewer";
export default PDFViewer;