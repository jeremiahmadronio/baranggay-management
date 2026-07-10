import { useState, useEffect } from "react";
import { AlertTriangle, Loader2, CheckCircle2, X } from "lucide-react";
import { FormModalShell, FormSectionTitle } from "../../reusable";
import {
  updateAdmin,
  checkEmailAvailability,
  checkUsernameAvailability,
  type AdminTable,
  type UpdateAdmin,
} from "../../service/admin-root-api/admin-management";
import { ActionModal } from "../../hooks/SuccessModal";

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
  "Archive": ["Restore Archived"],
};

interface EditUserModalProps {
  admin: AdminTable;
  onClose: () => void;
}

interface FormData {
  systemEmail: string;
  username: string;
}

type Errors = Partial<
  Record<"systemEmail" | "username", string>
>;

export function EditUserModal({ admin, onClose }: EditUserModalProps) {
  const actorId = localStorage.getItem("userId") ?? "";

  const [formData, setFormData] = useState<FormData>({
    systemEmail: admin.email ?? admin.systemEmail ?? "",
    username: admin.username,
  });

  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Email availability check
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [emailTaken, setEmailTaken] = useState(false);
  const [emailCheckTimeout, setEmailCheckTimeout] =
    useState<NodeJS.Timeout | null>(null);

  // Username availability check
  const [usernameCheckLoading, setUsernameCheckLoading] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [usernameCheckTimeout, setUsernameCheckTimeout] =
    useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // No department/permission options needed for edit
  }, []);



  const validate = (): boolean => {
    const e: Errors = {};
    if (!formData.username.trim()) {
      e.username = "Username is required.";
    }
    if (usernameTaken) {
      e.username = "This username is already taken.";
    }
    if (!formData.systemEmail.trim()) {
      e.systemEmail = "System email is required.";
    }
    if (emailTaken) {
      e.systemEmail = "This email is already taken.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload: UpdateAdmin = {
      systemEmail: formData.systemEmail,
      username: formData.username,
      allDepartments: false,
      departmentIds: [],
      permissionIds: [],
    };

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await updateAdmin(admin.id, actorId, payload);
      setSuccessMessage("Admin account has been updated successfully.");
      setShowSuccessModal(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to update admin.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadingOptions = false;


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
          <button autoFocus
            onClick={handleSave}
            disabled={isSubmitting || loadingOptions}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? "Saving..." : "Save Changes"}
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
              {(
                admin.firstName?.[0] ??
                admin.username?.[0] ??
                "A"
              ).toUpperCase()}
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
                  const newUsername = e.target.value;
                  setFormData((prev) => ({ ...prev, username: newUsername }));
                  if (errors.username)
                    setErrors((prev) => ({ ...prev, username: undefined }));

                  if (usernameCheckTimeout) clearTimeout(usernameCheckTimeout);

                  const originalUsername = admin.username ?? "";
                  if (
                    newUsername.trim().length >= 3 &&
                    newUsername !== originalUsername
                  ) {
                    setUsernameCheckLoading(true);
                    const timeout = setTimeout(async () => {
                      try {
                        const isTaken =
                          await checkUsernameAvailability(newUsername);
                        setUsernameTaken(isTaken);
                      } catch {
                        console.error("Username check error");
                      } finally {
                        setUsernameCheckLoading(false);
                      }
                    }, 500);
                    setUsernameCheckTimeout(timeout);
                  } else {
                    setUsernameTaken(false);
                    setUsernameCheckLoading(false);
                  }
                }}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                  usernameTaken || errors.username
                    ? "border-red-300 bg-red-50 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              {usernameCheckLoading && (
                <Loader2 className="mt-2 w-4 h-4 text-blue-500 animate-spin" />
              )}
              {usernameTaken && (
                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                   This username is already
                  taken
                </p>
              )}
              {errors.username && !usernameTaken && (
                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                  {errors.username}
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
                      setErrors((prev) => ({
                        ...prev,
                        systemEmail: undefined,
                      }));

                    if (emailCheckTimeout) clearTimeout(emailCheckTimeout);

                    const originalEmail =
                      admin.email ?? admin.systemEmail ?? "";
                    if (
                      newEmail.trim() &&
                      newEmail.includes("@") &&
                      newEmail !== originalEmail
                    ) {
                      setEmailCheckLoading(true);
                      const timeout = setTimeout(async () => {
                        try {
                          const isTaken =
                            await checkEmailAvailability(newEmail);
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
                  formData.systemEmail !==
                    (admin.email ?? admin.systemEmail ?? "") && (
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

        {/* Submit error */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 items-start">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}

        {/* Warning */}
      </div>

      <ActionModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          onClose();
        }}
        title="Admin Updated"
        type="success"
      >
        <p>{successMessage}</p>
      </ActionModal>
    </FormModalShell>
  );
}
