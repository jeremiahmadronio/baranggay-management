import { useState, useEffect } from "react";
import {
  XIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  AlertTriangleIcon,
} from "lucide-react";
import type {
  RecordMinutesRequest,
  PangkatAttendanceDTO,
  HearingMinutesViewingRequestDTO,
} from "../../lupong-tagapamayapa-api/LuponCaseManagement-view-api-v2";
import {
  recordHearingMinutes,
  getMediationHearingView,
} from "../../lupong-tagapamayapa-api/LuponCaseManagement-view-api-v2";

interface Props {
  hearingId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function RecordMinutesModal({ hearingId, onSuccess, onCancel }: Props) {
  const [hearingData, setHearingData] =
    useState<HearingMinutesViewingRequestDTO | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Attendance states
  const [complainantPresent, setComplainantPresent] = useState(true);
  const [respondentPresent, setRespondentPresent] = useState(true);
  const [pangkatMap, setPangkatMap] = useState<Map<number, boolean>>(new Map());

  // Form states
  const [hearingNotes, setHearingNotes] = useState("");
  const [outcome, setOutcome] = useState<"SETTLED" | "NOT_SETTLED" | "">("");
  const [settlementTerms, setSettlementTerms] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Derived: check if any pangkat member is absent ──
  const hasAbsentPangkat = Array.from(pangkatMap.values()).some((v) => !v);

  // ── Fetch Data & Initialize Map ──
  useEffect(() => {
    getMediationHearingView(hearingId)
      .then((data: HearingMinutesViewingRequestDTO) => {
        setHearingData(data);
        const map = new Map<number, boolean>();
        if (data.assignedPangkat) {
          data.assignedPangkat.forEach((m) => map.set(m.memberId, true));
        }
        setPangkatMap(map);
      })
      .catch((err) => setError(err.message))
      .finally(() => setFetchLoading(false));
  }, [hearingId]);

  // ── Reset outcome to NOT_SETTLED if Settled becomes disabled ──
  useEffect(() => {
    if (hasAbsentPangkat && outcome === "SETTLED") {
      setOutcome("NOT_SETTLED");
      setSettlementTerms("");
    }
  }, [hasAbsentPangkat]);

  const togglePangkat = (id: number) => {
    setPangkatMap((prev) => {
      const m = new Map(prev);
      m.set(id, !m.get(id));
      return m;
    });
  };

  const handleSubmit = async () => {
    if (!outcome) {
      setError("Please select an outcome.");
      return;
    }
    if (outcome === "SETTLED" && !settlementTerms.trim()) {
      setError("Please enter terms of settlement.");
      return;
    }

    setLoading(true);
    try {
      const pangkatAttendance: PangkatAttendanceDTO[] = Array.from(
        pangkatMap.entries(),
      ).map(([pangkatMemberId, isPresent]) => ({ pangkatMemberId, isPresent }));

      const body: RecordMinutesRequest = {
        complainantPresent,
        respondentPresent,
        hearingNotes: hearingNotes.trim(),
        outcome,
        settlementTerms:
          outcome === "SETTLED" ? settlementTerms.trim() : undefined,
        pangkatAttendance,
      };

      await recordHearingMinutes(hearingId, body);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Record Conciliation Minutes — Mediation{" "}
              {hearingData?.hearingNumber}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {hearingData?.caseNumber} · {hearingData?.caseTitle}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Info Card */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Mediation Information
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Date</p>
                <p className="text-sm text-gray-700 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />{" "}
                  {hearingData?.date}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Time</p>
                <p className="text-sm text-gray-700 flex items-center gap-1.5">
                  <ClockIcon className="w-3.5 h-3.5 text-gray-400" />{" "}
                  {hearingData?.startTime} - {hearingData?.endTime}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Venue</p>
                <p className="text-sm text-gray-700 flex items-center gap-1.5">
                  <MapPinIcon className="w-3.5 h-3.5 text-gray-400" />{" "}
                  {hearingData?.venue}
                </p>
              </div>
            </div>
          </div>

          {/* 1. Parties Attendance */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              1 Attendance
            </p>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              {[
                {
                  label: "Complainant",
                  value: complainantPresent,
                  set: setComplainantPresent,
                },
                {
                  label: "Respondent",
                  value: respondentPresent,
                  set: setRespondentPresent,
                },
              ].map((p) => (
                <div
                  key={p.label}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <p className="text-sm font-medium text-gray-800">{p.label}</p>
                  <div className="flex rounded-md overflow-hidden border border-gray-200">
                    <button
                      onClick={() => p.set(true)}
                      className={`px-4 py-1.5 text-xs font-medium ${p.value ? "bg-blue-600 text-white" : "bg-white text-gray-500"}`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => p.set(false)}
                      className={`px-4 py-1.5 text-xs font-medium border-l border-red-200 ${!p.value ? "bg-red-600 text-white" : "bg-white text-gray-500"}`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Pangkat Attendance */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              2 Pangkat Attendance
            </p>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              {hearingData?.assignedPangkat?.map((member) => {
                const isPresent = pangkatMap.get(member.memberId) ?? true;
                return (
                  <div
                    key={member.memberId}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {member.fullName}
                      </p>
                      <p className="text-xs text-gray-500">{member.position}</p>
                    </div>
                    <div className="flex rounded-md overflow-hidden border border-gray-200">
                      <button
                        onClick={() => togglePangkat(member.memberId)}
                        className={`px-4 py-1.5 text-xs font-medium ${isPresent ? "bg-blue-600 text-white" : "bg-white text-gray-500"}`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => togglePangkat(member.memberId)}
                        className={`px-4 py-1.5 text-xs font-medium border-l border-gray-200 ${!isPresent ? "bg-red-600 text-white" : "bg-white text-gray-500"}`}
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Pangkat Attendance Summary */}
            {hearingData &&
              Array.isArray(hearingData.assignedPangkat) &&
              hearingData.assignedPangkat.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {hearingData.assignedPangkat.map((member) => {
                    const isPresent = pangkatMap.get(member.memberId) ?? true;
                    return (
                      <span
                        key={member.memberId}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${isPresent ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}
                      >
                        {member.fullName}: {isPresent ? "Present" : "Absent"}
                      </span>
                    );
                  })}
                </div>
              )}
            {/* Note below Pangkat Attendance */}
            <div className="mt-3 text-xs text-blue-500 italic">
              <strong>Note:</strong> All Pangkat members must be marked as{" "}
              <span className="font-semibold text-emerald-700">Present</span> to
              allow the hearing to be marked as{" "}
              <span className="font-semibold text-blue-700">Settled</span>.
            </div>
          </div>

          {/* 3. Hearing Notes */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              3 Hearing Notes
            </p>
            <textarea
              value={hearingNotes}
              maxLength={3000}
              onChange={(e) => setHearingNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Summary of the hearing..."
            />
            <p className="text-xs text-gray-400">{hearingNotes.length}/3000</p>
          </div>

          {/* 4. Outcome */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              4 Outcome
            </p>

            {/* Warning if any pangkat member is absent */}
            {hasAbsentPangkat && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-center gap-2">
                  <AlertTriangleIcon className="w-4 h-4 shrink-0" />
                <span>
                  Settlement cannot be selected because at least one Pangkat member is marked as absent. Please update the attendance to enable settlement as an outcome.
                </span>
              </div>
            )}

            <div className="space-y-2">
              {/* Settled — disabled when any pangkat member is absent */}
              <label
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
                  hasAbsentPangkat
                    ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                    : outcome === "SETTLED"
                      ? "border-blue-300 bg-blue-50 cursor-pointer"
                      : "border-gray-200 cursor-pointer"
                }`}
              >
                <input
                  type="radio"
                  checked={outcome === "SETTLED"}
                  onChange={() => setOutcome("SETTLED")}
                  disabled={hasAbsentPangkat}
                  className="w-4 h-4 text-blue-600 disabled:cursor-not-allowed"
                />
                <span className="text-sm font-medium">Settled</span>
              </label>

              {outcome === "SETTLED" && !hasAbsentPangkat && (
                <textarea
                  value={settlementTerms}
                  onChange={(e) => setSettlementTerms(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg ml-7 w-[calc(100%-28px)]"
                  placeholder="Terms of settlement..."
                />
              )}

              <label
                className={`flex items-center gap-3 cursor-pointer px-4 py-3 rounded-lg border ${outcome === "NOT_SETTLED" ? "border-gray-400 bg-gray-50" : "border-gray-200"}`}
              >
                <input
                  type="radio"
                  checked={outcome === "NOT_SETTLED"}
                  onChange={() => {
                    setOutcome("NOT_SETTLED");
                    setSettlementTerms("");
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Not Settled</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
              <AlertTriangleIcon className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-white">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md disabled:opacity-50 transition-colors"
          >
            {loading ? "Saving..." : "Save Minutes"}
          </button>
        </div>
      </div>
    </div>
  );
}
