import  { useState, useEffect } from "react";
import { AlertTriangle, Loader2, CheckCircle2, X } from "lucide-react";
import { FormModalShell, FormSectionTitle } from "../../reusable";
import {
  updateAdmin,
  getDepartmentOptions,
  getPermissionOptions,
  checkEmailAvailability,
  type AdminTable,
  type UpdateAdmin,
  type DepartmentOptions,
  type PermissionOptions,
} from "../../service/admin-root-api/admin-management";

// Maps backend enum values → display names used by the department options API
const DEPT_ENUM_TO_NAME: Record<string, string> = {
  CLEARANCE: "Barangay Clearance & Certification",
  KAPITANA: "Office of the Barangay Captain",
  FTJS: "FTJS (First Time Job Seekers)",
  LUPONG_TAGAPAMAYAPA: "Lupong Tagapamayapa",
  BCPC: "BCPC (Council for the Protection of Children)",
  BLOTTER: "Blotter Management",
  VAWC: "VAWC (Violence Against Women and Children)",
};

const ALLOWED_PERMISSIONS = [
  "Create users",
  "Edit users",
  "View users",
  "Lock users",
  "Archive users",
  "Create resident",
  "View residents",
  "Edit resident",
  "Archive resident",
  "Create Officer",
  "View Officers",
  "Edit Officer",
  "Restore Archived",
  "Case Re-open",
];

const PERMISSION_GROUPS: Record<string, string[]> = {
  "User Management": [
    "Create users",
    "Edit users",
    "View users",
    "Lock users",
    "Archive users",
  ],
  "Resident Management": [
    "Create resident",
    "View residents",
    "Edit resident",
    "Archive resident",
  ],
  "Officer Management": ["Create Officer", "View Officers", "Edit Officer"],
  "Archive & Cases": ["Restore Archived", "Case Re-open"],
};

interface EditUserModalProps {
  admin: AdminTable;
  onClose: () => void;
}

interface FormData {
  systemEmail: string;
  username: string;
  allDepartments: boolean;
  departmentIds: number[];
  permissionIds: number[];
}

type Errors = Partial<Record<"systemEmail" | "username" | "departments", string>>;

export function EditUserModal({ admin, onClose }: EditUserModalProps) {
  const actorId = localStorage.getItem("userId") ?? "";

  const [departments, setDepartments] = useState<DepartmentOptions[]>([]);
  const [deptLoading, setDeptLoading] = useState(true);
  const [permissions, setPermissions] = useState<PermissionOptions[]>([]);
  const [permLoading, setPermLoading] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    systemEmail: admin.email ?? admin.systemEmail ?? "",
    username: admin.username,
    allDepartments: false,
    departmentIds: [],
    permissionIds: [],
  });

  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Email availability check
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [emailTaken, setEmailTaken] = useState(false);
  const [emailCheckTimeout, setEmailCheckTimeout] =
    useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        setDeptLoading(true);
        setPermLoading(true);

        const [deptOptions, permOptions] = await Promise.all([
          getDepartmentOptions(),
          getPermissionOptions(),
        ]);

        setDepartments(deptOptions);
        setPermissions(permOptions);

        // Convert enum values (e.g. "BLOTTER") → display names (e.g. "Blotter Management")
        // then match against the department options returned by the API
        const adminDeptDisplayNames = (admin.departments ?? []).map((d) => {
          const mapped = DEPT_ENUM_TO_NAME[d.trim().toUpperCase()];
          return (mapped ?? d).trim().toLowerCase();
        });

        const currentDeptIds = deptOptions
          .filter((opt) =>
            adminDeptDisplayNames.includes(opt.name.trim().toLowerCase()),
          )
          .map((opt) => opt.id);

        // Case-insensitive match for permissions
        const adminPermNames = (admin.permissions ?? []).map((p) =>
          p.trim().toLowerCase(),
        );
        const currentPermIds = permOptions
          .filter((opt) =>
            adminPermNames.includes(opt.permissionName.trim().toLowerCase()),
          )
          .map((opt) => opt.id);

        // Set both in one call — no race condition
        setFormData((prev) => ({
          ...prev,
          departmentIds: currentDeptIds,
          permissionIds: currentPermIds,
        }));
      } catch {
        setSubmitError("Failed to load options.");
      } finally {
        setDeptLoading(false);
        setPermLoading(false);
      }
    }

    fetchAll();
  }, []);

  const toggleDepartment = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      departmentIds: prev.departmentIds.includes(id)
        ? prev.departmentIds.filter((d) => d !== id)
        : [...prev.departmentIds, id],
    }));
    if (errors.departments)
      setErrors((prev) => ({ ...prev, departments: undefined }));
  };

  const togglePermission = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(id)
        ? prev.permissionIds.filter((p) => p !== id)
        : [...prev.permissionIds, id],
    }));
  };

  const validate = (): boolean => {
    const e: Errors = {};
    if (!formData.username.trim()) {
      e.username = "Username is required.";
    }
    if (!formData.systemEmail.trim()) {
      e.systemEmail = "System email is required.";
    }
    if (emailTaken) {
      e.systemEmail = "This email is already taken.";
    }
    if (!formData.allDepartments && formData.departmentIds.length === 0) {
      e.departments =
        "Please select at least one department or check 'All Departments'.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload: UpdateAdmin = {
      systemEmail: formData.systemEmail,
      username: formData.username,
      allDepartments: formData.allDepartments,
      departmentIds: formData.allDepartments ? [] : formData.departmentIds,
      permissionIds: formData.permissionIds,
    };

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await updateAdmin(admin.id, actorId, payload);
      setSuccess(true);
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to update admin.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadingOptions = deptLoading || permLoading;

  return (
    <FormModalShell
      isOpen={true}
      onClose={onClose}
      title="Edit Admin Account"
      maxWidthClass="max-w-3xl"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting || success || loadingOptions}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {success ? "Saved!" : isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Admin Identity Info (read-only display) */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-4">
          {admin.photo ? (
            <img
              src={admin.photo}
              alt={admin.username}
              className="w-12 h-12 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg shrink-0">
              {(admin.firstName?.[0] ?? admin.username?.[0] ?? "A").toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {admin.firstName} {admin.lastName}
            </p>
            <p className="text-xs text-gray-500">{admin.roleName}</p>
          </div>
        </div>

        {/* Account Credentials */}
        <div>
          <FormSectionTitle title="Account Credentials" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, username: e.target.value }));
                  if (errors.username)
                    setErrors((prev) => ({ ...prev, username: undefined }));
                }}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                  errors.username
                    ? "border-red-300 bg-red-50 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              {errors.username && (
                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {errors.username}
                </p>
              )}
            </div>

            {/* System Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.systemEmail}
                  onChange={(e) => {
                    const newEmail = e.target.value;
                    setFormData((prev) => ({ ...prev, systemEmail: newEmail }));
                    if (errors.systemEmail)
                      setErrors((prev) => ({ ...prev, systemEmail: undefined }));

                    if (emailCheckTimeout) clearTimeout(emailCheckTimeout);

                    // Only check if email actually changed from original
                    const originalEmail = admin.email ?? admin.systemEmail ?? "";
                    if (
                      newEmail.trim() &&
                      newEmail.includes("@") &&
                      newEmail !== originalEmail
                    ) {
                      setEmailCheckLoading(true);
                      const timeout = setTimeout(async () => {
                        try {
                          const isTaken = await checkEmailAvailability(newEmail);
                          setEmailTaken(isTaken);
                        } catch {
                          console.error("Email check error");
                        } finally {
                          setEmailCheckLoading(false);
                        }
                      }, 500);
                      setEmailCheckTimeout(timeout);
                    } else {
                      setEmailTaken(false);
                      setEmailCheckLoading(false);
                    }
                  }}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors pr-10 ${
                    emailTaken || errors.systemEmail
                      ? "border-red-300 bg-red-50 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
                {emailCheckLoading && (
                  <Loader2 className="absolute right-3 top-3 w-4 h-4 text-blue-500 animate-spin" />
                )}
                {!emailCheckLoading && emailTaken && (
                  <X className="absolute right-3 top-3 w-4 h-4 text-red-500" />
                )}
                {!emailCheckLoading &&
                  formData.systemEmail &&
                  !emailTaken &&
                  formData.systemEmail !== (admin.email ?? admin.systemEmail ?? "") && (
                    <CheckCircle2 className="absolute right-3 top-3 w-4 h-4 text-green-500" />
                  )}
              </div>
              {emailTaken && (
                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> This email is already
                  taken
                </p>
              )}
              {errors.systemEmail && !emailTaken && (
                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {errors.systemEmail}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Department Access */}
        <div>
          <FormSectionTitle title="Department Access" />

          

          {!formData.allDepartments && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Departments <span className="text-red-500">*</span>
              </label>
              {deptLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading
                  departments…
                </div>
              ) : (
                <div
                  className={`grid grid-cols-2 gap-3 p-3 rounded-lg transition-all ${
                    errors.departments
                      ? "border border-red-300 bg-red-50/40"
                      : ""
                  }`}
                >
                  {departments.map((dept) => (
                    <label
                      key={dept.id}
                      className="flex items-center gap-3 p-2.5 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors bg-white"
                    >
                      <input
                        type="checkbox"
                        checked={formData.departmentIds.includes(dept.id)}
                        onChange={() => toggleDepartment(dept.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">{dept.name}</span>
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
        </div>

        {/* Permissions */}
        <div>
          <FormSectionTitle title="Permissions" />

          {permLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading permissions…
            </div>
          ) : permissions.filter((p) =>
              ALLOWED_PERMISSIONS.some((allowed) =>
                p.permissionName.toLowerCase().includes(allowed.toLowerCase()),
              ),
            ).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(PERMISSION_GROUPS).map(([group, permNames]) => {
                const groupPermissions = permissions.filter(
                  (p) =>
                    permNames.some((perm) =>
                      p.permissionName
                        .toLowerCase()
                        .includes(perm.toLowerCase()),
                    ) &&
                    ALLOWED_PERMISSIONS.some((allowed) =>
                      p.permissionName
                        .toLowerCase()
                        .includes(allowed.toLowerCase()),
                    ),
                );
                if (groupPermissions.length === 0) return null;
                return (
                  <div key={group}>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      {group}
                    </h4>
                    <div className="grid grid-cols-2 gap-3 pl-2">
                      {groupPermissions.map((perm) => (
                        <label
                          key={perm.id}
                          className="flex items-center gap-3 p-2.5 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors bg-white"
                        >
                          <input
                            type="checkbox"
                            checked={formData.permissionIds.includes(perm.id)}
                            onChange={() => togglePermission(perm.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-sm text-gray-700">
                            {perm.permissionName}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No permissions available.</p>
          )}
        </div>

        {/* Submit error */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 items-start">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex gap-2 items-start">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">Admin updated successfully!</p>
          </div>
        )}

        {/* Warning */}
       
      </div>
    </FormModalShell>
  );
}