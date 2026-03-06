import { useState, useEffect } from "react"
import { X, Eye, EyeOff, AlertTriangle, ChevronDown, Loader2 } from "lucide-react"

// ─── Types (mirrored from api file) ──────────────────────────────────────────

interface DepartmentOptions {
  id: number
  name: string
}

interface RoleOptions {
  id: number
  roleName: string
}

interface CreateAdmin {
  username: string
  firstName: string
  lastName: string
  email: string
  password: string
  contactNumber: string
  roleId: number
  allDepartments: boolean
  departmentIds: number[]
  activateImmediately: boolean
}

// ─── API helpers (inline – swap with your imports in the real project) ────────

const BASE_URL  = "http://localhost:8080/api/v1/users"
const DEPT_URL  = "http://localhost:8080/api/v1/departments"
const ROLE_URL  = "http://localhost:8080/api/v1/roles"

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  baseUrl = BASE_URL,
): Promise<T> {
  const token = localStorage.getItem("token")
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }
  const response = await fetch(`${baseUrl}${endpoint}`, { ...options, headers })
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    const ct = response.headers.get("content-type")
    const msg = ct?.includes("application/json")
      ? (await response.json().catch(() => ({}))).message
      : await response.text()
    throw new Error(msg || `HTTP error! status: ${response.status}`)
  }
  if (response.status === 204) return {} as T
  const ct = response.headers.get("content-type")
  return ct?.includes("application/json")
    ? response.json()
    : (response.text() as unknown as T)
}

const getDepartmentOptions = () =>
  apiFetch<DepartmentOptions[]>("/options", {}, DEPT_URL)

const getAdminRoleOptions = () =>
  apiFetch<RoleOptions[]>("/admin-options", {}, ROLE_URL)

const createAdminAccount = (body: CreateAdmin) =>
  apiFetch<string>("/create-admin", { method: "POST", body: JSON.stringify(body) })

// ─── Password requirements ────────────────────────────────────────────────────

interface PwReq {
  label: string
  test: (v: string) => boolean
}

const PW_REQS: PwReq[] = [
  { label: "At least 8 characters",  test: (v) => v.length >= 8 },
  { label: "One uppercase letter",   test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter",   test: (v) => /[a-z]/.test(v) },
  { label: "One number",             test: (v) => /[0-9]/.test(v) },
  { label: "One special character",  test: (v) => /[^A-Za-z0-9]/.test(v) },
]

const isPasswordValid = (v: string) => PW_REQS.every((r) => r.test(v))

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormData {
  username:  string
  firstName: string
  lastName:  string
  email:     string
  password:  string
  contactNumber: string
  roleId:    number | ""
}

type Errors = Partial<Record<keyof FormData | "departments", string>>

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void
}

export default function CreateAdminModal({ onClose }: Props) {
  const [step, setStep]               = useState<1 | 2>(1)
  const [showPassword, setShowPassword] = useState(false)
  const [pwFocused, setPwFocused]     = useState(false)
  const [accessScope, setAccessScope] = useState<"all" | "specific">("specific")
  const [selectedDeptIds, setSelectedDeptIds] = useState<number[]>([])
  const [activateImmediately, setActivateImmediately] = useState(true)
  const [errors, setErrors]           = useState<Errors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [departments, setDepartments] = useState<DepartmentOptions[]>([])
  const [roles, setRoles]             = useState<RoleOptions[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  const [formData, setFormData] = useState<FormData>({
    username:      "",
    firstName:     "",
    lastName:      "",
    email:         "",
    password:      "",
    contactNumber: "",
    roleId:        "",
  })

  // Fetch roles + departments on mount
  useEffect(() => {
    Promise.all([getDepartmentOptions(), getAdminRoleOptions()])
      .then(([depts, roleList]) => {
        setDepartments(depts)
        setRoles(roleList)
      })
      .catch(console.error)
      .finally(() => setLoadingOptions(false))
  }, [])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const toggleDept = (id: number) => {
    setSelectedDeptIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    )
    if (errors.departments) setErrors((prev) => ({ ...prev, departments: undefined }))
  }

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateStep1 = (): boolean => {
    const e: Errors = {}
    if (!formData.username.trim())
      e.username = "Username is required."
    else if (formData.username.trim().length < 3)
      e.username = "Username must be at least 3 characters."

    if (!formData.firstName.trim()) e.firstName = "First name is required."
    if (!formData.lastName.trim())  e.lastName  = "Last name is required."

    if (!formData.email.trim()) {
      e.email = "Email address is required."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      e.email = "Please enter a valid email address."
    }

    if (!formData.password.trim()) {
      e.password = "Password is required."
    } else if (!isPasswordValid(formData.password)) {
      e.password = "Password does not meet all requirements."
    }

    if (!formData.contactNumber.trim()) {
      e.contactNumber = "Contact number is required."
    } else if (!/^(09|\+639)\d{9}$/.test(formData.contactNumber)) {
      e.contactNumber = "Enter a valid PH number (e.g. 09171234567)."
    }

    if (formData.roleId === "") e.roleId = "Please select a role."

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = (): boolean => {
    const e: Errors = {}
    if (accessScope === "specific" && selectedDeptIds.length === 0)
      e.departments = "Please select at least one department."
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validateStep2()) return

    const payload: CreateAdmin = {
      username:            formData.username,
      firstName:           formData.firstName,
      lastName:            formData.lastName,
      email:               formData.email,
      password:            formData.password,
      contactNumber:       formData.contactNumber,
      roleId:              formData.roleId as number,
      allDepartments:      accessScope === "all",
      departmentIds:       accessScope === "all" ? [] : selectedDeptIds,
      activateImmediately: activateImmediately,
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)
      await createAdminAccount(payload)
      onClose()
    } catch (err: any) {
      setSubmitError(err.message || "Failed to create admin. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const inputClass = (field: keyof FormData) =>
    `w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition-all ${
      errors[field]
        ? "border-red-400 focus:ring-2 focus:ring-red-300 focus:border-red-400 bg-red-50"
        : "border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    }`

  const DEPT_COLORS = [
    "bg-blue-100 text-blue-700",
    "bg-orange-100 text-orange-700",
    "bg-purple-100 text-purple-700",
    "bg-teal-100 text-teal-700",
    "bg-green-100 text-green-700",
    "bg-yellow-100 text-yellow-800",
    "bg-pink-100 text-pink-700",
    "bg-cyan-100 text-cyan-700",
  ]

  // ── Render ──────────────────────────────────────────────────────────────────

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
            <div className={`flex-1 h-0.5 mx-4 ${step >= 2 ? "bg-blue-600" : "bg-gray-200"}`} />
            <div className="flex flex-col items-center relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 ${step >= 2 ? "bg-blue-600 text-white" : "bg-white text-gray-400 border-2 border-gray-200"}`}>
                2
              </div>
              <span className={`text-xs mt-2 absolute top-8 whitespace-nowrap ${step >= 2 ? "text-blue-600 font-semibold" : "text-gray-400"}`}>
                Access & Permissions
              </span>
            </div>
          </div>

          {/* ── Step 1 ── */}
          {step === 1 && (
            <div className="space-y-5">

              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  className={inputClass("username")}
                  placeholder="juandelacruz"
                  value={formData.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                />
                {errors.username && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {errors.username}
                  </p>
                )}
              </div>

              {/* First / Last name */}
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

              {/* Email */}
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

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`${inputClass("password")} pr-10`}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onFocus={() => setPwFocused(true)}
                    onBlur={() => setPwFocused(false)}
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

                {/* Password requirements checklist – visible while typing or on error */}
                {(pwFocused || formData.password.length > 0) && (
                  <ul className="mt-2 space-y-1">
                    {PW_REQS.map((req) => {
                      const met = req.test(formData.password)
                      return (
                        <li
                          key={req.label}
                          className={`flex items-center gap-1.5 text-xs transition-colors ${
                            met ? "text-green-600" : "text-gray-400"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              met ? "bg-green-500" : "bg-gray-300"
                            }`}
                          />
                          {req.label}
                        </li>
                      )
                    })}
                  </ul>
                )}

                {errors.password && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {errors.password}
                  </p>
                )}
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  className={inputClass("contactNumber")}
                  placeholder="09171234567"
                  value={formData.contactNumber}
                  onChange={(e) => handleChange("contactNumber", e.target.value)}
                />
                {errors.contactNumber && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {errors.contactNumber}
                  </p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Admin Role <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  {loadingOptions ? (
                    <div className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-400 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading roles…
                    </div>
                  ) : (
                    <select
                      className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition-all appearance-none bg-white ${
                        errors.roleId
                          ? "border-red-400 focus:ring-2 focus:ring-red-300"
                          : "border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                      value={formData.roleId}
                      onChange={(e) =>
                        handleChange("roleId", e.target.value === "" ? "" : Number(e.target.value))
                      }
                    >
                      <option value="">Select a role</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.roleName}
                        </option>
                      ))}
                    </select>
                  )}
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.roleId && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {errors.roleId}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <div className="space-y-6">

              {/* Access Scope */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3">
                  Department Access Scope <span className="text-red-500">*</span>
                </h3>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
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
                  <label className="flex items-start gap-3 cursor-pointer">
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

              {/* Department checkboxes */}
              {accessScope === "specific" && (
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3">
                    Select Departments <span className="text-red-500">*</span>
                  </h3>
                  {loadingOptions ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading departments…
                    </div>
                  ) : (
                    <div
                      className={`grid grid-cols-2 gap-3 p-3 rounded-lg transition-all ${
                        errors.departments ? "border border-red-300 bg-red-50/40" : ""
                      }`}
                    >
                      {departments.map((dept, idx) => (
                        <label
                          key={dept.id}
                          className="flex items-center gap-3 p-2.5 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors bg-white"
                        >
                          <input
                            type="checkbox"
                            checked={selectedDeptIds.includes(dept.id)}
                            onChange={() => toggleDept(dept.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                          />
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                              DEPT_COLORS[idx % DEPT_COLORS.length]
                            }`}
                          >
                            {dept.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                  {errors.departments && (
                    <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {errors.departments}
                    </p>
                  )}
                </div>
              )}

              {/* Account Status */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3">Account Status</h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activateImmediately}
                    onChange={(e) => setActivateImmediately(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm text-slate-700">Activate account immediately</span>
                </label>
              </div>

              {/* Submit error */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 items-start">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              )}

              {/* Warning */}
              <div className="bg-red-50/80 border border-red-100 rounded-lg p-4 flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 leading-relaxed">
                  <span className="font-bold">Important:</span> Admin accounts have elevated
                  privileges. Ensure the person is authorized before creating this account. All
                  admin actions are logged in the audit trail.
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
                disabled={isSubmitting}
                className="px-4 py-2.5 border border-gray-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <div className="flex-1" />
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 text-slate-600 text-sm font-semibold hover:text-slate-900 transition-colors mr-2 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Admin
              </button>
            </>
          ) : (
            <>
              <div className="flex-1" />
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-slate-600 text-sm font-semibold hover:text-slate-900 transition-colors mr-2"
              >
                Cancel
              </button>
              <button
                onClick={() => { if (validateStep1()) setStep(2) }}
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