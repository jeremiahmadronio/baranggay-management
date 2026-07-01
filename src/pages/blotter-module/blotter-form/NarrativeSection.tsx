import { useRef } from "react";
import { SectionCard } from "../reusable/FormComponents";
import { FileTextIcon, UploadCloudIcon, XCircleIcon } from "lucide-react";

interface NarrativeSectionProps {
  mode: "record" | "formal";
  narrativeFile: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  clearErr: () => void;
}

const ACCEPTED = ".pdf,.doc,.docx,.txt";
const MAX_MB = 10;
const MAX_BYTES = MAX_MB * 1024 * 1024;

export const NarrativeSection = ({
  mode,
  narrativeFile,
  onChange,
  error,
  clearErr,
}: NarrativeSectionProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | null) => {
    if (!file) {
      onChange(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      // Just reject silently — parent validation will catch empty
      onChange(null);
      return;
    }
    onChange(file);
    clearErr();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0] ?? null;
    handleFile(file);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <SectionCard
      letter="E"
      title={
        mode === "record"
          ? "Narrative / Statement of Facts"
          : "Narrative / Sworn Statement"
      }
    >
      <p className="text-xs text-slate-500 mb-4">
        Upload a document containing the detailed narrative/statement of facts. Accepted formats: PDF, DOC, DOCX, TXT (max {MAX_MB} MB).
      </p>

      {/* Drop zone */}
      {!narrativeFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl px-6 py-10 cursor-pointer transition-colors ${
            error
              ? "border-red-300 bg-red-50/40"
              : "border-slate-300 bg-slate-50/60 hover:border-blue-400 hover:bg-blue-50/40"
          }`}
        >
          <UploadCloudIcon className="w-10 h-10 text-slate-400" />
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">
              Drag & drop your narrative file here
            </p>
            <p className="text-xs text-slate-400 mt-1">
              or click to browse — {ACCEPTED.split(",").join(", ")}
            </p>
          </div>
          <input
            ref={inputRef}
            id="field-narrative"
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>
      ) : (
        /* File selected preview */
        <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileTextIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {narrativeFile.name}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {formatSize(narrativeFile.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="flex-shrink-0 text-slate-400 hover:text-red-500 transition-colors"
            title="Remove file"
          >
            <XCircleIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
          ⚠ {error}
        </p>
      )}
    </SectionCard>
  );
};
