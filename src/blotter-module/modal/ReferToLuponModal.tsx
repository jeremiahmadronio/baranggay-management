import { useState } from 'react'
import { XIcon, UsersIcon, AlertTriangleIcon } from 'lucide-react'

export interface PangkatMember {
  firstName: string
  lastName: string
  position: string
}

interface ReferToLuponModalProps {
  blotterNumber: string
  complainantName: string
  loading: boolean
  onConfirm: (members: PangkatMember[]) => void
  onCancel: () => void
}

const POSITIONS = ['Chairman', 'Member', 'Secretary']

const DEFAULT_MEMBERS: PangkatMember[] = [
  { firstName: '', lastName: '', position: 'Chairman' },
  { firstName: '', lastName: '', position: 'Member' },
  { firstName: '', lastName: '', position: 'Member' },
]

export function ReferToLuponModal({
  blotterNumber,
  complainantName,
  loading,
  onConfirm,
  onCancel,
}: ReferToLuponModalProps) {
  const [members, setMembers] = useState<PangkatMember[]>(DEFAULT_MEMBERS)
  const [error, setError] = useState('')

  const updateMember = (index: number, field: keyof PangkatMember, value: string) => {
    setMembers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    )
    if (error) setError('')
  }

  const handleSubmit = () => {
    const incomplete = members.some((m) => !m.firstName.trim() || !m.lastName.trim())
    if (incomplete) {
      setError('Please fill in all member names.')
      return
    }
    const chairmanCount = members.filter((m) => m.position === 'Chairman').length
    if (chairmanCount !== 1) {
      setError('There must be exactly one Chairman.')
      return
    }
    setError('')
    onConfirm(members)
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden">

        {/* ── Header ── */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Refer to Lupong Tagapamayapa
                </h3>
                <p className="text-sm text-gray-400 mt-0.5">
                  {blotterNumber} · {complainantName}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-gray-500 leading-relaxed">
            Mediation by the Punong Barangay was unsuccessful. Assign the three
            Lupon members who will handle conciliation for this case.
          </p>

          {members.map((member, idx) => (
            <div
              key={idx}
              className="border border-gray-200 rounded-xl p-4 bg-gray-50/50"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Member {idx + 1}
                </span>
                <select
                  value={member.position}
                  onChange={(e) => updateMember(idx, 'position', e.target.value)}
                  className="text-sm font-semibold px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                >
                  {POSITIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="Juan"
                    value={member.firstName}
                    onChange={(e) => updateMember(idx, 'firstName', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-300 text-gray-900 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Dela Cruz"
                    value={member.lastName}
                    onChange={(e) => updateMember(idx, 'lastName', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-300 text-gray-900 shadow-sm"
                  />
                </div>
              </div>
            </div>
          ))}

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-lg">
              <AlertTriangleIcon className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm font-medium text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            1 Chairman · 2 Members required
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors shadow-sm"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Escalate to Lupon
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}