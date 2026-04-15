import { useEffect, useState } from "react";
import {
  Archive,
  ArrowLeftIcon,
  CalendarClock,
  CircleUserRound,
  ClipboardList,
  Download,
  Eye,
  FilePenLine,
  FileText,
  Files,
  History as HistoryIcon,
  NotebookPen,
  Plus,
  Printer,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ftjsApi,
  FTJS_PERMISSIONS,
  hasFtjsPermission,
  type FtjsEditRequestDTO,
  type FtjsFullResponseDTO,
  type NotesResponseDTO,
  type RequestNewFtjsDTO,
  type ResponseNewFtjsFullDetailsDTO,
  type ResponseNewFtjsSummaryDTO,
  type TimelineResponseDTO,
} from "../../service/first-time-job-seeker-api/FirstTimeJobSeeker";
import { ArchiveReasonModal } from "../../hooks/archive-modal";
import { CenteredLoader } from "../../hooks/LoadingStates";
import { ActionModal } from "../../hooks/SuccessModal";
import { FormModalShell } from "../../reusable/FormModalShell";
import { PermissionDeniedPage } from "../blotter-module/reusable/PermissionDeniedPage";
import {
  buildFtjsAutoArchiveReason,
  EDUCATIONAL_ATTAINMENT_OPTIONS,
  FieldShell,
  fileToByteArray,
  formatDate,
  formatDateTime,
  formatStatusLabel,
  GENDER_OPTIONS,
  getFtjsValidIdConfig,
  getFtjsExpiryDate,
  InfoItem,
  isFtjsExpired,
  isEditableFtjsStatus,
  StatusPill,
  toDateInputValue,
  VALID_ID_OPTIONS,
} from "./shared";
import { generateFtjsCertificate } from "./generateFtjsCertificate";
import { useFtjsAccess } from "./useFtjsAccess";

type TabKey = "overview" | "documents" | "notes" | "timeline" | "reissuance";

type FeedbackState = {
  type: "success" | "danger" | "info";
  title: string;
  message: string;
} | null;

type EditFormState = {
  submittedDate: string;
  gender: string;
  address: string;
  contactNumber: string;
  email: string;
  educationalAttainment: string;
  course: string;
  institution: string;
  validIdType: string;
  idNumber: string;
  schoolAddress: string;
  purpose: string;
  oathFile: File | null;
};

type ReissueFormState = {
  reason: string;
  dateOfLoss: string;
  orNumber: string;
  amountPaid: string;
  affidavitFile: File | null;
};

const INITIAL_REISSUE_FORM: ReissueFormState = {
  reason: "",
  dateOfLoss: "",
  orNumber: "",
  amountPaid: "",
  affidavitFile: null,
};

function createEditForm(record: FtjsFullResponseDTO | null): EditFormState {
  return {
    submittedDate: record?.dateSubmitted
      ? (() => {
          const submittedDate = new Date(record.dateSubmitted);
          return Number.isNaN(submittedDate.getTime())
            ? ""
            : toDateInputValue(submittedDate);
        })()
      : "",
    gender: record?.gender || "",
    address: record?.fullAddress || "",
    contactNumber: record?.contactNumber || "",
    email: record?.email || "",
    educationalAttainment: record?.educationalAttainment || "",
    course: record?.course || "",
    institution: record?.institution || "",
    validIdType: record?.validIdType || "",
    idNumber: record?.idNumber || "",
    schoolAddress: record?.schoolAddress || "",
    purpose: record?.purpose || "",
    oathFile: null,
  };
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 p-5 text-sm text-gray-500 text-center">
      {text}
    </div>
  );
}

function DetailPanel({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
        <span className="text-slate-500">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function QuickActionCard({
  title,
  subtitle,
  icon,
  tone,
  onClick,
  disabled = false,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tone: "blue" | "amber" | "sky" | "rose" | "slate";
  onClick: () => void;
  disabled?: boolean;
}) {
  const tones = {
    blue: "border-blue-100 bg-blue-50/50 hover:bg-blue-50 text-blue-700",
    amber: "border-gray-200 bg-gray-50/50 hover:bg-gray-50 text-gray-700",
    sky: "border-green-100 bg-green-50/50 hover:bg-green-50 text-green-700",
    rose: "border-red-100 bg-red-50/50 hover:bg-red-50 text-red-700",
    slate: "border-gray-200 bg-gray-50/50 hover:bg-gray-50 text-gray-700",
  } as const;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-start rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:opacity-50 ${tones[tone]}`}
    >
      <span className="mb-3 inline-flex items-center justify-center rounded-lg bg-white/80 p-2">
        {icon}
      </span>
      <span className="text-sm font-semibold leading-tight">{title}</span>
      <span className="mt-1 text-xs text-gray-400 leading-tight">
        {subtitle}
      </span>
    </button>
  );
}

type DetectedFileType = {
  mime: string;
  extension: string;
  label: string;
  previewMode: "browser" | "text" | "download";
};

function normalizeList<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeBytes(value?: unknown): number[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is number =>
        typeof item === "number" && Number.isFinite(item),
    );
  }

  if (value instanceof Uint8Array) {
    return Array.from(value);
  }

  if (typeof value !== "string") {
    return [];
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return [];
  }

  if (trimmedValue.startsWith("[")) {
    try {
      const parsedValue = JSON.parse(trimmedValue);
      return normalizeBytes(parsedValue);
    } catch {
      return [];
    }
  }

  const base64Value = trimmedValue.includes(",")
    ? trimmedValue.slice(trimmedValue.indexOf(",") + 1)
    : trimmedValue;

  try {
    return Array.from(atob(base64Value), (char) => char.charCodeAt(0));
  } catch {
    return [];
  }
}

function matchesSignature(bytes: number[], signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

function containsAsciiFragment(bytes: number[], fragment: string, limit = 8192) {
  const safeChars = bytes
    .slice(0, limit)
    .map((value) =>
      value >= 32 && value <= 126 ? String.fromCharCode(value) : " ",
    )
    .join("");

  return safeChars.includes(fragment);
}

function isLikelyText(bytes: number[]) {
  const sample = bytes.slice(0, 512);
  if (!sample.length) return false;

  const printable = sample.filter((value) => {
    return value === 9 || value === 10 || value === 13 || (value >= 32 && value <= 126);
  }).length;

  return printable / sample.length > 0.85;
}

function detectFileType(bytes?: unknown): DetectedFileType {
  const normalizedBytes = normalizeBytes(bytes);

  if (normalizedBytes.length < 4) {
    return {
      mime: "application/octet-stream",
      extension: "bin",
      label: "Document",
      previewMode: "download",
    };
  }

  if (matchesSignature(normalizedBytes, [0x25, 0x50, 0x44, 0x46])) {
    return {
      mime: "application/pdf",
      extension: "pdf",
      label: "PDF",
      previewMode: "browser",
    };
  }

  if (matchesSignature(normalizedBytes, [0x89, 0x50, 0x4e, 0x47])) {
    return {
      mime: "image/png",
      extension: "png",
      label: "PNG",
      previewMode: "browser",
    };
  }

  if (normalizedBytes[0] === 0xff && normalizedBytes[1] === 0xd8) {
    return {
      mime: "image/jpeg",
      extension: "jpg",
      label: "JPG",
      previewMode: "browser",
    };
  }

  if (matchesSignature(normalizedBytes, [0x47, 0x49, 0x46, 0x38])) {
    return {
      mime: "image/gif",
      extension: "gif",
      label: "GIF",
      previewMode: "browser",
    };
  }

  if (
    normalizedBytes.length >= 12 &&
    matchesSignature(normalizedBytes.slice(0, 4), [0x52, 0x49, 0x46, 0x46]) &&
    matchesSignature(normalizedBytes.slice(8, 12), [0x57, 0x45, 0x42, 0x50])
  ) {
    return {
      mime: "image/webp",
      extension: "webp",
      label: "WEBP",
      previewMode: "browser",
    };
  }

  if (matchesSignature(normalizedBytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    return {
      mime: "application/msword",
      extension: "doc",
      label: "Word Document",
      previewMode: "download",
    };
  }

  if (
    matchesSignature(normalizedBytes, [0x50, 0x4b, 0x03, 0x04]) &&
    (containsAsciiFragment(normalizedBytes, "word/") ||
      containsAsciiFragment(normalizedBytes, "[Content_Types].xml"))
  ) {
    return {
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      extension: "docx",
      label: "Word Document",
      previewMode: "download",
    };
  }

  if (isLikelyText(normalizedBytes)) {
    return {
      mime: "text/plain;charset=utf-8",
      extension: "txt",
      label: "Text File",
      previewMode: "text",
    };
  }

  return {
    mime: "application/octet-stream",
    extension: "bin",
    label: "Document",
    previewMode: "download",
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function openBytesInBrowser(bytes?: unknown, baseName = "document") {
  const normalizedBytes = normalizeBytes(bytes);
  if (!normalizedBytes.length) return;

  const file = detectFileType(normalizedBytes);
  const blob = new Blob([new Uint8Array(normalizedBytes)], { type: file.mime });
  const url = URL.createObjectURL(blob);

  if (file.previewMode === "browser") {
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }

  if (file.previewMode === "text") {
    const text = new TextDecoder().decode(new Uint8Array(normalizedBytes));
    const previewWindow = window.open("", "_blank", "noopener,noreferrer");

    if (previewWindow) {
      previewWindow.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(baseName)}.${file.extension}</title>
    <style>
      body { font-family: Segoe UI, sans-serif; margin: 0; background: #f8fafc; color: #0f172a; }
      .wrap { max-width: 960px; margin: 0 auto; padding: 24px; }
      .meta { margin-bottom: 16px; padding: 16px; border: 1px solid #cbd5e1; border-radius: 12px; background: white; }
      pre { white-space: pre-wrap; word-break: break-word; padding: 18px; border-radius: 12px; background: white; border: 1px solid #e2e8f0; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="meta">
        <strong>${escapeHtml(file.label)}</strong><br />
        ${escapeHtml(baseName)}.${file.extension}
      </div>
      <pre>${escapeHtml(text)}</pre>
    </div>
  </body>
</html>`);
      previewWindow.document.close();
    } else {
      downloadByteFile(normalizedBytes, baseName);
    }

    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }

  const previewWindow = window.open("", "_blank", "noopener,noreferrer");

  if (previewWindow) {
    previewWindow.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(baseName)}.${file.extension}</title>
    <style>
      body { font-family: Segoe UI, sans-serif; margin: 0; background: #f8fafc; color: #0f172a; }
      .wrap { max-width: 720px; margin: 0 auto; padding: 24px; }
      .card { padding: 20px; border: 1px solid #cbd5e1; border-radius: 14px; background: white; }
      .title { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
      .muted { color: #475569; margin-bottom: 20px; }
      .actions { display: flex; gap: 12px; flex-wrap: wrap; }
      .button { display: inline-block; padding: 10px 14px; border-radius: 10px; text-decoration: none; border: 1px solid #cbd5e1; color: #0f172a; }
      .button.primary { background: #dbeafe; border-color: #93c5fd; color: #1d4ed8; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <div class="title">${escapeHtml(file.label)}</div>
        <div class="muted">Preview is not supported directly in the browser for this attachment. Use one of the actions below to open the original file with the correct type.</div>
        <div class="actions">
          <a class="button primary" href="${url}" target="_blank" rel="noopener noreferrer">Open Raw File</a>
          <a class="button" href="${url}" download="${escapeHtml(baseName)}.${file.extension}">Download ${escapeHtml(file.label)}</a>
        </div>
      </div>
    </div>
  </body>
</html>`);
    previewWindow.document.close();
  } else {
    downloadByteFile(normalizedBytes, baseName);
  }

  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function downloadByteFile(bytes?: unknown, baseName = "document") {
  const normalizedBytes = normalizeBytes(bytes);
  if (!normalizedBytes.length) return;

  const file = detectFileType(normalizedBytes);
  const blob = new Blob([new Uint8Array(normalizedBytes)], { type: file.mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${baseName}.${file.extension}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function FtjsDetailViewPage() {
  const { ftjsId } = useParams();
  const navigate = useNavigate();
  const parsedId = Number(ftjsId);
  const { accessLoading, userAccess } = useFtjsAccess();

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [record, setRecord] = useState<FtjsFullResponseDTO | null>(null);
  const [notes, setNotes] = useState<NotesResponseDTO[]>([]);
  const [timeline, setTimeline] = useState<TimelineResponseDTO[]>([]);
  const [replacements, setReplacements] = useState<ResponseNewFtjsSummaryDTO[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>(createEditForm(null));
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [noteOpen, setNoteOpen] = useState(false);
  const [noteValue, setNoteValue] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  const [reissueOpen, setReissueOpen] = useState(false);
  const [reissueForm, setReissueForm] =
    useState<ReissueFormState>(INITIAL_REISSUE_FORM);
  const [reissueSubmitting, setReissueSubmitting] = useState(false);

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [replacementDetailOpen, setReplacementDetailOpen] = useState(false);
  const [replacementDetailLoading, setReplacementDetailLoading] =
    useState(false);
  const [replacementDetail, setReplacementDetail] =
    useState<ResponseNewFtjsFullDetailsDTO | null>(null);

  const editable = record ? isEditableFtjsStatus(record.status) : false;
  const canViewRecords = hasFtjsPermission(
    userAccess,
    FTJS_PERMISSIONS.VIEW_RECORDS,
  );
  const canUpdateApplicantInfo = hasFtjsPermission(
    userAccess,
    FTJS_PERMISSIONS.UPDATE_APPLICANT_INFO,
  );
  const canIssueCertificate = hasFtjsPermission(
    userAccess,
    FTJS_PERMISSIONS.ISSUE_CERTIFICATE,
  );

  async function loadRecord() {
    if (!Number.isFinite(parsedId)) {
      setError("Invalid FTJS record.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [recordRes, notesRes, timelineRes, replacementsRes] =
        await Promise.all([
          ftjsApi.getFullDetails(parsedId),
          ftjsApi.getNotes(parsedId),
          ftjsApi.getTimeline(parsedId),
          ftjsApi.getReplacementSummary(parsedId),
        ]);

      const normalizedStatus = String(recordRes.status || "")
        .trim()
        .toUpperCase();

      if (
        canUpdateApplicantInfo &&
        normalizedStatus !== "ARCHIVED" &&
        isFtjsExpired(recordRes.dateSubmitted)
      ) {
        await ftjsApi.updateStatus(recordRes.id, {
          isArchived: true,
          remarks: buildFtjsAutoArchiveReason(recordRes.dateSubmitted),
        });
        navigate("/first-time-job-seeker/archive", { replace: true });
        return;
      }

      setRecord(recordRes);
      setNotes(normalizeList<NotesResponseDTO>(notesRes));
      setTimeline(normalizeList<TimelineResponseDTO>(timelineRes));
      setReplacements(normalizeList<ResponseNewFtjsSummaryDTO>(replacementsRes));
      setEditForm(createEditForm(recordRes));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load FTJS record.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!accessLoading && canViewRecords) {
      loadRecord();
      return;
    }

    if (!accessLoading) {
      setLoading(false);
    }
  }, [accessLoading, canUpdateApplicantInfo, canViewRecords, parsedId]);

  if (accessLoading) {
    return <CenteredLoader minHeight="min-h-[70vh]" />;
  }

  if (!canViewRecords) {
    return (
      <PermissionDeniedPage
        message="You do not have permission to view FTJS records."
        hint="Ask your administrator to grant the View FTJS Records permission."
      />
    );
  }

  if (loading) {
    return <CenteredLoader minHeight="min-h-[70vh]" />;
  }

  if (error || !record) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-700 font-semibold mb-1">
            FTJS record not found
          </p>
          <p className="text-sm text-slate-500 mb-4">
            {error ?? "The requested FTJS record could not be loaded."}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg ring-1 ring-blue-200 transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const currentRecord = record;
  const expiryDate = getFtjsExpiryDate(currentRecord.dateSubmitted);
  const isExpired = isFtjsExpired(currentRecord.dateSubmitted);
  const editValidIdConfig = getFtjsValidIdConfig(editForm.validIdType);
  const editAcceptsIdNumber = editValidIdConfig.acceptsIdNumber;
  const editRequiresSchoolAddress = editValidIdConfig.requiresSchoolAddress;
  const editRequiresIdNumber = editValidIdConfig.requiresIdNumber;

  function printCertificateForDate(dateSource?: string | Date | null) {
    const issuedDate = dateSource ? new Date(dateSource) : new Date();

    generateFtjsCertificate({
      fullName: currentRecord.fullName,
      address: currentRecord.fullAddress || "Barangay Ugong, Valenzuela City",
      purpose: currentRecord.purpose || "employment requirement",
      dateIssued: Number.isNaN(issuedDate.getTime()) ? new Date() : issuedDate,
    });
  }

  function handlePrintCertificate() {
    if (!canIssueCertificate) {
      setFeedback({
        type: "danger",
        title: "Permission required",
        message: "You do not have permission to issue or print FTJS certificates.",
      });
      return;
    }

    printCertificateForDate(currentRecord.dateSubmitted);
  }

  async function handleSubmitEdit() {
    if (!canUpdateApplicantInfo) {
      setFeedback({
        type: "danger",
        title: "Permission required",
        message: "You do not have permission to update FTJS applicant information.",
      });
      return;
    }

    if (editRequiresIdNumber && !editForm.idNumber.trim()) {
      setFeedback({
        type: "danger",
        title: "Incomplete ID details",
        message: `${editValidIdConfig.idNumberLabel} is required for the selected valid ID.`,
      });
      return;
    }

    try {
      setEditSubmitting(true);
      const payload: FtjsEditRequestDTO = {
        gender: editForm.gender || undefined,
        address: editForm.address || undefined,
        contactNumber: editForm.contactNumber || undefined,
        email: editForm.email || undefined,
        schoolAddress: editForm.schoolAddress || undefined,
        educationalAttainment: editForm.educationalAttainment || undefined,
        course: editForm.course || undefined,
        institution: editForm.institution || undefined,
        validIdType: editForm.validIdType || undefined,
        idNumber: editAcceptsIdNumber ? editForm.idNumber || undefined : undefined,
        purpose: editForm.purpose || undefined,
        oathFiles: editForm.oathFile
          ? await fileToByteArray(editForm.oathFile)
          : undefined,
      };

      await ftjsApi.updateRequest(currentRecord.id, payload);
      setFeedback({
        type: "success",
        title: "Request updated",
        message: "FTJS request details were updated successfully.",
      });
      setEditOpen(false);
      await loadRecord();
    } catch (submitError) {
      setFeedback({
        type: "danger",
        title: "Update failed",
        message:
          submitError instanceof Error
            ? submitError.message
            : "Please try again.",
      });
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleSubmitNote() {
    if (!canUpdateApplicantInfo) {
      setFeedback({
        type: "danger",
        title: "Permission required",
        message: "You do not have permission to update FTJS applicant information.",
      });
      return;
    }

    if (!noteValue.trim()) return;

    try {
      setNoteSubmitting(true);
      await ftjsApi.addNotes({
        ftjsId: currentRecord.id,
        notes: noteValue.trim(),
      });

      setFeedback({
        type: "success",
        title: "Note saved",
        message: "The FTJS internal note was added successfully.",
      });
      setNoteOpen(false);
      setNoteValue("");
      await loadRecord();
      setActiveTab("notes");
    } catch (submitError) {
      setFeedback({
        type: "danger",
        title: "Failed to add note",
        message:
          submitError instanceof Error
            ? submitError.message
            : "Please try again.",
      });
    } finally {
      setNoteSubmitting(false);
    }
  }

  async function handleSubmitReissue() {
    if (!canIssueCertificate) {
      setFeedback({
        type: "danger",
        title: "Permission required",
        message: "You do not have permission to issue FTJS certificates.",
      });
      return;
    }

    if (!reissueForm.reason.trim() || !reissueForm.dateOfLoss) return;

    try {
      setReissueSubmitting(true);
      const payload: RequestNewFtjsDTO = {
        ftjsId: currentRecord.id,
        reason: reissueForm.reason.trim(),
        affidavitFiles: await fileToByteArray(reissueForm.affidavitFile),
        dateOfLoss: reissueForm.dateOfLoss,
        orNumber: reissueForm.orNumber.trim() || undefined,
        amountPaid: reissueForm.amountPaid
          ? Number(reissueForm.amountPaid)
          : undefined,
      };

      await ftjsApi.requestNewCertificate(payload);
      printCertificateForDate(new Date());
      setFeedback({
        type: "success",
        title: "Re-issuance requested",
        message:
          "The FTJS replacement / reissuance request was submitted successfully and the certificate PDF was prepared for printing.",
      });
      setReissueOpen(false);
      setReissueForm(INITIAL_REISSUE_FORM);
      await loadRecord();
      setActiveTab("reissuance");
    } catch (submitError) {
      setFeedback({
        type: "danger",
        title: "Request failed",
        message:
          submitError instanceof Error
            ? submitError.message
            : "Please try again.",
      });
    } finally {
      setReissueSubmitting(false);
    }
  }

  async function handleArchive(reason: string) {
    if (!canUpdateApplicantInfo) {
      setFeedback({
        type: "danger",
        title: "Permission required",
        message: "You do not have permission to update FTJS applicant information.",
      });
      return;
    }

    try {
      await ftjsApi.updateStatus(currentRecord.id, {
        isArchived: true,
        remarks: reason,
      });

      setArchiveOpen(false);
      setFeedback({
        type: "success",
        title: "Request archived",
        message: `${currentRecord.trackingNumber} was moved to the FTJS archive successfully.`,
      });
      navigate("/first-time-job-seeker/management");
    } catch (archiveError) {
      setFeedback({
        type: "danger",
        title: "Archive failed",
        message:
          archiveError instanceof Error
            ? archiveError.message
            : "Please try again.",
      });
    }
  }

  async function openReplacementDetail(replacementId: number) {
    try {
      setReplacementDetailLoading(true);
      const response = await ftjsApi.getReplacementFullDetails(replacementId);
      setReplacementDetail(response);
      setReplacementDetailOpen(true);
    } catch (detailError) {
      setFeedback({
        type: "danger",
        title: "Failed to load replacement request",
        message:
          detailError instanceof Error
            ? detailError.message
            : "Please try again.",
      });
    } finally {
      setReplacementDetailLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Back to FTJS Management
          </button>

          <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-50 px-5 py-5 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">
                  FTJS Management View
                </p>
                <h1 className="text-2xl font-bold text-slate-900">
                  {record.trackingNumber}
                </h1>
                <p className="text-sm text-slate-600 mt-1">{record.fullName}</p>
                <p className="text-sm text-slate-500 mt-2">
                  Reason: {record.purpose || "No reason recorded"}
                </p>
              </div>

              <div className="flex flex-col items-start lg:items-end gap-2">
                <StatusPill status={record.status} />
                <div className="text-sm text-slate-600">
                  Submitted:{" "}
                  <span className="font-medium text-slate-900">
                    {formatDate(record.dateSubmitted)}
                  </span>
                </div>
                <div className="text-sm text-slate-600">
                  {isExpired ? "Expired:" : "Expires:"}{" "}
                  <span className="font-medium text-slate-900">
                    {expiryDate ? formatDate(expiryDate.toISOString()) : "—"}
                  </span>
                </div>
                <div className="text-sm text-slate-600">
                  Issuance Count:{" "}
                  <span className="font-medium text-slate-900">
                    {record.issuanceCount}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 border-b border-slate-200">
              <div className="flex flex-wrap gap-5 text-sm">
                {[
                  { key: "overview", label: "Overview" },
                  { key: "documents", label: "Documents" },
                  { key: "notes", label: "Notes", count: notes.length },
                  {
                    key: "timeline",
                    label: "Timeline",
                    count: timeline.length,
                  },
                  {
                    key: "reissuance",
                    label: "Re-issuance",
                    count: replacements.length,
                  },
                ].map((tab) => {
                  const selected = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key as TabKey)}
                      className={`pb-3 -mb-px border-b-2 transition-colors ${selected ? "border-blue-600 text-blue-700 font-semibold" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                    >
                      {tab.label}
                      {typeof tab.count === "number" ? (
                        <span className="ml-2 text-xs text-slate-400">
                          {tab.count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {activeTab === "overview" ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <QuickActionCard
                title="Edit Request"
                subtitle="Update FTJS request details"
                icon={<FilePenLine className="w-5 h-5" />}
                tone="blue"
                onClick={() => setEditOpen(true)}
                disabled={!editable || !canUpdateApplicantInfo}
              />
              <QuickActionCard
                title="Print Certificate"
                subtitle="Generate the official FTJS certificate copy"
                icon={<Printer className="w-5 h-5" />}
                tone="amber"
                onClick={handlePrintCertificate}
                disabled={!canIssueCertificate}
              />
              <QuickActionCard
                title="Create Re-issuance Request"
                subtitle="Prepare a replacement certificate request"
                icon={<RefreshCw className="w-5 h-5" />}
                tone="sky"
                onClick={() => setReissueOpen(true)}
                disabled={!editable || !canIssueCertificate}
              />
              <QuickActionCard
                title="Archive Request"
                subtitle="Move this FTJS request to archive"
                icon={<Archive className="w-5 h-5" />}
                tone="rose"
                onClick={() => setArchiveOpen(true)}
                disabled={!canUpdateApplicantInfo}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <DetailPanel
                title="Applicant Information"
                icon={<CircleUserRound className="w-4 h-4" />}
                className="xl:col-span-2"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem label="Full Name" value={record.fullName} />
                  <InfoItem
                    label="Contact Number"
                    value={record.contactNumber || "—"}
                  />
                  <InfoItem label="Gender" value={record.gender || "—"} />
                  <InfoItem label="Email" value={record.email || "—"} />
                  <InfoItem
                    label="Resident Type"
                    value={
                      record.isRegisteredResident
                        ? "Registered Resident"
                        : "Walk-in / Non-resident"
                    }
                  />
                  <InfoItem
                    label="Resident ID"
                    value={record.residentId ?? "—"}
                  />
                  <div className="md:col-span-2">
                    <InfoItem
                      label="Current Address"
                      value={record.fullAddress || "—"}
                    />
                  </div>
                </div>
              </DetailPanel>

              <DetailPanel
                title="Request Information"
                icon={<ClipboardList className="w-4 h-4" />}
              >
                <div className="space-y-4">
                  <InfoItem
                    label="Tracking Number"
                    value={record.trackingNumber}
                  />
                  <InfoItem
                    label="Status"
                    value={<StatusPill status={record.status} />}
                  />
                  <InfoItem
                    label="Date Submitted"
                    value={formatDate(record.dateSubmitted)}
                  />
                  <InfoItem
                    label={isExpired ? "Expired On" : "Valid Until"}
                    value={expiryDate ? formatDate(expiryDate.toISOString()) : "—"}
                  />
                  <InfoItem
                    label="Verified By"
                    value={record.verifiedBy || "—"}
                  />
                  <InfoItem
                    label="Has Oath File"
                    value={record.hasOathFile ? "Yes" : "No"}
                  />
                  <InfoItem
                    label="Last Updated"
                    value={formatDateTime(record.updatedAt)}
                  />
                </div>
              </DetailPanel>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <DetailPanel
                title="Education & Request Details"
                icon={<ShieldCheck className="w-4 h-4" />}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem
                    label="Educational Attainment"
                    value={record.educationalAttainment || "—"}
                  />
                  <InfoItem label="Course" value={record.course || "—"} />
                  <InfoItem
                    label="Institution"
                    value={record.institution || "—"}
                  />
                  <InfoItem
                    label="Valid ID Type"
                    value={record.validIdType || "—"}
                  />
                  <InfoItem label="ID Number" value={record.idNumber || "—"} />
                  <InfoItem
                    label="Created At"
                    value={formatDateTime(record.createdAt)}
                  />
                  <div className="md:col-span-2">
                    <InfoItem
                      label="Reason for Request"
                      value={
                        <div className="whitespace-pre-wrap">
                          {record.purpose || "—"}
                        </div>
                      }
                    />
                  </div>
                </div>
              </DetailPanel>

              <DetailPanel
                title="Processing Snapshot"
                icon={<CalendarClock className="w-4 h-4" />}
              >
                <div className="space-y-4">
                  <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-blue-700 mb-1">
                      FTJS Progress Snapshot
                    </p>
                    <p className="text-sm text-slate-700">
                      This request is currently marked as{" "}
                      <span className="font-semibold">
                        {formatStatusLabel(record.status)}
                      </span>{" "}
                      and has{" "}
                      <span className="font-semibold">
                        {record.issuanceCount}
                      </span>{" "}
                      recorded issuance{record.issuanceCount === 1 ? "" : "s"}.
                    </p>
                    <p className="text-sm text-slate-700 mt-2">
                      This certificate is valid for 1 year from submission and {isExpired ? "expired" : "will expire"} on{" "}
                      <span className="font-semibold">
                        {expiryDate ? formatDate(expiryDate.toISOString()) : "—"}
                      </span>.
                    </p>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 flex items-start gap-3">
                    <FileText className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>
                      Verify identity and supporting documents carefully before
                      releasing any certificate. Re-issuance requests should
                      include affidavit attachment and a clear replacement
                      reason.
                    </p>
                  </div>
                </div>
              </DetailPanel>
            </div>
          </>
        ) : null}

        {activeTab === "documents" ? (
          <DetailPanel
            title="Submitted Documents"
            icon={<Files className="w-4 h-4" />}
          >
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 p-4 bg-white">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Oath Attachment
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Uploaded supporting oath file for this FTJS request.
                    </p>
                  </div>
                  {record.hasOathFile && record.oathFile?.length ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openBytesInBrowser(
                            record.oathFile,
                            `${record.trackingNumber}_oath_file`,
                          )
                        }
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100"
                      >
                        <Eye className="w-4 h-4" /> View File
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          downloadByteFile(
                            record.oathFile,
                            `${record.trackingNumber}_oath_file`,
                          )
                        }
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 bg-white rounded-lg hover:bg-gray-50"
                      >
                        <Download className="w-4 h-4" /> Download
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {record.hasOathFile && record.oathFile?.length
                    ? `Attached file detected (${detectFileType(record.oathFile).label}).`
                    : "No oath file is attached to this request."}
                </div>
              </div>
            </div>
          </DetailPanel>
        ) : null}

        {activeTab === "notes" ? (
          <DetailPanel
            title="Internal Notes"
            icon={<NotebookPen className="w-4 h-4" />}
          >
            <div className="flex items-center justify-end mb-4">
              <button
                type="button"
                onClick={() => setNoteOpen(true)}
                disabled={!canUpdateApplicantInfo}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" /> Add Note
              </button>
            </div>
            <div className="space-y-3">
              {notes.length === 0 ? (
                <EmptyState text="No internal notes yet." />
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-xl border border-gray-200 p-4 bg-gray-50/70"
                  >
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {note.note}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {note.createdBy} • {formatDateTime(note.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </DetailPanel>
        ) : null}

        {activeTab === "timeline" ? (
          <DetailPanel title="Timeline" icon={<HistoryIcon className="w-4 h-4" />}>
            <div className="space-y-3">
              {timeline.length === 0 ? (
                <EmptyState text="No timeline events yet." />
              ) : (
                timeline.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-200 p-4 bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {item.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                          {item.description}
                        </p>
                      </div>
                      <StatusPill status={item.type} />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDateTime(item.eventDate)} • {item.createdBy}
                    </p>
                  </div>
                ))
              )}
            </div>
          </DetailPanel>
        ) : null}

        {activeTab === "reissuance" ? (
          <DetailPanel
            title="Replacement / Re-issuance History"
            icon={<RefreshCw className="w-4 h-4" />}
          >
            <div className="flex items-center justify-end mb-4">
              <button
                type="button"
                onClick={() => setReissueOpen(true)}
                disabled={!editable || !canIssueCertificate}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" /> New Request
              </button>
            </div>
            {replacements.length === 0 ? (
              <EmptyState text="No replacement or reissuance records found." />
            ) : (
              <div className="space-y-3">
                {replacements.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-200 bg-white p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-cyan-100 p-2 text-cyan-700">
                          <RefreshCw className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            Re-issuance #{item.issuanceCount}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Requested on {formatDate(item.dateSubmitted)}
                          </p>
                          <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                            {item.reason}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 md:justify-end">
                        <button
                          type="button"
                          onClick={() => printCertificateForDate(item.dateSubmitted)}
                          disabled={!canIssueCertificate}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Printer className="w-4 h-4" /> Print FTJS Certificate
                        </button>
                        <button
                          type="button"
                          onClick={() => openReplacementDetail(item.id)}
                          disabled={replacementDetailLoading}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                        >
                          <Eye className="w-4 h-4" /> View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DetailPanel>
        ) : null}

        <FormModalShell
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          title="Edit FTJS Request"
          maxWidthClass="max-w-4xl"
          footer={
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitEdit}
                disabled={editSubmitting}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                {editSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          }
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-2">
              <FieldShell label="Applicant Name">
                <input
                  type="text"
                  value={currentRecord.fullName}
                  readOnly
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700"
                />
              </FieldShell>

              <FieldShell label="Date Submitted">
                <input
                  type="date"
                  value={editForm.submittedDate}
                  readOnly
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700"
                />
              </FieldShell>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-slate-900">Personal Information</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Match the original FTJS request details before saving changes.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FieldShell label="Gender">
                  <select
                    value={editForm.gender}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        gender: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">Select gender</option>
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FieldShell>

                <FieldShell label="Contact Number">
                  <input
                    type="text"
                    value={editForm.contactNumber}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        contactNumber: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </FieldShell>

                <FieldShell label="Email">
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </FieldShell>

                <div className="md:col-span-2">
                  <FieldShell label="Complete Address">
                    <textarea
                      value={editForm.address}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          address: event.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </FieldShell>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-slate-900">Educational &amp; Identity Details</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Keep this section aligned with the original FTJS entry fields.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FieldShell label="Educational Attainment">
                  <select
                    value={editForm.educationalAttainment}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        educationalAttainment: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">Select attainment</option>
                    {EDUCATIONAL_ATTAINMENT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </FieldShell>

                <FieldShell label="Course">
                  <input
                    type="text"
                    value={editForm.course}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        course: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </FieldShell>

                <FieldShell label="Institution">
                  <input
                    type="text"
                    value={editForm.institution}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        institution: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </FieldShell>

                <FieldShell label="Valid ID Type">
                  <select
                    value={editForm.validIdType}
                    onChange={(event) => {
                      const nextValidIdType = event.target.value;
                      const nextConfig = getFtjsValidIdConfig(nextValidIdType);

                      setEditForm((prev) => ({
                        ...prev,
                        validIdType: nextValidIdType,
                        schoolAddress: nextConfig.requiresSchoolAddress
                          ? prev.schoolAddress
                          : "",
                        idNumber: nextConfig.acceptsIdNumber
                          ? prev.idNumber
                          : "",
                      }));
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">Select ID type</option>
                    {VALID_ID_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </FieldShell>

                <FieldShell
                  label={editValidIdConfig.idNumberLabel}
                  required={editRequiresIdNumber}
                >
                  <input
                    type="text"
                    value={editForm.idNumber}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        idNumber: event.target.value,
                      }))
                    }
                    placeholder={editValidIdConfig.idNumberPlaceholder}
                    disabled={!editForm.validIdType || !editAcceptsIdNumber}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  {editValidIdConfig.idNumberHint ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {editValidIdConfig.idNumberHint}
                    </p>
                  ) : null}
                </FieldShell>

                {editRequiresSchoolAddress ? (
                  <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                    <FieldShell label="School Address">
                      <textarea
                        value={editForm.schoolAddress}
                        onChange={(event) =>
                          setEditForm((prev) => ({
                            ...prev,
                            schoolAddress: event.target.value,
                          }))
                        }
                        rows={3}
                        className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </FieldShell>
                  </div>
                ) : null}

                <div className="md:col-span-2">
                  <FieldShell label="Replace Oath File">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          oathFile: event.target.files?.[0] ?? null,
                        }))
                      }
                      className="w-full text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </FieldShell>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-slate-900">Reason for Request</h4>
              </div>

              <FieldShell label="Reason / Purpose">
                <textarea
                  value={editForm.purpose}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      purpose: event.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </FieldShell>
            </div>
          </div>
        </FormModalShell>

        <FormModalShell
          isOpen={noteOpen}
          onClose={() => setNoteOpen(false)}
          title="Add FTJS Note"
          maxWidthClass="max-w-2xl"
          footer={
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setNoteOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={noteSubmitting || !noteValue.trim()}
                onClick={handleSubmitNote}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                {noteSubmitting ? "Saving..." : "Save Note"}
              </button>
            </div>
          }
        >
          <FieldShell label="Internal Note" required>
            <textarea
              value={noteValue}
              onChange={(event) => setNoteValue(event.target.value)}
              rows={6}
              placeholder="Add processing observations, reminders, or verification notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
            />
          </FieldShell>
        </FormModalShell>

        <FormModalShell
          isOpen={reissueOpen}
          onClose={() => setReissueOpen(false)}
          title="Request New Certificate"
          maxWidthClass="max-w-3xl"
          footer={
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setReissueOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  reissueSubmitting ||
                  !reissueForm.reason.trim() ||
                  !reissueForm.dateOfLoss
                }
                onClick={handleSubmitReissue}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                {reissueSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <FieldShell label="Reason for Re-issuance" required>
                <textarea
                  value={reissueForm.reason}
                  onChange={(event) =>
                    setReissueForm((prev) => ({
                      ...prev,
                      reason: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Explain why the applicant needs a replacement certificate..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                />
              </FieldShell>
            </div>

            <FieldShell label="Date of Loss / Incident" required>
              <input
                type="date"
                value={reissueForm.dateOfLoss}
                onChange={(event) =>
                  setReissueForm((prev) => ({
                    ...prev,
                    dateOfLoss: event.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </FieldShell>

            <FieldShell label="OR Number">
              <input
                type="text"
                value={reissueForm.orNumber}
                onChange={(event) =>
                  setReissueForm((prev) => ({
                    ...prev,
                    orNumber: event.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </FieldShell>

            <FieldShell label="Amount Paid">
              <input
                type="number"
                min="0"
                step="0.01"
                value={reissueForm.amountPaid}
                onChange={(event) =>
                  setReissueForm((prev) => ({
                    ...prev,
                    amountPaid: event.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </FieldShell>

            <FieldShell label="Affidavit Attachment">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
                onChange={(event) =>
                  setReissueForm((prev) => ({
                    ...prev,
                    affidavitFile: event.target.files?.[0] ?? null,
                  }))
                }
                className="w-full text-sm text-gray-700 file:mr-4 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </FieldShell>
          </div>
        </FormModalShell>

        <ArchiveReasonModal
          isOpen={archiveOpen}
          onClose={() => setArchiveOpen(false)}
          title="Archive FTJS Request"
          subjectName={record.trackingNumber}
          subjectLabel="request"
          submitLabel="Archive"
          placeholder="Explain why this FTJS request should be archived..."
          onSubmit={handleArchive}
        />

        <FormModalShell
          isOpen={replacementDetailOpen}
          onClose={() => {
            setReplacementDetailOpen(false);
            setReplacementDetail(null);
          }}
          title="Replacement Request Details"
          maxWidthClass="max-w-3xl"
          footer={
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setReplacementDetailOpen(false);
                  setReplacementDetail(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 bg-white rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          }
        >
          {!replacementDetail ? (
            <EmptyState text="No replacement request selected." />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem
                  label="Applicant Name"
                  value={replacementDetail.residentFullName || record.fullName}
                />
                <InfoItem
                  label="Issuance Number"
                  value={replacementDetail.issuanceNumber}
                />
                <InfoItem
                  label="Date of Loss / Incident"
                  value={formatDate(replacementDetail.dateOfLoss)}
                />
                <InfoItem
                  label="OR Number"
                  value={replacementDetail.orNumber || "—"}
                />
                <InfoItem
                  label="Amount Paid"
                  value={
                    replacementDetail.amountPaid != null
                      ? `₱${replacementDetail.amountPaid.toLocaleString()}`
                      : "—"
                  }
                />
                <InfoItem
                  label="Created By"
                  value={replacementDetail.createdBy || "—"}
                />
                <InfoItem
                  label="Created At"
                  value={formatDateTime(replacementDetail.createdAt)}
                />
                <InfoItem
                  label="Attachment"
                  value={
                    replacementDetail.fileAttach?.length
                      ? `${detectFileType(replacementDetail.fileAttach).label} file attached`
                      : "No attachment"
                  }
                />
                <div className="md:col-span-2">
                  <InfoItem
                    label="Reason for Re-issuance"
                    value={
                      <div className="whitespace-pre-wrap">
                        {replacementDetail.reason || "—"}
                      </div>
                    }
                  />
                </div>
              </div>

              {replacementDetail.fileAttach?.length ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Attached Affidavit
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {detectFileType(replacementDetail.fileAttach).label}{" "}
                      attachment available for viewing or download.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openBytesInBrowser(
                          replacementDetail.fileAttach,
                          `${record.trackingNumber}_replacement_affidavit_${replacementDetail.id}`,
                        )
                      }
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100"
                    >
                      <Eye className="w-4 h-4" /> View File
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        downloadByteFile(
                          replacementDetail.fileAttach,
                          `${record.trackingNumber}_replacement_affidavit_${replacementDetail.id}`,
                        )
                      }
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 bg-white rounded-lg hover:bg-gray-50"
                    >
                      <Download className="w-4 h-4" /> Download
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </FormModalShell>

        <ActionModal
          isOpen={!!feedback}
          onClose={() => setFeedback(null)}
          title={feedback?.title || "FTJS Notification"}
          type={feedback?.type || "info"}
        >
          {feedback?.message}
        </ActionModal>
      </div>
    </div>
  );
}
