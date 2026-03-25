import  { useEffect, useState, useRef } from 'react'
import { X, Send, AlertCircle, ShieldOffIcon } from 'lucide-react'
import { recordHearingFollowUp } from '../../lupong-tagapamayapa-api/LuponCaseManagement-view-api-v2'
export interface FollowUpModalProps {
  hearingId: number
  caseNumber: string
  hasPermission: boolean
  onSuccess: () => void
  onClose: () => void
}
export function FollowUpModal({
  hearingId,
  caseNumber,
  hasPermission,
  onSuccess,
  onClose,
}: FollowUpModalProps) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (hasPermission) textAreaRef.current?.focus()
  }, [hasPermission])
  const handlePost = async () => {
    const trimmedText = text.trim()
    if (!trimmedText || !hasPermission) return
    setSaving(true)
    setError('')
    try {
      await recordHearingFollowUp(hearingId, {
        notes: trimmedText,
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save follow-up.')
    } finally {
      setSaving(false)
    }
  }
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 bg-white">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Hearing Follow-up
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Case:{' '}
              <span className="font-bold text-blue-600">{caseNumber}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Permission warning */}
          {!hasPermission && (
            <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              <ShieldOffIcon className="w-4 h-4 shrink-0" />
              <p>You do not have permission to add follow-up records.</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
              Notes / Remarks
            </label>
            <textarea
              ref={textAreaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                hasPermission
                  ? 'What happened? (e.g., Respondent promised to settle next week...)'
                  : 'You do not have permission to add follow-ups.'
              }
              rows={5}
              disabled={saving || !hasPermission}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none transition-all text-gray-900 shadow-sm disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
            />
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg shadow-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
          </div>

          <button
            onClick={handlePost}
            disabled={!text.trim() || saving || !hasPermission}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save Record'}
          </button>
        </div>
      </div>
    </div>
  )
}
