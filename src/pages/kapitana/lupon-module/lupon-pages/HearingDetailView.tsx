import React from "react";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  FileTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  TagIcon,
  HashIcon,
  UserCheckIcon,
  ClipboardListIcon,
} from "lucide-react";
import { Badge } from "../ui/Badge";
import { type HearingScheduleDTO } from "../../../../service/lupon-api/Hearing";

interface HearingDetailViewProps {
  hearing: HearingScheduleDTO;
  onBack: () => void;
  onSuccess: () => void;
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  const displayValue =
    value === null || value === undefined || value === "" ? "—" : value;
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-3.5 sm:p-4">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 text-gray-400">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wide font-medium text-gray-500 mb-1.5">
            {label}
          </p>
          <div className="text-sm text-gray-800 break-words">
            {displayValue}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/60">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          {icon}
          {title}
        </h3>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

function TopMetaCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/70 px-3.5 py-3">
      <p className="text-[11px] uppercase tracking-wide font-medium text-gray-500 mb-1">
        {label}
      </p>
      <div className="flex items-center gap-2 text-sm text-gray-800">
        <span className="text-gray-400">{icon}</span>
        <span className="font-medium">{value}</span>
      </div>
    </div>
  );
}

export function HearingDetailView({ hearing, onBack }: HearingDetailViewProps) {
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const formatDateTime = (dateString: string) =>
    `${formatDate(dateString)}, ${formatTime(dateString)}`;

  const PresenceTag = ({ present }: { present: boolean | null }) => {
    if (present === null || present === undefined) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 font-medium bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
          —
        </span>
      );
    }
    return present ? (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
        <CheckCircleIcon className="w-4 h-4" /> Present
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 text-xs text-red-700 font-medium bg-red-50 px-2.5 py-1 rounded-md border border-red-100">
        <XCircleIcon className="w-4 h-4" /> Absent
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50/30 min-h-screen space-y-6">
      {/* Back Navigation */}
      <button
        onClick={onBack}
        className="group inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
      >
        <div className="p-1.5 rounded-md bg-white border border-gray-200 group-hover:border-gray-300 transition-colors">
          <ArrowLeftIcon className="w-4 h-4" />
        </div>
        Back to Hearings
      </button>

      {/* Header Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                <Badge status={hearing.status} className="px-3 py-1 text-sm" />
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                  {hearing.casePhase}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                {hearing.complainantName}{" "}
                <span className="text-gray-400 font-normal mx-2">vs</span>{" "}
                {hearing.respondentName}
              </h1>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <span>
                  Case Ref:{" "}
                  <span className="font-semibold text-gray-700">
                    {hearing.blotterNumber}
                  </span>
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <TopMetaCard
              icon={<CalendarIcon className="w-4 h-4" />}
              label="Date"
              value={formatDate(hearing.scheduledStart)}
            />
            <TopMetaCard
              icon={<ClockIcon className="w-4 h-4" />}
              label="Time"
              value={
                <>
                  {formatTime(hearing.scheduledStart)}
                  {hearing.scheduledEnd && (
                    <span className="text-gray-500">
                      {" "}
                      – {formatTime(hearing.scheduledEnd)}
                    </span>
                  )}
                </>
              }
            />
            <TopMetaCard
              icon={<MapPinIcon className="w-4 h-4" />}
              label="Venue"
              value={hearing.venue || "—"}
            />
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <SectionCard
            title="Case Information"
            icon={<ClipboardListIcon className="w-4 h-4 text-gray-400" />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <DetailRow
                icon={<HashIcon className="w-4 h-4" />}
                label="Blotter Number"
                value={hearing.blotterNumber}
              />
              <DetailRow
                icon={<TagIcon className="w-4 h-4" />}
                label="Case Phase"
                value={hearing.casePhase}
              />
              <DetailRow
                icon={<HashIcon className="w-4 h-4" />}
                label="Summon Number"
                value={hearing.summonNumber}
              />
              <DetailRow
                icon={<CheckCircleIcon className="w-4 h-4" />}
                label="Outcome"
                value={
                  hearing.outcome ? hearing.outcome.replace(/_/g, " ") : "—"
                }
              />
            </div>
          </SectionCard>

          <SectionCard
            title="System Metadata"
            icon={<UserCheckIcon className="w-4 h-4 text-gray-400" />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <DetailRow
                icon={<UserCheckIcon className="w-4 h-4" />}
                label="Created By"
                value={hearing.createdBy}
              />
              <DetailRow
                icon={<CalendarIcon className="w-4 h-4" />}
                label="Created At"
                value={formatDateTime(hearing.createdAt)}
              />
            </div>
          </SectionCard>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <SectionCard
            title="Parties Involved"
            icon={<UserIcon className="w-4 h-4 text-gray-400" />}
          >
            <div className="space-y-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wide font-medium text-gray-500 mb-1">
                    Complainant
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {hearing.complainantName}
                  </p>
                </div>
                <PresenceTag present={hearing.complainantPresent} />
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wide font-medium text-gray-500 mb-1">
                    Respondent
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {hearing.respondentName}
                  </p>
                </div>
                <PresenceTag present={hearing.respondentPresent} />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Hearing Record"
            icon={<FileTextIcon className="w-4 h-4 text-gray-400" />}
          >
            <div className="space-y-3.5">
              <DetailRow
                icon={<UserCheckIcon className="w-4 h-4" />}
                label="Minutes Recorded By"
                value={hearing.recordedByMinutes}
              />

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-[11px] uppercase tracking-wide font-medium text-gray-500 mb-2">
                  Hearing Notes
                </p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[72px]">
                  {hearing.hearingNotes || "—"}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-[11px] uppercase tracking-wide font-medium text-gray-500 mb-2">
                  Remarks / Additional Notes
                </p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[72px]">
                  {hearing.notes || "—"}
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
