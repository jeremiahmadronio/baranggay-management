import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  getFullBlotterRecord,
  type BlotterRecordViewDTO,
} from "../../service/blotter-api/blotter-api";
import { CenteredLoader } from "../../reusable/LoadingStates";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (dateStr?: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const fmtTime = (timeStr?: string) => {
  if (!timeStr) return "—";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${m} ${ampm}`;
};

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  let bgColor, textColor, ringColor, dotColor;

  // Nilagyan natin ng kulay base sa status na galing sa database
  switch (status?.toUpperCase()) {
    case "PENDING":
      bgColor = "bg-amber-50";
      textColor = "text-amber-700";
      ringColor = "ring-amber-200";
      dotColor = "bg-amber-500";
      break;
    case "MEDIATION":
    case "LUPON":
      bgColor = "bg-blue-50";
      textColor = "text-blue-700";
      ringColor = "ring-blue-200";
      dotColor = "bg-blue-500";
      break;
    case "RECORDED":
    case "RESOLVED":
    case "CLOSED":
      bgColor = "bg-emerald-50";
      textColor = "text-emerald-700";
      ringColor = "ring-emerald-200";
      dotColor = "bg-emerald-500";
      break;
    case "ESCALATED":
    case "FILE_ACTION":
      bgColor = "bg-red-50";
      textColor = "text-red-700";
      ringColor = "ring-red-200";
      dotColor = "bg-red-500";
      break;
    default:
      bgColor = "bg-slate-50";
      textColor = "text-slate-700";
      ringColor = "ring-slate-200";
      dotColor = "bg-slate-500";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${bgColor} ${textColor} ring-1 ring-inset ${ringColor} shadow-sm`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse`}
      ></span>
      {status || "UNKNOWN"}
    </span>
  );
};

// ─── Reusable field components ────────────────────────────────────────────────
const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mb-0.5">
    {children}
  </p>
);

const FieldValue = ({
  children,
  mono = false,
}: {
  children: React.ReactNode;
  mono?: boolean;
}) => (
  <p
    className={`text-sm text-slate-800 ${mono ? "font-mono font-semibold tracking-wide" : "font-medium"}`}
  >
    {children || "—"}
  </p>
);

const Divider = () => <hr className="border-slate-100 my-4" />;

// ─── Section card ─────────────────────────────────────────────────────────────
const SectionCard = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-slate-50">
      <span className="text-slate-500">{icon}</span>
      <h2 className="text-sm font-bold text-slate-700">{title}</h2>
    </div>
    <div className="px-5 py-4">{children}</div>
  </div>
);

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconUser = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const IconUsers = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const IconFile = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const IconClip = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
    />
  </svg>
);

const IconDoc = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h7"
    />
  </svg>
);

const BlotterViewPage: React.FC = () => {
  // Get blotterNumber from query param
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

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return <CenteredLoader minHeight="min-h-[70vh]" />;
  }

  // ── Error state ─────────────────────────────────────────────────────────────
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

  // ── Record view ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen ">
      <div className="max-w-6xl mx-auto">
        {/* Back + header */}
        <div className="mb-5">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-3"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Records
          </button>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5 mb-0.5">
                <h1 className="text-xl font-bold text-slate-800">
                  Blotter Record
                </h1>
                <span className="font-mono text-sm font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md ring-1 ring-blue-200">
                  {record.blotterNumber}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                Filed on {fmt(record.dateFiled)} · Encoded by{" "}
                <span className="font-medium text-slate-600">
                  {record.encodedBy}
                </span>
              </p>
            </div>
            <StatusBadge status={record.status} />
          </div>
        </div>

        {/* Layout: left (2/3) + right (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ── Left column ──────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Complainant */}
            <SectionCard title="Client Information" icon={<IconUser />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <FieldLabel>Full Name</FieldLabel>
                  <FieldValue>{record.complainantFullName}</FieldValue>
                </div>
                <div>
                  <FieldLabel>Contact Number</FieldLabel>
                  <FieldValue>{record.complainantContact}</FieldValue>
                </div>
              </div>
              <Divider />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <FieldLabel>Current Address</FieldLabel>
                  <FieldValue>{record.complainantAddress}</FieldValue>
                </div>
                <div>
                  <FieldLabel>Email Address</FieldLabel>
                  <FieldValue>{record.complainantEmail}</FieldValue>
                </div>
              </div>
              <Divider />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
                <div>
                  <FieldLabel>Age</FieldLabel>
                  <FieldValue>{record.complainantAge}</FieldValue>
                </div>
                <div>
                  <FieldLabel>Gender</FieldLabel>
                  <FieldValue>{record.complainantGender}</FieldValue>
                </div>
                <div>
                  <FieldLabel>Civil Status</FieldLabel>
                  <FieldValue>{record.civilStatus}</FieldValue>
                </div>
              </div>
            </SectionCard>

            {/* Respondent */}
            <SectionCard title="Respondent Information" icon={<IconUsers />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <FieldLabel>Name</FieldLabel>
                  <FieldValue>{record.respondentFullName}</FieldValue>
                </div>
                <div>
                  <FieldLabel>Contact Number</FieldLabel>
                  <FieldValue>{record.respondentContact}</FieldValue>
                </div>
              </div>
              <Divider />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <FieldLabel>Address</FieldLabel>
                  <FieldValue>{record.respondentAddress}</FieldValue>
                </div>
                <div>
                  <FieldLabel>Relationship to Complainant</FieldLabel>
                  <FieldValue>{record.relationshipToComplainant}</FieldValue>
                </div>
              </div>
            </SectionCard>

            {/* Narrative */}
            <SectionCard title="Narrative Statement" icon={<IconDoc />}>
              {record.narrativeStatement ? (
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {record.narrativeStatement}
                </p>
              ) : (
                <p className="text-sm text-slate-400 italic">
                  No narrative statement provided.
                </p>
              )}
            </SectionCard>

            {/* Types of Evidence Recorded */}
            <SectionCard title="Types of Evidence Recorded" icon={<IconClip />}>
              {record.evidenceNames && record.evidenceNames.length > 0 ? (
                <ul className="space-y-1.5 ml-1">
                  {record.evidenceNames.map((name, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-sm text-slate-700"
                    >
                      {/* Simple bullet dot lang, walang fancy icons */}
                      <span className="text-slate-400 text-lg leading-none mt-[-1px]">
                        •
                      </span>
                      <span className="leading-relaxed">{name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400 italic">
                  No evidence recorded.
                </p>
              )}
            </SectionCard>
          </div>

          {/* ── Right column ─────────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Case Information */}
            <SectionCard title="Case Information" icon={<IconFile />}>
              <div className="space-y-4">
                <div>
                  <FieldLabel>Case Number</FieldLabel>
                  <FieldValue mono>{record.blotterNumber}</FieldValue>
                </div>

                <div>
                  <FieldLabel>Status</FieldLabel>
                  <div className="mt-1">
                    <StatusBadge status={record.status} />
                  </div>
                </div>

                <Divider />

                <div>
                  <FieldLabel>Date Filed</FieldLabel>
                  <FieldValue>{fmt(record.dateFiled)}</FieldValue>
                </div>

                <div>
                  <FieldLabel>Nature of Complaint</FieldLabel>
                  <FieldValue>{record.natureOfComplaint}</FieldValue>
                </div>

                <Divider />

                <div>
                  <FieldLabel>Incident Date</FieldLabel>
                  <FieldValue>{fmt(record.dateOfIncident)}</FieldValue>
                </div>

                <div>
                  <FieldLabel>Incident Time</FieldLabel>
                  <FieldValue>{fmtTime(record.timeOfIncident)}</FieldValue>
                </div>

                <div>
                  <FieldLabel>Incident Place</FieldLabel>
                  <FieldValue>{record.placeOfIncident}</FieldValue>
                </div>
              </div>
            </SectionCard>

            {/* Quick info card */}
            <div className="bg-blue-50 rounded-xl border border-blue-100 px-5 py-4">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-widest mb-1">
                Encoded By
              </p>
              <p className="text-sm font-semibold text-blue-800">
                {record.encodedBy}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlotterViewPage;
