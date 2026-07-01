import { useEffect, useState } from "react";
import {
  FileTextIcon,
  DownloadIcon,
  Loader2Icon,
  BookOpenIcon,
  FileIcon,
} from "lucide-react";
import { getCaseNarrative } from "../../../../service/blotter-api/RecordView";

// ─── File type detection ───────────────────────────────────────────────────────
interface FileInfo {
  isText: boolean;
  mimeType: string;
  extension: string;
  label: string;
  textContent?: string;
  blobUrl?: string;
}

function detectAndDecode(base64: string): FileInfo {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    // File signature detection
    const b0 = bytes[0], b1 = bytes[1], b2 = bytes[2], b3 = bytes[3];

    // PDF: %PDF  (25 50 44 46)
    const isPDF = b0 === 0x25 && b1 === 0x50 && b2 === 0x44 && b3 === 0x46;
    // DOCX/ZIP: PK (50 4B)
    const isDocx = b0 === 0x50 && b1 === 0x4B;
    // Old .doc: D0 CF 11 E0
    const isDoc = b0 === 0xD0 && b1 === 0xCF && b2 === 0x11 && b3 === 0xE0;

    if (isPDF) {
      const blob = new Blob([bytes], { type: "application/pdf" });
      return {
        isText: false,
        mimeType: "application/pdf",
        extension: "pdf",
        label: "PDF Document",
        blobUrl: URL.createObjectURL(blob),
      };
    }

    if (isDocx) {
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      return {
        isText: false,
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        extension: "docx",
        label: "Word Document (.docx)",
        blobUrl: URL.createObjectURL(blob),
      };
    }

    if (isDoc) {
      const blob = new Blob([bytes], { type: "application/msword" });
      return {
        isText: false,
        mimeType: "application/msword",
        extension: "doc",
        label: "Word Document (.doc)",
        blobUrl: URL.createObjectURL(blob),
      };
    }

    // Assume plain text — decode as UTF-8
    const text = new TextDecoder("utf-8").decode(bytes);
    return { isText: true, mimeType: "text/plain", extension: "txt", label: "Text", textContent: text };
  } catch {
    // Not base64 — already plain text (legacy)
    return { isText: true, mimeType: "text/plain", extension: "txt", label: "Text", textContent: base64 };
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────
interface NarrativeViewerProps {
  caseNumber: string;
}

export function NarrativeViewer({ caseNumber }: NarrativeViewerProps) {
  const [raw, setRaw] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!caseNumber) return;
    setLoading(true);
    setError(null);
    getCaseNarrative(caseNumber)
      .then((text) => setRaw(text))
      .catch(() => setError("Could not load narrative."))
      .finally(() => setLoading(false));
  }, [caseNumber]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-6">
        <Loader2Icon className="w-4 h-4 animate-spin" />
        Loading narrative...
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  // ── No content ──
  if (!raw) {
    return (
      <p className="text-sm text-gray-400 italic">
        No narrative document attached.
      </p>
    );
  }

  const info = detectAndDecode(raw);

  // ── Binary file (PDF / DOCX / DOC) ──
  if (!info.isText) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
          <BookOpenIcon className="w-3.5 h-3.5" />
          Narrative Statement
        </div>
        <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileIcon className="w-5 h-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {info.label}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Attached narrative statement document
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View Button */}
            {info.mimeType === "application/pdf" && (
              <a
                href={info.blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                View Document
              </a>
            )}
            {/* Download Button */}
            <a
              href={info.blobUrl}
              download={`narrative-${caseNumber}.${info.extension}`}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <DownloadIcon className="w-3.5 h-3.5" />
              Download
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Plain text ──
  const preview = (info.textContent ?? "").slice(0, 400);
  const hasMore = (info.textContent ?? "").length > 400;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
        <BookOpenIcon className="w-3.5 h-3.5" />
        Narrative Statement
      </div>

      {/* Document card */}
      <div className="relative bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Decorative left bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-l-xl" />

        <div className="pl-5 pr-5 py-5">
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-[Georgia,serif]">
            {expanded ? info.textContent : preview}
            {!expanded && hasMore && (
              <span className="text-slate-400">…</span>
            )}
          </p>
        </div>

        {/* Show more / less */}
        {hasMore && (
          <div className="border-t border-slate-100 px-5 py-2.5 bg-slate-50 flex justify-between items-center">
            <span className="text-xs text-slate-400">
              {expanded
                ? `${(info.textContent ?? "").length} characters`
                : `Showing first 400 of ${(info.textContent ?? "").length} characters`}
            </span>
            <button
              onClick={() => setExpanded((p) => !p)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              {expanded ? "Show less ↑" : "Read full narrative ↓"}
            </button>
          </div>
        )}
      </div>

      {/* Download plain text */}
      <div className="flex justify-end">
        <a
          href={`data:text/plain;charset=utf-8,${encodeURIComponent(info.textContent ?? "")}`}
          download={`narrative-${caseNumber}.txt`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          <FileTextIcon className="w-3.5 h-3.5" />
          Download as .txt
        </a>
      </div>
    </div>
  );
}
