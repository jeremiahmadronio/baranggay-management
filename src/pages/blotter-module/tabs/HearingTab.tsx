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
import type { HearingViewDTO } from "../../../service/blotter-api/blotter-api";
import { HEARING_STATUS_CONFIG, isTerminalStatus } from "../shared/StatusBadge";
import { SectionCard } from "../shared/SectionCard";
import { formatDate, formatTime } from "../shared/utils";
import { generatePaanyaya } from "../modal/GeneratePaanyaya";
import { updateHearingStatus } from "../../../service/blotter-api/blotter-api";
import { ActionModal } from "../../../reusable/SuccessModal";
import { ArchiveReasonModal } from "../../../hooks/archive-modal";
import {
  getHearingFullDetails,
  type HearingFullDetailsDTO,
} from "../../../lupong-tagapamayapa-api/LuponCaseManagement-view-api-v2";
import { HearingViewModal } from "../modal/HearingViewModal";

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
  onAddFollowUp,
  onRefresh,
}: HearingsTabProps) {
  const isUnderConciliation = caseStatus === "UNDER_CONCILIATION";
  const isTerminal = isTerminalStatus(caseStatus) || isUnderConciliation;
  const hasScheduledHearing = hearings.some((h) => h.status === "SCHEDULED");

  // ── View Minutes state ──
  const [viewingHearing, setViewingHearing] =
    useState<HearingFullDetailsDTO | null>(null);
  const [isFetchingMinutes, setIsFetchingMinutes] = useState<number | null>(
    null,
  );

  // ── Cancel state ──
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedHearingId, setSelectedHearingId] = useState<number | null>(
    null,
  );

  const isHearingInFuture = (dateStr: string, timeStr: string) => {
    return new Date(`${dateStr}T${timeStr}`) > new Date();
  };

  const handleViewMinutes = async (h: HearingViewDTO) => {
    setIsFetchingMinutes(h.hearingId);
    try {
      const full = await getHearingFullDetails(h.hearingId);
      setViewingHearing(full);
    } catch (err) {
      console.error("Error loading minutes:", err);
      alert("Failed to load hearing minutes.");
    } finally {
      setIsFetchingMinutes(null);
    }
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

  const handleConfirmCancel = async (reason: string) => {
    if (!selectedHearingId || !reason.trim()) return;
    try {
      await updateHearingStatus(selectedHearingId, "CANCELLED", reason);
      setShowSuccessModal(true);
      onRefresh?.();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Failed to cancel hearing",
      );
    }
  };

  const handleUpdateHearing = (h: HearingViewDTO) => {
    onUpdateHearing(h);
    onRefresh?.();
  };

  const handleAddFollowUp = (h: HearingViewDTO) => {
    onAddFollowUp(h);
    onRefresh?.();
  };

  return (
    <div className="space-y-3">
      {/* View Minutes Modal */}
      {viewingHearing && (
        <HearingViewModal
          hearing={viewingHearing}
          onClose={() => setViewingHearing(null)}
        />
      )}

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
          !isTerminal && !hasScheduledHearing ? (
            <button
              onClick={onScheduleHearing}
              disabled={!hasPermission}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <PlusIcon className="w-4 h-4" /> Schedule New Mediation
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
            {hearings
              .slice()
              .sort((a, b) => (b.hearingNumber ?? 0) - (a.hearingNumber ?? 0))
              .map((h) => {
                const isCompleted = h.status === "COMPLETED";
                const isCancelled = h.status === "CANCELLED";
                const isTimeLocked = isHearingInFuture(h.date, h.startTime);
                const isFetchingThis = isFetchingMinutes === h.hearingId;

                return (
                  <div
                    key={h.hearingId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/80 rounded-xl border border-gray-100 gap-4"
                  >
                    {/* Hearing Info */}
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-base font-bold text-gray-900">
                          Mediation {h.hearingNumber}
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-tight ${
                            h.status === "CANCELLED"
                              ? "bg-red-50 text-red-600 border border-red-200"
                              : h.status === "PENDING_MINUTES"
                                ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                : (HEARING_STATUS_CONFIG[h.status] ??
                                  "bg-gray-100 text-gray-600")
                          }`}
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

                    {/* Actions */}
                    <div className="flex items-center gap-3 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 flex-wrap">
                      {!isTerminal && !isCancelled && !isCompleted && (
                        <>
                          <button
                            onClick={() => handlePrintPaanyaya(h)}
                            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors"
                          >
                            <PrinterIcon className="w-3.5 h-3.5" /> Paanyaya
                          </button>
                          <div className="w-px h-4 bg-gray-200 hidden sm:block" />
                          <button
                            onClick={() => {
                              setSelectedHearingId(h.hearingId);
                              setShowCancelInput(true);
                            }}
                            disabled={!hasPermission}
                            className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 transition-colors disabled:opacity-40"
                          >
                            <XCircleIcon className="w-3.5 h-3.5" /> Cancel
                            Mediation
                          </button>
                          <div className="w-px h-4 bg-gray-200 hidden sm:block" />
                        </>
                      )}

                      {isCompleted ? (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleViewMinutes(h)}
                            disabled={isFetchingThis}
                            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-60"
                          >
                            {isFetchingThis ? (
                              <span className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            ) : null}
                            View Minutes{" "}
                            <ChevronRightIcon className="w-4 h-4" />
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
                                Record Minutes{" "}
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

      {/* Cancel Modal */}
      {showCancelInput && (
        <ArchiveReasonModal
          isOpen={showCancelInput}
          onClose={() => {
            setShowCancelInput(false);
            setSelectedHearingId(null);
          }}
          title="Cancel Mediation"
          subjectName={
            selectedHearingId ? `Hearing #${selectedHearingId}` : undefined
          }
          subjectLabel="mediation"
          submitLabel="Confirm Cancellation"
          placeholder="Enter cancellation reason here..."
          onSubmit={handleConfirmCancel}
        />
      )}

      <ActionModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Cancelled Successfully"
        type="success"
      >
        Mediation has been successfully <strong>CANCELLED</strong>. This hearing
        will no longer appear in the schedule.
      </ActionModal>
    </div>
  );
}
