import { useState } from 'react'
import {
  XIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  AlertTriangleIcon,
  FileTextIcon,
} from 'lucide-react'
import type {
  HearingViewDTO,
  RecordMinutesRequest,
} from '../../blotter-api/DocketView'
import { recordHearingMinutes } from '../../blotter-api/DocketView'
import { formatDate, formatTime } from '../shared/utils'

interface RecordMinutesModalProps {
  hearing: HearingViewDTO
  caseNumber: string
  natureOfComplaint: string
  complainantName: string
  respondentName: string
  onSuccess: () => void
  onCancel: () => void
}

export function RecordMinutesModal({
  hearing,
  caseNumber,
  natureOfComplaint,
  complainantName,
  respondentName,
  onSuccess,
  onCancel,
}: RecordMinutesModalProps) {
  const [complainantPresent, setComplainantPresent] = useState(true)
  const [respondentPresent, setRespondentPresent] = useState(true)
  const [hearingNotes, setHearingNotes] = useState('')
  const [outcome, setOutcome] = useState<'SETTLED' | 'NOT_SETTLED' | ''>('')
  const [settlementTerms, setSettlementTerms] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!outcome) {
      setError('Please select an outcome.')
      return
    }
    if (outcome === 'SETTLED' && !settlementTerms.trim()) {
      setError('Please enter the terms of settlement / napagkasunduan.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const body: RecordMinutesRequest = {
        hearingId: hearing.hearingId,
        complainantPresent,
        respondentPresent,
        hearingNotes: hearingNotes || undefined,
        outcome,
        settlementTerms: outcome === 'SETTLED' ? settlementTerms.trim() : '',
      }
      await recordHearingMinutes(body)
      onSuccess()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to save minutes.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Record Hearing Minutes — Hearing {hearing.hearingNumber}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {caseNumber} · {natureOfComplaint}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">

          {/* ── Hearing info ── */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
              Hearing Information
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              <div>
                <p className="text-xs text-gray-500 mb-1 font-semibold">Summon</p>
                <p className="text-sm font-bold text-blue-600">
                  Summon {hearing.hearingNumber}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1 font-semibold">Date</p>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-blue-400" />
                  {formatDate(hearing.date)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1 font-semibold">Time</p>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                  <ClockIcon className="w-4 h-4 text-blue-400" />
                  {formatTime(hearing.startTime)} – {formatTime(hearing.endTime)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1 font-semibold">Venue</p>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                  <MapPinIcon className="w-4 h-4 text-blue-400" />
                  {hearing.venue}
                </p>
              </div>
            </div>
          </div>

          {/* ── 1. Attendance ── */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                1 — Attendance
              </p>
            </div>
            <div className="p-5 space-y-5 bg-white">
              {[
                {
                  label: 'Complainant',
                  name: complainantName,
                  value: complainantPresent,
                  set: setComplainantPresent,
                },
                {
                  label: 'Respondent',
                  name: respondentName,
                  value: respondentPresent,
                  set: setRespondentPresent,
                },
              ].map(({ label, name, value, set }) => (
                <div key={label} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{label}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{name}</p>
                  </div>
                  <div className="flex rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    <button
                      onClick={() => set(true)}
                      className={`px-5 py-2 text-xs font-bold transition-colors ${value ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => set(false)}
                      className={`px-5 py-2 text-xs font-bold transition-colors border-l border-gray-200 ${!value ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 2. Hearing Notes ── */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                2 — Hearing Notes
              </p>
            </div>
            <div className="p-5 bg-white">
              <textarea
                value={hearingNotes}
                onChange={(e) => setHearingNotes(e.target.value)}
                rows={4}
                placeholder="Brief summary of what transpired during the hearing..."
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none text-gray-900 shadow-sm"
              />
            </div>
          </div>

          {/* ── 3. Outcome ── */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                3 — Outcome
              </p>
            </div>
            <div className="p-5 space-y-3 bg-white">

              {/* Settled */}
              <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-colors group ${outcome === 'SETTLED' ? 'border-emerald-400 bg-emerald-50/40' : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/20'}`}>
                <input
                  type="radio"
                  name="outcome"
                  value="SETTLED"
                  checked={outcome === 'SETTLED'}
                  onChange={() => setOutcome('SETTLED')}
                  className="w-5 h-5 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-sm font-bold text-gray-900">Settled</span>
                  <span className="text-sm text-gray-500 ml-2">(proceed to close case)</span>
                </div>
              </label>

              {outcome === 'SETTLED' && (
                <div className="ml-8 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="border border-emerald-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-200 flex items-center gap-2">
                      <FileTextIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                         Terms of Settlement
                      </p>
                      <span className="ml-auto text-xs text-emerald-600 font-medium">Required</span>
                    </div>
                    <div className="p-4 bg-white">
                      <textarea
                        value={settlementTerms}
                        onChange={(e) => setSettlementTerms(e.target.value)}
                        rows={5}
                        autoFocus
                        placeholder={
                          `Agreement details...\n\n` 
                          
                        }
                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none text-gray-900 shadow-sm placeholder:text-gray-400"
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        Ang mga ito ay ilalagay sa opisyal na rekord ng kasong ito.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Not Settled */}
              <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-colors group ${outcome === 'NOT_SETTLED' ? 'border-red-300 bg-red-50/40' : 'border-gray-200 hover:border-red-200 hover:bg-red-50/20'}`}>
                <input
                  type="radio"
                  name="outcome"
                  value="NOT_SETTLED"
                  checked={outcome === 'NOT_SETTLED'}
                  onChange={() => {
                    setOutcome('NOT_SETTLED')
                    setSettlementTerms('') // clear terms if switched away
                  }}
                  className="w-5 h-5 text-red-500 border-gray-300 focus:ring-red-400"
                />
                <div>
                  <span className="text-sm font-bold text-gray-900">Not Settled</span>
                  <span className="text-sm text-gray-500 ml-2">(schedule next hearing)</span>
                </div>
              </label>

            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
              <AlertTriangleIcon className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm font-medium text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex justify-end gap-3 px-6 py-5 border-t border-gray-100 sticky bottom-0 bg-white">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-semibold border border-gray-200 rounded-lg text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !outcome || (outcome === 'SETTLED' && !settlementTerms.trim())}
            className="px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors shadow-sm"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Save Minutes
          </button>
        </div>

      </div>
    </div>
  )
}