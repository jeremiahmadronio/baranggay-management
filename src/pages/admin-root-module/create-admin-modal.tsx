import { useState, useEffect, useRef } from "react";
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setIsSearchOpen(false);
        return;
      }

      try {
        setSearchLoading(true);
        const results = await searchPeople(searchQuery);
        setSearchResults(results);
        setIsSearchOpen(true);
      } catch (err) {
        console.error("Search error:", err);
        setSearchResults([]);
        setIsSearchOpen(true);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectResident = (resident: PersonSearchResponseDTO) => {
    setFormData((prev) => ({
      ...prev,
      personId: resident.id,
    }));
    setSelectedResidentName(`${resident.firstName} ${resident.lastName}`);
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchOpen(false);
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

    const resolvedDepartmentIds = formData.allDepartments
      ? departments.map((d) => d.id)
      : formData.departmentIds;

    const payload: CreateAdmin = {
      personId: formData.personId ?? undefined,
      accountType: "ADMIN",
      systemEmail: formData.systemEmail,
      departmentIds: resolvedDepartmentIds,
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
          <div className="relative" ref={searchWrapperRef}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {searchLoading ? (
                  <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 text-slate-400" />
                )}
              </div>
              <input
                type="text"
                placeholder="Type resident name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (
                    searchResults.length > 0 ||
                    searchQuery.trim().length >= 2
                  ) {
                    setIsSearchOpen(true);
                  }
                }}
                className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            {isSearchOpen && searchQuery.trim().length >= 2 && (
              <div className="absolute z-20 mt-1 w-full bg-white rounded-lg shadow-lg border border-blue-100 max-h-60 overflow-auto">
                {searchResults.length > 0 ? (
                  <ul className="py-1">
                    {searchResults.map((resident) => (
                      <li
                        key={resident.id}
                        onClick={() => handleSelectResident(resident)}
                        className="px-4 py-2 hover:bg-blue-50/50 cursor-pointer border-b border-slate-100 last:border-0"
                      >
                        <div className="font-medium text-sm text-slate-900">
                          {resident.firstName}{" "}
                          {resident.middleName ? `${resident.middleName} ` : ""}
                          {resident.lastName}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate">
                          {resident.completeAddress || "No address"}{" "}
                          {resident.contactNumber
                            ? `• ${resident.contactNumber}`
                            : ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  !searchLoading && (
                    <div className="px-4 py-3 text-sm text-slate-500 text-center">
                      No residents found for "{searchQuery}"
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
            <p className="mt-2 text-xs text-slate-500">
              Type at least 2 characters to search.
            </p>
          )}

          {formData.personId && (
            <div className="mt-3 flex items-center justify-between gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-gray-700 truncate">
                <span className="font-semibold">Selected:</span>{" "}
                {selectedResidentName}
              </p>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, personId: null }));
                  setSelectedResidentName("");
                }}
                className="text-xs font-medium text-green-700 hover:text-green-800 whitespace-nowrap"
              >
                Change
              </button>
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
