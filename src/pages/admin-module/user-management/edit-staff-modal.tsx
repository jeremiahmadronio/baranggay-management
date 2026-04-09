"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  userManagementApi,
  type Department,
  type EditUserPayload,
  type Permission,
  type Role,
  type UserTable,
  type UserViewDTO,
} from "../../../service/admin-module-api/user-management";
import { ActionModal } from "../../../hooks/SuccessModal";
import { FormModalShell, FormSectionTitle } from "../../../reusable";
import {
  filterPermissionsByDepartments,
  filterRolesByDepartments,
  resolveDeptKey,
} from "./role-department-map";

interface Props {
  user: UserTable;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  username: string;
  systemEmail: string;
  roleId: number | null;
  departmentId: number | null;
  permissionIds: number[];
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
}

type Errors = Partial<
  Record<
    "username" | "systemEmail" | "roleId" | "departmentIds" | "permissionIds",
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

export function EditStaffModal({ user, onClose, onSuccess }: Props) {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const [details, setDetails] = useState<UserViewDTO | null>(null);

  const [form, setForm] = useState<FormData>({
    username: user.username,
    systemEmail: "",
    roleId: null,
    departmentId: null,
    permissionIds: [],
    status:
      user.status?.toUpperCase() === "ARCHIVED"
        ? "ARCHIVED"
        : user.status?.toUpperCase() === "INACTIVE"
          ? "INACTIVE"
          : "ACTIVE",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoadingProfile(true);
      try {
        const res = await userManagementApi.getUserDetails(user.id);
        setDetails(res);
        setForm((prev) => ({
          ...prev,
          username: res.username || user.username,
          systemEmail: res.systemEmail || "",
          status:
            res.status?.toUpperCase() === "ARCHIVED"
              ? "ARCHIVED"
              : res.status?.toUpperCase() === "INACTIVE"
                ? "INACTIVE"
                : "ACTIVE",
        }));
      } catch {
        setSubmitError("Unable to load user details.");
      } finally {
        setLoadingProfile(false);
      }
    };

    load();
  }, [user.id, user.username]);

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
    if (!details || roles.length === 0 || departments.length === 0) {
      return;
    }

    const roleCandidates = [details.roleName, user.roleName].filter(Boolean);
    const roleId =
      roles.find((r) =>
        roleCandidates.some(
          (candidate) =>
            normalizeComparable(r.roleName) === normalizeComparable(candidate),
        ),
      )?.id ?? null;

    const departmentNames = [
      ...splitDepartmentNames(details.departments),
      user.departmentName,
    ].filter(Boolean) as string[];

    const departmentIds = departmentNames
      .map((name) => findDepartmentIdByAssignedName(departments, name))
      .filter((id): id is number => typeof id === "number");

    const permissionNames = [
      ...(details.permissions || []),
      ...(user.permissions || []),
    ];

    const permissionIds = permissions.length
      ? permissions
          .filter((p) =>
            permissionNames.some(
              (perm) =>
                normalizeComparable(perm) ===
                normalizeComparable(p.permissionName),
            ),
          )
          .map((p) => p.id)
      : [];

    setForm((prev) => ({
      ...prev,
      roleId,
      departmentId: departmentIds[0] ?? null,
      permissionIds,
    }));
  }, [
    details,
    roles,
    departments,
    permissions,
    user.departmentName,
    user.permissions,
    user.roleName,
  ]);

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

  const loading = loadingProfile || loadingOptions;

  useEffect(() => {
    if (!form.roleId) return;
    if (!filteredRoles.some((r) => r.id === form.roleId)) {
      setForm((prev) => ({ ...prev, roleId: null }));
    }
  }, [filteredRoles, form.roleId]);

  useEffect(() => {
    const allowedPermissionIds = new Set(filteredPermissions.map((p) => p.id));
    const nextPermissionIds = form.permissionIds.filter((id) =>
      allowedPermissionIds.has(id),
    );

    if (nextPermissionIds.length !== form.permissionIds.length) {
      setForm((prev) => ({ ...prev, permissionIds: nextPermissionIds }));
    }
  }, [filteredPermissions, form.permissionIds]);

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

  const handleSubmit = async () => {
    if (!validate()) {
      setSubmitError("Please fix required fields before saving.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const username = form.username.trim();
    const systemEmail = form.systemEmail.trim();

    try {
      const payload: EditUserPayload = {
        username,
        systemEmail,
        roleId: form.roleId!,
        departmentIds: [form.departmentId!],
        permissionIds: form.permissionIds,
        status: form.status,
      };

      await userManagementApi.updateUser(user.id, payload);
      setSubmitSuccess(true);
      onSuccess?.();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Unable to update user account.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayName = useMemo(
    () => `${user.firstName} ${user.lastName}`.trim(),
    [user.firstName, user.lastName],
  );

  return (
    <>
      <FormModalShell
        isOpen
        onClose={onClose}
        title="Edit User Account"
        maxWidthClass="max-w-4xl"
        footer={
          !submitSuccess ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">@{user.username}</p>
              <div className="flex items-center gap-3">
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
                  disabled={isSubmitting || loading}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
                >
                  {(isSubmitting || loading) && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
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
              <FormSectionTitle title="Account Information" />

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
                  <input
                    value={form.username}
                    onChange={(e) =>
                      setField(
                        "username",
                        normalizeUsernameInput(e.target.value),
                      )
                    }
                    maxLength={USERNAME_MAX_LENGTH}
                    className={fieldClass(!!errors.username)}
                    disabled={loading}
                  />
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
                  <input
                    type="email"
                    value={form.systemEmail}
                    onChange={(e) =>
                      setField("systemEmail", e.target.value.trimStart())
                    }
                    maxLength={SYSTEM_EMAIL_MAX_LENGTH}
                    className={fieldClass(!!errors.systemEmail)}
                    disabled={loading}
                  />
                  {errors.systemEmail && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.systemEmail}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setField(
                      "status",
                      (e.target.value as "ACTIVE" | "INACTIVE" | "ARCHIVED") ||
                        "ACTIVE",
                    )
                  }
                  className={fieldClass(false)}
                  disabled={loading}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
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
                  disabled={loading}
                >
                  <option value="">Select a department</option>
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
                  disabled={loading || !form.departmentId}
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
                    disabled={loading}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
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
                          disabled={loading}
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
        title="User Updated"
        type="success"
      >
        <p>
          User account for <span className="font-semibold">{displayName}</span>{" "}
          was updated successfully.
        </p>
      </ActionModal>
    </>
  );
}

function normalizeComparable(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "");
}

function splitDepartmentNames(value: string | null | undefined): string[] {
  return String(value ?? "")
    .split(/[,/;|]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function findDepartmentIdByAssignedName(
  departments: Department[],
  assignedName: string,
): number | null {
  const normalizedAssigned = normalizeComparable(assignedName);
  const assignedKey = resolveDeptKey(assignedName);

  const exact = departments.find(
    (d) => normalizeComparable(d.name) === normalizedAssigned,
  );
  if (exact) return exact.id;

  const fuzzy = departments.find((d) => {
    const normalizedOption = normalizeComparable(d.name);
    return (
      normalizedOption.includes(normalizedAssigned) ||
      normalizedAssigned.includes(normalizedOption)
    );
  });
  if (fuzzy) return fuzzy.id;

  if (assignedKey) {
    const byKey = departments.find(
      (d) => resolveDeptKey(d.name) === assignedKey,
    );
    if (byKey) return byKey.id;
  }

  return null;
}
