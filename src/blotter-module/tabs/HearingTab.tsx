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
} from 'lucide-react'
import type { HearingViewDTO } from '../../blotter-api/DocketView'
import { HEARING_STATUS_CONFIG, isTerminalStatus } from '../shared/StatusBadge'
import { SectionCard } from '../shared/SectionCard'
import { formatDate, formatTime } from '../shared/utils'

interface HearingsTabProps {
  hearings: HearingViewDTO[]
  hearingsLoading: boolean
  caseStatus: string
  hasPermission: boolean // "Manage Hearings & Mediation"
  onScheduleHearing: () => void
  onUpdateHearing: (hearing: HearingViewDTO) => void
  onAddFollowUp: (hearing: HearingViewDTO) => void
  onViewMinutes: (hearing: HearingViewDTO) => void
}

export function HearingsTab({
  hearings,
  hearingsLoading,
  caseStatus,
  hasPermission,
  onScheduleHearing,
  onUpdateHearing,
  onViewMinutes,
  onAddFollowUp,
}: HearingsTabProps) {
  const isTerminal = isTerminalStatus(caseStatus)
  const isHearingInFuture = (dateStr: string, timeStr: string) => {
    const scheduledDateTime = new Date(`${dateStr}T${timeStr}`)
    return scheduledDateTime > new Date()
  }

  return (
    <div className="space-y-3">
      {/* Permission warning banner */}
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
              const isTimeLocked = isHearingInFuture(h.date, h.startTime)

              return (
                <div
                  key={h.hearingId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/80 rounded-xl border border-gray-100 gap-4"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-base font-bold text-gray-900">
                        Hearing {h.hearingNumber}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-tight ${HEARING_STATUS_CONFIG[h.status] ?? 'bg-gray-100 text-gray-600'}`}
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

                  <div className="flex items-center gap-4 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                    {isCompleted ? (
                      <div className="flex items-center gap-4">
                        {/* View Minutes — always visible, read-only is fine */}
                        <button
                          onClick={() => onViewMinutes(h)}
                          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          View Minutes <ChevronRightIcon className="w-4 h-4" />
                        </button>

                        <div className="w-px h-4 bg-gray-300 hidden sm:block" />

                        {/* Follow-up — needs permission */}
                        <button
                          onClick={() => onAddFollowUp(h)}
                          disabled={!hasPermission}
                          title={
                            !hasPermission
                              ? 'You do not have permission to manage hearings'
                              : undefined
                          }
                          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <MessageSquarePlus className="w-3.5 h-3.5" />{' '}
                          Follow-up
                        </button>
                      </div>
                    ) : (
                      !isTerminal && (
                        <button
                          disabled={isTimeLocked || !hasPermission}
                          onClick={() => onUpdateHearing(h)}
                          title={
                            !hasPermission
                              ? 'You do not have permission to manage hearings'
                              : isTimeLocked
                              ? 'Cannot update until scheduled time arrives'
                              : undefined
                          }
                          className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                            isTimeLocked || !hasPermission
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-blue-600 hover:text-blue-700'
                          }`}
                        >
                          {isTimeLocked ? (
                            <>
                              <LockIcon className="w-3.5 h-3.5" /> Scheduled
                            </>
                          ) : (
                            <>
                              Update Hearing{' '}
                              <ChevronRightIcon className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      )
                    )}
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