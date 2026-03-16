import  { useState } from 'react'
import {
  X,
  Send,
  Info,
  ShieldCheck,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  FileTextIcon,
  UserIcon,
} from 'lucide-react'
import {
  recordHearingFollowUp,
  getHearingFullDetails,
  type HearingFullDetailsDTO,
  type FollowUpSummaryDTO,
} from '../../blotter-api/DocketView'
import { formatDateTime } from '../shared/utils'
interface Props {
  hearing: HearingFullDetailsDTO
  isViewOnly: boolean
  onClose: () => void
  onSave: (data: any) => void
}
export function HearingMinutesModal({
  hearing,
  isViewOnly,
  onClose,
  onSave,
}: Props) {
  const [notes, setNotes] = useState(hearing.minutes?.hearingNotes || '')
  const [outcome, setOutcome] = useState(hearing.minutes?.outcome || '')
  const [compPresent] = useState(hearing.minutes?.complainantPresent ?? true)
  const [respPresent] = useState(hearing.minutes?.respondentPresent ?? true)
  const [followUps, setFollowUps] = useState<FollowUpSummaryDTO[]>(
    hearing.followUps,
  )
  const [newFollowUp, setNewFollowUp] = useState('')
  const [savingFollowUp, setSavingFollowUp] = useState(false)
  const handlePostFollowUp = async () => {
    if (!newFollowUp.trim()) return
    setSavingFollowUp(true)
    try {
      await recordHearingFollowUp(hearing.hearingId, {
        notes: newFollowUp.trim(),
      })
      setNewFollowUp('')
      // toast.success('Follow-up posted successfully')
      const updated = await getHearingFullDetails(hearing.hearingId)
      setFollowUps(updated.followUps)
    } catch (err: any) {
      // toast.error(err.message || 'Failed to post follow-up')
    } finally {
      setSavingFollowUp(false)
    }
  }
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-bold text-gray-900">
                  Hearing Minutes — Patawag #{hearing.summonNumber}
                </h3>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${hearing.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  {hearing.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-400" /> {hearing.venue}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-400" />{' '}
                  {formatDateTime(
                    hearing.scheduledStart.split('T')[0],
                    hearing.scheduledStart.split('T')[1],
                  )}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 overflow-y-auto flex-1 space-y-6">
          {/* Outcome */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Hearing Outcome
              </p>
            </div>
            <div className="p-5">
              {isViewOnly ? (
                <div
                  className={`flex items-center gap-3 p-4 rounded-lg border-l-4 bg-gray-50 ${outcome === 'SETTLED' ? 'border-l-emerald-500' : outcome === 'NOT_SETTLED' ? 'border-l-red-400' : 'border-l-gray-300'}`}
                >
                  {outcome === 'SETTLED' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                    {outcome || 'PENDING'}
                  </span>
                </div>
              ) : (
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-200 bg-white font-bold text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 shadow-sm"
                >
                  <option value="">Select outcome...</option>
                  <option value="SETTLED">SETTLED</option>
                  <option value="NOT_SETTLED">NOT SETTLED</option>
                </select>
              )}
            </div>
          </div>

          {/* Initial Context */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
            <p className="text-xs font-bold text-blue-700 uppercase mb-2 flex items-center gap-1.5">
              <Info className="w-4 h-4" /> Initial Context
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {hearing.initialNotes || 'No initial notes provided.'}
            </p>
          </div>

          {/* Attendance */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5" /> Attendance
              </p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-gray-200">
              <div className="p-4 text-center">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">
                  Complainant
                </p>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${compPresent ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${compPresent ? 'bg-emerald-500' : 'bg-red-500'}`}
                  />
                  {compPresent ? 'Present' : 'Absent'}
                </span>
              </div>
              <div className="p-4 text-center">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">
                  Respondent
                </p>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${respPresent ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${respPresent ? 'bg-emerald-500' : 'bg-red-500'}`}
                  />
                  {respPresent ? 'Present' : 'Absent'}
                </span>
              </div>
            </div>
          </div>

          {/* Mediation Narrative */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                  <FileTextIcon className="w-3.5 h-3.5" /> Mediation Narrative
                </p>
                {hearing.minutes?.recordedBy && (
                  <span className="text-xs text-gray-400 font-medium">
                    Recorded by: {hearing.minutes.recordedBy}
                  </span>
                )}
              </div>
            </div>
            <div className="p-5">
              <textarea
                disabled={isViewOnly}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-700 disabled:border-gray-100 resize-none transition-all text-gray-900"
                rows={4}
                placeholder="Describe what transpired during the hearing..."
              />
            </div>
          </div>

          {/* Follow-up Records */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Follow-up Records ({followUps.length})
              </p>
            </div>
            <div className="p-5">
              {followUps.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No follow-up records yet.
                </p>
              ) : (
                <div className="space-y-3 mb-4">
                  {followUps.map((f) => (
                    <div
                      key={f.id}
                      className="bg-gray-50 border border-gray-100 rounded-lg p-4"
                    >
                      <p className="text-sm text-gray-800 leading-relaxed">
                        {f.remarks}
                      </p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                        <span className="font-bold text-blue-600 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" /> {f.recordedBy}
                        </span>
                        <span>•</span>
                        <span className="font-medium">
                          {formatDateTime(
                            f.createdAt.split('T')[0],
                            f.createdAt.split('T')[1],
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Add follow-up input */}
              <div className="relative">
                <textarea
                  value={newFollowUp}
                  onChange={(e) => setNewFollowUp(e.target.value)}
                  placeholder="Add a follow-up note..."
                  rows={2}
                  className="w-full pl-4 pr-12 py-3 text-sm border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all text-gray-900"
                />
                <button
                  onClick={handlePostFollowUp}
                  disabled={!newFollowUp.trim() || savingFollowUp}
                  className="absolute right-3 bottom-3 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-all shadow-sm"
                >
                  {savingFollowUp ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-gray-100 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold border border-gray-200 rounded-lg text-gray-600 bg-white hover:bg-gray-50 transition-colors"
          >
            {isViewOnly ? 'Close' : 'Cancel'}
          </button>
          {!isViewOnly && (
            <button
              onClick={() =>
                onSave({
                  notes,
                  outcome,
                  complainantPresent: compPresent,
                  respondentPresent: respPresent,
                })
              }
              disabled={!outcome || !notes.trim()}
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
            >
              Save Record
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
