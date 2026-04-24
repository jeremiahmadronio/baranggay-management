import { useState } from "react";
import {
  CalendarDaysIcon,
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
 
  MessageSquarePlusIcon,
  PrinterIcon,
  XCircleIcon,
  LockIcon,
  ChevronRightIcon,
} from "lucide-react";
import type { HearingViewDTO } from "../../../../service/blotter-api/DocketView";
import { HEARING_STATUS_CONFIG, isTerminalStatus } from "../shared/StatusBadge";
import { SectionCard } from "../shared/SectionCard";
import { formatDate, formatTime } from "../lib/Utils";
import { generatePaanyaya } from "../modal/GeneratePaanyaya";
import { updateHearingStatus } from "../../../../service/blotter-api/HearingUpdate";
import { ActionModal } from "../../../../reusable";
import { HearingViewModal } from "../modal/HearingViewModal";
import { RecordMinutesModal } from "../modal/RecordMinutesModal";
import { CircleLoader } from "../../../../hooks/LoadingStates";

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
  onAddFollowUp,
  onRefresh,
}: HearingsTabProps) {
  const isUnderConciliation = caseStatus === "UNDER_CONCILIATION";
  const isTerminal = isTerminalStatus(caseStatus);
  const hasScheduledHearing = hearings.some((h) => h.status === "SCHEDULED");

  const getDisplayStatus = (h: HearingViewDTO): string => {
    const status = String(h.status || "").toUpperCase();
    if (
      isTerminal &&
      (status === "SCHEDULED" || status === "PENDING_MINUTES")
    ) {
      return "CANCELLED";
    }
    return status;
  };

  // ── View Minutes state ──
  const [viewingHearingId, setViewingHearingId] = useState<number | null>(null);
  // ...existing code...

  // ── Record Minutes modal state ──
  const [showRecordMinutes, setShowRecordMinutes] = useState(false);
  const [selectedHearing, setSelectedHearing] = useState<HearingViewDTO | null>(
    null,
  );
  // ── Cancel modal state ──
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedHearingId, setSelectedHearingId] = useState<number | null>(
    null,
  );
  const [cancelRemarks, setCancelRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isHearingInFuture = (h: HearingViewDTO): boolean => {
    try {
      return new Date(`${h.date}T${h.startTime}`) > new Date();
    } catch {
      return false;
    }
  };

  const shouldShowViewMinutes = (h: HearingViewDTO): boolean => {
    // Keep minutes viewable for all completed hearings.
    return h.status === "COMPLETED";
  };

  const handleViewMinutes = (h: HearingViewDTO) => {
    setViewingHearingId(h.hearingId);
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

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setCancelRemarks("");

    setSelectedHearingId(null);
  };

  const handleConfirmCancel = async () => {
    if (!selectedHearingId || !cancelRemarks.trim()) return;
    setIsSubmitting(true);

    try {
      await updateHearingStatus(
        selectedHearingId,
        "CANCELLED",
        cancelRemarks.trim(),
      );
      closeCancelModal();
      setShowSuccessModal(true);
      onRefresh?.();
    } catch (err: unknown) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordMinutes = (h: HearingViewDTO) => {
    setSelectedHearing(h);
    setShowRecordMinutes(true);
  };

  const handleAddFollowUp = (h: HearingViewDTO) => {
    onAddFollowUp(h);
    onRefresh?.();
  };

  return (
    <div className="space-y-3">
      {/* ── View Minutes Modal ── */}
      {viewingHearingId !== null && (
        <HearingViewModal
          hearingId={viewingHearingId}
          onClose={() => setViewingHearingId(null)}
        />
      )}



      <SectionCard
        title="Conciliation Process"
        icon={<CalendarDaysIcon className="w-4 h-4 text-gray-400" />}
        action={
          hasPermission && (!isTerminal || isUnderConciliation) && !hasScheduledHearing ? (
            <button
              onClick={onScheduleHearing}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <PlusIcon className="w-4 h-4" /> Schedule New Conciliation
            </button>
          ) : undefined
        }
      >
        {/* Loading */}
        {hearingsLoading && (
          <div className="flex items-center justify-center py-10">
            <CircleLoader size="sm" />
          </div>
        )}

        {/* Empty */}
        {!hearingsLoading && hearings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-3">
            <CalendarDaysIcon className="w-8 h-8 text-gray-300" />
            <p className="text-sm">No Conciliation scheduled yet.</p>
          </div>
        )}

        {/* List */}
        {!hearingsLoading && hearings.length > 0 && (
          <div className="space-y-3">
            {hearings
              .slice()
              .sort((a, b) => (b.hearingNumber ?? 0) - (a.hearingNumber ?? 0))
              .map((h) => {
                const displayStatus = getDisplayStatus(h);
                const isCompleted = displayStatus === "COMPLETED";
                const isCancelled = displayStatus === "CANCELLED";
                const isScheduled =
                  displayStatus === "SCHEDULED" ||
                  displayStatus === "PENDING_MINUTES";
                const isFuture = isHearingInFuture(h);
                const isFetchingThis = false;

                return (
                  <div
                    key={h.hearingId}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/80 rounded-xl border border-gray-100 gap-4 transition-opacity ${isCancelled ? "opacity-60 grayscale" : ""}`}
                  >
                    {/* Hearing Info */}
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-base font-bold text-gray-900">
                          Conciliation {h.hearingNumber}
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-tight ${
                            displayStatus === "CANCELLED"
                              ? "bg-red-600 text-white border border-red-600"
                              : displayStatus === "PENDING_MINUTES"
                                ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                : (HEARING_STATUS_CONFIG[displayStatus] ??
                                  "bg-gray-100 text-gray-600")
                          }`}
                        >
                          {displayStatus}
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

                    {/* Actions - Print, Follow-up, View Minutes, Cancel (red text), Record Minutes (last) */}
                    <div className="flex items-center gap-3 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 flex-wrap">
                      {/* Print Paanyaya (always, not cancelled) */}
                      {!isCancelled && (
                        <button
                          onClick={() => handlePrintPaanyaya(h)}
                          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <PrinterIcon className="w-3.5 h-3.5" /> Paanyaya
                        </button>
                      )}

                      {/* Follow-up (completed, not terminal) */}
                      {isCompleted && !isTerminal && hasPermission && (
                        <button
                          onClick={() => handleAddFollowUp(h)}
                          disabled={!hasPermission}
                          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-40"
                        >
                          <MessageSquarePlusIcon className="w-3.5 h-3.5" />{" "}
                          Follow-up
                        </button>
                      )}

                      {/* View Minutes (completed) */}
                      {shouldShowViewMinutes(h) && (
                        <button
                          onClick={() => handleViewMinutes(h)}
                          disabled={isFetchingThis}
                          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-60"
                        >
                          {/* No loading spinner needed since modal fetches data */}
                          View Minutes <ChevronRightIcon className="w-4 h-4" />
                        </button>
                      )}

                      {/* Cancel Conciliation (red text only, before Record Minutes) */}
                      {isScheduled &&
                        !isTerminal &&
                        hasPermission &&
                        !isCancelled && (
                          <button
                            onClick={() => {
                              setSelectedHearingId(h.hearingId);
                              setShowCancelModal(true);
                            }}
                            disabled={!hasPermission}
                            className="flex items-center gap-1.5 text-[14px] font-medium text-red-600 hover:text-red-700 transition-colors disabled:opacity-40"
                          >
                            <XCircleIcon className="w-3.5 h-3.5" /> Cancel
                            Conciliation
                          </button>
                        )}

                      {/* Record Minutes / Scheduled lock (last/rightmost) */}
                      {isScheduled && !isTerminal && hasPermission && (
                        <button
                          disabled={isFuture || !hasPermission}
                          onClick={() => handleRecordMinutes(h)}
                          className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                            isFuture || !hasPermission
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-blue-600 hover:text-blue-700"
                          }`}
                        >
                          {isFuture ? (
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
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </SectionCard>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 mb-4 text-red-600">
              <XCircleIcon className="w-6 h-6" />
              <h3 className="text-xl font-bold">Cancel Conciliation </h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for cancelling this conciliation. This
              will be recorded in the system for future reference.
            </p>
            <textarea
              autoFocus
              className="w-full p-3 border-2 border-gray-100 rounded-lg text-sm focus:border-red-500 outline-none resize-none h-32 transition-all"
              placeholder="Enter cancellation reason here..."
              value={cancelRemarks}
              onChange={(e) => {
                const words = e.target.value.split(/\s+/).filter(Boolean);
                if (words.length <= 250) {
                  setCancelRemarks(e.target.value);
                } else {
                  setCancelRemarks(words.slice(0, 250).join(" "));
                }
              }}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-400">
                {cancelRemarks.trim().split(/\s+/).filter(Boolean).length} / 250
                words
              </span>
              {cancelRemarks.trim().split(/\s+/).filter(Boolean).length >=
                250 && (
                <span className="text-xs text-red-500 font-semibold">
                  Word limit reached
                </span>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                disabled={isSubmitting}
                onClick={() => {
                  setShowCancelModal(false);
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
                {isSubmitting ? (
                  <>
                    <CircleLoader size="sm" tone="light" /> Processing...
                  </>
                ) : (
                  "Confirm Cancellation"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Success Modal ── */}
      <ActionModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Conciliation Cancelled"
        type="success"
      >
        Conciliation has been successfully marked as{" "}
        <span className="font-semibold text-red-600">CANCELLED</span>. This
        hearing will no longer be active in the schedule.
      </ActionModal>
      {/* ── Record Minutes Modal ── */}
      {showRecordMinutes && selectedHearing && (
        <RecordMinutesModal
          hearingId={selectedHearing.hearingId}
          onSuccess={() => {
            setShowRecordMinutes(false);
            setSelectedHearing(null);
            onRefresh?.();
          }}
          onCancel={() => {
            setShowRecordMinutes(false);
            setSelectedHearing(null);
          }}
        />
      )}
    </div>
  );
}
