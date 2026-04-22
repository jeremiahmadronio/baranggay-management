import { useState, useEffect } from "react";
import { AlertTriangle, Loader2, Search, X, CheckCircle2 } from "lucide-react";
import { FormModalShell, FormSectionTitle } from "../../reusable";
import {
  getDepartmentOptions,
  getPermissionOptions,
  createAdminAccount,
  searchPeople,
  checkEmailAvailability,
  type DepartmentOptions,
  type PermissionOptions,
  type CreateAdmin,
  type PersonSearchResponseDTO,
} from "../../service/admin-root-api/admin-management";
import { ActionModal } from "../../hooks/SuccessModal";

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
  Archive: ["Restore Archived"],
};

type Errors = Partial<
  Record<"systemEmail" | "departments" | "permissions", string>
>;

interface Props {
  onClose: () => void;
}

interface FormData {
  personId: number | null;
  systemEmail: string;
  departmentIds: number[];
  permissionIds: number[];
  activateImmediately: boolean;
  allDepartments: boolean;
}

export default function CreateAdminModal({ onClose }: Props) {
  const [formData, setFormData] = useState<FormData>({
    personId: null,
    systemEmail: "",
    departmentIds: [],
    permissionIds: [],
    activateImmediately: true,
    allDepartments: false,
  });

  const [departments, setDepartments] = useState<DepartmentOptions[]>([]);
  const [permissions, setPermissions] = useState<PermissionOptions[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedResidentName, setSelectedResidentName] = useState<string>("");

  // Resident search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PersonSearchResponseDTO[]>(
    [],
  );
  const [searchLoading, setSearchLoading] = useState(false);

  // Email availability check
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [emailTaken, setEmailTaken] = useState(false);
  const [emailCheckTimeout, setEmailCheckTimeout] =
    useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    Promise.all([getDepartmentOptions(), getPermissionOptions()])
      .then(([depts, perms]) => {
        setDepartments(depts);
        setPermissions(perms);
      })
      .catch(console.error)
      .finally(() => setLoadingOptions(false));
  }, []);

  const toggleDept = (id: number) => {
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
    if (errors.permissions)
      setErrors((prev) => ({ ...prev, permissions: undefined }));
  };

  const handleSearchResident = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const results = await searchPeople(query);
      setSearchResults(results);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectResident = (resident: PersonSearchResponseDTO) => {
    setFormData((prev) => ({
      ...prev,
      personId: resident.id,
    }));
    setSelectedResidentName(`${resident.firstName} ${resident.lastName}`);
    setSearchQuery("");
    setSearchResults([]);
  };

  const validate = (): boolean => {
    const e: Errors = {};
    if (!formData.personId) {
      e.systemEmail = "Please select a resident.";
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
    if (formData.permissionIds.length === 0) {
      e.permissions = "Please select at least one permission.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload: CreateAdmin = {
      personId: formData.personId ?? undefined,
      systemEmail: formData.systemEmail,
      departmentIds: formData.allDepartments ? [] : formData.departmentIds,
      permissionsIds: formData.permissionIds,
      activateImmediately: formData.activateImmediately,
    };

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await createAdminAccount(payload);
      setSuccessMessage("Admin account has been created successfully.");
      setShowSuccessModal(true);
    } catch (err: any) {
      setSubmitError(
        err.message || "Failed to create admin. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModalShell
      isOpen={true}
      onClose={onClose}
      title="Create Admin Account"
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
            onClick={handleSubmit}
            disabled={isSubmitting || loadingOptions}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Admin
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Resident Search */}
        <div>
          <FormSectionTitle title="Select Resident" />
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Resident <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => handleSearchResident(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {searchLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-4 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Searching...
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto mt-2">
              {searchResults.map((resident) => (
                <div
                  key={resident.id}
                  onClick={() => handleSelectResident(resident)}
                  className="p-4 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <p className="font-medium text-gray-900">
                    {resident.firstName} {resident.lastName}
                  </p>
                </div>
              ))}
            </div>
          )}

          {searchQuery && !searchLoading && searchResults.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              <p className="text-sm">
                No residents found. Try a different search.
              </p>
            </div>
          )}

          {formData.personId && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Selected:</span>{" "}
                {selectedResidentName}
              </p>
            </div>
          )}

          {errors.systemEmail && !formData.personId && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {errors.systemEmail}
            </p>
          )}
        </div>

        {/* Account Credentials */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            System Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="email"
              placeholder="Enter system email"
              value={formData.systemEmail}
              onChange={(e) => {
                const newEmail = e.target.value;
                setFormData((prev) => ({ ...prev, systemEmail: newEmail }));
                if (errors.systemEmail)
                  setErrors((prev) => ({ ...prev, systemEmail: undefined }));

                // Debounced email availability check
                if (emailCheckTimeout) clearTimeout(emailCheckTimeout);
                if (newEmail.trim() && newEmail.includes("@")) {
                  setEmailCheckLoading(true);
                  const timeout = setTimeout(async () => {
                    try {
                      const isTaken = await checkEmailAvailability(newEmail);
                      setEmailTaken(isTaken);
                    } catch (err) {
                      console.error("Email check error:", err);
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
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                emailTaken
                  ? "border-red-300 bg-red-50 focus:ring-red-500"
                  : errors.systemEmail && !formData.personId
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
            {!emailCheckLoading && formData.systemEmail && !emailTaken && (
              <CheckCircle2 className="absolute right-3 top-3 w-4 h-4 text-green-500" />
            )}
          </div>
          {emailTaken && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
              This email is already taken
            </p>
          )}
          {errors.systemEmail && !formData.personId && !emailTaken && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {errors.systemEmail}
            </p>
          )}
        </div>

        {/* Department Access */}
        <div>
          <FormSectionTitle title="Department Access" />

          <div className="flex items-center gap-3 mb-4"></div>

          {!formData.allDepartments && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Departments <span className="text-red-500">*</span>
              </label>
              {loadingOptions ? (
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
                  {/* Always show all departments from API, no filtering */}
                  {departments.map((dept) => (
                    <label
                      key={dept.id}
                      className="flex items-center gap-3 p-2.5 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors bg-white"
                    >
                      <input
                        type="checkbox"
                        checked={formData.departmentIds.includes(dept.id)}
                        onChange={() => toggleDept(dept.id)}
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

          {loadingOptions ? (
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

          {errors.permissions && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {errors.permissions}
            </p>
          )}
        </div>

        {/* Account Status */}
        <div>
          <FormSectionTitle title="Account Status" />
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.activateImmediately}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  activateImmediately: e.target.checked,
                }))
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-sm text-gray-700">
              Activate account immediately
            </span>
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
            <span className="font-bold">Important:</span> Admin accounts have
            elevated privileges. Ensure proper authorization before creating
            this account. All admin actions are logged in the audit trail.
          </p>
        </div>
      </div>

      <ActionModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          onClose();
        }}
        title="Admin Created"
        type="success"
      >
        <p>{successMessage}</p>
      </ActionModal>
    </FormModalShell>
  );
}
