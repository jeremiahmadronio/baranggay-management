// Status label mapping utility
export const STATUS_LABELS: Record<string, string> = {
  CERTIFIED_TO_FILE_ACTION: 'Certified to File Action',
  SETTLED: 'Settled',
  CLOSED: 'Closed',
  ESCALATED: 'Escalated',
  ONGOING: 'Ongoing',
  WITHDRAWN: 'Withdrawn',
  DISMISSED: 'Dismissed',
  REPUDIATED: 'Repudiated',
}

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status
}

export function formatStatusForDisplay(status: string): string {
  // Convert database format to readable format
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
