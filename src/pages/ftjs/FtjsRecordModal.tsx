import { useEffect, useState } from "react";
import {
  CalendarClock,
  CircleUserRound,
  ClipboardList,
  FilePenLine,
  FileText,
  History,
  NotebookPen,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { FormModalShell } from "../../reusable";
import type {
  FtjsFullResponseDTO,
  NotesResponseDTO,
  ResponseNewFtjsSummaryDTO,
  TimelineResponseDTO,
} from "../../service/ftjs/FirstTimeJobSeeker";
import { formatDate, formatDateTime, InfoItem, StatusPill } from "./shared";

interface FtjsRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: FtjsFullResponseDTO | null;
  notes: NotesResponseDTO[];
  timeline: TimelineResponseDTO[];
  replacements: ResponseNewFtjsSummaryDTO[];
  onEdit?: () => void;
  onAddNote?: () => void;
  onRequestReissue?: () => void;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 p-5 text-sm text-gray-500 text-center">
      {text}
    </div>
  );
}

type TabKey = "overview" | "notes" | "timeline" | "reissuance";

function QuickActionCard({
  title,
  subtitle,
  icon,
  tone,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tone: "blue" | "amber" | "violet" | "slate";
  onClick: () => void;
}) {
  const tones = {
    blue: "bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100/70",
    amber: "bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100/70",
    violet:
      "bg-violet-50 border-violet-100 text-violet-700 hover:bg-violet-100/70",
    slate: "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/80",
  } as const;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-colors ${tones[tone]}`}
    >
      <div className="inline-flex items-center justify-center rounded-lg p-2 bg-white/80 border border-current/10 mb-3">
        {icon}
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs mt-1 opacity-80">{subtitle}</p>
    </button>
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

export function FtjsRecordModal({
  isOpen,
  onClose,
  record,
  notes,
  timeline,
  replacements,
  onEdit,
  onAddNote,
  onRequestReissue,
}: FtjsRecordModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  useEffect(() => {
    if (isOpen) {
      setActiveTab("overview");
    }
  }, [isOpen, record?.id]);

  return (
    <FormModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={record?.trackingNumber || "FTJS Request Details"}
      maxWidthClass="max-w-7xl"
      bodyClassName="bg-slate-50/80"
    >
      {!record ? (
        <EmptyState text="No FTJS record selected." />
      ) : (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-50 px-5 py-5 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">
                  FTJS Management View
                </p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {record.trackingNumber}
                </h3>
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

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {onEdit ? (
              <QuickActionCard
                title="Edit Request"
                subtitle="Update FTJS details"
                icon={<FilePenLine className="w-5 h-5" />}
                tone="blue"
                onClick={onEdit}
              />
            ) : null}
            {onAddNote ? (
              <QuickActionCard
                title="Add Note"
                subtitle="Log internal observation"
                icon={<NotebookPen className="w-5 h-5" />}
                tone="amber"
                onClick={onAddNote}
              />
            ) : null}
            {onRequestReissue ? (
              <QuickActionCard
                title="Request Re-issuance"
                subtitle="Create a new certificate request"
                icon={<RefreshCw className="w-5 h-5" />}
                tone="violet"
                onClick={onRequestReissue}
              />
            ) : null}
            <QuickActionCard
              title="Close View"
              subtitle="Return to FTJS management"
              icon={<X className="w-5 h-5" />}
              tone="slate"
              onClick={onClose}
            />
          </div>

          {activeTab === "overview" ? (
            <>
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
                    <InfoItem
                      label="ID Number"
                      value={record.idNumber || "—"}
                    />
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
                        recorded issuance{record.issuanceCount === 1 ? "" : "s"}
                        .
                      </p>
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 flex items-start gap-3">
                      <FileText className="w-5 h-5 shrink-0 mt-0.5" />
                      <p>
                        Verify identity and supporting documents carefully
                        before releasing any certificate. Re-issuance requests
                        should include affidavit attachment and a clear
                        replacement reason.
                      </p>
                    </div>
                  </div>
                </DetailPanel>
              </div>
            </>
          ) : null}

          {activeTab === "notes" ? (
            <DetailPanel
              title="Internal Notes"
              icon={<NotebookPen className="w-4 h-4" />}
            >
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
            <DetailPanel
              title="Timeline"
              icon={<History className="w-4 h-4" />}
            >
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
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                            {item.reason}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm min-w-[220px]">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                            Date Submitted
                          </p>
                          <p className="font-medium text-gray-900">
                            {formatDate(item.dateSubmitted)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                            Summary
                          </p>
                          <p className="font-medium text-gray-900">
                            Linked re-issuance record
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DetailPanel>
          ) : null}
        </div>
      )}
    </FormModalShell>
  );
}

export default FtjsRecordModal;
