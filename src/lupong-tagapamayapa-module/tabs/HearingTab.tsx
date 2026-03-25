import {
  CalendarDaysIcon,
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  ShieldOffIcon,
  
  MessageSquarePlusIcon,
  EyeIcon,
  FileEditIcon,
  PrinterIcon,
} from 'lucide-react'
import {type HearingViewDTO } from '../../lupong-tagapamayapa-api/LuponCaseManagement-view-api-v2'
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
}: HearingsTabProps) {
  const isTerminal = isTerminalStatus(caseStatus)
  const isActiveCase =
    caseStatus === 'UNDER MEDIATION' || caseStatus === 'UNDER_CONCILIATION'

  const isHearingInFuture = (h: HearingViewDTO): boolean => {
    try {
      const hearingDate = new Date(`${h.date}T${h.startTime}`)
      return hearingDate > new Date()
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
              const isFuture = isHearingInFuture(h)
              const isScheduled = h.status === 'SCHEDULED' || h.status === 'PENDING_MINUTES'
              // Display SCHEDULED hearings as CANCELLED when case is no longer active
              const displayAsCancelled = isScheduled && !isActiveCase
              const displayStatus = displayAsCancelled ? 'CANCELLED' : h.status
              return (
                <div
                  key={h.hearingId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/80 rounded-xl border border-gray-100 gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-base font-bold text-gray-900">
                        Hearing {h.hearingNumber}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-tight ${HEARING_STATUS_CONFIG[displayStatus] ?? 'bg-gray-100 text-gray-600'}`}
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

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* Completed hearing: View Minutes + Follow-up */}
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

                    {/* Scheduled hearing: Record Minutes (only if case is active and not in future) */}
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

                    {/* Print Paanyaya for all hearings */}
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
    </div>
  )
}