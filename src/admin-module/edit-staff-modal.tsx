"use client";

import { useState, useEffect } from "react";
import {
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  ChevronDown,
  Loader2,
  Check,
} from "lucide-react";
import {
  userManagementApi,
  type Department,
  type Role,
  type Permission,
  type UserTable,
  type EditUserPayload,
} from "../admin-module-api/user-management";
import { ActionModal } from "../reusable/SuccessModal";

// ─── Password Requirements ────────────────────────────────────────────────────

interface PwReq {
  label: string;
  test: (v: string) => boolean;
}

const PW_REQS: PwReq[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "One number", test: (v) => /[0-9]/.test(v) },
  { label: "One special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const isPasswordValid = (v: string) => PW_REQS.every((r) => r.test(v));

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  contactNumber: string;
  departmentId: number | null;
  roleId: number | null;
  permissionIds: number[];
}

type Errors = Partial<Record<keyof FormData, string>>;

interface Props {
  user: UserTable;
  onClose: () => void;
  onSuccess?: () => void;
}

// ─── Permissions that require "View" to also be selected ─────────────────────
const VIEW_DEPENDENTS = ["edit", "delete", "generate report", "issue cert"];

const MOCK_PASSWORD = "••••••••";

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  const steps = [
    { num: 1, label: "Personal Info" },
    { num: 2, label: "Department & Role" },
    { num: 3, label: "Permissions" },
  ];

  return (
    <div className="flex items-center justify-center mb-10 px-4">
      {steps.map((s, i) => {
        const done = step > s.num;
        const active = step === s.num;
        return (
          <div key={s.num} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center relative">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 transition-all ${
                  done || active
                    ? "bg-blue-600 text-white"
                    : "bg-white border-2 border-gray-200 text-gray-400"
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span
                className={`text-xs mt-2 absolute top-8 whitespace-nowrap font-medium ${
                  active
                    ? "text-blue-600 font-semibold"
                    : done
                      ? "text-gray-600"
                      : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-3 transition-all ${
                  step > s.num ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function SelectSkeleton() {
  return (
    <div className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-400 flex items-center gap-2 bg-gray-50 animate-pulse">
      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      <span>Loading…</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function EditStaffModal({ user, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  // Password change tracking
  const [passwordDisplay, setPasswordDisplay] = useState(MOCK_PASSWORD);
  const [passwordChanged, setPasswordChanged] = useState(false);

  // ── Options from API ─────────────────────────────────────────────────────────
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  // ── Form State ───────────────────────────────────────────────────────────────
  const [form, setForm] = useState<FormData>({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    password: "",
    contactNumber: user.contactNumber || "",
    departmentId: null,
    roleId: null,
    permissionIds: [],
  });

  // ── Fetch departments, roles, permissions on mount ───────────────────────────
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoadingOptions(true);
        setOptionsError(null);
        const [depts, roles, perms] = await Promise.all([
          userManagementApi.getDepartmentOptions(),
          userManagementApi.getRoleOptions(),
          userManagementApi.getPermissionOptions(),
        ]);
        setDepartments(depts);
        setAllRoles(roles);
        setPermissions(perms);

        const currentDept = depts.find((d) => d.name === user.departmentName);
        const currentRole = roles.find((r) => r.roleName === user.roleName);
        const currentPermIds = perms
          .filter((p) => user.permissions?.includes(p.permissionName))
          .map((p) => p.id);

        setForm((prev) => ({
          ...prev,
          departmentId: currentDept?.id ?? null,
          roleId: currentRole?.id ?? null,
          permissionIds: currentPermIds,
        }));
      } catch (err) {
        setOptionsError(
          err instanceof Error
            ? err.message
            : "Failed to load options. Please try again.",
        );
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, [user]);

  // ── Reset role when department changes ───────────────────────────────────────
  useEffect(() => {
    setFilteredRoles(allRoles);
  }, [form.departmentId, allRoles]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const setField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const inputClass = (field: keyof FormData) =>
    `w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition-all ${
      errors[field]
        ? "border-red-400 focus:ring-2 focus:ring-red-300 focus:border-red-400 bg-red-50"
        : "border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    }`;

  // ── Permission helpers ────────────────────────────────────────────────────────

  const getViewPermission = () =>
    permissions.find((p) => p.permissionName.toLowerCase().includes("view"));

  const requiresView = (perm: Permission) =>
    VIEW_DEPENDENTS.some((dep) =>
      perm.permissionName.toLowerCase().includes(dep),
    );

  const isViewForced = () => {
    const viewPerm = getViewPermission();
    if (!viewPerm) return false;
    return permissions.some(
      (p) => requiresView(p) && form.permissionIds.includes(p.id),
    );
  };

  const togglePermission = (id: number) => {
    const clicked = permissions.find((p) => p.id === id);
    if (!clicked) return;

    const viewPerm = getViewPermission();

    setForm((prev) => {
      const isChecking = !prev.permissionIds.includes(id);
      let next = isChecking
        ? [...prev.permissionIds, id]
        : prev.permissionIds.filter((pid) => pid !== id);

      if (isChecking) {
        if (requiresView(clicked) && viewPerm && !next.includes(viewPerm.id)) {
          next = [...next, viewPerm.id];
        }
      } else {
        if (viewPerm && id === viewPerm.id) {
          const dependentIds = permissions
            .filter((p) => requiresView(p))
            .map((p) => p.id);
          next = next.filter((pid) => !dependentIds.includes(pid));
        }
      }

      return { ...prev, permissionIds: next };
    });
    setErrors((prev) => ({ ...prev, permissionIds: undefined }));
  };

  const getDisplayPermissions = () =>
    permissions.filter(
      (p) => !p.permissionName.toLowerCase().includes("all access"),
    );

  const displayPerms = getDisplayPermissions();

  const allSelected =
    displayPerms.length > 0 &&
    displayPerms.every((p) => form.permissionIds.includes(p.id));

  const someSelected =
    !allSelected && displayPerms.some((p) => form.permissionIds.includes(p.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setForm((prev) => ({ ...prev, permissionIds: [] }));
    } else {
      setForm((prev) => ({
        ...prev,
        permissionIds: displayPerms.map((p) => p.id),
      }));
    }
    setErrors((prev) => ({ ...prev, permissionIds: undefined }));
  };

  // ── Password handlers ─────────────────────────────────────────────────────────

  const handlePasswordFocus = () => {
    if (!passwordChanged) {
      setPasswordDisplay("");
    }
  };

  const handlePasswordBlur = () => {
    if (!passwordChanged && passwordDisplay === "") {
      setPasswordDisplay(MOCK_PASSWORD);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPasswordDisplay(val);
    setPasswordChanged(true);
    setField("password", val);
  };

  // ── Validation ────────────────────────────────────────────────────────────────

  const validateStep1 = (): boolean => {
    const e: Errors = {};
    if (!form.firstName.trim()) e.firstName = "First name is required.";
    if (!form.lastName.trim()) e.lastName = "Last name is required.";
    if (!form.email.trim()) {
      e.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Please enter a valid email address.";
    }
    if (passwordChanged && form.password && !isPasswordValid(form.password)) {
      e.password = "Password does not meet all requirements.";
    }
    if (!form.contactNumber.trim()) {
      e.contactNumber = "Contact number is required.";
    } else if (!/^(09|\+639)\d{9}$/.test(form.contactNumber)) {
      e.contactNumber = "Enter a valid PH number (e.g. 09171234567).";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: Errors = {};
    if (!form.departmentId) e.departmentId = "Please select a department.";
    if (!form.roleId) e.roleId = "Please select a role.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = (): boolean => {
    const e: Errors = {};
    if (form.permissionIds.length === 0)
      e.permissionIds = "Select at least one permission.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Navigation ────────────────────────────────────────────────────────────────

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  // ── Submit ────────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload: EditUserPayload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        contactNumber: form.contactNumber,
        roleId: form.roleId!,
        departmentIds: form.departmentId ? [form.departmentId] : [],
        permissionIds: form.permissionIds,
      };
      if (passwordChanged && form.password) {
        payload.password = form.password;
      }
      await userManagementApi.updateUser(user.id, payload);
      setSubmitSuccess(true);
      onSuccess?.();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  const viewPerm = getViewPermission();
  const viewIsForced = isViewForced();

  if (submitSuccess) {
    return (
      <ActionModal
        isOpen={true}
        onClose={onClose}
        title="Staff Updated!"
        type="success"
      >
        <p>
          <span className="font-semibold">
            {form.firstName} {form.lastName}
          </span>{" "}
          has been updated successfully.
        </p>
      </ActionModal>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col max-h-[95vh]">
        {/* ── Header ── */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Edit Staff Account
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">@{user.username}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-6 overflow-y-auto flex-1">
          <StepIndicator step={step} />

          {optionsError && (
            <div className="mb-5 bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 items-start">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{optionsError}</p>
            </div>
          )}

          {/* ── Step 1: Personal Info ── */}
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
                    value={form.firstName}
                    onChange={(e) => setField("firstName", e.target.value)}
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
                    value={form.lastName}
                    onChange={(e) => setField("lastName", e.target.value)}
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
                  placeholder="juan@email.com"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  className={inputClass("contactNumber")}
                  placeholder="09171234567"
                  value={form.contactNumber}
                  onChange={(e) => setField("contactNumber", e.target.value)}
                />
                {errors.contactNumber && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {errors.contactNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Password
                  <span className="ml-1.5 text-xs font-normal text-gray-400">
                    (leave unchanged to keep current)
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword && passwordChanged ? "text" : "password"}
                    value={passwordDisplay}
                    onFocus={handlePasswordFocus}
                    onBlur={handlePasswordBlur}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    className={`${inputClass("password")} pr-10`}
                  />
                  {passwordChanged && (
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {errors.password}
                  </p>
                )}
                {passwordChanged && form.password && (
                  <ul className="mt-2 space-y-1">
                    {PW_REQS.map((rule) => (
                      <li
                        key={rule.label}
                        className={`flex items-center gap-1.5 text-xs ${
                          rule.test(form.password)
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            rule.test(form.password)
                              ? "bg-green-500"
                              : "bg-gray-300"
                          }`}
                        />
                        {rule.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* ── Step 2: Department & Role ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Department <span className="text-red-500">*</span>
                </label>
                {loadingOptions ? (
                  <SelectSkeleton />
                ) : (
                  <div className="relative">
                    <select
                      value={form.departmentId ?? ""}
                      onChange={(e) =>
                        setField(
                          "departmentId",
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      className={`${inputClass("departmentId")} appearance-none cursor-pointer`}
                    >
                      <option value="">Select a department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                )}
                {errors.departmentId && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {errors.departmentId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Role <span className="text-red-500">*</span>
                </label>
                {loadingOptions ? (
                  <SelectSkeleton />
                ) : (
                  <div className="relative">
                    <select
                      value={form.roleId ?? ""}
                      onChange={(e) =>
                        setField(
                          "roleId",
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      className={`${inputClass("roleId")} appearance-none cursor-pointer`}
                    >
                      <option value="">Select a role</option>
                      {filteredRoles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.roleName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                )}
                {errors.roleId && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {errors.roleId}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Permissions ── */}
          {step === 3 && (
            <div className="space-y-4">
              <label className="text-sm font-semibold text-slate-700">
                Permissions <span className="text-red-500">*</span>
              </label>

              {loadingOptions ? (
                <SelectSkeleton />
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* ── Select All checkbox row ── */}
                  <label
                    className={`flex items-center gap-2 text-sm px-3 py-2.5 border-b border-gray-200 cursor-pointer transition-colors font-semibold text-slate-700 ${
                      allSelected ? "bg-blue-50" : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span>All Permissions</span>
                    {someSelected && (
                      <span className="ml-auto text-xs font-normal text-gray-400">
                        {form.permissionIds.length} of {displayPerms.length} selected
                      </span>
                    )}
                  </label>

                  {/* ── Individual permission rows ── */}
                  <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto p-3 bg-gray-50/50">
                    {displayPerms.map((p) => {
                      const isView = viewPerm && p.id === viewPerm.id;
                      const disabled = isView && viewIsForced;
                      const checked = form.permissionIds.includes(p.id);

                      return (
                        <label
                          key={p.id}
                          className={`flex items-center gap-2 text-sm px-2 py-1.5 rounded cursor-pointer transition-colors ${
                            checked
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-700 hover:bg-gray-100"
                          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={() => togglePermission(p.id)}
                            className="w-4 h-4 accent-blue-600"
                          />
                          <span className="truncate">{p.permissionName}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {errors.permissionIds && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {errors.permissionIds}
                </p>
              )}
            </div>
          )}

          {submitError && (
            <div className="mt-5 bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 items-start">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="p-6 border-t border-gray-100 flex justify-between">
          {step > 1 ? (
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            >
              Back
            </button>
          ) : (
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={loadingOptions}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || loadingOptions}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}