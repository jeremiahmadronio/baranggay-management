import  { useState } from 'react'
import { XIcon, RefreshCwIcon } from 'lucide-react'
const AVAILABLE_STATUSES = [
  {
    value: 'UNDER_MEDIATION',
    label: 'Under Mediation',
  },
  {
    value: 'EXPIRED_UNACTIONED',
    label: 'Expired / Unactioned',
  },
  {
    value: 'REFERRED_TO_LUPON',
    label: 'Referred to Lupon',
  },
  {
    value: 'CERTIFIED_TO_FILE_ACTION',
    label: 'Certified to File Action',
  },
  {
    value: 'DISMISSED',
    label: 'Dismissed',
  },
  {
    value: 'SETTLED',
    label: 'Settled',
  },
]
interface ChangeStatusModalProps {
  currentStatus: string
  loading: boolean
  onConfirm: (newStatus: string, reason: string) => void
  onCancel: () => void
}
export function ChangeStatusModal({
  currentStatus,
  loading,
  onConfirm,
  onCancel,
}: ChangeStatusModalProps) {
  const [newStatus, setNewStatus] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const filteredStatuses = AVAILABLE_STATUSES.filter(
    (s) => s.value !== currentStatus,
  )
  const handleSubmit = () => {
    if (!newStatus) {
      setError('Please select a new status.')
      return
    }
    if (!reason.trim()) {
      setError('Please provide a reason for the status change.')
      return
    }
    setError('')
    onConfirm(newStatus, reason.trim())
    // toast.success('Status updated successfully')
  }
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl">
              <RefreshCwIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Change Case Status
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Current: {currentStatus.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              New Status *
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900 shadow-sm"
            >
              <option value="">Select a status...</option>
              {filteredStatuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Provide a reason for this status change..."
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none text-gray-900 shadow-sm"
            />
          </div>

          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 px-6 py-5 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-semibold border border-gray-200 rounded-lg text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !newStatus || !reason.trim()}
            className="px-5 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors shadow-sm"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Update Status
          </button>
        </div>
      </div>
    </div>
  )
}
