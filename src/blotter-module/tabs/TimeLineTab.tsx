import { ClockIcon, CheckCircle2 } from 'lucide-react'
import type {
  BlotterDocketViewDTO,
  MediationProcessDTO,
  HearingViewDTO,
  CaseNoteViewDTO,
} from '../../blotter-api/DocketView'
import { SectionCard } from '../shared/SectionCard'
import { formatDate, formatTime } from '../shared/utils'
interface TimelineTabProps {
  docket: BlotterDocketViewDTO
  mediation: MediationProcessDTO | null
  hearings: HearingViewDTO[]
  notes: CaseNoteViewDTO[]
}
interface TimelineEvent {
  date: string
  fullDate: string
  title: string
  description: string
  isCompleted: boolean
  status: string
}
export function TimelineTab({
  docket,
  mediation,
  hearings,
  notes,
}: TimelineTabProps) {
  const events: TimelineEvent[] = []
  // 1. Case Filed
  events.push({
    date: docket.dateFiled,
    fullDate: `${docket.dateFiled}T00:00:00`,
    title: 'Case Filed',
    description: `Report officially recorded by ${docket.firstName} ${docket.lastName}`,
    isCompleted: true,
    status: 'COMPLETED',
  })
  // 2. Summon
  if (mediation?.stepSummonIssued) {
    events.push({
      date: mediation.caseReceivedDate ?? docket.dateFiled,
      fullDate: `${mediation.caseReceivedDate ?? docket.dateFiled}T00:00:01`,
      title: 'Summon Issued',
      description: mediation.summonStatus || 'Summon notice sent to respondent',
      isCompleted: true,
      status: 'COMPLETED',
    })
  }
  // 3. Hearings
  hearings.forEach((h) => {
    const timeRange = `${formatTime(h.startTime)} – ${formatTime(h.endTime)}`
    const isDone = h.status === 'COMPLETED'
    events.push({
      date: h.date,
      fullDate: `${h.date}T${h.startTime || '00:00:00'}`,
      title: `Hearing ${h.hearingNumber}`,
      description: isDone
        ? `Conducted at ${h.venue} (${timeRange})`
        : `Scheduled at ${h.venue} (${timeRange})`,
      isCompleted: isDone,
      status: h.status,
    })
  })
  // 4. Notes
  notes.forEach((n) => {
    events.push({
      date: n.createdAt.split('T')[0],
      fullDate: n.createdAt,
      title: 'Case Note Added',
      description: n.note,
      isCompleted: true,
      status: 'NOTE',
    })
  })
  // Sort: Newest to Oldest
  events.sort(
    (a, b) => new Date(b.fullDate).getTime() - new Date(a.fullDate).getTime(),
  )
  return (
    <SectionCard
      title="Case History & Timeline"
      icon={<ClockIcon className="w-4 h-4 text-gray-400" />}
    >
      {events.length === 0 ? (
        <div className="py-12 text-center text-gray-500 italic text-sm">
          No events recorded.
        </div>
      ) : (
        <div className="relative ml-3">
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />
          <div className="space-y-10">
            {events.map((event, idx) => (
              <div key={idx} className="relative pl-10">
                <div className="absolute left-0 top-0.5 bg-white">
                  {event.isCompleted ? (
                    <CheckCircle2 className="w-[22px] h-[22px] text-emerald-500 fill-white" />
                  ) : (
                    <div className="w-[22px] h-[22px] rounded-full border-2 border-blue-400 bg-white flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-500 mb-1">
                    {formatDate(event.date)}
                  </span>

                  <div className="flex items-center gap-2">
                    <h4
                      className={`text-base font-bold ${event.isCompleted ? 'text-gray-900' : 'text-blue-600'}`}
                    >
                      {event.title}
                    </h4>
                    {!event.isCompleted && (
                      <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full font-bold uppercase tracking-wider">
                        Upcoming
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-2 leading-relaxed bg-white p-4 rounded-xl border border-gray-200 max-w-2xl shadow-sm">
                    {event.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  )
}
