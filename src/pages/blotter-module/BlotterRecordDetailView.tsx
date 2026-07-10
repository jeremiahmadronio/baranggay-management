import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeftIcon,
  UserIcon,
  ClipboardIcon,
  FileTextIcon,
} from "lucide-react";
import {
  getFullBlotterRecord,
  type BlotterRecordViewDTO,
} from "../../service/blotter-api/RecordView";
import { CenteredLoader } from "../../hooks/LoadingStates";
import { InfoRow } from "./shared/InfoRow";
import { SectionCard } from "./shared/SectionCard";
import { NarrativeViewer } from "./shared/NarrativeViewer";
import { formatDate, formatTime } from "./shared/utils";
import { generateInvitation } from "./modal/GenerateInvitation";
import { InvitationPreview } from "./modal/InvitationPreview";
import { closeRecordCase, getSettlementDocument } from "../../service/blotter-api/RecordView";
import { Upload, X, PrinterIcon, Download } from "lucide-react";
import { TimelineTab } from "../admin-module/blotter-docket/tabs/TimeLineTab";
import { ActionModal } from "./reusable/SuccessModal";
import {
  getNatureOfComplaintOptions,
  type NatureOptionDTO,
} from "../../service/blotter-api/BlotterFormComplaint";

const getStatusPillClass = (statusRaw: string) => {
  const status = String(statusRaw || "")
    .toUpperCase()
    .trim();
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "UNDER_MEDIATION":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    case "UNDER_CONCILIATION":
      return "bg-indigo-50 text-indigo-700 border border-indigo-200";
    case "REFERRED_TO_LUPON":
      return "bg-violet-50 text-violet-700 border border-violet-200";
    case "SETTLED":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "RECORDED":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "DISMISSED":
      return "bg-rose-50 text-rose-700 border border-rose-200";
    case "CERTIFIED_TO_FILE_ACTION":
      return "bg-cyan-50 text-cyan-700 border border-cyan-200";
    case "EXPIRED_UNACTIONED":
      return "bg-red-50 text-red-700 border border-red-200";
    case "WITHDRAWN":
      return "bg-orange-50 text-orange-700 border border-orange-200";
    case "CLOSED":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    case "ELEVATED_TO_FORMAL":
      return "bg-red-50 text-red-700 border border-red-200";
    default:
      return "bg-gray-100 text-gray-600 border border-gray-200";
  }
};

const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal ${getStatusPillClass(status)}`}
  >
    {String(status || "UNKNOWN")
      .replace(/_/g, " ")
      .toUpperCase()}
  </span>
);

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const b64 = reader.result?.toString().split(",")[1];
      if (b64) resolve(b64);
      else reject(new Error("Failed to convert file."));
    };
    reader.onerror = (error) => reject(error);
  });
}

function SettlementDocumentViewer({ caseNumber }: { caseNumber: string }) {
  const [raw, setRaw] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!caseNumber) return;
    setLoading(true);
    getSettlementDocument(caseNumber)
      .then((text) => setRaw(text))
      .catch(() => setRaw(null))
      .finally(() => setLoading(false));
  }, [caseNumber]);

  if (loading) return <span className="text-sm text-gray-500">Loading...</span>;
  if (!raw) return <span className="text-sm text-gray-400 italic">No document found</span>;

  const mime = raw.startsWith("JVBERi0") ? "application/pdf" : "image/jpeg";
  const ext = mime === "application/pdf" ? "pdf" : "jpg";
  const dataUrl = `data:${mime};base64,${raw}`;

  return (
    <a
      href={dataUrl}
      download={`Settlement_${caseNumber}.${ext}`}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-gray-50 hover:text-blue-700"
    >
      <Download className="h-4 w-4" />
      Download Document
    </a>
  );
}

const BlotterRecordDetailViewPage: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const blotterNumber = searchParams.get("blotterNumber") || "";
  const navigate = useNavigate();

  const [record, setRecord] = useState<BlotterRecordViewDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "invitation" | "closure" | "timeline">("overview");
  const [natureOptions, setNatureOptions] = useState<NatureOptionDTO[]>([]);

  const [closingDate, setClosingDate] = useState("");
  const [closingVenue, setClosingVenue] = useState("");
  const [closingFile, setClosingFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleCloseCase = async () => {
    if (!closingDate || !closingVenue || !closingFile) {
      setSubmitError("All fields are required.");
      return;
    }
    try {
      setIsSubmitting(true);
      setSubmitError("");
      const b64 = await fileToBase64(closingFile);
      await closeRecordCase(record!.id, {
        dateOfSettlement: closingDate,
        venue: closingVenue,
        settlementFile: b64,
      });
      setShowSuccessModal(true);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to close case.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!blotterNumber) return;
    setLoading(true);
    setError(null);
    Promise.all([
      getFullBlotterRecord(blotterNumber),
      getNatureOfComplaintOptions(),
    ])
      .then(([rec, natures]) => {
        setRecord(rec);
        setNatureOptions(natures);
      })
      .catch((err: any) => setError(err.message ?? "Failed to load record."))
      .finally(() => setLoading(false));
  }, [blotterNumber]);

  if (loading) {
    return <CenteredLoader minHeight="min-h-[70vh]" />;
  }

  if (error || !record) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-50 ring-1 ring-red-200 mb-4">
            <svg
              className="w-7 h-7 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-slate-700 font-semibold mb-1">Record not found</p>
          <p className="text-sm text-slate-500 mb-4">
            {error ?? "The requested blotter record could not be loaded."}
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

  return (
    <div className="min-h-screen">
      <div className="mx-auto px-6 py-6 space-y-5">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Back to Records
          </button>

          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {record.blotterNumber}
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            {natureOptions.find((n) => String(n.id) === String(record.natureOfComplaint))?.natureName || record.natureOfComplaint || "For the Record"}
          </p>
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-1 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "overview"
                ? "border-blue-600 text-blue-600 bg-white rounded-t-lg"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("invitation")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "invitation"
                ? "border-blue-600 text-blue-600 bg-white rounded-t-lg"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Invitation Notice
          </button>
          <button
            onClick={() => setActiveTab("closure")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "closure"
                ? "border-blue-600 text-blue-600 bg-white rounded-t-lg"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Case Closure
          </button>
          <button
            onClick={() => setActiveTab("timeline")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "timeline"
                ? "border-blue-600 text-blue-600 bg-white rounded-t-lg"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Timeline
          </button>
        </div>

        {/* ── TAB CONTENT ── */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-2">
            <div className="lg:col-span-2 space-y-5">
              <SectionCard
                title="Complainant Information"
                icon={<UserIcon className="w-4 h-4 text-gray-400" />}
              >
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Full Name" value={record.complainantFullName} />
                  <InfoRow label="Contact Number" value={record.complainantContact} />
                  <InfoRow label="Age" value={record.complainantAge} />
                  <InfoRow label="Gender" value={record.complainantGender} />
                  <InfoRow label="Civil Status" value={record.civilStatus} />
                  <InfoRow label="Email" value={record.complainantEmail} />
                  <div className="col-span-2">
                    <InfoRow label="Current Address" value={record.complainantAddress} />
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Respondent Information"
                icon={<UserIcon className="w-4 h-4 text-gray-400" />}
              >
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Name" value={record.respondentFullName} />
                  <InfoRow label="Contact Number" value={record.respondentContact} />
                  <InfoRow label="Relationship to Complainant" value={record.relationshipToComplainant} />
                  <InfoRow label="Address" value={record.respondentAddress} />
                </div>
              </SectionCard>

              {/* Incident Details — Evidence only, no narrative here */}
              <SectionCard
                title="Incident Details"
                icon={<FileTextIcon className="w-4 h-4 text-gray-400" />}
              >
                {record.evidenceNames && record.evidenceNames.length > 0 ? (
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1.5">
                      Evidence Submitted
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {record.evidenceNames.map((name, idx) => (
                        <span
                          key={`${name}-${idx}`}
                          className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No evidence submitted.</p>
                )}
              </SectionCard>

              {/* Narrative / Statement of Facts */}
              <SectionCard
                title="Narrative / Statement of Facts"
                icon={<FileTextIcon className="w-4 h-4 text-gray-400" />}
              >
                <NarrativeViewer caseNumber={blotterNumber} />
              </SectionCard>
            </div>

            <div className="space-y-5">
              <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-5 h-fit">
                <h3 className="text-base font-medium text-gray-800 flex items-center gap-2">
                  <ClipboardIcon className="w-5 h-5 text-gray-400" /> Case Information
                </h3>

                <InfoRow label="Case Number" value={record.blotterNumber} />
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1.5">
                    Status
                  </p>
                  <StatusBadge status={record.status} />
                </div>

                <InfoRow label="Date Filed" value={formatDate(record.dateFiled)} />
                <InfoRow label="Encoded By" value={record.encodedBy} />
                <InfoRow label="Nature of Complaint" value={record.natureOfComplaint} />
                <InfoRow label="Incident Date" value={formatDate(record.dateOfIncident)} />
                <InfoRow label="Incident Time" value={formatTime(record.timeOfIncident)} />
                <InfoRow label="Incident Place" value={record.placeOfIncident} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "invitation" && (
          <div className="pt-2">
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden flex flex-col md:flex-row">
              <div className="flex-1 p-6 space-y-5 bg-gray-50 border-r border-gray-200">
                <h3 className="text-base font-medium text-gray-800 flex items-center gap-2">
                  <PrinterIcon className="w-5 h-5 text-gray-400" /> Appearance Details
                </h3>
                <p className="text-sm text-gray-500">
                  Generate an invitation notice for the respondent to appear at the barangay hall.
                  A live preview of the generated document is shown on the right.
                </p>
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 border border-transparent rounded-lg hover:bg-blue-200 transition-colors"
                  onClick={() => {
                    generateInvitation({
                      caseNumber: record.id.toString(),
                      natureOfComplaint: record.natureOfComplaint || "For the Record",
                      blotterNumber: record.blotterNumber,
                      complainantName: record.complainantFullName,
                      respondentName: record.respondentFullName,
                      date: new Date().toISOString().split("T")[0],
                    });
                  }}
                >
                  <PrinterIcon className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
              <div className="flex-[2] bg-gray-100 p-8 min-h-[600px] flex items-center justify-center">
                 <InvitationPreview
                    blotterNumber={record.blotterNumber}
                    respondentName={record.respondentFullName}
                    respondentAddress={record.respondentAddress}
                    natureOfComplaint={record.natureOfComplaint || "For the Record"}
                    date={new Date().toISOString().split("T")[0]}
                 />
              </div>
            </div>
          </div>
        )}

        {activeTab === "closure" && (
          <div className="pt-2">
            <SectionCard
              title="Record Case Resolution"
              icon={<ClipboardIcon className="w-4 h-4 text-gray-400" />}
            >
              {record.status === "CLOSED" ? (
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Date of Settlement" value={formatDate(record.settledAt)} />
                  <InfoRow label="Venue / Location" value={record.settlementVenue || "N/A"} />
                  <InfoRow label="Desk Officer Name" value={record.encodedBy} />
                  <div className="col-span-2 mt-2">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1.5">
                      Attached Document
                    </p>
                    {record.hasSettlementDocument ? (
                      <SettlementDocumentViewer caseNumber={blotterNumber} />
                    ) : (
                      <span className="text-sm text-gray-400 italic">No document attached</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {submitError && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                      {submitError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Settlement <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={closingDate}
                        onChange={(e) => setClosingDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Venue / Location <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={closingVenue}
                        onChange={(e) => setClosingVenue(e.target.value.replace(/[^a-zA-Z0-9\s.,-]/g, ''))}
                        maxLength={150}
                        placeholder="e.g. Barangay Hall"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Desk Officer Name
                      </label>
                      <input
                        type="text"
                        value={record.encodedBy}
                        readOnly
                        className="w-full px-3 py-2 text-sm border border-gray-200 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload signed settlement or agreement (PDF or image) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="dropzone-file-settlement"
                        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer bg-slate-50 border-slate-300 hover:bg-slate-100 ${
                          isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        {closingFile ? (
                          <div className="flex flex-col items-center p-4 text-center">
                            <span className="text-sm font-semibold text-slate-700 break-all">
                              {closingFile.name}
                            </span>
                            <span className="text-xs text-slate-500 mt-1">
                              {(closingFile.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setClosingFile(null);
                              }}
                              className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium"
                              disabled={isSubmitting}
                            >
                              Remove file
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-slate-400" />
                            <p className="mb-1 text-sm text-slate-500">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-slate-400">PDF, PNG, JPG (MAX. 5MB)</p>
                          </div>
                        )}
                        <input
                          id="dropzone-file-settlement"
                          type="file"
                          className="hidden"
                          accept=".pdf,image/png,image/jpeg"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setClosingFile(file);
                          }}
                          disabled={isSubmitting}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleCloseCase}
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? "Closing Case..." : "Mark as Closed"}
                    </button>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="pt-2">
            <TimelineTab blotterNumber={blotterNumber} />
          </div>
        )}
      </div>

      <ActionModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          window.location.reload();
        }}
        title="Case Closed"
        type="success"
      >
        <p>The case has been closed successfully.</p>
      </ActionModal>
    </div>
  );
};

export default BlotterRecordDetailViewPage;
