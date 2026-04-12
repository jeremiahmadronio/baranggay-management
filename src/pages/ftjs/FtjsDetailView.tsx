import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  History,
  NotebookPen,
  Plus,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { ArchiveReasonModal } from "../../hooks/archive-modal";
import { ActionModal, FormModalShell } from "../../reusable";
import { CenteredLoader } from "../../hooks/LoadingStates";
import {
  ftjsApi,
  type FtjsEditRequestDTO,
  type FtjsFullResponseDTO,
  type NotesResponseDTO,
  type RequestNewFtjsDTO,
  type ResponseNewFtjsFullDetailsDTO,
  type ResponseNewFtjsSummaryDTO,
  type TimelineResponseDTO,
} from "../../service/ftjs/FirstTimeJobSeeker";
import {
  EDUCATIONAL_ATTAINMENT_OPTIONS,
  FieldShell,
  fileToByteArray,
  formatDate,
  formatDateTime,
  GENDER_OPTIONS,
  InfoItem,
  isEditableFtjsStatus,
  StatusPill,
  VALID_ID_OPTIONS,
} from "./shared";

type TabKey = "overview" | "documents" | "notes" | "timeline" | "reissuance";

type FeedbackState = {
  type: "success" | "danger" | "info";
  title: string;
  message: string;
} | null;

type EditFormState = {
  gender: string;
  address: string;
  contactNumber: string;
  email: string;
  educationalAttainment: string;
  course: string;
  institution: string;
  validIdType: string;
  idNumber: string;
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
    gender: record?.gender || "",
    address: record?.fullAddress || "",
    contactNumber: record?.contactNumber || "",
    email: record?.email || "",
    educationalAttainment: record?.educationalAttainment || "",
    course: record?.course || "",
    institution: record?.institution || "",
    validIdType: record?.validIdType || "",
    idNumber: record?.idNumber || "",
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

function detectFileType(bytes?: number[] | null) {
  if (!bytes || bytes.length < 4) {
    return {
      mime: "application/octet-stream",
      extension: "bin",
      label: "Document",
    };
  }

  if (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    return { mime: "application/pdf", extension: "pdf", label: "PDF" };
  }

  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return { mime: "image/png", extension: "png", label: "PNG" };
  }

  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    return { mime: "image/jpeg", extension: "jpg", label: "JPG" };
  }

  return {
    mime: "application/octet-stream",
    extension: "bin",
    label: "Document",
  };
}

function openBytesInBrowser(bytes?: number[] | null, _baseName?: string) {
  if (!bytes?.length) return;
  const file = detectFileType(bytes);
  const blob = new Blob([new Uint8Array(bytes)], { type: file.mime });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function downloadByteFile(bytes?: number[] | null, baseName = "document") {
  if (!bytes?.length) return;
  const file = detectFileType(bytes);
  const blob = new Blob([new Uint8Array(bytes)], { type: file.mime });
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

      setRecord(recordRes);
      setNotes(notesRes);
      setTimeline(timelineRes);
      setReplacements(replacementsRes);
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
    loadRecord();
  }, [parsedId]);

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

  async function handleSubmitEdit() {
    try {
      setEditSubmitting(true);
      const payload: FtjsEditRequestDTO = {
        gender: editForm.gender || undefined,
        address: editForm.address || undefined,
        contactNumber: editForm.contactNumber || undefined,
        email: editForm.email || undefined,
        educationalAttainment: editForm.educationalAttainment || undefined,
        course: editForm.course || undefined,
        institution: editForm.institution || undefined,
        validIdType: editForm.validIdType || undefined,
        idNumber: editForm.idNumber || undefined,
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
      setFeedback({
        type: "success",
        title: "Re-issuance requested",
        message:
          "The FTJS replacement / reissuance request was submitted successfully.",
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
    try {
      await ftjsApi.updateStatus(currentRecord.id, {
        newStatus: "ARCHIVED",
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
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                disabled={!editable}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FilePenLine className="w-4 h-4" /> Edit Request
              </button>
              <button
                type="button"
                onClick={() => setArchiveOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-700 border border-rose-200 bg-rose-50 rounded-lg hover:bg-rose-100"
              >
                <Archive className="w-4 h-4" /> Archive Request
              </button>
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
                        {record.status.replace(/_/g, " ")}
                      </span>{" "}
                      and has{" "}
                      <span className="font-semibold">
                        {record.issuanceCount}
                      </span>{" "}
                      recorded issuance{record.issuanceCount === 1 ? "" : "s"}.
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
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100"
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
          <DetailPanel title="Timeline" icon={<History className="w-4 h-4" />}>
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
                disabled={!editable}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-violet-700 border border-violet-200 bg-violet-50 rounded-lg hover:bg-violet-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="rounded-xl border border-gray-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-violet-100 text-violet-700 p-2 rounded-lg">
                        <RefreshCw className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Re-issuance #{item.issuanceCount}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Requested on {formatDate(item.dateSubmitted)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                          {item.reason}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 min-w-[220px] md:justify-end">
                      <button
                        type="button"
                        onClick={() => openReplacementDetail(item.id)}
                        disabled={replacementDetailLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                      >
                        <Eye className="w-4 h-4" /> View Details
                      </button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldShell label="Gender">
              <select
                value={editForm.gender}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    gender: event.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </FieldShell>

            <FieldShell label="Educational Attainment">
              <select
                value={editForm.educationalAttainment}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    educationalAttainment: event.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </FieldShell>

            <FieldShell label="Valid ID Type">
              <select
                value={editForm.validIdType}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    validIdType: event.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Select ID type</option>
                {VALID_ID_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FieldShell>

            <FieldShell label="ID Number">
              <input
                type="text"
                value={editForm.idNumber}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    idNumber: event.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </FieldShell>

            <div className="md:col-span-2">
              <FieldShell label="Address">
                <textarea
                  value={editForm.address}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      address: event.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                />
              </FieldShell>
            </div>

            <div className="md:col-span-2">
              <FieldShell label="Reason for Request">
                <textarea
                  value={editForm.purpose}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      purpose: event.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                />
              </FieldShell>
            </div>

            <div className="md:col-span-2">
              <FieldShell label="Replace Oath File">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      oathFile: event.target.files?.[0] ?? null,
                    }))
                  }
                  className="w-full text-sm text-gray-700 file:mr-4 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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
                className="px-5 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-60"
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
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(event) =>
                  setReissueForm((prev) => ({
                    ...prev,
                    affidavitFile: event.target.files?.[0] ?? null,
                  }))
                }
                className="w-full text-sm text-gray-700 file:mr-4 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
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
              {replacementDetail?.fileAttach?.length ? (
                <button
                  type="button"
                  onClick={() =>
                    downloadByteFile(
                      replacementDetail.fileAttach,
                      `${record.trackingNumber}_replacement_affidavit_${replacementDetail.id}`,
                    )
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100"
                >
                  <Download className="w-4 h-4" /> Download Attachment
                </button>
              ) : null}
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
