import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  User,
  Shield,
  Mail,
  Smartphone,
  Camera,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { TotpSetupModal } from "../../../pages/admin-root-module/modal/settings-Totp";
import { BackupEmailModal } from "../../../pages/admin-root-module/modal/settings-backup";
import { ActionModal } from "../../../hooks/SuccessModal";
import {
  checkEmailAvailability,
  checkUsernameAvailability,
  getSettingsPreview,
  updateSettings,
  type SettingsPreview,
} from "../../../service/admin-root-api/admin-management";

interface ProfileState {
  username: string;
  firstName: string;
  lastName: string;
  systemEmail: string;
  contactNumber: string;
  roleName: string;
  systemBackupEmail: string;
  mfaType: string;
  totpEnabled: boolean;
  createdAt: string;
  lastLoginAt: string;
  photo: string | null;
}

const EMPTY_PROFILE: ProfileState = {
  username: "",
  firstName: "",
  lastName: "",
  systemEmail: "",
  contactNumber: "",
  roleName: "ADMIN",
  systemBackupEmail: "",
  mfaType: "TOTP",
  totpEnabled: false,
  createdAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
  photo: null,
};

export function Settings() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ActionModal state
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "danger" | "info";
  }>({ isOpen: false, title: "", message: "", type: "success" });

  const [usernameCheck, setUsernameCheck] = useState<{
    checking: boolean;
    taken: boolean;
    message: string;
  }>({ checking: false, taken: false, message: "" });
  const [emailCheck, setEmailCheck] = useState<{
    checking: boolean;
    taken: boolean;
    message: string;
  }>({ checking: false, taken: false, message: "" });

  // Show/hide password toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Modals state
  const [isTotpModalOpen, setIsTotpModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [userData, setUserData] = useState<ProfileState>(EMPTY_PROFILE);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    contactNumber: "",
    username: "",
    systemEmail: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const hydrateFromPreview = (data: SettingsPreview) => {
    const derivedTotpEnabled =
      typeof data.totpEnabled === "boolean"
        ? data.totpEnabled
        : (data.mfaType ?? "").toUpperCase() === "TOTP";

    const normalized: ProfileState = {
      username: data.username ?? "",
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      systemEmail: data.systemEmail ?? "",
      contactNumber: data.contactNumber ?? "",
      roleName: data.roleName ?? "ADMIN",
      systemBackupEmail: data.systemBackupEmail ?? "",
      mfaType: data.mfaType ?? "TOTP",
      totpEnabled: derivedTotpEnabled,
      createdAt: data.createdAt,
      lastLoginAt: data.lastLoginAt ?? "",
      photo: data.photo ?? null,
    };

    setUserData(normalized);
    setEditForm({
      firstName: normalized.firstName,
      lastName: normalized.lastName,
      contactNumber: normalized.contactNumber,
      username: normalized.username,
      systemEmail: normalized.systemEmail,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    if (tab === "security") {
      setActiveTab("security");
      return;
    }
    setActiveTab("profile");
  }, [location.search]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getSettingsPreview();
        hydrateFromPreview(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load settings.",
        );
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (!isEditing) {
      setUsernameCheck({ checking: false, taken: false, message: "" });
      return;
    }
    const username = editForm.username.trim();
    const original = userData.username.trim();
    if (!username || username === original) {
      setUsernameCheck({ checking: false, taken: false, message: "" });
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        setUsernameCheck({ checking: true, taken: false, message: "" });
        const taken = await checkUsernameAvailability(username);
        setUsernameCheck({
          checking: false,
          taken,
          message: taken ? "Username is already taken." : "",
        });
      } catch {
        setUsernameCheck({ checking: false, taken: false, message: "" });
      }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [editForm.username, isEditing, userData.username]);

  useEffect(() => {
    if (!isEditing) {
      setEmailCheck({ checking: false, taken: false, message: "" });
      return;
    }
    const email = editForm.systemEmail.trim();
    const original = userData.systemEmail.trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!email || email === original || !isValidEmail) {
      setEmailCheck({ checking: false, taken: false, message: "" });
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        setEmailCheck({ checking: true, taken: false, message: "" });
        const taken = await checkEmailAvailability(email);
        setEmailCheck({
          checking: false,
          taken,
          message: taken ? "Email is already taken." : "",
        });
      } catch {
        setEmailCheck({ checking: false, taken: false, message: "" });
      }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [editForm.systemEmail, isEditing, userData.systemEmail]);

  // Password requirements — pure computation, no side effects
  const passwordRequirements = useMemo(() => {
    const pw = editForm.newPassword;
    if (!pw) return null;
    return {
      minLength: pw.length >= 8,
      hasUppercase: /[A-Z]/.test(pw),
      hasLowercase: /[a-z]/.test(pw),
      hasNumber: /[0-9]/.test(pw),
      hasSpecial: /[^A-Za-z0-9]/.test(pw),
    };
  }, [editForm.newPassword]);

  const isPasswordValid =
    !passwordRequirements ||
    Object.values(passwordRequirements).every(Boolean);

  // Confirm password match states
  const showConfirmMismatch =
    !!editForm.confirmPassword &&
    editForm.newPassword !== editForm.confirmPassword;

  const showConfirmMatch =
    !!editForm.confirmPassword &&
    editForm.newPassword === editForm.confirmPassword &&
    isPasswordValid;

  const handleSaveProfile = async () => {
    if (editForm.newPassword && !isPasswordValid) {
      setError("New password does not meet the requirements.");
      return;
    }

    if (editForm.newPassword && editForm.newPassword !== editForm.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (
      userData.systemBackupEmail &&
      editForm.systemEmail.trim().toLowerCase() ===
        userData.systemBackupEmail.trim().toLowerCase()
    ) {
      setError(
        "Primary email cannot be the same as your backup email. Please use a different email.",
      );
      return;
    }

    if (usernameCheck.taken || emailCheck.taken) {
      setError("Please fix the fields with availability errors before saving.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      await updateSettings({
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        contactNumber: editForm.contactNumber.trim(),
        username: editForm.username.trim(),
        systemEmail: editForm.systemEmail.trim(),
        systemBackupEmail: userData.systemBackupEmail || null,
        currentPassword: editForm.currentPassword.trim() || undefined,
        newPassword: editForm.newPassword.trim() || undefined,
        photo: userData.photo,
      });

      setUserData((prev) => ({
        ...prev,
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        contactNumber: editForm.contactNumber.trim(),
        username: editForm.username.trim(),
        systemEmail: editForm.systemEmail.trim(),
      }));

      setEditForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setIsEditing(false);
      setActionModal({
        isOpen: true,
        title: "Profile Updated",
        message: "Your profile has been updated successfully.",
        type: "success",
      });
    } catch (err) {
      setActionModal({
        isOpen: true,
        title: "Update Failed",
        message:
          err instanceof Error ? err.message : "Failed to update settings.",
        type: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const photoSrc = useMemo(() => {
    if (!userData.photo) return null;
    if (userData.photo.startsWith("data:image")) return userData.photo;
    return `data:image/jpeg;base64,${userData.photo}`;
  }, [userData.photo]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-slate-500 text-sm">
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* ActionModal for success/error feedback */}
      <ActionModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal((prev) => ({ ...prev, isOpen: false }))}
        title={actionModal.title}
        type={actionModal.type}
      >
        <p>{actionModal.message}</p>
      </ActionModal>

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => navigate(`${location.pathname}?tab=profile`)}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "profile" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}
        >
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile Settings
          </div>
        </button>
        <button
          onClick={() => navigate(`${location.pathname}?tab=security`)}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "security" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security & MFA
          </div>
        </button>
      </div>

      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Avatar & Quick Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
              <div className="relative mb-4">
                {photoSrc ? (
                  <img
                    src={photoSrc}
                    alt={`${userData.firstName} ${userData.lastName}`}
                    className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center text-3xl font-semibold text-slate-600">
                    {userData.firstName?.[0] || "U"}
                  </div>
                )}
                {isEditing && (
                  <button
                    type="button"
                    title="Photo updates will be available once upload endpoint is connected"
                    className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                {userData.firstName} {userData.lastName}
              </h2>
              <p className="text-sm text-slate-500 mb-3">@{userData.username}</p>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full tracking-wide">
                {userData.roleName}
              </span>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-2">
                Account Activity
              </h3>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Created</span>
                <span className="font-medium text-slate-700">
                  {formatDate(userData.createdAt)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Last Login</span>
                <span className="font-medium text-slate-700">
                  {formatDate(userData.lastLoginAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Details / Edit Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-semibold text-slate-800">
                  Personal Information
                </h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={isSaving}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors"
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </button>
              </div>

              <div className="p-6">
                {!isEditing ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          First Name
                        </label>
                        <p className="text-slate-800 font-medium">
                          {userData.firstName}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          Last Name
                        </label>
                        <p className="text-slate-800 font-medium">
                          {userData.lastName}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          System Email
                        </label>
                        <div className="flex items-center gap-2 text-slate-800 font-medium">
                          <Mail className="w-4 h-4 text-slate-400" />
                          {userData.systemEmail}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          Contact Number
                        </label>
                        <div className="flex items-center gap-2 text-slate-800 font-medium">
                          <Smartphone className="w-4 h-4 text-slate-400" />
                          {userData.contactNumber}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={editForm.firstName}
                          onChange={(e) =>
                            setEditForm({ ...editForm, firstName: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={editForm.lastName}
                          onChange={(e) =>
                            setEditForm({ ...editForm, lastName: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">
                          Username
                        </label>
                        <input
                          type="text"
                          value={editForm.username}
                          onChange={(e) =>
                            setEditForm({ ...editForm, username: e.target.value })
                          }
                          className={`w-full px-3 py-2 bg-white border rounded-lg focus:ring-2 outline-none transition-all text-sm ${usernameCheck.taken ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-slate-300 focus:ring-blue-500 focus:border-blue-500"}`}
                        />
                        {usernameCheck.checking && (
                          <p className="text-xs text-slate-500">
                            Checking username availability...
                          </p>
                        )}
                        {!usernameCheck.checking && usernameCheck.message && (
                          <p className="text-xs text-red-600">
                            {usernameCheck.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">
                          Contact Number
                        </label>
                        <input
                          type="text"
                          value={editForm.contactNumber}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              contactNumber: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-medium text-slate-700">
                          System Email
                        </label>
                        <input
                          type="email"
                          value={editForm.systemEmail}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              systemEmail: e.target.value,
                            })
                          }
                          className={`w-full px-3 py-2 bg-white border rounded-lg focus:ring-2 outline-none transition-all text-sm ${emailCheck.taken ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-slate-300 focus:ring-blue-500 focus:border-blue-500"}`}
                        />
                        {emailCheck.checking && (
                          <p className="text-xs text-slate-500">
                            Checking email availability...
                          </p>
                        )}
                        {!emailCheck.checking && emailCheck.message && (
                          <p className="text-xs text-red-600">
                            {emailCheck.message}
                          </p>
                        )}
                        {userData.systemBackupEmail &&
                          editForm.systemEmail.trim().toLowerCase() ===
                            userData.systemBackupEmail.trim().toLowerCase() && (
                            <p className="text-xs text-red-600">
                              Primary email cannot match your backup email.
                            </p>
                          )}
                      </div>
                    </div>

                    {/* Change Password Section */}
                    <div className="pt-6 border-t border-slate-100">
                      <h4 className="text-sm font-semibold text-slate-800 mb-4">
                        Change Password (Optional)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Current Password — full width */}
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-sm font-medium text-slate-700">
                            Current Password
                          </label>
                          <div className="relative">
                            <input
                              type={showCurrentPassword ? "text" : "password"}
                              value={editForm.currentPassword}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  currentPassword: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 pr-10 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword((v) => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {showCurrentPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* New Password */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-700">
                            New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPassword ? "text" : "password"}
                              value={editForm.newPassword}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  newPassword: e.target.value,
                                })
                              }
                              className={`w-full px-3 py-2 pr-10 bg-white border rounded-lg focus:ring-2 outline-none transition-all text-sm ${
                                passwordRequirements && !isPasswordValid
                                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                                  : passwordRequirements && isPasswordValid
                                    ? "border-emerald-400 focus:ring-emerald-500 focus:border-emerald-500"
                                    : "border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword((v) => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {showNewPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          {passwordRequirements && (
                            <ul className="mt-2 space-y-1">
                              {[
                                { key: "minLength", label: "At least 8 characters" },
                                { key: "hasUppercase", label: "One uppercase letter (A–Z)" },
                                { key: "hasLowercase", label: "One lowercase letter (a–z)" },
                                { key: "hasNumber", label: "One number (0–9)" },
                                { key: "hasSpecial", label: "One special character (!@#$…)" },
                              ].map(({ key, label }) => {
                                const passed =
                                  passwordRequirements[
                                    key as keyof typeof passwordRequirements
                                  ];
                                return (
                                  <li
                                    key={key}
                                    className={`flex items-center gap-1.5 text-xs transition-colors ${
                                      passed ? "text-emerald-600" : "text-slate-400"
                                    }`}
                                  >
                                    {passed ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                    ) : (
                                      <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center text-slate-300 text-base leading-none">
                                        ·
                                      </span>
                                    )}
                                    {label}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>

                        {/* Confirm New Password */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-700">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              value={editForm.confirmPassword}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  confirmPassword: e.target.value,
                                })
                              }
                              className={`w-full px-3 py-2 pr-10 bg-white border rounded-lg focus:ring-2 outline-none transition-all text-sm ${
                                showConfirmMismatch
                                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                                  : showConfirmMatch
                                    ? "border-emerald-400 focus:ring-emerald-500 focus:border-emerald-500"
                                    : "border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword((v) => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          {showConfirmMismatch && (
                            <p className="text-xs text-red-600">
                              Passwords do not match.
                            </p>
                          )}
                          {showConfirmMatch && (
                            <p className="text-xs text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Passwords match.
                            </p>
                          )}
                        </div>

                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        onClick={handleSaveProfile}
                        disabled={
                          isSaving ||
                          usernameCheck.checking ||
                          emailCheck.checking ||
                          usernameCheck.taken ||
                          emailCheck.taken ||
                          !isPasswordValid ||
                          showConfirmMismatch ||
                          (Boolean(userData.systemBackupEmail) &&
                            editForm.systemEmail.trim().toLowerCase() ===
                              userData.systemBackupEmail.trim().toLowerCase())
                        }
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                      >
                        <Save className="w-4 h-4" />
                        {isSaving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "security" && (
        <div className="w-full space-y-6">
          {/* TOTP Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Two-Factor Authentication (TOTP)
                  </h3>
                  <p className="text-sm text-slate-500">
                    Add an extra layer of security to your account.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-700">
                    Status:
                  </span>
                  {userData.totpEnabled ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" /> Enabled
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      <AlertCircle className="w-3 h-3" /> Disabled
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 max-w-md">
                  Use an authenticator app to generate one-time codes when
                  logging in.
                </p>
              </div>
              <button
                onClick={() => setIsTotpModalOpen(true)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${userData.totpEnabled ? "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50" : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"}`}
              >
                {userData.totpEnabled ? "Reconfigure TOTP" : "Setup TOTP"}
              </button>
            </div>
          </div>

          {/* Backup Email Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Backup Email Address
                  </h3>
                  <p className="text-sm text-slate-500">
                    Used for account recovery if you lose access.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-700">
                    Current Backup Email:
                  </span>
                  {userData.systemBackupEmail ? (
                    <span className="text-sm font-semibold text-slate-800">
                      {userData.systemBackupEmail}
                    </span>
                  ) : (
                    <span className="text-sm italic text-slate-400">
                      Not configured
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 max-w-md">
                  We'll send a verification code to confirm ownership of the new
                  email address.
                </p>
              </div>
              <button
                onClick={() => setIsBackupModalOpen(true)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                {userData.systemBackupEmail ? "Change Email" : "Add Backup Email"}
              </button>
            </div>
          </div>
        </div>
      )}

      <TotpSetupModal
        isOpen={isTotpModalOpen}
        onClose={() => setIsTotpModalOpen(false)}
        onSuccess={(recoveryCodes) => {
          setIsTotpModalOpen(false);
          setUserData((prev) => ({ ...prev, totpEnabled: true }));
          setActionModal({
            isOpen: true,
            title: "TOTP Enabled",
            message:
              recoveryCodes && recoveryCodes.length > 0
                ? `TOTP enabled successfully. Recovery codes generated: ${recoveryCodes.length}.`
                : "TOTP has been enabled successfully.",
            type: "success",
          });
        }}
      />

      <BackupEmailModal
        isOpen={isBackupModalOpen}
        primaryEmail={userData.systemEmail}
        onClose={() => setIsBackupModalOpen(false)}
        onSuccess={(email) => {
          setIsBackupModalOpen(false);
          setUserData((prev) => ({ ...prev, systemBackupEmail: email }));
          setActionModal({
            isOpen: true,
            title: "Backup Email Updated",
            message: "Your backup email has been updated successfully.",
            type: "success",
          });
        }}
      />
    </div>
  );
}