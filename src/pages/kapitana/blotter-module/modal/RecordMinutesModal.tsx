import { useState } from "react";
import {
  XIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  AlertTriangleIcon,
} from "lucide-react";
import type {
  HearingViewDTO,
  RecordMinutesRequest,
} from "../../../../service/blotter-api/DocketView";
import { recordHearingMinutes } from "../../../../service/blotter-api/DocketView";
import { formatDate, formatTime } from "../shared/utils";

interface RecordMinutesModalProps {
  hearing: HearingViewDTO;
  caseNumber: string;
  natureOfComplaint: string;
  complainantName: string;
  respondentName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function RecordMinutesModal({
  hearing,
  caseNumber,
  natureOfComplaint,
  complainantName,
  respondentName,
  onSuccess,
  onCancel,
}: RecordMinutesModalProps) {
  const [complainantPresent, setComplainantPresent] = useState(true);
  const [respondentPresent, setRespondentPresent] = useState(true);
  const [hearingNotes, setHearingNotes] = useState("");
  const [outcome, setOutcome] = useState<"SETTLED" | "NOT_SETTLED" | "">("");
  const [settlementTerms, setSettlementTerms] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!outcome) {
      setError("Please select an outcome.");
      return;
    }
    if (outcome === "SETTLED" && !settlementTerms.trim()) {
      setError("Please enter the terms of settlement / napagkasunduan.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const body: RecordMinutesRequest = {
        hearingId: hearing.hearingId,
        complainantPresent,
        respondentPresent,
        hearingNotes: hearingNotes || undefined,
        outcome,
        settlementTerms: outcome === "SETTLED" ? settlementTerms.trim() : "",
      };
      await recordHearingMinutes(body);
      onSuccess();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save minutes.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Record Mediation Minutes — Mediation {hearing.hearingNumber}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {caseNumber} · {natureOfComplaint}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Hearing Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Mediation Information
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Summon</p>
                <p className="text-sm font-semibold text-blue-600">
                  Summon {hearing.hearingNumber}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Date</p>
                <p className="text-sm text-gray-700 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                  {formatDate(hearing.date)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Time</p>
                <p className="text-sm text-gray-700 flex items-center gap-1.5">
                  <ClockIcon className="w-3.5 h-3.5 text-gray-400" />
                  {formatTime(hearing.startTime)} –{" "}
                  {formatTime(hearing.endTime)}
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

          {/* 1. Attendance */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              1 Attendance
            </p>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              {[
                {
                  label: "Complainant",
                  name: complainantName,
                  value: complainantPresent,
                  set: setComplainantPresent,
                },
                {
                  label: "Respondent",
                  name: respondentName,
                  value: respondentPresent,
                  set: setRespondentPresent,
                },
              ].map(({ label, name, value, set }) => (
                <div
                  key={label}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{label}</p>
                    <p className="text-xs text-gray-500">{name}</p>
                  </div>
                  <div className="flex rounded-md overflow-hidden border border-gray-200">
                    <button
                      onClick={() => set(true)}
                      className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                        value
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => set(false)}
                      className={`px-4 py-1.5 text-xs font-medium border-l border-gray-200 transition-colors ${
                        !value
                          ? "bg-gray-700 text-white"
                          : "bg-white text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Hearing Notes */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              2 Hearing Notes
            </p>
            <textarea
              value={hearingNotes}
              onChange={(e) => setHearingNotes(e.target.value)}
              rows={4}
              placeholder="Brief summary of what transpired during the hearing..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-800 placeholder:text-gray-400"
            />
          </div>

          {/* 3. Outcome */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              3 Outcome
            </p>
            <div className="space-y-2">
              {/* Settled */}
              <label
                className={`flex items-center gap-3 cursor-pointer px-4 py-3 rounded-lg border transition-colors ${
                  outcome === "SETTLED"
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="outcome"
                  value="SETTLED"
                  checked={outcome === "SETTLED"}
                  onChange={() => setOutcome("SETTLED")}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Settled
                  </span>
                  <span className="text-sm text-gray-400 ml-2">
                    {" "}
                    proceed to close case
                  </span>
                </div>
              </label>

              {outcome === "SETTLED" && (
                <div className="ml-7 mt-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Terms of Settlement <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={settlementTerms}
                    onChange={(e) => setSettlementTerms(e.target.value)}
                    rows={5}
                    autoFocus
                    placeholder="Please enter the terms of settlement / napagkasunduan..."
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-800 placeholder:text-gray-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Ang mga ito ay ilalagay sa opisyal na rekord ng kasong ito.
                  </p>
                </div>
              )}

              {/* Not Settled */}
              <label
                className={`flex items-center gap-3 cursor-pointer px-4 py-3 rounded-lg border transition-colors ${
                  outcome === "NOT_SETTLED"
                    ? "border-gray-400 bg-gray-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="outcome"
                  value="NOT_SETTLED"
                  checked={outcome === "NOT_SETTLED"}
                  onChange={() => {
                    setOutcome("NOT_SETTLED");
                    setSettlementTerms("");
                  }}
                  className="w-4 h-4 text-gray-600 border-gray-300 focus:ring-gray-400"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Not Settled
                  </span>
                  <span className="text-sm text-gray-400 ml-2">
                    — schedule next hearing
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangleIcon className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-md text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              loading ||
              !outcome ||
              (outcome === "SETTLED" && !settlementTerms.trim())
            }
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Save Minutes
          </button>
        </div>
      </div>
    </div>
  );
}
