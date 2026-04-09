interface BadgeProps {
  status: string
  className?: string
}
export function Badge({ status, className = '' }: BadgeProps) {
  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'postponed':
      case 'rescheduled':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'certified to file action':
        return 'bg-slate-50 text-slate-700 border-slate-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles(status)} ${className}`}
    >
      {status}
    </span>
  )
}
