import { useEffect, useState } from "react";
import { Loader2, Download, FileTextIcon } from "lucide-react";
import { getCaseNarrative } from "../../../service/blotter-api/RecordView";

interface NarrativeViewerProps {
  caseNumber: string;
}

export function NarrativeViewer({ caseNumber }: NarrativeViewerProps) {
  const [raw, setRaw] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseNumber) return;
    setLoading(true);
    setError(null);
    getCaseNarrative(caseNumber)
      .then((text) => setRaw(text))
      .catch(() => setError("Could not load narrative."))
      .finally(() => setLoading(false));
  }, [caseNumber]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-6">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading narrative...
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  if (!raw) {
    return (
      <p className="text-sm text-gray-500 italic">
        — No narrative attached —
      </p>
    );
  }

  const isPdf = raw.startsWith("JVBERi0");
  const isPng = raw.startsWith("iVBORw0KGgo");
  const isJpeg = raw.startsWith("/9j/");
  const isDocx = raw.startsWith("UEsDBBQ");

  const isImage = isPng || isJpeg;

  if (isImage) {
    const mime = isPng ? "image/png" : "image/jpeg";
    const dataUrl = `data:${mime};base64,${raw}`;
    const ext = isPng ? "png" : "jpg";
    return (
      <div className="flex flex-col gap-3">
        <img
          src={dataUrl}
          alt="Incident Narrative"
          className="mt-2 max-h-[600px] rounded-lg border border-gray-200 object-contain"
        />
        <a
          href={dataUrl}
          download={`Narrative_${caseNumber}.${ext}`}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-gray-50 hover:text-blue-700"
        >
          <Download className="h-4 w-4" />
          Download Image
        </a>
      </div>
    );
  }

  let mime = "application/octet-stream";
  let ext = "file";

  if (isPdf) {
    mime = "application/pdf";
    ext = "pdf";
  } else if (isDocx) {
    mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    ext = "docx";
  } else {
    // fallback to .doc if starts with generic Microsoft Office ole magic
    if (raw.startsWith("0M8R4KGxGuE")) {
      mime = "application/msword";
      ext = "doc";
    } else {
      // If it's short, it might just be text or a txt file
      if (raw.length < 50000 && !raw.includes("AAB")) {
        mime = "text/plain";
        ext = "txt";
      }
    }
  }

  const dataUrl = `data:${mime};base64,${raw}`;

  return (
    <a
      href={dataUrl}
      download={`Narrative_${caseNumber}.${ext}`}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-gray-50 hover:text-blue-700"
    >
      <Download className="h-4 w-4" />
      Download Narrative File
    </a>
  );
}
