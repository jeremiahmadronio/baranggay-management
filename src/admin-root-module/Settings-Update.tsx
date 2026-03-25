
/*import React, { useEffect, useState } from 'react'
import {
  User,
  ShieldCheck,
  Mail,
  AtSign,
  Phone,
  Save,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { ProfilePictureUpload } from './ProfilePictureUpload'
import { ActionModal } from './ActionModalSettings'
import {
  getSettingsPreview,
  updateSettings,
  type UserSettings,
} from '../admin-root-api/admin-management'
import {
  validateEmail,
  validatePhone,
  validateUsername,
  formatPhoneInput,
} from './utils/Validation'
interface FormState extends UserSettings {
  password?: string
  confirmPassword?: string
}
interface FormErrors {
  [key: string]: string
}
export function AccountSettings() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [formData, setFormData] = useState<FormState>({
    id: '',
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    contactNumber: '',
    avatarUrl: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getSettingsPreview()
        setFormData({
          ...data,
          password: '',
          confirmPassword: '',
        })
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'firstName':
      case 'lastName':
        if (!value.trim()) return 'Required'
        if (value.length > 50) return 'Max 50 characters'
        return ''
      case 'username':
        if (!value.trim()) return 'Required'
        if (value.length > 30) return 'Max 30 characters'
        if (!validateUsername(value)) return 'Alphanumeric and underscores only'
        return ''
      case 'email':
        if (!value.trim()) return 'Required'
        if (!validateEmail(value)) return 'Invalid email format'
        return ''
      case 'contactNumber':
        if (!value.trim()) return 'Required'
        if (!validatePhone(value)) return 'Format: +63 XXX XXX XXXX'
        return ''
      case 'password':
        if (value && value.length < 8) return 'Min 8 characters'
        return ''
      case 'confirmPassword':
        if (formData.password && value !== formData.password)
          return 'Passwords do not match'
        return ''
      default:
        return ''
    }
  }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    let newValue = value
    if (name === 'contactNumber') {
      newValue = formatPhoneInput(value)
    }
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }))
    const error = validateField(name, newValue)
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }))
    if (name === 'password' && formData.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword:
          newValue !== formData.confirmPassword ? 'Passwords do not match' : '',
      }))
    }
  }
  const handlePhotoUpdate = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      avatarUrl: url,
    }))
  }
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    let isValid = true
    Object.keys(formData).forEach((key) => {
      if (key === 'id' || key === 'avatarUrl') return
      const error = validateField(key, formData[key as keyof FormState] || '')
      if (error) {
        newErrors[key] = error
        isValid = false
      }
    })
    setErrors(newErrors)
    return isValid
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      const firstError = document.querySelector('.text-red-600')
      firstError?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      return
    }
    setIsSaving(true)
    try {
      const payload = {
        ...formData,
      }
      if (!payload.password) {
        delete payload.password
      }
      delete payload.confirmPassword
      await updateSettings(payload)
      setShowSuccessModal(true)
      setFormData((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }))
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setIsSaving(false)
    }
  }
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }
  return (
    <div className="h-[calc(100vh-4rem)] overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Manage your profile and account preferences
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <ProfilePictureUpload
              firstName={formData.firstName}
              lastName={formData.lastName}
              currentPhotoUrl={formData.avatarUrl}
              onPhotoUpdate={handlePhotoUpdate}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-4.5 h-4.5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-gray-900">
                    Personal Information
                  </h2>
                  <p className="text-xs text-gray-500">
                    Update your personal details
                  </p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    error={errors.firstName}
                    maxLength={50}
                    placeholder="Juan"
                    required
                  />
                  <InputField
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    error={errors.lastName}
                    maxLength={50}
                    placeholder="Dela Cruz"
                    required
                  />
                </div>
                <InputField
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  error={errors.username}
                  maxLength={30}
                  placeholder="jdelacruz"
                  icon={<AtSign className="w-4 h-4" />}
                  required
                />
                <InputField
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  placeholder="juan@example.gov.ph"
                  icon={<Mail className="w-4 h-4" />}
                  required
                />
                <InputField
                  label="Contact Number"
                  name="contactNumber"
                  type="tel"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  error={errors.contactNumber}
                  placeholder="+63 900 000 0000"
                  hint="Format: +63 XXX XXX XXXX"
                  icon={<Phone className="w-4 h-4" />}
                  required
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
                <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4.5 h-4.5 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-gray-900">
                    Security
                  </h2>
                  <p className="text-xs text-gray-500">Change your password</p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <InputField
                  label="New Password"
                  name="password"
                  type="password"
                  value={formData.password || ''}
                  onChange={handleChange}
                  error={errors.password}
                  placeholder="Min. 8 characters"
                  hint="Leave blank to keep current password"
                />
                <InputField
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword || ''}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  placeholder="Repeat new password"
                  disabled={!formData.password}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg shadow-sm transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>

        <ActionModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="Changes Saved"
          type="success"
        >
          Your account settings have been updated successfully.
        </ActionModal>
      </div>
    </div>
  )
}
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  icon?: React.ReactNode
}
function InputField({
  label,
  error,
  hint,
  icon,
  maxLength,
  value,
  ...props
}: InputFieldProps) {
  const valueStr = (value as string) || ''
  const showCounter = maxLength && valueStr.length > 0
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-baseline">
        <label className="text-xs font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {showCounter && (
          <span
            className={`text-xs ${valueStr.length >= maxLength ? 'text-red-600 font-medium' : 'text-gray-400'}`}
          >
            {valueStr.length}/{maxLength}
          </span>
        )}
      </div>

      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          value={value}
          maxLength={maxLength}
          className={`
            w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 transition-all
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100 hover:border-gray-400'}
          `}
          {...props}
        />
      </div>

      {error ? (
        <div className="flex items-center gap-1 text-red-600 text-xs animate-in slide-in-from-top-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : hint ? (
        <p className="text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  )
}
*/