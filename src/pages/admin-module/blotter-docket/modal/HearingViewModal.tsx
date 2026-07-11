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
} from "../../../../service/lupon-api/LuponCaseManagement-view-api-v2";
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
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* --- Header --- */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-[17px] font-semibold text-gray-900">
              Minutes — Mediation {hearing.summonNumber}
            </h3>
            <p className="text-[13px] text-gray-500 mt-1.5">
              {formatDate(hearing.scheduledStart.split("T")[0])} · {formatTime(hearing.scheduledStart.split("T")[1])} · {hearing.venue}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-8">
          {/* --- 1. Attendance --- */}
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">
              1 — ATTENDANCE
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div>
                  <p className="text-[14px] font-semibold text-gray-900">Complainant</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">Attendance Status</p>
                </div>
                <span className={`px-3.5 py-1.5 text-[12px] font-semibold rounded-full ${compPresent ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                  {compPresent ? 'Present' : 'Absent'}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div>
                  <p className="text-[14px] font-semibold text-gray-900">Respondent</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">Attendance Status</p>
                </div>
                <span className={`px-3.5 py-1.5 text-[12px] font-semibold rounded-full ${respPresent ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                  {respPresent ? 'Present' : 'Absent'}
                </span>
              </div>
            </div>
          </div>

          {/* --- 2. Lupon Attendance --- */}
          {hasLuponAttendance && (
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">
                2 — LUPON ATTENDANCE
              </p>
              <div className="space-y-3">
                {[
                  { label: "Chairperson", present: hearing.minutes?.chairmanPresent },
                  { label: "Secretary", present: hearing.minutes?.secretaryPresent },
                  { label: "Member", present: hearing.minutes?.memberPresent },
                ].map(({ label, present }) => {
                  const isPresent = present === true;
                  return (
                    <div key={label} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      <div>
                        <p className="text-[14px] font-semibold text-gray-900">{label}</p>
                        <p className="text-[12px] text-gray-500 mt-0.5">Attendance Status</p>
                      </div>
                      <span className={`px-3.5 py-1.5 text-[12px] font-semibold rounded-full ${isPresent ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                        {isPresent ? 'Present' : 'Absent'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* --- 2/3. Mediation Narrative --- */}
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">
              {narrativeStep} — SESSION NOTES
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-[14px] text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
                {notes || '— No notes recorded for this session —'}
              </p>
            </div>
          </div>

          {/* --- 3/4. Outcome --- */}
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">
              {outcomeStep} — OUTCOME
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-[14px] font-semibold text-gray-900">
                {isSettledOutcome ? 'Settled (Case Closed)' : 'Not Settled (Schedule Next Session)'}
              </p>
            </div>
          </div>

          {/* Settlement Terms */}
          {isSettledOutcome && hearing.minutes?.settlementTerms && (
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">
                SETTLEMENT TERMS
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-[14px] text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
                  {hearing.minutes.settlementTerms}
                </p>
              </div>
            </div>
          )}

          {/* Follow-ups */}
          {followUps.length > 0 && (
            <div className="pt-8 border-t border-gray-100">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">
                FOLLOW-UP NOTES
              </p>
              <div className="space-y-4">
                {followUps.map((f) => (
                  <div key={f.id} className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-[14px] text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                      {f.remarks}
                    </p>
                    <p className="text-[12px] text-gray-400 mt-4 font-medium">
                      {new Date(f.createdAt).toLocaleString()} • {f.recordedBy}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
