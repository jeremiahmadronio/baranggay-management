export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatTime(timeStr?: string | null): string {
  if (!timeStr) return '—'
  const [hrs, mins] = timeStr.split(':')
  if (!hrs || !mins) return timeStr
  const h = parseInt(hrs, 10)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${mins} ${ampm}`
}

export function formatDateTime(
  dateStr?: string | null,
  timeStr?: string | null,
): string {
  if (!dateStr) return '—'
  const d = formatDate(dateStr)
  if (!timeStr) return d
  return `${d} at ${formatTime(timeStr)}`
}
