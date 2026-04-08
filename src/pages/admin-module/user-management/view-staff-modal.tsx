import { useMemo, useState } from "react";
import { FormModalShell } from "../../../reusable/FormModalShell";
import { type UserTable } from "../../../service/admin-module-api/user-management";

interface ViewStaffModalProps {
  user: UserTable | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ViewStaffModal({ user, isOpen, onClose }: ViewStaffModalProps) {
  if (!user || !isOpen) return null;

  const [activeTab, setActiveTab] = useState<"overview" | "access">("overview");

  const fullName = `${user.firstName} ${user.lastName}`;
  const userStatus = user.isLocked
    ? "LOCKED"
    : user.status?.toUpperCase() === "INACTIVE"
      ? "INACTIVE"
      : "ACTIVE";

  const initials = useMemo(
    () =>
      fullName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "US",
    [fullName],
  );

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <FormModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Staff Profile"
      maxWidthClass="max-w-4xl"
      footer={
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
            {initials}
          </div>

          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900 leading-tight">
              {fullName}
            </h2>
            <p className="text-sm text-gray-500 mt-1">@{user.username}</p>
            <p className="text-sm text-gray-500">{user.email || "No email"}</p>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${userStatus === "ACTIVE" ? "bg-green-100 text-green-700" : userStatus === "INACTIVE" ? "bg-gray-100 text-gray-600" : "bg-amber-100 text-amber-700"}`}
              >
                {userStatus}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {user.roleName || "No role"}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                {user.departmentName || "No department"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
          <div className="flex border-b border-gray-200 px-6 bg-white">
            {(
              [
                ["overview", "Overview"],
                ["access", `Permissions (${user.permissions?.length ?? 0})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`py-4 px-1 mr-8 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-800"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "overview" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-xl p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    User Information
                  </h3>
                  <p className="text-sm text-gray-700">
                    <span className="text-gray-500">Contact:</span>{" "}
                    {user.contactNumber || "—"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="text-gray-500">Email:</span>{" "}
                    {user.email || "—"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="text-gray-500">Role:</span>{" "}
                    {user.roleName || "—"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="text-gray-500">Department:</span>{" "}
                    {user.departmentName || "—"}
                  </p>
                </div>

                <div className="border border-gray-200 rounded-xl p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    System Information
                  </h3>
                  <p className="text-sm text-gray-700">
                    <span className="text-gray-500">Account Lock:</span>{" "}
                    {user.isLocked ? "Locked" : "Unlocked"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="text-gray-500">Locked Until:</span>{" "}
                    {formatDate(user.lockUntil)}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="text-gray-500">Created At:</span>{" "}
                    {formatDate(user.createdAt)}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="text-gray-500">Last Login:</span>{" "}
                    {formatDate(user.lastLoginAt)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {!user.permissions || user.permissions.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No assigned permissions.
                  </p>
                ) : (
                  user.permissions.map((perm, index) => (
                    <div
                      key={`${perm}-${index}`}
                      className="border border-gray-200 rounded-lg p-3 bg-gray-50/70"
                    >
                      <p className="text-sm font-medium text-gray-800">
                        {perm}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </FormModalShell>
  );
}
