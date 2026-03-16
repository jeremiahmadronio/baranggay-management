import  { useState } from 'react'
import { XIcon, UsersIcon, PlusIcon, TrashIcon } from 'lucide-react'
interface PangkatMember {
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
export function ReferToLuponModal({
  blotterNumber,
  complainantName,
  loading,
  onConfirm,
  onCancel,
}: ReferToLuponModalProps) {
  const [members, setMembers] = useState<PangkatMember[]>([
    {
      firstName: '',
      lastName: '',
      position: 'Chairman',
    },
    {
      firstName: '',
      lastName: '',
      position: 'Member',
    },
    {
      firstName: '',
      lastName: '',
      position: 'Member',
    },
  ])
  const [error, setError] = useState('')
  const updateMember = (
    index: number,
    field: keyof PangkatMember,
    value: string,
  ) => {
    setMembers((prev) =>
      prev.map((m, i) =>
        i === index
          ? {
              ...m,
              [field]: value,
            }
          : m,
      ),
    )
    if (error) setError('')
  }
  const addMember = () => {
    setMembers((prev) => [
      ...prev,
      {
        firstName: '',
        lastName: '',
        position: 'Member',
      },
    ])
  }
  const removeMember = (index: number) => {
    if (members.length <= 3) return
    setMembers((prev) => prev.filter((_, i) => i !== index))
  }
  const handleSubmit = () => {
    const incomplete = members.some(
      (m) => !m.firstName.trim() || !m.lastName.trim(),
    )
    if (incomplete) {
      setError('Please fill in all Pangkat member names.')
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
        <div className="px-6 py-5 border-b border-gray-100 bg-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                <UsersIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Refer to Pangkat ng Tagapagkasundo
                </h3>
                <p className="text-sm text-gray-500 mt-1">
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

        <div className="px-6 py-6 max-h-[60vh] overflow-y-auto bg-gray-50/30">
          <p className="text-sm text-gray-700 mb-6 leading-relaxed">
            Mediation by the Punong Barangay was unsuccessful. Assign the
            Pangkat members who will handle conciliation for this case.
          </p>

          <div className="space-y-4">
            {members.map((member, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 shadow-sm rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold border border-blue-100">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Pangkat Member
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={member.position}
                      onChange={(e) =>
                        updateMember(idx, 'position', e.target.value)
                      }
                      className="text-sm font-bold px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm"
                    >
                      {POSITIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    {members.length > 3 && (
                      <button
                        onClick={() => removeMember(idx)}
                        className="p-2 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remove member"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                      First Name
                    </label>
                    <input
                      type="text"
                      placeholder="Juan"
                      value={member.firstName}
                      onChange={(e) =>
                        updateMember(idx, 'firstName', e.target.value)
                      }
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder:text-gray-300 transition-colors text-gray-900 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                      Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="Dela Cruz"
                      value={member.lastName}
                      onChange={(e) =>
                        updateMember(idx, 'lastName', e.target.value)
                      }
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder:text-gray-300 transition-colors text-gray-900 shadow-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addMember}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-blue-600 border-2 border-dashed border-blue-200 rounded-xl hover:bg-blue-50 transition-colors bg-white"
          >
            <PlusIcon className="w-4 h-4" />
            Add Another Member
          </button>

          {error && (
            <div className="mt-4 px-4 py-3 bg-red-50 border border-red-100 rounded-lg shadow-sm">
              <p className="text-sm font-medium text-red-600">{error}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-5 border-t border-gray-100 bg-white">
          <p className="text-xs font-medium text-gray-500">
            Minimum 3 members required (1 Chairman, 2 Members)
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold border border-gray-200 rounded-lg text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors shadow-sm"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Refer to Pangkat
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
