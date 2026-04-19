import { FormModalShell } from "../../reusable";
import { type AdminTable } from "../../service/admin-root-api/admin-management";
import {
  User,
  Building2,
  ShieldCheck,
  Clock3,
  CalendarDays,
  Lock,
  LockOpen,
  Phone,
  Mail,
  Timer,
  MapPin,
} from "lucide-react";

interface ViewUserModalProps {
  admin: AdminTable | null;
  isOpen: boolean;
  onClose: () => void;
}

const DEPT_ENUM_TO_LABEL: Record<string, string> = {
  CLEARANCE: "Barangay Clearance & Certification",
  KAPITANA: "Office of the Barangay Captain",
  FTJS: "FTJS (First Time Job Seekers)",
  LUPONG_TAGAPAMAYAPA: "Lupong Tagapamayapa",
  BCPC: "BCPC (Council for the Protection of Children)",
  BLOTTER: "Blotter Management",
  VAWC: "VAWC (Violence Against Women and Children)",
};

function formatDept(raw: string): string {
  return DEPT_ENUM_TO_LABEL[raw.trim().toUpperCase()] ?? raw;
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateString;
  }
}

function SectionLabel({
  index,
  icon,
  title,
}: {
  index: number;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xs font-bold text-gray-400">{index}</span>
      <span className="text-gray-400">{icon}</span>
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
        {title}
      </span>
    </div>
  );
}

function StatusBadge({
  status,
  isLocked,
}: {
  status: string;
  isLocked: boolean;
}) {
  if (isLocked) {
    return (
      <span className="text-xs font-bold text-red-600 uppercase tracking-wide">
        LOCKED
      </span>
    );
  }
  const colorMap: Record<string, string> = {
    ACTIVE: "text-green-600",
    INACTIVE: "text-gray-500",
    PENDING: "text-amber-600",
  };
  return (
    <span
      className={`text-xs font-bold uppercase tracking-wide ${colorMap[status?.toUpperCase()] ?? "text-gray-500"}`}
    >
      {status}
    </span>
  );
}

export function ViewUserModal({ admin, isOpen, onClose }: ViewUserModalProps) {
  if (!admin || !isOpen) return null;

  const fullName = `${admin.firstName} ${admin.lastName}`;
  const initials = (admin.firstName?.[0] ?? "") + (admin.lastName?.[0] ?? "");
  const departments = (admin.departments ?? []).map(formatDept);
  const permissions = admin.permissions ?? [];
  const accountSectionIndex = permissions.length > 0 ? 4 : 3;

  return (
    <FormModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={fullName}
      maxWidthClass="max-w-3xl"
      footer={
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-5">

        {/* Status line — shown below title like the screenshot */}
        <p className="text-sm text-gray-500 -mt-2">
          Status:{" "}
          <StatusBadge status={admin.status} isLocked={admin.isLocked} />
        </p>

        {/* 1 — USER INFORMATION */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <SectionLabel
            index={1}
            icon={<User className="w-3.5 h-3.5" />}
            title="User Information"
          />
          <div className="grid grid-cols-4 gap-x-6 gap-y-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-1">Username</p>
              <div className="flex items-center gap-1.5 font-medium text-gray-800">
                {admin.photo ? (
                  <img
                    src={admin.photo}
                    className="w-5 h-5 rounded-full object-cover"
                    alt=""
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                    {initials.toUpperCase()}
                  </div>
                )}
                {admin.username}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Role</p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                <ShieldCheck className="w-3 h-3" />
                {admin.roleName}
              </span>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Gender</p>
              <p className="font-medium text-gray-800">{admin.gender || "N/A"}</p>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Age</p>
              <p className="font-medium text-gray-800">{admin.age ? `${admin.age} yrs old` : "N/A"}</p>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Contact</p>
              <div className="flex items-center gap-1 font-medium text-gray-800">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                {admin.contactNumber || "N/A"}
              </div>
            </div>

            <div className="col-span-3">
              <p className="text-xs text-gray-400 mb-1">System Email</p>
              <div className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <a
                  href={`mailto:${admin.systemEmail ?? admin.email}`}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {admin.systemEmail ?? admin.email ?? "N/A"}
                </a>
              </div>
            </div>

            {admin.completeAddress && (
              <div className="col-span-4">
                <p className="text-xs text-gray-400 mb-1">Address</p>
                <div className="flex items-start gap-1 font-medium text-gray-800">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                  {admin.completeAddress}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2 — DEPARTMENT ACCESS */}
        <div>
          <SectionLabel
            index={2}
            icon={<Building2 className="w-3.5 h-3.5" />}
            title="Department Access"
          />
          {departments.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {departments.map((dept) => (
                <div
                  key={dept}
                  className="flex items-center justify-between px-3 py-2.5 bg-white border border-gray-200 rounded-lg gap-2"
                >
                  <span className="text-sm text-gray-700 font-medium leading-snug">
                    {dept}
                  </span>
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full shrink-0">
                    ACCESS
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic px-1">
              No department assigned.
            </p>
          )}
        </div>

        {/* 3 — PERMISSIONS (conditional) */}
        {permissions.length > 0 && (
          <div>
            <SectionLabel
              index={3}
              icon={<ShieldCheck className="w-3.5 h-3.5" />}
              title="Permissions"
            />
            <div className="flex flex-wrap gap-2">
              {permissions.map((perm) => (
                <span
                  key={perm}
                  className="px-2.5 py-1 text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-md"
                >
                  {perm}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 3 or 4 — ACCOUNT STATUS */}
        <div>
          <SectionLabel
            index={accountSectionIndex}
            icon={<Clock3 className="w-3.5 h-3.5" />}
            title="Account Status"
          />
          <div className="grid grid-cols-2 gap-3">
            {/* Lock status */}
            <div
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${
                admin.isLocked
                  ? "bg-red-50 border-red-100"
                  : "bg-green-50 border-green-100"
              }`}
            >
              <div className="flex items-center gap-2">
                {admin.isLocked ? (
                  <Lock className="w-4 h-4 text-red-400" />
                ) : (
                  <LockOpen className="w-4 h-4 text-green-500" />
                )}
                <span className="text-sm text-gray-700 font-medium">
                  Account Lock
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  admin.isLocked
                    ? "text-red-600 bg-red-50 border-red-200"
                    : "text-green-600 bg-green-50 border-green-200"
                }`}
              >
                {admin.isLocked ? "LOCKED" : "UNLOCKED"}
              </span>
            </div>

            {/* Overall status */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-white border border-gray-200 rounded-lg">
              <span className="text-sm text-gray-700 font-medium">
                Account Status
              </span>
              <StatusBadge status={admin.status} isLocked={false} />
            </div>

            {/* Lock until — only if locked */}
            {admin.isLocked && admin.lockUntil && (
              <div className="col-span-2 flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg">
                <Timer className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-xs text-gray-500">Locked until:</span>
                <span className="text-xs font-semibold text-red-700">
                  {formatDate(admin.lockUntil)}
                </span>
              </div>
            )}

            {/* Created at */}
            <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg">
              <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">
                  Created
                </p>
                <p className="text-xs font-medium text-gray-700">
                  {formatDate(admin.createdAt)}
                </p>
              </div>
            </div>

            {/* Last login */}
            <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg">
              <Clock3 className="w-4 h-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">
                  Last Login
                </p>
                <p className="text-xs font-medium text-gray-700">
                  {formatDate(admin.lastLoginAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </FormModalShell>
  );
}