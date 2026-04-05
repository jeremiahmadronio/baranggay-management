"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, AlertTriangle, ChevronDown, Loader2 } from "lucide-react";
import {
  userManagementApi,
  type Department,
  type Role,
  type Permission,
  type CreateUserPayload,
} from "../admin-module-api/user-management";
import { ActionModal } from "../reusable/SuccessModal";
import { FormModalShell, FormSectionTitle } from "../reusable";

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

interface FormData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  contactNumber: string;
  departmentId: number | null;
  roleId: number | null;
  permissionIds: number[];
  activateImmediately: boolean;
}

type Errors = Partial<Record<keyof FormData, string>>;

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

const VIEW_DEPENDENTS = ["edit", "delete", "generate report", "issue cert"];

function SelectSkeleton() {
  return (
    <div className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-400 flex items-center gap-2 bg-gray-50 animate-pulse">
      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      <span>Loading…</span>
    </div>
  );
}

export default function CreateStaffModal({ onClose, onSuccess }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const [departments, setDepartments] = useState<Department[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    contactNumber: "",
    departmentId: null,
    roleId: null,
    permissionIds: [],
    activateImmediately: true,
  });

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
      } catch {
        setOptionsError("Failed to load options. Please try again.");
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    setFilteredRoles(allRoles);
    setForm((prev) => ({ ...prev, roleId: null }));
  }, [form.departmentId, allRoles]);

  const setField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const inputClass = (field: keyof FormData) =>
    `w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      errors[field] ? "border-red-500" : "border-gray-300"
    }`;

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
      } else if (viewPerm && id === viewPerm.id) {
        const dependentIds = permissions
          .filter((p) => requiresView(p))
          .map((p) => p.id);
        next = next.filter((pid) => !dependentIds.includes(pid));
      }

      return { ...prev, permissionIds: next };
    });

    setErrors((prev) => ({ ...prev, permissionIds: undefined }));
  };

  const getDisplayPermissions = () => {
    const selectedDept = departments
      .find((d) => d.id === form.departmentId)
      ?.name?.toUpperCase();

    if (selectedDept === "BLOTTER") {
      const allowed = [
        "VIEW BLOTTER RECORDS",
        "CREATE BLOTTER ENTRY",
        "MANAGE HEARINGS & MEDIATION",
        "UPDATE CASE STATUS",
      ];
      return permissions.filter((p) =>
        allowed.includes(p.permissionName.toUpperCase()),
      );
    }

    if (selectedDept === "LUPONG_TAGAPAMAYAPA") {
      const allowed = [
        "VIEW BLOTTER RECORDS",
        "MANAGE HEARINGS & MEDIATION",
        "UPDATE CASE STATUS",
      ];
      return permissions.filter((p) =>
        allowed.includes(p.permissionName.toUpperCase()),
      );
    }

    return permissions.filter(
      (p) => !p.permissionName.toLowerCase().includes("all access"),
    );
  };

  const displayPerms = getDisplayPermissions();
  const allSelected =
    displayPerms.length > 0 &&
    displayPerms.every((p) => form.permissionIds.includes(p.id));
  const someSelected = form.permissionIds.length > 0 && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setForm((prev) => ({
        ...prev,
        permissionIds: prev.permissionIds.filter(
          (id) => !displayPerms.some((p) => p.id === id),
        ),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        permissionIds: Array.from(
          new Set([...prev.permissionIds, ...displayPerms.map((p) => p.id)]),
        ),
      }));
    }
    setErrors((prev) => ({ ...prev, permissionIds: undefined }));
  };

  const validateForm = (): boolean => {
    const e: Errors = {};

    if (!form.username.trim()) {
      e.username = "Username is required.";
    } else if (form.username.trim().length < 3) {
      e.username = "Username must be at least 3 characters.";
    }

    if (!form.firstName.trim()) e.firstName = "First name is required.";
    if (!form.lastName.trim()) e.lastName = "Last name is required.";

    if (!form.email.trim()) {
      e.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Please enter a valid email address.";
    }

    if (!form.password) {
      e.password = "Password is required.";
    } else if (!isPasswordValid(form.password)) {
      e.password = "Password does not meet all requirements.";
    }

    if (!form.contactNumber.trim()) {
      e.contactNumber = "Contact number is required.";
    } else if (!/^(09|\+639)\d{9}$/.test(form.contactNumber)) {
      e.contactNumber = "Enter a valid PH number (e.g. 09171234567).";
    }

    if (!form.departmentId) e.departmentId = "Please select a department.";
    if (!form.roleId) e.roleId = "Please select a role.";

    if (form.permissionIds.length === 0) {
      e.permissionIds = "Select at least one permission.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setSubmitError(
        "Please fix the highlighted required fields before submitting.",
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload: CreateUserPayload = {
        username: form.username,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        contactNumber: form.contactNumber,
        roleId: form.roleId!,
        departmentIds: form.departmentId ? [form.departmentId] : [],
        permissionIds: form.permissionIds,
        activateImmediately: form.activateImmediately,
      };

      await userManagementApi.createUser(payload);
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

  const viewPerm = getViewPermission();
  const viewIsForced = isViewForced();

  return (
    <>
      <FormModalShell
        isOpen={true}
        onClose={onClose}
        title="Create Staff Account"
        maxWidthClass="max-w-4xl"
        footer={
          !submitSuccess ? (
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? "Creating..." : "Create Account"}
              </button>
            </div>
          ) : undefined
        }
      >
        {optionsError && (
          <div className="mb-5 bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 items-start">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{optionsError}</p>
          </div>
        )}

        {!submitSuccess && (
          <div className="space-y-8">
            <div className="space-y-5">
              <FormSectionTitle title="Personal Information" />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  className={inputClass("username")}
                  placeholder="juandelacruz"
                  value={form.username}
                  onChange={(e) => setField("username", e.target.value)}
                />
                {errors.username && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {errors.username}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className={inputClass("email")}
                    placeholder="juan.delacruz@ugong.gov.ph"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
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
                      <AlertTriangle className="w-3 h-3" />{" "}
                      {errors.contactNumber}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`${inputClass("password")} pr-10`}
                    placeholder="Create a strong password"
                    value={form.password}
                    onFocus={() => setPwFocused(true)}
                    onBlur={() => setPwFocused(false)}
                    onChange={(e) => setField("password", e.target.value)}
                  />
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
                </div>
                {(pwFocused || form.password.length > 0) && (
                  <ul className="mt-2 space-y-1">
                    {PW_REQS.map((req) => {
                      const met = req.test(form.password);
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
                      );
                    })}
                  </ul>
                )}
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {errors.password}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <FormSectionTitle title="Department & Role" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Department <span className="text-red-500">*</span>
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
                        className={`${inputClass("departmentId")} appearance-none bg-white pr-9`}
                      >
                        <option value="">Select a department</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  )}
                  {errors.departmentId && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />{" "}
                      {errors.departmentId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                        disabled={!form.departmentId}
                        className={`${inputClass("roleId")} appearance-none bg-white pr-9 disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <option value="">Select a role</option>
                        {filteredRoles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.roleName}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  )}
                  {errors.roleId && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {errors.roleId}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">Note:</span> Each department
                  has specific roles with predefined responsibilities.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <FormSectionTitle title="Access Permissions" />

              <div>
                {loadingOptions ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="h-12 bg-gray-100 rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    className={`border rounded-lg overflow-hidden divide-y divide-gray-100 transition-all ${
                      errors.permissionIds
                        ? "border-red-300"
                        : "border-gray-200"
                    }`}
                  >
                    <label className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someSelected;
                        }}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-gray-700">
                        All Permissions
                      </span>
                      {someSelected && (
                        <span className="ml-auto text-xs text-gray-400">
                          {form.permissionIds.length} of {displayPerms.length}{" "}
                          selected
                        </span>
                      )}
                    </label>

                    {displayPerms.map((p) => {
                      const isView = viewPerm?.id === p.id;
                      const isForced = isView && viewIsForced;
                      const depLabel = requiresView(p) ? "requires View" : null;

                      return (
                        <label
                          key={p.id}
                          className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                            isForced
                              ? "bg-blue-50 cursor-not-allowed"
                              : "hover:bg-gray-50 cursor-pointer"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={form.permissionIds.includes(p.id)}
                            onChange={() => !isForced && togglePermission(p.id)}
                            disabled={isForced}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                          />
                          <span
                            className={`text-sm font-medium ${
                              isForced ? "text-blue-700" : "text-gray-700"
                            }`}
                          >
                            {p.permissionName}
                          </span>
                          {depLabel && (
                            <span className="ml-auto text-xs text-gray-400 italic">
                              {depLabel}
                            </span>
                          )}
                          {isForced && (
                            <span className="ml-auto text-xs text-blue-500 italic">
                              required
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}

                {errors.permissionIds && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {errors.permissionIds}
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Account Status
                </h3>
                <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.activateImmediately}
                    onChange={(e) =>
                      setField("activateImmediately", e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">
                    Activate account immediately
                  </span>
                </label>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                <p className="text-sm text-amber-800 leading-relaxed">
                  <span className="font-semibold">Security Note:</span> The
                  staff member will receive an email with login credentials and
                  must change their password on first login.
                </p>
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 items-start">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </FormModalShell>

      <ActionModal
        isOpen={submitSuccess}
        onClose={onClose}
        title="Account Created!"
        type="success"
      >
        <p>
          <span className="font-semibold">
            {form.firstName} {form.lastName}
          </span>
          's staff account has been successfully created.
        </p>
      </ActionModal>
    </>
  );
}
