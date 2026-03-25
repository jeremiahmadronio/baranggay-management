import { useState } from 'react'
import { XIcon, CalendarClockIcon } from 'lucide-react'
import { formatDate } from '../lib/Utils'
interface ExtendMediationModalProps {
  currentDeadline: string
  loading: boolean
  onConfirm: (reason: string) => void
  onCancel: () => void
}
export function ExtendMediationModal({
  currentDeadline,
  loading,
  onConfirm,
  onCancel,
}: ExtendMediationModalProps) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-full">
                <CalendarClockIcon className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Extend Mediation Period
              </h3>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mb-5">
            <p className="text-xs text-gray-500 mb-1">Current Deadline</p>
            <p className="text-sm font-bold text-gray-900">
              {formatDate(currentDeadline)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Extending will add 15 days to the current deadline. This can only
              be done once.
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-700 mb-2">
              Reason for Extension *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="State the reason why extension is needed..."
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(reason)}
              disabled={loading || !reason.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Confirm Extension
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
