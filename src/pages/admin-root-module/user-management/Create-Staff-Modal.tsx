"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  userManagementApi,
  type CreateUserPayload,
  type Department,
  type Permission,
  type PersonSearchResponseDTO,
  type Role,
} from "../../../service/admin-root-api/user-management";
import { ActionModal } from "../../../reusable";
import { FormModalShell, FormSectionTitle } from "../../../reusable";
import {
  filterPermissionsByDepartments,
  filterRolesByDepartments,
} from "./role-department-map";

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  person: PersonSearchResponseDTO | null;
  username: string;
  systemEmail: string;
  roleId: number | null;
  departmentId: number | null;
  permissionIds: number[];
  activateImmediately: boolean;
}

type Errors = Partial<
  Record<
    | "person"
    | "username"
    | "systemEmail"
    | "roleId"
    | "departmentIds"
    | "permissionIds",
    string
  >
>;

const USERNAME_MIN_LENGTH = 4;
const USERNAME_MAX_LENGTH = 20;
const SYSTEM_EMAIL_MAX_LENGTH = 100;
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

const normalizeUsernameInput = (value: string) =>
  value
    .replace(/\s+/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, USERNAME_MAX_LENGTH);

function fieldClass(hasError: boolean) {
  return `w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
    hasError ? "border-red-500" : "border-gray-300"
  }`;
}

export default function CreateStaffModal({ onClose, onSuccess }: Props) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PersonSearchResponseDTO[]>(
    [],
  );
  const [searchLoading, setSearchLoading] = useState(false);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const [form, setForm] = useState<FormData>({
    person: null,
    username: "",
    systemEmail: "",
    roleId: null,
    departmentId: null,
    permissionIds: [],
    activateImmediately: true,
  });

  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true);
      setOptionsError(null);
      const [deptsRes, rolesRes, permsRes] = await Promise.allSettled([
        userManagementApi.getDepartmentOptions(),
        userManagementApi.getRoleOptions(),
        userManagementApi.getPermissionOptions(),
      ]);

      const failed: string[] = [];

      if (deptsRes.status === "fulfilled") {
        setDepartments(deptsRes.value || []);
      } else {
        setDepartments([]);
        failed.push("departments");
      }

      if (rolesRes.status === "fulfilled") {
        setRoles(rolesRes.value || []);
      } else {
        setRoles([]);
        failed.push("roles");
      }

      if (permsRes.status === "fulfilled") {
        setPermissions(permsRes.value || []);
      } else {
        setPermissions([]);
        failed.push("permissions");
      }

      if (failed.length > 0) {
        setOptionsError(`Some options failed to load: ${failed.join(", ")}.`);
      }

      setLoadingOptions(false);
    };

    loadOptions();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (
      trimmed.length < 2 ||
      (form.person?.id && trimmed === fullName(form.person))
    ) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await userManagementApi.searchPeople(trimmed);
        if (!active) return;
        setSearchResults(res);
      } catch {
        if (!active) return;
        setSearchResults([]);
      } finally {
        if (active) setSearchLoading(false);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, form.person]);

  const filteredRoles = useMemo(
    () =>
      filterRolesByDepartments(
        roles,
        departments,
        form.departmentId ? [form.departmentId] : [],
      ),
    [roles, departments, form.departmentId],
  );

  const filteredPermissions = useMemo(
    () =>
      filterPermissionsByDepartments(
        permissions,
        departments,
        form.departmentId ? [form.departmentId] : [],
      ),
    [permissions, departments, form.departmentId],
  );

  const allPermissionsSelected =
    filteredPermissions.length > 0 &&
    filteredPermissions.every((p) => form.permissionIds.includes(p.id));

  const previousDepartmentIdRef = useRef<number | null>(null);

  const selectedPersonName = useMemo(
    () => (form.person ? fullName(form.person) : ""),
    [form.person],
  );

  useEffect(() => {
    if (!form.roleId) return;
    if (!filteredRoles.some((r) => r.id === form.roleId)) {
      setForm((prev) => ({ ...prev, roleId: null }));
    }
  }, [filteredRoles, form.roleId]);

  useEffect(() => {
    const departmentChanged = previousDepartmentIdRef.current !== form.departmentId;

    if (departmentChanged) {
      previousDepartmentIdRef.current = form.departmentId;

      if (filteredPermissions.length > 0) {
        setForm((prev) => ({
          ...prev,
          permissionIds: filteredPermissions.map((permission) => permission.id),
        }));
      } else if (form.permissionIds.length > 0) {
        setForm((prev) => ({ ...prev, permissionIds: [] }));
      }
    }
  }, [filteredPermissions, form.departmentId, form.permissionIds.length]);

  const setField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const toggleId = (
    source: number[],
    setSource: (value: number[]) => void,
    id: number,
  ) => {
    if (source.includes(id)) {
      setSource(source.filter((x) => x !== id));
      return;
    }
    setSource([...source, id]);
  };

  const validate = () => {
    const next: Errors = {};
    if (!form.person) next.person = "Please select a resident/person.";

    const username = form.username.trim();
    const systemEmail = form.systemEmail.trim();

    if (!username) {
      next.username = "Username is required.";
    } else if (username.length < USERNAME_MIN_LENGTH) {
      next.username = `Username must be at least ${USERNAME_MIN_LENGTH} characters.`;
    } else if (username.length > USERNAME_MAX_LENGTH) {
      next.username = `Username must be at most ${USERNAME_MAX_LENGTH} characters.`;
    } else if (!USERNAME_PATTERN.test(username)) {
      next.username =
        "Username can only use letters, numbers, dot (.), underscore (_), and hyphen (-).";
    }

    if (!systemEmail) {
      next.systemEmail = "System email is required.";
    } else if (systemEmail.length > SYSTEM_EMAIL_MAX_LENGTH) {
      next.systemEmail = `System email must be at most ${SYSTEM_EMAIL_MAX_LENGTH} characters.`;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(systemEmail)) {
      next.systemEmail = "Please enter a valid email address.";
    }

    if (!form.roleId) next.roleId = "Please select a role.";
    if (!form.departmentId) {
      next.departmentIds = "Select at least one department.";
    }
    if (filteredPermissions.length > 0 && form.permissionIds.length === 0) {
      next.permissionIds = "Select at least one permission.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleUsernameBlur = async () => {
    const username = form.username.trim();
    if (
      !username ||
      username.length < USERNAME_MIN_LENGTH ||
      !USERNAME_PATTERN.test(username)
    )
      return;
    setCheckingUsername(true);
    try {
      const taken = await userManagementApi.checkUsernameExists(username);
      if (taken) {
        setErrors((prev) => ({
          ...prev,
          username: "Username is already taken.",
        }));
      }
    } catch {
      // silently ignore network errors on blur check
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleEmailBlur = async () => {
    const email = form.systemEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setCheckingEmail(true);
    try {
      const taken = await userManagementApi.checkEmailExists(email);
      if (taken) {
        setErrors((prev) => ({
          ...prev,
          systemEmail: "This email is already in use.",
        }));
      }
    } catch {
      // silently ignore network errors on blur check
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) {
      setSubmitError("Please fix required fields before registering.");
      return;
    }

    // Block submit if async checks are still in progress
    if (checkingUsername || checkingEmail) {
      setSubmitError("Please wait while we validate the username and email.");
      return;
    }

    // Block if duplicates were already detected
    if (errors.username || errors.systemEmail) {
      setSubmitError("Please fix the highlighted fields before registering.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const username = form.username.trim();
    const systemEmail = form.systemEmail.trim();

    try {
      const payload: CreateUserPayload = {
        personId: form.person!.id,
        accountType: "SYSTEM_USER",
        username,
        systemEmail,
        roleId: form.roleId!,
        departmentIds: [form.departmentId!],
        permissionIds: form.permissionIds,
        activateImmediately: form.activateImmediately,
      };

      await userManagementApi.createUser(payload);
      setSubmitSuccess(true);
      onSuccess?.();
    } catch (err) {
      setSubmitError(
        err instanceof Error && err.message
          ? err.message
          : "Unable to create user account.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <FormModalShell
        isOpen={!submitSuccess}
        onClose={onClose}
        title="Create User Account"
        maxWidthClass="max-w-4xl"
        footer={
          !submitSuccess ? (
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || loadingOptions}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
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
          <div className="space-y-7">
            <div className="space-y-4">
              <FormSectionTitle title="Person & Account" />

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resident / Person <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    const next = e.target.value;
                    setQuery(next);
                    if (
                      form.person &&
                      next.trim().toLowerCase() !==
                        fullName(form.person).toLowerCase()
                    ) {
                      setField("person", null);
                    }
                  }}
                  placeholder="Search by resident name..."
                  className={fieldClass(!!errors.person)}
                />

                {form.person && (
                  <p className="mt-1 text-xs text-emerald-600">
                    Selected: {selectedPersonName}
                  </p>
                )}

                {(query.trim().length >= 2 || searchLoading) &&
                  !form.person && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                      {searchLoading ? (
                        <p className="px-3 py-2 text-xs text-gray-500">
                          Searching...
                        </p>
                      ) : searchResults.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-gray-500">
                          No matching resident found.
                        </p>
                      ) : (
                        searchResults.map((person) => (
                          <button
                            key={person.id}
                            type="button"
                            onClick={() => {
                              setField("person", person);
                              setQuery(fullName(person));
                              setSearchResults([]);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                          >
                            <p className="text-sm font-medium text-gray-800">
                              {fullName(person)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(person.barangayIdNumber
                                ? `${person.barangayIdNumber} • `
                                : "") +
                                (person.completeAddress || "No address")}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                {errors.person && (
                  <p className="text-xs text-red-500 mt-1">{errors.person}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <span
                      className={`text-[10px] ${
                        form.username.length >= USERNAME_MAX_LENGTH
                          ? "text-red-500 font-bold"
                          : "text-gray-400"
                      }`}
                    >
                      {form.username.length}/{USERNAME_MAX_LENGTH}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={form.username}
                      onChange={(e) =>
                        setField(
                          "username",
                          normalizeUsernameInput(e.target.value),
                        )
                      }
                      onBlur={handleUsernameBlur}
                      maxLength={USERNAME_MAX_LENGTH}
                      placeholder="juan.delacruz"
                      className={fieldClass(!!errors.username)}
                    />
                    {checkingUsername && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                        Checking…
                      </span>
                    )}
                  </div>

                  {errors.username && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.username}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      System Email <span className="text-red-500">*</span>
                    </label>
                    <span
                      className={`text-[10px] ${
                        form.systemEmail.length >= SYSTEM_EMAIL_MAX_LENGTH
                          ? "text-red-500 font-bold"
                          : "text-gray-400"
                      }`}
                    >
                      {form.systemEmail.length}/{SYSTEM_EMAIL_MAX_LENGTH}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="email"
                      value={form.systemEmail}
                      onChange={(e) =>
                        setField("systemEmail", e.target.value.trimStart())
                      }
                      onBlur={async (e) => {
                        const value = e.target.value.trim();
                        if (
                          value &&
                          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                        ) {
                          setErrors((prev) => ({
                            ...prev,
                            systemEmail: "Please enter a valid email address.",
                          }));
                          return;
                        }
                        await handleEmailBlur();
                      }}
                      maxLength={SYSTEM_EMAIL_MAX_LENGTH}
                      placeholder="juan@barangay.gov.ph"
                      className={fieldClass(!!errors.systemEmail)}
                    />
                    {checkingEmail && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                        Checking…
                      </span>
                    )}
                  </div>

                  {errors.systemEmail && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.systemEmail}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <FormSectionTitle title="Access Setup" />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departments <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.departmentId ?? ""}
                  onChange={(e) => {
                    const nextDepartmentId = e.target.value
                      ? Number(e.target.value)
                      : null;
                    setField("departmentId", nextDepartmentId);
                    setField("roleId", null);
                  }}
                  className={fieldClass(!!errors.departmentIds)}
                  disabled={loadingOptions}
                >
                  <option value="">Select a department</option>
                  {/* Always show all departments from API, no filtering */}
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {errors.departmentIds && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.departmentIds}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.roleId ?? ""}
                  onChange={(e) =>
                    setField(
                      "roleId",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  className={fieldClass(!!errors.roleId)}
                  disabled={loadingOptions || !form.departmentId}
                >
                  <option value="">
                    {!form.departmentId
                      ? "Select department first"
                      : "Select a role"}
                  </option>
                  {filteredRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.roleName}
                    </option>
                  ))}
                </select>
                {form.departmentId && filteredRoles.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No role mapping available for selected department(s).
                  </p>
                )}
                {errors.roleId && (
                  <p className="text-xs text-red-500 mt-1">{errors.roleId}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Permissions <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setField(
                        "permissionIds",
                        allPermissionsSelected
                          ? []
                          : filteredPermissions.map((p) => p.id),
                      )
                    }
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    disabled={
                      !form.departmentId || filteredPermissions.length === 0
                    }
                  >
                    {allPermissionsSelected ? "Clear all" : "Select all"}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50/60 max-h-56 overflow-y-auto">
                  {!form.departmentId ? (
                    <p className="text-xs text-gray-500">
                      Select department first.
                    </p>
                  ) : filteredPermissions.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      No permission mapping available for selected department.
                    </p>
                  ) : (
                    filteredPermissions.map((perm) => (
                      <label
                        key={perm.id}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={form.permissionIds.includes(perm.id)}
                          onChange={() =>
                            toggleId(
                              form.permissionIds,
                              (v) => setField("permissionIds", v),
                              perm.id,
                            )
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                        />
                        {perm.permissionName}
                      </label>
                    ))
                  )}
                </div>
                {errors.permissionIds && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.permissionIds}
                  </p>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700 p-3 border border-gray-200 rounded-lg bg-gray-50/60">
                <input
                  type="checkbox"
                  checked={form.activateImmediately}
                  onChange={(e) =>
                    setField("activateImmediately", e.target.checked)
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                Activate account immediately
              </label>

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
        title="User Created"
        type="success"
      >
        <p>
          User account for{" "}
          <span className="font-semibold">{selectedPersonName}</span> was
          created successfully.
        </p>
      </ActionModal>
    </>
  );
}

function fullName(person: PersonSearchResponseDTO): string {
  return [person.firstName, person.middleName, person.lastName]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
