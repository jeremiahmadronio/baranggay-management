const STATUS_CONFIG: Record<
  string,
  {
    bg: string
    text: string
    dot: string
  }
> = {
  UNDER_MEDIATION: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  PENDING: {
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
  },
  ACTIVE: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  REFERRED_TO_LUPON: {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    dot: 'bg-violet-500',
  },
  CERTIFIED_TO_FILE_ACTION: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  EXPIRED_UNACTIONED: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    dot: 'bg-red-500',
  },
  SETTLED: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  DISMISSED: {
    bg: 'bg-gray-100',
    text: 'text-gray-500',
    dot: 'bg-gray-400',
  },
  MEDIATION: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  RESOLVED: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  UNSETTLED: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    dot: 'bg-red-500',
  },
  SUMMONED: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
}
export const TERMINAL_STATUSES = [
  'SETTLED',
  'DISMISSED',
  'CERTIFIED_TO_FILE_ACTION',
  'EXPIRED_UNACTIONED',
  'RESOLVED',
]
export function isTerminalStatus(status: string): boolean {
  return TERMINAL_STATUSES.includes(status)
}
interface StatusBadgeProps {
  status: string
}
export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
        aria-hidden="true"
      />
      {status.replace(/_/g, ' ')}
    </span>
  )
}
export const HEARING_STATUS_CONFIG: Record<string, string> = {
  SCHEDULED: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-red-50 text-red-600',
  ONGOING: 'bg-amber-50 text-amber-700',
}
