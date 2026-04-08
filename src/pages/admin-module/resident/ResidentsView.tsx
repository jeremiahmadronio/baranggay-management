import { useEffect, useState } from "react";
import { ChevronLeftIcon, CheckIcon, PencilIcon } from "lucide-react";
import type { ResidentProfileViewDTO } from "../../../service/admin-module-api/ResidentsManagement";
import { updateResidentStatus } from "../../../service/admin-module-api/ResidentsManagement";
import { ResidentsOverviewTab } from "./Overview";
import { ResidentsCaseHistoryTab } from "./CaseHistory";
import { ResidentsFilesTab } from "./ResidentsFile";
import {
  StatusUpdateModal,
  type StatusOption,
  type ReasonOption,
} from "../../../reusable/StatusUpdateModal";

import { ActionModal } from "../../../reusable/SuccessModal";

interface ResidentProfilePageProps {
  residentId: number;
  onBack: () => void;
  fetchProfile: (id: number) => Promise<ResidentProfileViewDTO>;
  readOnly?: boolean;
}

const RESIDENT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700 border border-green-200",
  INACTIVE: "bg-gray-100 text-gray-600 border border-gray-200",
  RETIRED: "bg-blue-50 text-blue-700 border border-blue-200",
  ARCHIVED: "bg-amber-50 text-amber-700 border border-amber-200",
  LOCKED: "bg-red-50 text-red-700 border border-red-200",
  DECEASED: "bg-red-50 text-red-700 border border-red-200",
};

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: "ACTIVE",
    label: "Active (Currently residing)",
  },
  {
    value: "INACTIVE",
    label: "Inactive (No longer active in records)",
  },
  {
    value: "DECEASED",
    label: "Deceased (Passed away)",
  },
  {
    value: "ARCHIVED",
    label: "Archived (Record archived for retention)",
  },
  {
    value: "MOVE_OUT",
    label: "Moved Out (Resident moved out of barangay)",
  },
];

const STATUS_REASON_OPTIONS: ReasonOption[] = [
  { value: "ADMINISTRATIVE_UPDATE", label: "Administrative update" },
  { value: "BARANGAY_AUDIT", label: "Barangay records audit" },
  { value: "RESIDENT_REQUEST", label: "Request by resident or family" },
  { value: "RELOCATION", label: "Relocation / moved out of barangay" },
  { value: "LEGAL_ORDER", label: "Court / legal order" },
  { value: "OTHER", label: "Other (specify)" },
];

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`bg-gray-200 rounded animate-pulse ${className ?? ""}`} />
  );
}

export function ResidentsView({
  residentId,
  onBack,
  fetchProfile,
  readOnly = false,
}: ResidentProfilePageProps) {
  const [profile, setProfile] = useState<ResidentProfileViewDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false); // add

  const [activeTab, setActiveTab] = useState<"overview" | "cases" | "files">(
    "overview",
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    setProfile(null);
    fetchProfile(residentId)
      .then(setProfile)
      .catch((e) => setError(e.message || "Failed to load profile"))
      .finally(() => setLoading(false));
  }, [residentId, fetchProfile]);

  const formatDate = (date?: string) => {
    if (!date) return "—";
    try {
      return new Date(date).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return date;
    }
  };

  const inferMimeFromName = (name?: string) => {
    const ext = name?.split(".").pop()?.toUpperCase();
    switch (ext) {
      case "PDF":
        return "application/pdf";
      case "PNG":
        return "image/png";
      case "JPG":
      case "JPEG":
        return "image/jpeg";
      case "WEBP":
        return "image/webp";
      case "GIF":
        return "image/gif";
      case "BMP":
        return "image/bmp";
      case "SVG":
        return "image/svg+xml";
      case "TXT":
        return "text/plain";
      case "CSV":
        return "text/csv";
      case "DOC":
        return "application/msword";
      case "DOCX":
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      case "XLS":
        return "application/vnd.ms-excel";
      case "XLSX":
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      case "PPT":
        return "application/vnd.ms-powerpoint";
      case "PPTX":
        return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
      case "ZIP":
        return "application/zip";
      case "RAR":
        return "application/vnd.rar";
      case "7Z":
        return "application/x-7z-compressed";
      case "MP4":
        return "video/mp4";
      case "MP3":
        return "audio/mpeg";
      default:
        return "application/octet-stream";
    }
  };

  const resolveDocumentMimeType = (type?: string, name?: string) => {
    if (type) {
      const trimmed = type.trim();
      if (trimmed.includes("/")) return trimmed;
      const fromType = inferMimeFromName(`x.${trimmed}`);
      if (fromType !== "application/octet-stream") return fromType;
    }
    return inferMimeFromName(name);
  };

  const base64ToBlobUrl = (base64: string, mime: string) => {
    const clean = base64.replace(/\s/g, "");
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: mime });
    return URL.createObjectURL(blob);
  };

  const normalizeAsset = (
    value?: string | null,
    mimeHint = "application/octet-stream",
  ) => {
    if (!value) return "";
    if (value.startsWith("data:") || value.startsWith("http")) return value;
    return `data:${mimeHint};base64,${value}`;
  };

  const openDocument = (doc: {
    fileData?: string;
    documentType?: string;
    documentName?: string;
  }) => {
    if (!doc.fileData) return;
    const mime = resolveDocumentMimeType(doc.documentType, doc.documentName);
    const src = base64ToBlobUrl(doc.fileData, mime);
    const win = window.open(src, "_blank", "noopener,noreferrer");
    if (!win) {
      const a = document.createElement("a");
      a.href = src;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.download = doc.documentName || "resident-document";
      a.click();
    }
    setTimeout(() => URL.revokeObjectURL(src), 60000);
  };

  const downloadDocument = (doc: {
    fileData?: string;
    documentType?: string;
    documentName?: string;
  }) => {
    if (!doc.fileData) return;
    const mime = resolveDocumentMimeType(doc.documentType, doc.documentName);
    const src = base64ToBlobUrl(doc.fileData, mime);
    const a = document.createElement("a");
    a.href = src;
    a.download = doc.documentName || "resident-document";
    a.click();
    setTimeout(() => URL.revokeObjectURL(src), 60000);
  };

  const handleStatusUpdate = async (payload: {
    status?: string;
    reason: string;
    reasonDetail?: string;
  }) => {
    if (!payload.status) return;
    try {
      await updateResidentStatus(residentId, {
        status: payload.status,
        reason: payload.reasonDetail
          ? `${payload.reason}: ${payload.reasonDetail}`
          : payload.reason,
      });
      // Re-fetch to reflect new status
      const updated = await fetchProfile(residentId);
      setProfile(updated);
      setIsSuccessModalOpen(true);
    } catch (e: any) {
      setError(e.message || "Failed to update status");
    }
  };

  const profilePhotoSrc = profile?.photo
    ? normalizeAsset(profile.photo, "image/jpeg")
    : "";

  const firstName = profile?.firstName?.trim() || "";
  const middleName = profile?.middleName?.trim() || "";
  const lastName = profile?.lastName?.trim() || "";

  const formattedDisplayName =
    lastName && firstName
      ? `${lastName}, ${firstName}${middleName ? ` ${middleName}` : ""}`
      : [firstName, middleName, lastName].filter(Boolean).join(" ");

  const fullDisplayName =
    [formattedDisplayName, profile?.suffix?.trim()].filter(Boolean).join(" ") ||
    profile?.fullName ||
    "Resident";

  const residentStatus = (profile?.status || "").toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back to Residents
          </button>
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-2">
              <SkeletonBlock className="h-8 w-56" />
              <SkeletonBlock className="h-4 w-80" />
            </div>
          ) : error ? null : (
            <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0">
                {profilePhotoSrc ? (
                  <img
                    src={profilePhotoSrc}
                    alt={fullDisplayName}
                    className="w-16 h-16 rounded-full object-cover border border-gray-200 shadow-sm cursor-zoom-in"
                    onClick={() => setIsPhotoModalOpen(true)}
                    title="Click to zoom"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-lg font-semibold text-gray-500">
                    {profile?.fullName
                      ?.split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "R"}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                      {fullDisplayName}
                    </h1>
                    {residentStatus && (
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${RESIDENT_STATUS_COLORS[residentStatus] ?? "bg-gray-100 text-gray-600 border border-gray-200"}`}
                      >
                        {residentStatus}
                      </span>
                    )}
                    {profile?.isVoter && (
                      <span className="text-xs font-medium bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <CheckIcon className="w-3 h-3" />
                        Registered Voter
                      </span>
                    )}
                    {profile?.isHeadOfFamily && (
                      <span className="text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full">
                        Head of Family
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1.5">
                    Barangay ID {profile?.barangayIdNumber || "N/A"}
                  </p>
                </div>
              </div>

              {!readOnly && (
                <div className="shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsStatusModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors w-full sm:w-auto"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Update Status
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="flex flex-col items-center justify-center py-24 text-red-500 gap-3 bg-white rounded-xl border border-gray-200">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                fetchProfile(residentId)
                  .then(setProfile)
                  .catch((e) => setError(e.message || "Failed to load"))
                  .finally(() => setLoading(false));
              }}
              className="text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {!error && (
          <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
            <div className="flex border-b border-gray-200 px-6 bg-white overflow-x-auto whitespace-nowrap">
              {(["overview", "cases", "files"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  disabled={loading}
                  className={`py-4 px-1 mr-8 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-800 disabled:pointer-events-none"}`}
                >
                  {tab === "cases"
                    ? `Case History${profile ? ` (${profile.cases?.length ?? 0})` : ""}`
                    : tab === "files"
                      ? `Files${profile ? ` (${profile.documents?.length ?? 0})` : ""}`
                      : "Overview"}
                </button>
              ))}
            </div>
            <div className="p-6 flex flex-col gap-5 bg-white">
              {loading && (
                <div className="flex flex-col gap-5">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="border border-gray-200 rounded-xl p-6 flex flex-col gap-4"
                    >
                      <SkeletonBlock className="h-4 w-32" />
                      <div className="grid grid-cols-2 gap-4">
                        {[...Array(6)].map((_, j) => (
                          <div key={j} className="flex flex-col gap-1.5">
                            <SkeletonBlock className="h-3 w-20" />
                            <SkeletonBlock className="h-4 w-32" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!loading && profile && activeTab === "overview" && (
                <ResidentsOverviewTab
                  profile={profile}
                  fullDisplayName={fullDisplayName}
                  formatDate={formatDate}
                />
              )}
              {!loading && profile && activeTab === "cases" && (
                <ResidentsCaseHistoryTab
                  profile={profile}
                  formatDate={formatDate}
                />
              )}
              {!loading && profile && activeTab === "files" && (
                <ResidentsFilesTab
                  profile={profile}
                  formatDate={formatDate}
                  openDocument={openDocument}
                  downloadDocument={downloadDocument}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {isPhotoModalOpen && profilePhotoSrc && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setIsPhotoModalOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsPhotoModalOpen(false)}
              className="absolute -top-10 right-0 text-white/90 hover:text-white text-sm"
            >
              Close
            </button>
            <img
              src={profilePhotoSrc}
              alt={fullDisplayName}
              className="w-[70vw] max-w-[520px] aspect-square rounded-full object-cover border-4 border-white shadow-2xl"
            />
          </div>
        </div>
      )}

      {!readOnly && (
        <>
          <StatusUpdateModal
            isOpen={isStatusModalOpen}
            onClose={() => setIsStatusModalOpen(false)}
            title="Update Resident Status"
            mode="status-and-reason"
            subjectName={fullDisplayName}
            subjectLabel="resident"
            statusOptions={STATUS_OPTIONS}
            reasonOptions={STATUS_REASON_OPTIONS}
            initialStatus={residentStatus || undefined}
            submitLabel="Update Status"
            onSubmit={handleStatusUpdate}
          />

          <ActionModal
            isOpen={isSuccessModalOpen}
            onClose={() => setIsSuccessModalOpen(false)}
            title="Status Updated"
            type="success"
          >
            The status of{" "}
            <span className="font-semibold text-gray-800">
              {fullDisplayName}
            </span>{" "}
            has been successfully updated.
          </ActionModal>
        </>
      )}
    </div>
  );
}
