import { useState } from "react"
import { X, Eye, EyeOff, AlertTriangle, ChevronDown } from "lucide-react"

type Props = {
  onClose: () => void
}

const DEPARTMENTS = [
  { id: "vawc", label: "VAWC", color: "bg-blue-100 text-blue-700" },
  { id: "blotter", label: "Blotter", color: "bg-orange-100 text-orange-700" },
  { id: "kapitana", label: "Kapitana", color: "bg-purple-100 text-purple-700" },
  { id: "bcpc", label: "BCPC", color: "bg-teal-100 text-teal-700" },
  { id: "clearance", label: "Clearance", color: "bg-green-100 text-green-700" },
  { id: "lupong", label: "Lupong Tagapamayapa", color: "bg-yellow-100 text-yellow-800" },
  { id: "operational", label: "Operational Staff", color: "bg-pink-100 text-pink-700" },
  { id: "ftjs", label: "FTJS", color: "bg-cyan-100 text-cyan-700" },
]

type FormData = {
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
  role: string
}

type Errors = Partial<Record<keyof FormData | "departments", string>>

export default function CreateAdminModal({ onClose }: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [showPassword, setShowPassword] = useState(false)
  const [accessScope, setAccessScope] = useState<"all" | "specific">("specific")
  const [selectedDepts, setSelectedDepts] = useState<string[]>([])
  const [isActive, setIsActive] = useState(true)
  const [errors, setErrors] = useState<Errors>({})

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    role: "Admin",
  })

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const toggleDept = (id: string) => {
    setSelectedDepts((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    )
    if (errors.departments) {
      setErrors((prev) => ({ ...prev, departments: undefined }))
    }
  }

  const validateStep1 = (): boolean => {
    const newErrors: Errors = {}
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required."
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required."
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address."
    }
    if (!formData.password.trim()) {
      newErrors.password = "Password is required."
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters."
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required."
    } else if (!/^(09|\+639)\d{9}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid PH phone number (e.g. 09171234567)."
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = (): boolean => {
    const newErrors: Errors = {}
    if (accessScope === "specific" && selectedDepts.length === 0) {
      newErrors.departments = "Please select at least one department."
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep1()) setStep(2)
  }

  const handleSubmit = () => {
    if (validateStep2()) {
      // Submit logic here
      console.log("Submitting:", { formData, accessScope, selectedDepts, isActive })
      onClose()
    }
  }

  const inputClass = (field: keyof FormData) =>
    `w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition-all ${
      errors[field]
        ? "border-red-400 focus:ring-2 focus:ring-red-300 focus:border-red-400 bg-red-50"
        : "border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    }`

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[95vh]">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-slate-900">Create Admin Account</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">

          {/* Stepper */}
          <div className="flex items-center justify-center mb-10 px-8">
            <div className="flex flex-col items-center relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 ${step >= 1 ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
                1
              </div>
              <span className={`text-xs mt-2 absolute top-8 whitespace-nowrap ${step >= 1 ? "text-blue-600 font-semibold" : "text-gray-500"}`}>
                Account Info
              </span>
            </div>
            <div className={`flex-1 h-0.5 mx-4 ${step >= 2 ? "bg-blue-600" : "bg-gray-200"}`}></div>
            <div className="flex flex-col items-center relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 ${step >= 2 ? "bg-blue-600 text-white" : "bg-white text-gray-400 border-2 border-gray-200"}`}>
                2
              </div>
              <span className={`text-xs mt-2 absolute top-8 whitespace-nowrap ${step >= 2 ? "text-blue-600 font-semibold" : "text-gray-400"}`}>
                Access & Permissions
              </span>
            </div>
          </div>

          {/* Step 1 - Account Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={inputClass("firstName")}
                    placeholder="Juan"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {errors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={inputClass("lastName")}
                    placeholder="Dela Cruz"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className={inputClass("email")}
                  placeholder="admin@ugong.gov.ph"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`${inputClass("password")} pr-10`}
                    placeholder="Enter secure password (min. 8 characters)"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {errors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  className={inputClass("phone")}
                  placeholder="09171234567"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Admin Role <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none bg-white"
                    value={formData.role}
                    onChange={(e) => handleChange("role", e.target.value)}
                  >
                    <option>Admin</option>
                    <option>Super Admin</option>
                    <option>Moderator</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 - Access & Permissions */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3">
                  Department Access Scope <span className="text-red-500">*</span>
                </h3>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="flex items-center h-5 mt-0.5">
                      <input
                        type="radio"
                        name="accessScope"
                        value="all"
                        checked={accessScope === "all"}
                        onChange={() => {
                          setAccessScope("all")
                          setErrors((prev) => ({ ...prev, departments: undefined }))
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-700">All Departments</div>
                      <div className="text-xs text-slate-500">Admin can manage staff across all departments</div>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="flex items-center h-5 mt-0.5">
                      <input
                        type="radio"
                        name="accessScope"
                        value="specific"
                        checked={accessScope === "specific"}
                        onChange={() => setAccessScope("specific")}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-700">Specific Departments</div>
                      <div className="text-xs text-slate-500">Restrict admin access to selected departments only</div>
                    </div>
                  </label>
                </div>
              </div>

              {accessScope === "specific" && (
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3">
                    Select Departments <span className="text-red-500">*</span>
                  </h3>
                  <div className={`grid grid-cols-2 gap-3 p-3 rounded-lg transition-all ${errors.departments ? "border border-red-300 bg-red-50/40" : ""}`}>
                    {DEPARTMENTS.map((dept) => (
                      <label
                        key={dept.id}
                        className="flex items-center gap-3 p-2.5 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors bg-white"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDepts.includes(dept.id)}
                          onChange={() => toggleDept(dept.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${dept.color}`}>
                          {dept.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.departments && (
                    <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {errors.departments}
                    </p>
                  )}
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3">Account Status</h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm text-slate-700">Activate account immediately</span>
                </label>
              </div>

              <div className="bg-red-50/80 border border-red-100 rounded-lg p-4 flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 leading-relaxed">
                  <span className="font-bold">Important:</span> Admin accounts have elevated privileges. Ensure the person is authorized before creating this account. All admin actions are logged in the audit trail.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center p-6 border-t border-gray-100 bg-white rounded-b-2xl">
          {step === 2 ? (
            <>
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2.5 border border-gray-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <div className="flex-1"></div>
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-slate-600 text-sm font-semibold hover:text-slate-900 transition-colors mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Create Admin
              </button>
            </>
          ) : (
            <>
              <div className="flex-1"></div>
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-slate-600 text-sm font-semibold hover:text-slate-900 transition-colors mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Next
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  )
}