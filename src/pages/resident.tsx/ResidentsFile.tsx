import { PaperclipIcon } from "lucide-react";
import type { ResidentProfileViewDTO } from "../../service/resident-api/ResidentsManagement";

interface ResidentsFilesTabProps {
  profile: ResidentProfileViewDTO;
  formatDate: (date?: string) => string;
  openDocument: (doc: {
    fileData?: string;
    documentType?: string;
    documentName?: string;
  }) => void;
  downloadDocument: (doc: {
    fileData?: string;
    documentType?: string;
    documentName?: string;
  }) => void;
}

export function ResidentsFilesTab({
  profile,
  formatDate,
  openDocument,
  downloadDocument,
}: ResidentsFilesTabProps) {
  if (!profile.documents || profile.documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <PaperclipIcon className="w-11 h-11 mb-3 stroke-1" />
        <p className="text-sm font-medium text-gray-500">No files uploaded</p>
        <p className="text-xs mt-1 text-gray-400">
          This resident has no uploaded documents yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {profile.documents.map((doc, idx) => (
        <div
          key={`${doc.id ?? doc.documentName}-${idx}`}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3.5 hover:border-gray-300 hover:shadow-sm transition-all"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {doc.documentName || "Untitled document"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {doc.documentType || "FILE"}
              {doc.uploadedAt
                ? ` • Uploaded ${formatDate(doc.uploadedAt)}`
                : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openDocument(doc)}
              disabled={!doc.fileData}
              className="px-3 py-1.5 text-xs border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              View
            </button>
            <button
              type="button"
              onClick={() => downloadDocument(doc)}
              disabled={!doc.fileData}
              className="px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Download
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
