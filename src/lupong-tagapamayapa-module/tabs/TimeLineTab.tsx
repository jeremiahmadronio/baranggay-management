import { useEffect, useState } from 'react'
import { ClockIcon, CheckCircle2 } from 'lucide-react'
import { SectionCard } from '../shared/SectionCard'
import { formatDate } from '../../blotter-module/shared/utils'
import { getCaseTimeline, type CaseTimelineDTO } from '../../blotter-api/DocketView'

interface TimelineTabProps {
  blotterNumber: string
}

export function TimelineTab({ blotterNumber }: TimelineTabProps) {
  const [events, setEvents] = useState<CaseTimelineDTO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        setLoading(true)
        const data = await getCaseTimeline(blotterNumber)
        setEvents(data)
      } catch (error) {
        console.error("Failed to fetch timeline:", error)
      } finally {
        setLoading(false)
      }
    }

    if (blotterNumber) {
      fetchTimeline()
    }
  }, [blotterNumber])

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500 animate-pulse text-sm">
        Loading case history...
      </div>
    )
  }

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
            {events.map((event) => {
              // Logic check: Pag timeline record, usually completed na ang action
              const isCompleted = true 

              return (
                <div key={event.id} className="relative pl-10">
                  <div className="absolute left-0 top-0.5 bg-white">
                    {isCompleted ? (
                      <CheckCircle2 className="w-[22px] h-[22px] text-emerald-500 fill-white" />
                    ) : (
                      <div className="w-[22px] h-[22px] rounded-full border-2 border-blue-400 bg-white flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-500 mb-1">
                      {formatDate(event.eventDate.split('T')[0])}
                    </span>

                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-base font-bold ${isCompleted ? 'text-gray-900' : 'text-blue-600'}`}
                      >
                        {event.title}
                      </h4>
                      {!isCompleted && (
                        <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full font-bold uppercase tracking-wider">
                          Upcoming
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-2 leading-relaxed bg-white p-4 rounded-xl border border-gray-200 max-w-2xl shadow-sm">
                      {event.description}
                    </p>
                    
                    {/* Optional: Pwede mong ilagay dito kung sino ang gumawa */}
                    <span className="text-[10px] text-gray-400 mt-2 italic">
                      Recorded by: {event.performedBy}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </SectionCard>
  )
}