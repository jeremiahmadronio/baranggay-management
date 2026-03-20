import {
  X,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  MessageSquare,
  CalendarCheck,
  ShieldCheck,
} from "lucide-react";
import type {
  HearingFullDetailsDTO,
  FollowUpSummaryDTO,
} from "../../blotter-api/DocketView";
import { formatDateTime } from "../shared/utils";

interface Props {
  hearing: HearingFullDetailsDTO;
  onClose: () => void;
}

const OutcomeBadge = ({ outcome }: { outcome: string }) => {
  if (outcome === "SETTLED") {
    return (
      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold">
        <CheckCircle2 className="w-4 h-4" /> Settled
      </span>
    );
  }
  if (outcome === "NOT_SETTLED") {
    return (
      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-200 text-red-600 text-sm font-bold">
        <AlertCircle className="w-4 h-4" /> Not Settled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-200 text-gray-500 text-sm font-semibold">
      Pending
    </span>
  );
};

const AttendancePill = ({ present, label }: { present: boolean; label: string }) => (
  <div className="flex flex-col items-center gap-2 px-6 py-4 rounded-xl bg-gray-50 border border-gray-100 flex-1">
    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
        present
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-red-50 text-red-600 border border-red-200"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${present ? "bg-emerald-500" : "bg-red-500"}`} />
      {present ? "Present" : "Absent"}
    </span>
  </div>
);

export function HearingMinutesModal({ hearing, onClose }: Props) {
  const compPresent = hearing.minutes?.complainantPresent ?? true;
  const respPresent = hearing.minutes?.respondentPresent ?? true;
  const notes = hearing.minutes?.hearingNotes || "";
  const outcome = hearing.minutes?.outcome || "";
  const followUps: FollowUpSummaryDTO[] = hearing.followUps ?? [];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="px-6 py-5 border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                <h3 className="text-base font-bold text-gray-900">
                  Hearing {hearing.summonNumber} — Minutes
                </h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-tight">
                  {hearing.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">{hearing.venue}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  {formatDateTime(
                    hearing.scheduledStart.split("T")[0],
                    hearing.scheduledStart.split("T")[1],
                  )}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Outcome */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5" /> Outcome
            </p>
            <OutcomeBadge outcome={outcome} />
          </div>

          {/* Attendance */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Attendance
            </p>
            <div className="flex gap-3">
              <AttendancePill present={compPresent} label="Complainant" />
              <AttendancePill present={respPresent} label="Respondent" />
            </div>
          </div>

          {/* Initial Context */}
          {hearing.initialNotes && (
            <div className="rounded-xl bg-blue-50/60 border border-blue-100 px-4 py-3.5">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1.5">
                Initial Notes
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {hearing.initialNotes}
              </p>
            </div>
          )}

          {/* Mediation Narrative */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Mediation Narrative
            </p>
            {notes ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3.5">
                {hearing.minutes?.recordedBy && (
                  <p className="text-xs text-gray-400 font-medium mb-2 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-blue-400" />
                    Recorded by {hearing.minutes.recordedBy}
                  </p>
                )}
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {notes}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No narrative recorded.</p>
            )}
          </div>

          {/* Follow-up Records — view only */}
          {followUps.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Follow-up Records
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-500 rounded-full">
                  {followUps.length}
                </span>
              </p>
              <div className="space-y-2.5">
                {followUps.map((f) => (
                  <div
                    key={f.id}
                    className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3.5"
                  >
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {f.remarks}
                    </p>
                    <div className="flex items-center gap-2 mt-2.5 text-xs text-gray-400">
                      <span className="font-bold text-blue-600 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> {f.recordedBy}
                      </span>
                      <span>·</span>
                      <span>
                        {formatDateTime(
                          f.createdAt.split("T")[0],
                          f.createdAt.split("T")[1],
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 bg-white border-t border-gray-100 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}