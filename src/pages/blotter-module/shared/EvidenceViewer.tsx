import { useState } from "react";
import { Loader2, PaperclipIcon } from "lucide-react";
import { getEvidenceFile } from "../../../service/blotter-api/RecordView";
import { viewOrDownloadFile } from "../../../utils/fileViewer";

interface EvidenceViewerProps {
  recordId: number;
  fileName: string;
}

export function EvidenceViewer({ recordId, fileName }: EvidenceViewerProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      const raw = await getEvidenceFile(recordId);
      if (!raw) {
        alert("File not found or empty.");
        return;
      }

      const isPdf = raw.startsWith("JVBERi0");
      const isPng = raw.startsWith("iVBORw0KGgo");
      const isJpeg = raw.startsWith("/9j/");
      const isDocx = raw.startsWith("UEsDBBQ");
      const isMp4 = raw.startsWith("AAAA") && raw.substring(0, 20).includes("Z0eXB"); // Z0eXB is base64 for 'ftyp'
      const isWebm = raw.startsWith("GkXfo");
      const isAvi = raw.startsWith("UklGR");

      let mime = "application/octet-stream";
      let ext = "bin";

      if (isPdf) {
        mime = "application/pdf";
        ext = "pdf";
      } else if (isPng) {
        mime = "image/png";
        ext = "png";
      } else if (isJpeg) {
        mime = "image/jpeg";
        ext = "jpg";
      } else if (isDocx) {
        mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        ext = "docx";
      } else if (isMp4) {
        mime = "video/mp4";
        ext = "mp4";
      } else if (isWebm) {
        mime = "video/webm";
        ext = "webm";
      } else if (isAvi) {
        mime = "video/x-msvideo";
        ext = "avi";
      } else if (raw.startsWith("0M8R4KGxGuE")) {
        mime = "application/msword";
        ext = "doc";
      } else if (raw.length < 50000 && !raw.includes("AAB")) {
        mime = "text/plain";
        ext = "txt";
      }

      viewOrDownloadFile(raw, mime, ext, `Evidence_${fileName.replace(/[^a-z0-9]/gi, "_")}`);
    } catch (err) {
      alert("Failed to download evidence.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
      title="Download Evidence"
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <PaperclipIcon className="w-3 h-3" />
      )}
      Download File
    </button>
  );
}
