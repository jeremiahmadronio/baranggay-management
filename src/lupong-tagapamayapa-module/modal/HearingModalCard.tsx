import { ArrowRightIcon, CalendarIcon, ClockIcon } from 'lucide-react'
import {type HearingScheduleDTO } from '../../lupong-tagapamayapa-api/Hearing'
import { Badge } from '../ui/Badge'
interface UpcomingHearingsCardProps {
  hearings: HearingScheduleDTO[]
  onViewCalendar: () => void
}
export function UpcomingHearingsCard({
  hearings,
  onViewCalendar,
}: UpcomingHearingsCardProps) {
  const upcoming = hearings.slice(0, 5)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Upcoming Hearings
        </h2>
        <button
          onClick={onViewCalendar}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center transition-colors"
        >
          View All <ArrowRightIcon className="ml-1 h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {upcoming.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No upcoming hearings scheduled.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {upcoming.map((hearing) => (
              <li
                key={hearing.hearingId}
                className="p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                      <CalendarIcon className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {hearing.complainantName} vs {hearing.respondentName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {hearing.blotterNumber}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <Badge status={hearing.status} className="mb-2" />
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(hearing.scheduledStart)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center justify-end">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {formatTime(hearing.scheduledStart)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
