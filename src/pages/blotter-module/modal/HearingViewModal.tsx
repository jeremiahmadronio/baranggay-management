import {
  XIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  FileTextIcon,
  UsersIcon,
  MessageSquareIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  ShieldCheck,
} from "lucide-react";
import type {
  HearingFullDetailsDTO,
  FollowUpSummaryDTO,
} from "../../../service/lupon-api/LuponCaseManagement-view-api-v2";
import { formatDate, formatTime } from "../shared/utils";

interface Props {
  hearing: HearingFullDetailsDTO;
  onClose: () => void;
}

export function HearingViewModal({ hearing, onClose }: Props) {
  const compPresent = hearing.minutes?.complainantPresent ?? true;
  const respPresent = hearing.minutes?.respondentPresent ?? true;
  const notes = hearing.minutes?.hearingNotes || "";
  const outcome = hearing.minutes?.outcome || "";
  const followUps: FollowUpSummaryDTO[] = hearing.followUps ?? [];
  const hasLuponAttendance = hearing.minutes?.isInLupon === true;

  const narrativeStep = hasLuponAttendance ? 3 : 2;
  const outcomeStep = hasLuponAttendance ? 4 : 3;
  const followUpStep = hasLuponAttendance ? 5 : 4;

  const PresenceBadge = ({
    present,
  }: {
    present: boolean | null | undefined;
  }) => {
    if (present === null || present === undefined) {
      return (
        <span className="text-xs font-bold px-2.5 py-1 rounded-full uppercase bg-gray-100 text-gray-500">
          —
        </span>
      );
    }

    return (
      <span
        className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${present ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
      >
        {present ? "Present" : "Absent"}
      </span>
    );
  };
  const normalizedOutcome = String(outcome || "PENDING")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const isSettledOutcome = String(outcome).toUpperCase() === "SETTLED";

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* --- Header (Matching Record Style) --- */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Mediation Minutes — Mediation {hearing.summonNumber}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Status:{" "}
              <span className="font-medium text-blue-600">
                {hearing.status}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* --- Mediation Information Box --- */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Mediation Information
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Summon</p>
                <p className="text-sm font-semibold text-blue-600">
                  Summon {hearing.summonNumber}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Date</p>
                <p className="text-sm text-gray-700 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                  {formatDate(hearing.scheduledStart.split("T")[0])}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Time</p>
                <p className="text-sm text-gray-700 flex items-center gap-1.5">
                  <ClockIcon className="w-3.5 h-3.5 text-gray-400" />
                  {formatTime(hearing.scheduledStart.split("T")[1])}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Venue</p>
                <p className="text-sm text-gray-700 flex items-center gap-1.5">
                  <MapPinIcon className="w-3.5 h-3.5 text-gray-400" />
                  {hearing.venue}
                </p>
              </div>
            </div>
          </div>

          {/* --- 1. Attendance --- */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <UsersIcon className="w-3.5 h-3.5" /> 1 Attendance
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Complainant", present: compPresent },
                { label: "Respondent", present: respPresent },
              ].map(({ label, present }) => (
                <div
                  key={label}
                  className={`flex items-center justify-between px-4 py-3 border rounded-lg ${present ? "bg-emerald-50/50 border-emerald-100" : "bg-red-50/50 border-red-100"}`}
                >
                  <span className="text-sm font-medium text-gray-700">
                    {label}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${present ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                  >
                    {present ? "Present" : "Absent"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* --- 2. Lupon Attendance --- */}
          {hasLuponAttendance && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5" /> 2 Lupon Attendance
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    label: "Chairperson",
                    present: hearing.minutes?.chairmanPresent,
                  },
                  {
                    label: "Secretary",
                    present: hearing.minutes?.secretaryPresent,
                  },
                  {
                    label: "Member",
                    present: hearing.minutes?.memberPresent,
                  },
                ].map(({ label, present }) => {
                  const isAbsent = present === false;
                  const isPresent = present === true;
                  const rowClass = isPresent
                    ? "bg-emerald-50/50 border-emerald-100"
                    : isAbsent
                      ? "bg-red-50/50 border-red-100"
                      : "bg-gray-50 border-gray-200";

                  return (
                    <div
                      key={label}
                      className={`flex items-center justify-between px-4 py-3 border rounded-lg ${rowClass}`}
                    >
                      <span className="text-sm font-medium text-gray-700">
                        {label}
                      </span>
                      <PresenceBadge present={present} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* --- 2/3. Mediation Narrative --- */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <FileTextIcon className="w-3.5 h-3.5" /> {narrativeStep} Mediation
              Narrative
            </p>
            <div className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 leading-relaxed min-h-[100px] whitespace-pre-wrap">
              {notes || (
                <span className="text-gray-400 italic">
                  No narrative recorded for this session.
                </span>
              )}
            </div>
            {hearing.minutes?.recordedBy && (
              <p className="text-[12px] text-blue-600 capitalize   font-medium mt-2 flex items-center gap-1">
                Recorded by: {hearing.minutes.recordedBy}
              </p>
            )}
          </div>

          {/* --- 3/4. Outcome --- */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <CheckCircle2Icon className="w-3.5 h-3.5" /> {outcomeStep} Outcome
            </p>
            <div
              className={`flex items-start gap-3 px-4 py-3.5 rounded-lg border ${
                isSettledOutcome
                  ? "border-emerald-200 bg-emerald-50/60"
                  : "border-amber-200 bg-amber-50/60"
              }`}
            >
              {isSettledOutcome ? (
                <CheckCircle2Icon className="w-4 h-4 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircleIcon className="w-4 h-4 text-amber-600 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <p
                  className={`text-sm font-semibold ${
                    isSettledOutcome ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {normalizedOutcome}
                </p>
                <p className="text-xs text-gray-500">
                  {isSettledOutcome
                    ? "Parties reached an agreement during mediation."
                    : "Case remains unresolved and may need further action."}
                </p>
              </div>
            </div>
          </div>

          {followUps.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <MessageSquareIcon className="w-3.5 h-3.5" /> {followUpStep}{" "}
                Follow-up Records
              </p>
              <div className="space-y-3">
                {followUps.map((f) => (
                  <div
                    key={f.id}
                    className="p-4 rounded-lg border border-gray-100 bg-gray-50/50"
                  >
                    <p className="text-sm text-gray-700 mb-2 leading-relaxed">
                      {f.remarks}
                    </p>
                    <div className="flex items-center gap-2 text-[12px] text-gray-400 font-medium">
                      <span className="text-blue-600 capitalize">
                        By {f.recordedBy}
                      </span>
                      <span>•</span>
                      <span>{formatDate(f.createdAt.split("T")[0])}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium border border-gray-200 rounded-md text-gray-600 bg-white hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
