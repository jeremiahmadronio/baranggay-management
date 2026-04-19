"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Archive,
  ChevronLeftIcon,
  ChevronRightIcon,
  Eye,
  FilterIcon,
  KeyRound,
  Lock,
  LockOpen,
  Pencil,
  PlusIcon,
  RotateCcw,
  SearchIcon,
} from "lucide-react";
import {
  userManagementApi,
  type Department,
  type Role,
  type UserStats,
  type UserViewDTO,
  type UserTable,
} from "../../../service/admin-root-api/user-management";
import { KPICard, KPIGrid, KPIIcons } from "../../../hooks/KPICard";
import CreateStaffModal from "./Create-Staff-Modal";
import { LockStaffModal } from "./Lock-staff-modal";
import { DeleteStaffModal } from "./delete-staff-modal";
import { RestoreStaffModal } from "./restore-staff-modal";
import { EditStaffModal } from "./edit-staff-modal";
import { UpdateStaffStatusModal } from "./update-staff-status-modal";
import { ResetPasswordModal } from "./reset-password-modal";

function formatLastLogin(iso: string | null): string {
  if (!iso) return "Never";
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function PermissionsCell({ permissions }: { permissions: string[] }) {
  if (!permissions || permissions.length === 0) {
    return <span className="text-sm text-gray-400">—</span>;
  }

  const total = permissions.length;
  return (
    <span className="text-sm text-gray-700">
      {total} {total === 1 ? "permission" : "permissions"}
    </span>
  );
}

function prettifyLabel(raw?: string | null): string {
  const value = String(raw ?? "").trim();
  if (!value) return "—";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function normalizeUserStatus(
  user: UserTable,
): "ACTIVE" | "INACTIVE" | "ARCHIVED" | "LOCK" {
  if (user.isLocked) return "LOCK";
  const normalized = user.status?.toUpperCase();
  if (normalized === "ARCHIVED") return "ARCHIVED";
  if (normalized === "INACTIVE") return "INACTIVE";
  return "ACTIVE";
}

function isUserVisibleInManagement(user: UserTable): boolean {
  const normalized = String(user.status || "").toUpperCase();
  return normalized !== "ARCHIVED";
}

const USER_STATUS_STYLES: Record<
  "ACTIVE" | "INACTIVE" | "ARCHIVED" | "LOCK",
  string
> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-gray-100 text-gray-600",
  ARCHIVED: "bg-red-100 text-red-700",
  LOCK: "bg-amber-100 text-amber-700",
};

function displayText(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
        {label}
      </p>
      <p className="text-sm text-gray-800">{displayText(value)}</p>
    </div>
  );
}

interface UserProfileViewProps {
  user: UserTable;
  userDetails: UserViewDTO | null;
  detailsLoading: boolean;
  onBack: () => void;
  onEdit: (u: UserTable) => void;
  onUpdateStatus: (u: UserTable) => void;
  onResetPassword: (u: UserTable) => void;
  onArchive: (u: UserTable) => void;
  onRestore: (u: UserTable) => void;
}

function UserProfileView({
  user,
  userDetails,
  detailsLoading,
  onBack,
  onEdit,
  onUpdateStatus,
  onResetPassword,
}: UserProfileViewProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "access">("overview");

  const statusLabel = normalizeUserStatus(user);
  const rawStatus = String(user.status || "").toUpperCase();
  const isArchived = rawStatus === "ARCHIVED";
  const canUpdateStatus = !isArchived;

  const fullName =
    userDetails?.fullName || `${user.firstName} ${user.lastName}`;
  const displayRole = prettifyLabel(userDetails?.roleName || user.roleName);
  const displayDepartments =
    userDetails?.departments && userDetails.departments.trim().length > 0
      ? userDetails.departments
      : prettifyLabel(user.departmentName);
  const displayPermissions = userDetails?.permissions || user.permissions || [];
  const displayAge = userDetails?.age ? `${userDetails.age} years old` : "—";
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors w-fit"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        Back to User Management
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
            {initials || "US"}
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
              {fullName}
            </h1>
            <p className="text-sm text-gray-500 mt-1">@{user.username}</p>

            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {displayRole}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {canUpdateStatus && (
            <button
              onClick={() => onUpdateStatus(user)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto"
            >
              <Lock className="w-4 h-4" />
              Update Status
            </button>
          )}

          {!isArchived && (
            <button
              onClick={() => onResetPassword(user)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors w-full sm:w-auto"
            >
              <KeyRound className="w-4 h-4" />
              Reset Password
            </button>
          )}

          {!isArchived && (
            <button
              onClick={() => onEdit(user)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors w-full sm:w-auto"
            >
              <Pencil className="w-4 h-4" />
              Edit User
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
        <div className="flex border-b border-gray-200 px-6 bg-white overflow-x-auto whitespace-nowrap">
          {(
            [
              ["overview", "Overview"],
              ["access", `Permissions (${displayPermissions.length})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`py-4 px-1 mr-8 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-800"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {detailsLoading && (
            <div className="mb-4 text-sm text-gray-500">
              Loading user details...
            </div>
          )}
          {activeTab === "overview" ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2 border border-gray-200 rounded-xl p-5 bg-white">
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  User Information
                </h2>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
                  <DetailField label="Full Name" value={fullName} />
                  <DetailField label="Username" value={`@${user.username}`} />
                  <DetailField
                    label="System Email"
                    value={userDetails?.systemEmail || "—"}
                  />
                  <DetailField
                    label="Contact Number"
                    value={userDetails?.contactNumber || "—"}
                  />
                  <DetailField label="Age" value={displayAge} />
                  <DetailField
                    label="Gender"
                    value={userDetails?.gender || "—"}
                  />
                  <DetailField
                    label="Civil Status"
                    value={userDetails?.civilStatus || "—"}
                  />
                  <DetailField label="Role" value={displayRole} />
                  <DetailField
                    label="Assigned Department"
                    value={displayDepartments}
                  />
                  <DetailField
                    label="Complete Address"
                    value={userDetails?.completeAddress || "—"}
                  />
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-5 bg-white">
                <h2 className="text-sm font-semibold text-gray-900">
                  System Information
                </h2>
                <div className="mt-4 space-y-5">
                  <DetailField
                    label="Account Lock"
                    value={user.isLocked ? "Locked" : "Unlocked"}
                  />
                  <DetailField
                    label="Status"
                    value={userDetails?.status || statusLabel}
                  />
                  <DetailField
                    label="Created At"
                    value={
                      userDetails?.createdAt
                        ? formatLastLogin(userDetails.createdAt)
                        : "Never"
                    }
                  />
                  <DetailField
                    label="Last Updated At"
                    value={
                      userDetails?.updatedAt
                        ? formatLastLogin(userDetails.updatedAt)
                        : "Never"
                    }
                  />
                  <DetailField
                    label="Last Login"
                    value={formatLastLogin(
                      userDetails?.lastLoginAt || user.lastLoginAt,
                    )}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl p-5 bg-white">
              <h2 className="text-sm font-semibold text-gray-900">
                Assigned Permissions
              </h2>
              {displayPermissions.length === 0 ? (
                <p className="text-sm text-gray-500 mt-4">
                  No assigned permissions.
                </p>
              ) : (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {displayPermissions.map((perm, index) => (
                    <div
                      key={`${perm}-${index}`}
                      className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700"
                    >
                      {perm}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Root_User_Management() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ─── Table ─────────────────────────────────────────────────────────────────
  const [tableData, setTableData] = useState<UserTable[]>([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [roleOptions, setRoleOptions] = useState<Role[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<Department[]>([]);

  // ─── Filters ───────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    role: "",
    department: "",
  });
  const [currentPage, setCurrentPage] = useState(1);

  // ─── Modals ────────────────────────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingUser, setViewingUser] = useState<UserTable | null>(null);
  const [viewingUserDetails, setViewingUserDetails] =
    useState<UserViewDTO | null>(null);
  const [viewingDetailsLoading, setViewingDetailsLoading] = useState(false);
  const [actionUser, setActionUser] = useState<UserTable | null>(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [openUpdateStatus, setOpenUpdateStatus] = useState(false);
  const [openLock, setOpenLock] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openRestore, setOpenRestore] = useState(false);
  const [openResetPassword, setOpenResetPassword] = useState(false);

  // ─── Fetch Stats ───────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await userManagementApi.getStats();
      setStats(data);
    } catch {
      setStats({
        totalUser: 0,
        totalActiveUser: 0,
        totalInactive: 0,
        totalLock: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ─── Fetch Table ───────────────────────────────────────────────────────────
  const fetchTable = useCallback(async () => {
    try {
      setTableLoading(true);
      const requestParams = {
        size: 100,
        search: appliedFilters.search || undefined,
        roleName: appliedFilters.role || undefined,
        departmentName: appliedFilters.department || undefined,
      };

      const firstPage = await userManagementApi.getStaffTable({
        page: 0,
        ...requestParams,
      });

      let allRows = [...(firstPage.content || [])];
      const apiTotalPages = firstPage.totalPages || 1;

      if (apiTotalPages > 1) {
        const pageRequests = [];
        for (let page = 1; page < apiTotalPages; page++) {
          pageRequests.push(
            userManagementApi.getStaffTable({
              page,
              ...requestParams,
            }),
          );
        }

        const pageResults = await Promise.all(pageRequests);
        allRows = allRows.concat(
          ...pageResults.flatMap((r) => r.content || []),
        );
      }

      const visibleRows = allRows.filter(isUserVisibleInManagement);
      const computedTotalItems = visibleRows.length;
      const computedTotalPages = Math.max(
        Math.ceil(computedTotalItems / 10),
        1,
      );
      const safeCurrentPage = Math.min(currentPage, computedTotalPages);
      const start = (safeCurrentPage - 1) * 10;

      setTableData(visibleRows.slice(start, start + 10));
      setTotalItems(computedTotalItems);
      setTotalPages(computedTotalPages);

      if (safeCurrentPage !== currentPage) {
        setCurrentPage(safeCurrentPage);
      }
    } catch (err) {
      console.error("Failed to fetch staff table:", err);
      setTableData([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setTableLoading(false);
    }
  }, [currentPage, appliedFilters]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);
  useEffect(() => {
    fetchTable();
  }, [fetchTable]);

  useEffect(() => {
    let active = true;

    const loadFilterOptions = async () => {
      try {
        const [roles, departments] = await Promise.all([
          userManagementApi.getRoleOptions(),
          userManagementApi.getDepartmentOptions(),
        ]);
        if (!active) return;
        setRoleOptions(roles || []);
        setDepartmentOptions(departments || []);
      } catch {
        if (!active) return;
        setRoleOptions([]);
        setDepartmentOptions([]);
      }
    };

    loadFilterOptions();
    return () => {
      active = false;
    };
  }, []);

  // ─── Filter Handlers ───────────────────────────────────────────────────────
  const handleFilterApply = () => {
    setAppliedFilters({
      search,
      role: roleFilter,
      department: departmentFilter,
    });
    setCurrentPage(1);
  };
  const handleFilterClear = () => {
    setSearch("");
    setRoleFilter("");
    setDepartmentFilter("");
    setAppliedFilters({
      search: "",
      role: "",
      department: "",
    });
    setCurrentPage(1);
  };

  // ─── Action Handlers ───────────────────────────────────────────────────────
  const handleView = (u: UserTable) => {
    setViewingUser(u);
    setViewingUserDetails(null);
  };
  const handleEdit = (u: UserTable) => {
    setActionUser(u);
    setOpenEdit(true);
  };
  const handleLock = (u: UserTable) => {
    setActionUser(u);
    setOpenLock(true);
  };
  const handleUpdateStatus = (u: UserTable) => {
    setActionUser(u);
    setOpenUpdateStatus(true);
  };
  const handleDelete = (u: UserTable) => {
    if (u.isLocked) return;
    setActionUser(u);
    setOpenDelete(true);
  };
  const handleRestore = (u: UserTable) => {
    setActionUser(u);
    setOpenRestore(true);
  };
  const handleResetPassword = (u: UserTable) => {
    setActionUser(u);
    setOpenResetPassword(true);
  };

  const activeFilterCount = [roleFilter, departmentFilter].filter(
    Boolean,
  ).length;

  const getVisiblePages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages] as const;
    }
    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ] as const;
    }
    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ] as const;
  };

  useEffect(() => {
    if (!viewingUser) return;

    let active = true;
    const loadDetails = async () => {
      setViewingDetailsLoading(true);
      try {
        const details = await userManagementApi.getUserDetails(viewingUser.id);
        if (!active) return;
        setViewingUserDetails(details);
      } catch {
        if (!active) return;
        setViewingUserDetails(null);
      } finally {
        if (active) setViewingDetailsLoading(false);
      }
    };

    loadDetails();

    return () => {
      active = false;
    };
  }, [viewingUser]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {viewingUser ? (
        <UserProfileView
          user={viewingUser}
          userDetails={viewingUserDetails}
          detailsLoading={viewingDetailsLoading}
          onBack={() => {
            setViewingUser(null);
            setViewingUserDetails(null);
            fetchTable();
          }}
          onEdit={handleEdit}
          onUpdateStatus={handleUpdateStatus}
          onResetPassword={handleResetPassword}
          onArchive={handleDelete}
          onRestore={handleRestore}
        />
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900"></h1>
              <p className="text-sm text-gray-500 mt-1"></p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
            >
              <PlusIcon className="w-4 h-4" />
              Create User Account
            </button>
          </div>

          {/* ── KPI Stats ── */}
          <KPIGrid columns={4}>
            <KPICard
              title="Total Created Users"
              value={statsLoading ? "—" : (stats?.totalUser ?? 0)}
              icon={KPIIcons.users}
              color="blue"
              subtitle="All registered user accounts"
            />
            <KPICard
              title="Active User Accounts"
              value={statsLoading ? "—" : (stats?.totalActiveUser ?? 0)}
              icon={KPIIcons.check}
              color="emerald"
              subtitle="Can currently access the system"
            />
            <KPICard
              title="Locked User Accounts"
              value={statsLoading ? "—" : (stats?.totalLock ?? 0)}
              icon={KPIIcons.pending}
              color="amber"
              subtitle="Temporarily restricted access"
            />
            <KPICard
              title="Inactive Users"
              value={statsLoading ? "—" : (stats?.totalInactive ?? 0)}
              icon={KPIIcons.chart}
              color="slate"
              subtitle="Disabled but recoverable accounts"
            />
          </KPIGrid>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by first name or lastname"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                >
                  <option value="">All Roles</option>
                  {roleOptions.map((role) => (
                    <option key={role.id} value={role.roleName}>
                      {prettifyLabel(role.roleName)}
                    </option>
                  ))}
                </select>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                >
                  <option value="">All Departments</option>
                  {departmentOptions.map((department) => (
                    <option key={department.id} value={department.name}>
                      {prettifyLabel(department.name)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleFilterApply}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
                >
                  <FilterIcon className="w-4 h-4" />
                  Apply
                  {activeFilterCount > 0 && (
                    <span className="bg-white text-blue-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleFilterClear}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Profile
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Permissions
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tableLoading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="h-4 w-40 bg-gray-200 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-24 bg-gray-200 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-24 bg-gray-200 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-40 bg-gray-200 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-20 bg-gray-200 rounded mx-auto" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-24 bg-gray-200 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-24 bg-gray-200 rounded ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : tableData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No staff accounts found.
                      </td>
                    </tr>
                  ) : (
                    tableData.map((item) => {
                      const statusLabel = normalizeUserStatus(item);
                      const rawStatus = String(item.status || "").toUpperCase();
                      const isArchived = rawStatus === "ARCHIVED";
                      const isInactive = rawStatus === "INACTIVE";
                      const isActive = rawStatus === "ACTIVE";
                      const isLocked = Boolean(item.isLocked);
                      const canArchive = !isLocked;
                      const canUseLockAction = isLocked || isActive;
                      const LockIcon = isLocked ? LockOpen : Lock;
                      const lockTitle = isLocked ? "Unlock" : "Lock";

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-500">
                                {item.firstName?.[0] || "U"}
                                {item.lastName?.[0] || "S"}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800 leading-tight text-base">
                                  {item.firstName} {item.lastName}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  @{item.username}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                            {prettifyLabel(item.roleName)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                            {prettifyLabel(item.departmentName)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                            <PermissionsCell permissions={item.permissions} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${USER_STATUS_STYLES[statusLabel]}`}
                            >
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                            {formatLastLogin(item.lastLoginAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                title="View"
                                onClick={() => handleView(item)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {!isArchived && (
                                <button
                                  title="Edit"
                                  onClick={() => handleEdit(item)}
                                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              )}

                              {!isArchived && canUseLockAction && (
                                <button
                                  title={lockTitle}
                                  onClick={() => handleLock(item)}
                                  className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                >
                                  <LockIcon className="w-4 h-4" />
                                </button>
                              )}

                              {isArchived || isInactive ? (
                                <button
                                  title={isInactive ? "Activate" : "Restore"}
                                  onClick={() => handleRestore(item)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  title={
                                    canArchive
                                      ? "Archive"
                                      : "Unlock account before archiving"
                                  }
                                  onClick={() =>
                                    canArchive && handleDelete(item)
                                  }
                                  disabled={!canArchive}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                >
                                  <Archive className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * 10 + 1} to{" "}
                  {Math.min(currentPage * 10, totalItems)} of {totalItems} users
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {getVisiblePages().map((page, idx) =>
                      page === "..." ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-2 py-1 text-sm text-gray-400"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-9 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${currentPage === page ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
                        >
                          {page}
                        </button>
                      ),
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showCreateModal && (
        <CreateStaffModal
          onClose={() => {
            setShowCreateModal(false);
            fetchTable();
            fetchStats();
          }}
          onSuccess={() => {
            fetchTable();
            fetchStats();
          }}
        />
      )}

      {openEdit && actionUser && (
        <EditStaffModal
          user={actionUser}
          onClose={() => {
            setOpenEdit(false);
            setActionUser(null);
          }}
          onSuccess={() => {
            fetchTable();
            fetchStats();
          }}
        />
      )}

      {openUpdateStatus && actionUser && (
        <UpdateStaffStatusModal
          user={actionUser}
          onClose={() => {
            setOpenUpdateStatus(false);
            setActionUser(null);
          }}
          onSuccess={() => {
            fetchTable();
            fetchStats();
          }}
        />
      )}

      {openLock && actionUser && (
        <LockStaffModal
          user={actionUser}
          onClose={() => {
            setOpenLock(false);
            setActionUser(null);
          }}
          onSuccess={() => {
            fetchTable();
            fetchStats();
          }}
        />
      )}

      {openDelete && actionUser && (
        <DeleteStaffModal
          user={actionUser}
          onClose={() => {
            setOpenDelete(false);
            setActionUser(null);
          }}
          onSuccess={() => {
            fetchTable();
            fetchStats();
          }}
        />
      )}

      {openRestore && actionUser && (
        <RestoreStaffModal
          user={actionUser}
          onClose={() => {
            setOpenRestore(false);
            setActionUser(null);
          }}
          onSuccess={() => {
            fetchTable();
            fetchStats();
          }}
        />
      )}

      {openResetPassword && actionUser && (
        <ResetPasswordModal
          user={actionUser}
          onClose={() => {
            setOpenResetPassword(false);
            setActionUser(null);
          }}
          onSuccess={() => {
            fetchTable();
            fetchStats();
          }}
        />
      )}
    </div>
  );
}
