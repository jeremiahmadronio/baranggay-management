import React, { useState } from 'react'
import { X, Loader2, CheckCircle } from 'lucide-react'
import { updateAdmin, type AdminTable, type UpdateAdmin } from '../admin-root-api/admin-management'

interface EditUserModalProps {
  admin: AdminTable
  onClose: () => void
}

const DEPARTMENT_OPTIONS: { id: number; name: string }[] = [
  { id: 1, name: 'Lupon' },
  { id: 2, name: 'First Time Jobseeker' },
  { id: 3, name: 'VAWC' },
  { id: 4, name: 'Blotter' },
  { id: 5, name: 'BCPC' },
  { id: 6, name: 'Clearance' },
]

// Maps department names from API back to their IDs for pre-checking
function getInitialDepartmentIds(departmentNames: string[]): number[] {
  return DEPARTMENT_OPTIONS
    .filter(opt => departmentNames.includes(opt.name))
    .map(opt => opt.id)
}

export function EditUserModal({ admin, onClose }: EditUserModalProps) {
  const actorId = localStorage.getItem('userId') ?? ''

  const initialIds = getInitialDepartmentIds(admin.departments ?? [])

  const [formData, setFormData] = useState<UpdateAdmin>({
    firstName:      admin.firstName,
    lastName:       admin.lastName,
    email:          admin.email,
    username:       admin.username,
    contactNumber:  admin.contactNumber,
    allDepartments: false,
    departmentIds:  initialIds,   // ← pre-checked based on current departments
  })

  const [loading, setLoading]   = useState(false)
  const [error,   setError]     = useState<string | null>(null)
  const [success, setSuccess]   = useState(false)

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const toggleDepartment = (id: number) => {
    setFormData(prev => ({
      ...prev,
      departmentIds: prev.departmentIds.includes(id)
        ? prev.departmentIds.filter(d => d !== id)
        : [...prev.departmentIds, id],
    }))
  }

  const handleSave = async () => {
    setError(null)
    setSuccess(false)

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required.')
      return
    }
    if (!formData.email.trim()) {
      setError('Email is required.')
      return
    }
    if (!formData.username.trim()) {
      setError('Username is required.')
      return
    }

    try {
      setLoading(true)

      const response = await fetch(
        `http://localhost:8080/api/v1/users/update-admin?userId=${admin.id}&actorId=${actorId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') && {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            }),
          },
          body: JSON.stringify(formData),
        }
      )

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        const errMsg = contentType?.includes('application/json')
          ? (await response.json()).message
          : await response.text()
        throw new Error(errMsg || `HTTP error! status: ${response.status}`)
      }

      // ← success: show notif, then close after 1.2s
      setSuccess(true)
      setTimeout(() => onClose(), 1200)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update admin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Edit Admin</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.contactNumber}
              placeholder="09XXXXXXXXX or +639XXXXXXXXX"
              onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="allDepts"
              type="checkbox"
              checked={formData.allDepartments}
              onChange={e => setFormData({ ...formData, allDepartments: e.target.checked, departmentIds: [] })}
              className="w-4 h-4 accent-blue-600"
            />
            <label htmlFor="allDepts" className="text-sm font-medium text-gray-700">
              Grant access to all departments
            </label>
          </div>

          {!formData.allDepartments && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Department Access
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DEPARTMENT_OPTIONS.map(dept => (
                  <label key={dept.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.departmentIds.includes(dept.id)}
                      onChange={() => toggleDepartment(dept.id)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    {dept.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {success && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Admin updated successfully!
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || success}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Saving...' : success ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}