import React, { useState, useEffect } from 'react'
import { X, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react'
import {
  updateAdmin,
  getDepartmentOptions,
  type AdminTable,
  type UpdateAdmin,
  type DepartmentOptions,
} from '../admin-root-api/admin-management'

interface EditUserModalProps {
  admin: AdminTable
  onClose: () => void
}

const MOCK_PASSWORD = '••••••••'

function validatePassword(pw: string): string | null {
  if (pw.length < 8)                    return 'Password must be at least 8 characters.'
  if (!/[A-Z]/.test(pw))               return 'Password must contain at least one uppercase letter.'
  if (!/[a-z]/.test(pw))               return 'Password must contain at least one lowercase letter.'
  if (!/[0-9]/.test(pw))               return 'Password must contain at least one number.'
  if (!/[^A-Za-z0-9]/.test(pw))        return 'Password must contain at least one special character.'
  return null
}

export function EditUserModal({ admin, onClose }: EditUserModalProps) {
  const actorId = localStorage.getItem('userId') ?? ''

  const [departments, setDepartments] = useState<DepartmentOptions[]>([])
  const [deptLoading, setDeptLoading] = useState(true)

  const [formData, setFormData] = useState<UpdateAdmin>({
    firstName:      admin.firstName,
    lastName:       admin.lastName,
    email:          admin.email,
    username:       admin.username,
    contactNumber:  admin.contactNumber,
    password:       '',
    allDepartments: false,
    departmentIds:  [],
  })

  // password field state — starts as mock, user clears to type real one
  const [passwordDisplay, setPasswordDisplay] = useState(MOCK_PASSWORD)
  const [passwordFocused,  setPasswordFocused]  = useState(false)
  const [showPassword,     setShowPassword]     = useState(false)
  const [passwordChanged,  setPasswordChanged]  = useState(false)

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function fetchDepts() {
      try {
        setDeptLoading(true)
        const options = await getDepartmentOptions()
        setDepartments(options)
        const currentIds = options
          .filter(opt => (admin.departments ?? []).includes(opt.name))
          .map(opt => opt.id)
        setFormData(prev => ({ ...prev, departmentIds: currentIds }))
      } catch {
        setError('Failed to load department options.')
      } finally {
        setDeptLoading(false)
      }
    }
    fetchDepts()
  }, [])

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

  const handlePasswordFocus = () => {
    setPasswordFocused(true)
    // Clear mock placeholder when user clicks into the field
    if (!passwordChanged) {
      setPasswordDisplay('')
    }
  }

  const handlePasswordBlur = () => {
    setPasswordFocused(false)
    // If user left it empty without typing, restore mock placeholder
    if (!passwordChanged && passwordDisplay === '') {
      setPasswordDisplay(MOCK_PASSWORD)
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setPasswordDisplay(val)
    setPasswordChanged(true)
    setFormData(prev => ({ ...prev, password: val }))
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

    // Only validate password if user actually changed it
    if (passwordChanged && formData.password) {
      const pwError = validatePassword(formData.password)
      if (pwError) { setError(pwError); return }
    }

    // Build payload — omit password if unchanged
    const payload: UpdateAdmin = {
      ...formData,
      password: passwordChanged && formData.password ? formData.password : '',
    }

    try {
      setLoading(true)
      await updateAdmin(admin.id, actorId, payload)
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
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Edit Admin</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">

          {/* First + Last Name */}
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

          {/* Username */}
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

          {/* Email */}
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

          {/* Contact Number */}
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

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Password
              <span className="ml-1.5 text-xs font-normal text-gray-400">(leave unchanged to keep current)</span>
            </label>
            <div className="relative">
              <input
                type={showPassword && passwordChanged ? 'text' : 'password'}
                value={passwordDisplay}
                onFocus={handlePasswordFocus}
                onBlur={handlePasswordBlur}
                onChange={handlePasswordChange}
                placeholder="Enter new password"
                className={`w-full border rounded-lg px-4 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:border-transparent
                  ${passwordChanged && formData.password && validatePassword(formData.password)
                    ? 'border-red-300 focus:ring-red-400'
                    : 'border-gray-300 focus:ring-blue-500'
                  }`}
              />
              {passwordChanged && (
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}
            </div>

            { passwordFocused || passwordChanged && formData.password && (
              <ul className="mt-2 space-y-1">
                {[
                  { ok: formData.password.length >= 8,          text: 'At least 8 characters' },
                  { ok: /[A-Z]/.test(formData.password),        text: 'One uppercase letter' },
                  { ok: /[a-z]/.test(formData.password),        text: 'One lowercase letter' },
                  { ok: /[0-9]/.test(formData.password),        text: 'One number' },
                  { ok: /[^A-Za-z0-9]/.test(formData.password), text: 'One special character' },
                ].map(rule => (
                  <li key={rule.text} className={`flex items-center gap-1.5 text-xs ${rule.ok ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${rule.ok ? 'bg-green-500' : 'bg-gray-300'}`} />
                    {rule.text}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* All Departments Toggle */}
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

          {/* Department Checkboxes */}
          {!formData.allDepartments && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Department Access
              </label>
              {deptLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading departments...
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {departments.map(dept => (
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
              )}
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
            disabled={loading || success || deptLoading}
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