import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, PencilIcon, ShieldCheck } from "lucide-react";
import {
  type AdminTable,
  type Status,
  Statuses,
  toggleUserLock,
  updateUserStatus,
} from "../../service/admin-root-api/admin-management";
import {
  FormFieldError,
  FormFieldLabel,
  FormModalShell,
} from "../../reusable/FormModalShell";
import { ActionModal } from "../../reusable";

const DEPT_ENUM_TO_LABEL: Record<string, string> = {
  CLEARANCE: "Barangay Clearance & Certification",
  KAPITANA: "Office of the Barangay Captain",
  FTJS: "FTJS (First Time Job Seekers)",
  LUPONG_TAGAPAMAYAPA: "Lupong Tagapamayapa",
  BCPC: "BCPC (Council for the Protection of Children)",
  BLOTTER: "Blotter Management",
  VAWC: "VAWC (Violence Against Women and Children)",
};

const REASON_LIMIT = 1000;

function formatDept(raw: string): string {
  return DEPT_ENUM_TO_LABEL[raw.trim().toUpperCase()] ?? raw;
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return "Never";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizePermissionLabel(label: string): string {
  if (!label) return label;
  return label
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function extractPermissions(admin: AdminTable | null): string[] {
  if (!admin) return [];
  const source = admin as unknown as Record<string, unknown>;
  const collectFromCandidate = (candidate: unknown): string[] => {
    if (!candidate) return [];

    if (Array.isArray(candidate)) {
      return candidate
        .map((item) => {
          if (typeof item === "string") return item.trim();
          if (item && typeof item === "object") {
            const rec = item as Record<string, unknown>;
            const text =
              rec.permissionName ??
              rec.name ??
              rec.value ??
              rec.code ??
              rec.authority;
            return typeof text === "string" ? text.trim() : "";
          }
          return "";
        })
        .filter(Boolean);
    }

    if (typeof candidate === "string") {
      return candidate
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
    }

    if (candidate && typeof candidate === "object") {
      const rec = candidate as Record<string, unknown>;

      if (Array.isArray(rec.permissions)) {
        return collectFromCandidate(rec.permissions);
      }

      if (Array.isArray(rec.permissionNames)) {
        return collectFromCandidate(rec.permissionNames);
      }

      // Handle map-like payloads, e.g. { CREATE_USER: true, VIEW_USER: true }
      const truthyKeys = Object.entries(rec)
        .filter(([, value]) => value === true)
        .map(([key]) => key.trim())
        .filter(Boolean);
      if (truthyKeys.length > 0) return truthyKeys;
    }

    return [];
  };

  const candidates = [
    source.permissions,
    source.permissionNames,
    source.permission,
    source.accessPermissions,
    source.rolePermissions,
    source.role,
  ];

  for (const candidate of candidates) {
    const normalized = collectFromCandidate(candidate);
    if (normalized.length > 0) {
      return Array.from(new Set(normalized));
    }
  }

  return [];
}

const STATUS_OPTIONS = [
  { value: Statuses.ACTIVE, label: "Active (fully operational)" },
  { value: Statuses.INACTIVE, label: "Inactive (user not available)" },
  { value: Statuses.PENDING, label: "Pending (for verification)" },
] as const;

export default function AdminViewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminId } = useParams();

  const initialAdmin = (location.state as { admin?: AdminTable } | null)?.admin;
  const [admin, setAdmin] = useState<AdminTable | null>(initialAdmin ?? null);
  const [activeTab, setActiveTab] = useState<"overview" | "access">("overview");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const backPath = location.pathname.startsWith("/admin/")
    ? "/admin/user-management"
    : "/rootadmin/admin-management";

  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");



  if (!admin) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate(backPath)}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Admin Management
        </button>
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-lg p-4 text-sm">
          Unable to load admin details directly. Please open the profile from
          Admin Management list.
          {adminId ? ` (Admin ID: ${adminId})` : ""}
        </div>
      </div>
    );
  }

  const fullName = `${admin.firstName} ${admin.lastName}`;
  const adminStatus = admin.isLocked
    ? "LOCKED"
    : admin.status?.toUpperCase() === "INACTIVE"
      ? "INACTIVE"
      : admin.status?.toUpperCase() === "PENDING"
        ? "PENDING"
        : "ACTIVE";

  const initials = useMemo(
    () =>
      fullName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "AD",
    [fullName],
  );

  const departments = (admin.departments ?? []).map(formatDept);
  const permissions = extractPermissions(admin);
  const primaryEmail = admin.systemEmail ?? admin.email ?? "No email";



  return (
    <div className="p-6 space-y-5">
      <button
        onClick={() => navigate(backPath)}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Admin Management
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
        {admin.photo ? (
          <img
            src={admin.photo}
            alt={fullName}
            className="w-16 h-16 rounded-full object-cover border border-gray-200"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-gray-900 leading-tight">
            {fullName}
          </h2>
          <p className="text-sm text-gray-500 mt-1">@{admin.username}</p>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${adminStatus === "ACTIVE" ? "bg-green-100 text-green-700" : adminStatus === "INACTIVE" ? "bg-gray-100 text-gray-600" : adminStatus === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}
            >
              {adminStatus}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              <ShieldCheck className="w-3 h-3 mr-1" />
              {admin.roleName || "No role"}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
        <div className="flex border-b border-gray-200 px-6 bg-white">
          {(
            [
              ["overview", "Overview"],
              ["access", `Permissions (${permissions.length})`],
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
                  {admin.contactNumber || "—"}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="text-gray-500">Email:</span>{" "}
                  {primaryEmail || "—"}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="text-gray-500">Role:</span>{" "}
                  {admin.roleName || "—"}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="text-gray-500">Gender:</span>{" "}
                  {admin.gender || "—"}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="text-gray-500">Age:</span>{" "}
                  {admin.age ? `${admin.age} yrs old` : "—"}
                </p>
                <div className="text-sm text-gray-700">
                  <span className="text-gray-500">Departments:</span>
                  {departments.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {departments.map((dept) => (
                        <span
                          key={dept}
                          className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {dept}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="ml-1">—</span>
                  )}
                </div>
                <p className="text-sm text-gray-700">
                  <span className="text-gray-500">Address:</span>{" "}
                  {admin.completeAddress || "—"}
                </p>
              </div>

              <div className="border border-gray-200 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  System Information
                </h3>
                <p className="text-sm text-gray-700">
                  <span className="text-gray-500">Account Lock:</span>{" "}
                  {admin.isLocked ? "Locked" : "Unlocked"}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="text-gray-500">Status:</span>{" "}
                  {admin.status || "—"}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="text-gray-500">Locked Until:</span>{" "}
                  {formatDate(admin.lockUntil)}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="text-gray-500">Created At:</span>{" "}
                  {formatDate(admin.createdAt)}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="text-gray-500">Last Login:</span>{" "}
                  {formatDate(admin.lastLoginAt)}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {permissions.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No assigned permissions.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {permissions.map((perm, index) => (
                    <div
                      key={`${perm}-${index}`}
                      className="border border-gray-200 rounded-lg p-3 bg-white flex items-center justify-between gap-3"
                    >
                      <p className="text-sm font-medium text-gray-800 leading-5">
                        {normalizePermissionLabel(perm)}
                      </p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                        Access
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>



      <ActionModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Status Updated"
        type="success"
      >
        <p>{successMsg || "Admin status has been updated successfully."}</p>
      </ActionModal>
    </div>
  );
}
