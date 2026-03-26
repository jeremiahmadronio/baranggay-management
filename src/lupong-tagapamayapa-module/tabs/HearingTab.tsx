import { useState } from 'react'
import  { CalendarDaysIcon,
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  ShieldOffIcon,
  MessageSquarePlusIcon,
  EyeIcon,
  FileEditIcon,
  PrinterIcon,
  XCircleIcon,
} from 'lucide-react'
import { ActionModal } from '../../reusable/SuccessModal'
import { type HearingViewDTO } from '../../lupong-tagapamayapa-api/LuponCaseManagement-view-api-v2'
import { updateHearingStatus } from '../../blotter-api/HearingUpdate'
import { HEARING_STATUS_CONFIG, isTerminalStatus } from '../shared/StatusBadge'
import { SectionCard } from '../shared/SectionCard'
import { formatDate, formatTime } from '../lib/Utils'
import { generatePaanyaya } from '../modal/GeneratePaanyaya'

interface HearingsTabProps {
  hearings: HearingViewDTO[]
  hearingsLoading: boolean
  caseStatus: string
  hasPermission: boolean
  blotterNumber: string
  caseNumber: string
  natureOfComplaint: string
  complainantName: string
  respondentName: string
  onScheduleHearing: () => void
  onRecordMinutes: (h: HearingViewDTO) => void
  onViewMinutes: (h: HearingViewDTO) => void
  onAddFollowUp: (h: HearingViewDTO) => void
  onRefresh?: () => void
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
  onRecordMinutes,
  onViewMinutes,
  onAddFollowUp,
  onRefresh,
}: HearingsTabProps) {
  const isTerminal = isTerminalStatus(caseStatus)
  const isActiveCase =
    caseStatus === 'UNDER MEDIATION' || caseStatus === 'UNDER_CONCILIATION'

  // ── Cancel modal state ──
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [selectedHearingId, setSelectedHearingId] = useState<number | null>(null)
  const [cancelRemarks, setCancelRemarks] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cancelError, setCancelError] = useState('')

  const isHearingInFuture = (h: HearingViewDTO): boolean => {
    try {
      return new Date(`${h.date}T${h.startTime}`) > new Date()
    } catch {
      return false
    }
  }

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
    })
  }

  const openCancelModal = (hearingId: number) => {
    setSelectedHearingId(hearingId)
    setCancelRemarks('')
    setCancelError('')
    setShowCancelModal(true)
  }

  const closeCancelModal = () => {
    setShowCancelModal(false)
    setCancelRemarks('')
    setCancelError('')
    setSelectedHearingId(null)
  }

  const handleConfirmCancel = async () => {
    if (!selectedHearingId || !cancelRemarks.trim()) return
    setIsSubmitting(true)
    setCancelError('')
    try {
     await updateHearingStatus(selectedHearingId, 'CANCELLED', cancelRemarks.trim())
      
      closeCancelModal()
      setShowSuccessModal(true)
      onRefresh?.()
    } catch (err: unknown) {
      setCancelError(
        err instanceof Error ? err.message : 'Failed to cancel hearing.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-3">
      {!hasPermission && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          <ShieldOffIcon className="w-4 h-4 shrink-0" />
          <p>
            You do not have permission to manage hearings. Contact your
            administrator.
          </p>
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
              title={
                !hasPermission
                  ? 'You do not have permission to manage hearings'
                  : undefined
              }
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
              const isCompleted = h.status === 'COMPLETED'
              const isCancelled = h.status === 'CANCELLED'
              const isFuture = isHearingInFuture(h)
              const isScheduled =
                h.status === 'SCHEDULED' || h.status === 'PENDING_MINUTES'

              const displayAsCancelled = isScheduled && !isActiveCase
              const displayStatus = displayAsCancelled ? 'CANCELLED' : h.status

              return (
                <div
                  key={h.hearingId}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/80 rounded-xl border border-gray-100 gap-4 transition-opacity ${
                    isCancelled || displayAsCancelled ? 'opacity-60 grayscale' : ''
                  }`}
                >
                  {/* ── Hearing Info ── */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-base font-bold text-gray-900">
                        Hearing {h.hearingNumber}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-tight ${
                          HEARING_STATUS_CONFIG[displayStatus] ??
                          'bg-gray-100 text-gray-600'
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

                  {/* ── Action Buttons ── */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* Completed: View Minutes + Follow-up */}
                    {isCompleted && (
                      <>
                        <button
                          onClick={() => onViewMinutes(h)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <EyeIcon className="w-3.5 h-3.5" /> View Minutes
                        </button>
                        {!isTerminal && hasPermission && (
                          <button
                            onClick={() => onAddFollowUp(h)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-600 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
                          >
                            <MessageSquarePlusIcon className="w-3.5 h-3.5" />{' '}
                            Follow-up
                          </button>
                        )}
                      </>
                    )}

                    {/* Scheduled: Record Minutes */}
                    {isScheduled && !isTerminal && hasPermission && isActiveCase && (
                      <button
                        onClick={() => onRecordMinutes(h)}
                        disabled={isFuture}
                        title={
                          isFuture
                            ? 'Hearing has not started yet'
                            : 'Record hearing minutes'
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <FileEditIcon className="w-3.5 h-3.5" /> Update Hearing
                      </button>
                    )}

                    {isScheduled && !isTerminal && hasPermission && isActiveCase && !isCancelled && (
                      <button
                        onClick={() => openCancelModal(h.hearingId)}
                        title="Cancel this hearing"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <XCircleIcon className="w-3.5 h-3.5" /> Cancel Hearing
                      </button>
                    )}

                    {/* Print Paanyaya — always visible */}
                    <button
                      onClick={() => handlePrintPaanyaya(h)}
                      title="Print Paanyaya (Summon Letter)"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <PrinterIcon className="w-3.5 h-3.5" /> Paanyaya
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>

     
    {showCancelModal && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    role="dialog"
    aria-modal="true"
  >
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
      
      {/* ── Header ── */}
      <div className="flex items-center gap-2 mb-4 text-red-600">
        <XCircleIcon className="w-6 h-6" />
        <h3 className="text-xl font-bold">Cancel Mediation Hearing</h3>
      </div>

      {/* ── Description ── */}
      <p className="text-sm text-gray-600 mb-4 leading-relaxed">
        This will permanently mark the hearing as{' '}
        <span className="font-bold text-red-600">Cancelled</span>. 
        Please provide a reason below for future reference.
      </p>

      {/* ── Textarea Section ── */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Cancellation Reason <span className="text-red-500">*</span>
        </label>
        <textarea
          autoFocus
          rows={4}
          className="w-full p-3 text-sm bg-gray-50 border-2 border-gray-100 rounded-lg outline-none resize-none transition-all text-gray-800 placeholder:text-gray-400 focus:border-red-500 focus:bg-white h-32"
          placeholder="Provide a detailed reason for cancelling this hearing. This information will be recorded in the system for future reference."
          value={cancelRemarks}
          onChange={(e) => setCancelRemarks(e.target.value)}
          maxLength={200}
        />
        <p className="text-[11px] text-gray-400 text-right font-medium">
          {cancelRemarks.trim().length} / 200 characters
        </p>
      </div>

      {/* ── Error Message ── */}
      {cancelError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg mt-3">
          <XCircleIcon className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-700 font-medium">{cancelError}</p>
        </div>
      )}

      {/* ── Footer Actions ── */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={closeCancelModal}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-40"
        >
          Go Back
        </button>
        <button
          onClick={handleConfirmCancel}
          disabled={isSubmitting || !cancelRemarks.trim()}
          className="px-6 py-2 text-sm font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <XCircleIcon className="w-4 h-4" />
              Confirm Cancellation
            </>
          )}
        </button>
      </div>
    </div>
  </div>
)}

     
      <ActionModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Hearing Cancelled"
        type="success"
      >
        Hearing has been successfully marked as <span className="font-semibold text-red-600">CANCELLED</span>.
        This hearing will no longer be active in the system, and its status has been updated for future reference.
      </ActionModal>
    </div>
  )
}