import { Clock } from 'lucide-react'
import { Card } from './Card'
interface MediationProgressProps {
  daysRemaining: number
  totalDays: number
  dateFiled: string
  deadlineDate: string
}
export function MediationProgress({
  daysRemaining,
  totalDays,
  dateFiled,
  deadlineDate,
}: MediationProgressProps) {
  const progressPercentage = Math.max(
    0,
    Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100),
  )
  return (
    <Card className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 text-blue-700 font-medium text-sm">
          <Clock className="w-4 h-4" />
          <span>{totalDays}-Day Mediation Period</span>
        </div>
        <span className="text-blue-700 font-bold text-sm">
          {daysRemaining} days remaining
        </span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
          style={{
            width: `${progressPercentage}%`,
          }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-400">
        <span>Filed: {dateFiled}</span>
        <span>Deadline: {deadlineDate}</span>
      </div>
    </Card>
  )
}
