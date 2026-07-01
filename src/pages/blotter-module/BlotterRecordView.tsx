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

const BlotterRecordViewPage: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const blotterNumber = searchParams.get("blotterNumber") || "";
  const navigate = useNavigate();

  const [record, setRecord] = useState<BlotterRecordViewDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!blotterNumber) return;
    setLoading(true);
    setError(null);
    getFullBlotterRecord(blotterNumber)
      .then(setRecord)
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
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Records
          </button>

          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {record.blotterNumber}
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            {record.natureOfComplaint || "For the Record"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <SectionCard
              title="Complainant Information"
              icon={<UserIcon className="w-4 h-4 text-gray-400" />}
            >
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Full Name" value={record.complainantFullName} />
                <InfoRow
                  label="Contact Number"
                  value={record.complainantContact}
                />
                <InfoRow label="Age" value={record.complainantAge} />
                <InfoRow label="Gender" value={record.complainantGender} />
                <InfoRow label="Civil Status" value={record.civilStatus} />
                <InfoRow label="Email" value={record.complainantEmail} />
                <div className="col-span-2">
                  <InfoRow
                    label="Current Address"
                    value={record.complainantAddress}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Respondent Information"
              icon={<UserIcon className="w-4 h-4 text-gray-400" />}
            >
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Name" value={record.respondentFullName} />
                <InfoRow
                  label="Contact Number"
                  value={record.respondentContact}
                />
                <InfoRow
                  label="Relationship to Complainant"
                  value={record.relationshipToComplainant}
                />
                <InfoRow label="Address" value={record.respondentAddress} />
              </div>
            </SectionCard>

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

          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-5 h-fit">
            <h3 className="text-base font-medium text-gray-800 flex items-center gap-2">
              <ClipboardIcon className="w-5 h-5 text-gray-400" /> Case
              Information
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
            <InfoRow
              label="Nature of Complaint"
              value={record.natureOfComplaint}
            />
            <InfoRow
              label="Incident Date"
              value={formatDate(record.dateOfIncident)}
            />
            <InfoRow
              label="Incident Time"
              value={formatTime(record.timeOfIncident)}
            />
            <InfoRow label="Incident Place" value={record.placeOfIncident} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlotterRecordViewPage;
