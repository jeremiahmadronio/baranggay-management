import { useState } from "react";
import {
  CalendarDaysIcon,
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  ChevronRightIcon,
  LockIcon,
  MessageSquarePlus,
  ShieldOffIcon,
  PrinterIcon,
  XCircleIcon,
} from "lucide-react";
import type { HearingViewDTO } from "../../blotter-api/DocketView";
import { HEARING_STATUS_CONFIG, isTerminalStatus } from "../shared/StatusBadge";
import { SectionCard } from "../shared/SectionCard";
import { formatDate, formatTime } from "../shared/utils";
import { generatePaanyaya } from "../modal/GeneratePaanyaya";
import { updateHearingStatus } from "../../blotter-api/HearingUpdate";
import { ActionModal } from "../../reusable/SuccessModal";

interface HearingsTabProps {
  hearings: HearingViewDTO[];
  hearingsLoading: boolean;
  caseStatus: string;
  hasPermission: boolean;
  blotterNumber: string;
  caseNumber: string;
  natureOfComplaint: string;
  complainantName: string;
  respondentName: string;
  onScheduleHearing: () => void;
  onUpdateHearing: (hearing: HearingViewDTO) => void;
  onAddFollowUp: (hearing: HearingViewDTO) => void;
  onViewMinutes: (hearing: HearingViewDTO) => void;
  onRefresh?: () => void;
}

export function HearingsTab({
  hearings,
  hearingsLoading,
  caseStatus,
  hasPermission,
  blotterNumber,
  caseNumber,
  natureOfComplaint,
  complainantName,
  respondentName,
  onScheduleHearing,
  onUpdateHearing,
  onViewMinutes,
  onAddFollowUp,
  onRefresh,
}: HearingsTabProps) {
  const isUnderConciliation = caseStatus === "UNDER_CONCILIATION";
  const isTerminal = isTerminalStatus(caseStatus) || isUnderConciliation;

  // --- Modal States ---
  const [showCancelInput, setShowCancelInput] = useState(false); // Modal para sa reason
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Success Modal
  const [selectedHearingId, setSelectedHearingId] = useState<number | null>(
    null,
  );
  const [cancelRemarks, setCancelRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isHearingInFuture = (dateStr: string, timeStr: string) => {
    const scheduledDateTime = new Date(`${dateStr}T${timeStr}`);
    return scheduledDateTime > new Date();
  };

  const handlePrintPaanyaya = (h: HearingViewDTO) => {
    generatePaanyaya({
      blotterNumber,
      caseNumber,
      natureOfComplaint,
      complainantName,
      respondentName,
      hearingNumber: h.hearingNumber,
      date: h.date,
      startTime: h.startTime,
      endTime: h.endTime,
      venue: h.venue,
    });
  };

  // --- Handle Cancellation Logic ---
  const handleConfirmCancel = async () => {
    if (!selectedHearingId || !cancelRemarks.trim()) return;

    setIsSubmitting(true);
    try {
      await updateHearingStatus(selectedHearingId, "CANCELLED", cancelRemarks);
      setShowCancelInput(false);
      setCancelRemarks("");

      // I-trigger ang success modal
      setShowSuccessModal(true);

      // Automatic update ng UI
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Failed to cancel hearing",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateHearing = (h: HearingViewDTO) => {
    onUpdateHearing(h);
    if (onRefresh) onRefresh();
  };
  const handleAddFollowUp = (h: HearingViewDTO) => {
    onAddFollowUp(h);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="space-y-3">
      {!hasPermission && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          <ShieldOffIcon className="w-4 h-4 shrink-0" />
          <p>You do not have permission to manage hearings.</p>
        </div>
      )}

      <SectionCard
        title="Mediation Hearings"
        icon={<CalendarDaysIcon className="w-4 h-4 text-gray-400" />}
        action={
          !isTerminal ? (
            <button
              onClick={onScheduleHearing}
              disabled={!hasPermission}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <PlusIcon className="w-4 h-4" /> Schedule New Hearing
            </button>
          ) : undefined
        }
      >
        {hearingsLoading && (
          <div className="flex items-center justify-center py-10">
            <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!hearingsLoading && hearings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-3">
            <CalendarDaysIcon className="w-8 h-8 text-gray-300" />
            <p className="text-sm">No hearings scheduled yet.</p>
          </div>
        )}

        {!hearingsLoading && hearings.length > 0 && (
          <div className="space-y-3">
            {hearings.map((h) => {
              const isCompleted = h.status === "COMPLETED";
              const isCancelled = h.status === "CANCELLED";
              const isTimeLocked = isHearingInFuture(h.date, h.startTime);

              return (
                <div
                  key={h.hearingId}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/80 rounded-xl border border-gray-100 gap-4 ${isCancelled ? "opacity-60 grayscale" : ""}`}
                >
                  {/* Hearing Info Section */}
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-base font-bold text-gray-900">
                        Hearing {h.hearingNumber}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-tight ${HEARING_STATUS_CONFIG[h.status] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {h.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
                        {formatDate(h.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5 text-blue-400" />
                        {formatTime(h.startTime)} – {formatTime(h.endTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPinIcon className="w-3.5 h-3.5 text-blue-400" />
                        {h.venue}
                      </span>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="flex items-center gap-3 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 flex-wrap">
                    {!isTerminal && !isCancelled && (
                      <>
                        <button
                          onClick={() => handlePrintPaanyaya(h)}
                          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <PrinterIcon className="w-3.5 h-3.5" /> Paanyaya
                        </button>

                        <div className="w-px h-4 bg-gray-200 hidden sm:block" />

                        {/* CANCEL BUTTON */}
                        <button
                          onClick={() => {
                            setSelectedHearingId(h.hearingId);
                            setShowCancelInput(true);
                          }}
                          disabled={!hasPermission}
                          className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 transition-colors disabled:opacity-40"
                        >
                          <XCircleIcon className="w-3.5 h-3.5" /> Cancel Hearing
                        </button>

                        <div className="w-px h-4 bg-gray-200 hidden sm:block" />
                      </>
                    )}

                    {isCompleted ? (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onViewMinutes(h)}
                          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          View Minutes <ChevronRightIcon className="w-4 h-4" />
                        </button>
                        {!isTerminal && (
                          <>
                            <div className="w-px h-4 bg-gray-300 hidden sm:block" />
                            <button
                              onClick={() => handleAddFollowUp(h)}
                              disabled={!hasPermission}
                              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-40"
                            >
                              <MessageSquarePlus className="w-3.5 h-3.5" />{" "}
                              Follow-up
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      !isTerminal &&
                      !isCancelled && (
                        <button
                          disabled={isTimeLocked || !hasPermission}
                          onClick={() => handleUpdateHearing(h)}
                          className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                            isTimeLocked || !hasPermission
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-blue-600 hover:text-blue-700"
                          }`}
                        >
                          {isTimeLocked ? (
                            <>
                              <LockIcon className="w-3.5 h-3.5" /> Scheduled
                            </>
                          ) : (
                            <>
                              Update Hearing{" "}
                              <ChevronRightIcon className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* --- MODAL 1: Reason Input (Danger Type Visuals) --- */}
      {showCancelInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 mb-4 text-red-600">
              <XCircleIcon className="w-6 h-6" />
              <h3 className="text-xl font-bold">Cancel Mediation Hearing</h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for cancelling this hearing. This will be recorded in the system for future reference.
            </p>

            <textarea
              autoFocus
              className="w-full p-3 border-2 border-gray-100 rounded-lg text-sm focus:border-red-500 outline-none resize-none h-32 transition-all"
              placeholder="Enter cancellation reason here..."
              value={cancelRemarks}
              onChange={(e) => setCancelRemarks(e.target.value)}
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                disabled={isSubmitting}
                onClick={() => {
                  setShowCancelInput(false);
                  setCancelRemarks("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800"
              >
                Go Back
              </button>
              <button
                disabled={isSubmitting || !cancelRemarks.trim()}
                onClick={handleConfirmCancel}
                className="px-6 py-2 text-sm font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? "Processing..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: Success Notification (Using your ActionModal) --- */}
      <ActionModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Cancelled Successfully"
        type="success"
      >
        Ang hearing status ay matagumpay na nailagay sa{" "}
        <strong>CANCELLED</strong>. Ang schedule na ito ay hindi na aktibo sa
        system.
      </ActionModal>
    </div>
  );
}
