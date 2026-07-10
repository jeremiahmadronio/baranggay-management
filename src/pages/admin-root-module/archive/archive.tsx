import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RotateCcwIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  SearchIcon,
  ShieldCheck,
} from "lucide-react";
import {
  KPIGrid,
  KPICard,
  KPIIcons,
  StatusUpdateModal,
} from "../../../reusable";
import {
  getArchiveStats,
  type ArchiveStatsDTO,
} from "../../../service/admin-root-api/archive";
import {
  getResidentProfile,
  getResidentTable,
  updateResidentStatus,
} from "../../../service/admin-module-api/ResidentsManagement";
import type { ResidentSummary } from "../../../service/admin-module-api/ResidentsManagement";
import {
  userManagementApi,
  Statuses,
} from "../../../service/admin-root-api/user-management";
import {
  getAdminTable,
  type AdminTable,
} from "../../../service/admin-root-api/admin-management";
import {
  employeeApi,
  EmployeeStatuses,
  type EmployeeTable,
} from "../../../service/admin-root-api/officer";
import { ResidentsView } from "../../admin-module/resident/ResidentsView";
import { OfficerProfileView } from "../officer/officer-profile-view";

type ArchiveTab = "residents" | "users" | "officers";
type RestoreKind = "resident" | "user" | "officer";

interface RestoreTarget {
  kind: RestoreKind;
  id: string | number;
  name: string;
  status?: string;
}

function normalizeResidentStatus(status?: string | null): string {
  return String(status || "")
    .toUpperCase()
    .trim()
    .replace(/\s+/g, "_");
}

function isResidentStatusRestorable(status?: string | null): boolean {
  return normalizeResidentStatus(status) !== "DECEASED";
}

function getResidentStatusClass(status?: string | null): string {
  const normalized = normalizeResidentStatus(status);
  if (normalized === "DECEASED") return "bg-red-100 text-red-700";
  if (normalized === "ARCHIVED") return "bg-slate-100 text-slate-700";
  if (normalized === "INACTIVE") return "bg-amber-100 text-amber-700";
  if (normalized === "MOVE_OUT" || normalized === "MOVED_OUT")
    return "bg-cyan-100 text-cyan-700";
  return "bg-gray-100 text-gray-700";
}

function getVisiblePages(currentPage: number, totalPages: number) {
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
}

function prettify(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "—";
  if (!raw.includes("_")) return raw;
  return raw
    .toLowerCase()
    .split("_")
    .map((w) => (w ? `${w[0].toUpperCase()}${w.slice(1)}` : w))
    .join(" ");
}

function formatLastLogin(iso?: string | null): string {
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

function formatDateTime(iso?: string | null): string {
  if (!iso) return "Never";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function normalizeUserStatus(
  user: AdminTable,
): "ACTIVE" | "INACTIVE" | "ARCHIVED" | "LOCK" {
  if (user.isLocked) return "LOCK";
  const normalized = user.status?.toUpperCase();
  if (normalized === "ARCHIVED") return "ARCHIVED";
  if (normalized === "INACTIVE") return "INACTIVE";
  return "ACTIVE";
}

// ─── Pagination Component ────────────────────────────────────────────────────
function Pagination({
  prefix,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  prefix: string;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-t border-gray-200">
      <p className="text-sm text-gray-500">
        Showing {(currentPage - 1) * pageSize + 1} to{" "}
        {Math.min(currentPage * pageSize, totalItems)} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1">
          {getVisiblePages(currentPage, totalPages).map((page, idx) =>
            page === "..." ? (
              <span
                key={`${prefix}-ellipsis-${idx}`}
                className="px-2 py-1 text-sm text-gray-400"
              >
                ...
              </span>
            ) : (
              <button
                key={`${prefix}-page-${page}`}
                onClick={() => onPageChange(Number(page))}
                className={`min-w-9 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ),
          )}
        </div>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── User Archive Profile View ───────────────────────────────────────────────
function UserArchiveProfileView({
  user,
  onBack,
}: {
  user: AdminTable;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "access">("overview");

  const fullName = `${user.firstName} ${user.lastName}`;
  const userStatus = user.isLocked
    ? "LOCKED"
    : user.status?.toUpperCase() === "INACTIVE"
      ? "INACTIVE"
      : user.status?.toUpperCase() === "ARCHIVED"
        ? "ARCHIVED"
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

  return (
    <div className="p-6 space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        ← Back to Archive
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-gray-900 leading-tight">
            {fullName}
          </h2>
          <p className="text-sm text-gray-500 mt-1">@{user.username}</p>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${userStatus === "ACTIVE" ? "bg-green-100 text-green-700" : userStatus === "INACTIVE" ? "bg-amber-100 text-amber-700" : userStatus === "ARCHIVED" ? "bg-slate-100 text-slate-700" : "bg-rose-100 text-rose-700"}`}
            >
              {userStatus}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              <ShieldCheck className="w-3 h-3 mr-1" />
              {prettify(user.roleName)}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
              {Array.isArray(user.departments) ? user.departments.map(prettify).join(", ") : (prettify(user.departments) || "No department")}
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
                  {prettify(user.roleName) || "—"}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="text-gray-500">Department:</span>{" "}
                  {Array.isArray(user.departments) ? user.departments.map(prettify).join(", ") : (prettify(user.departments) || "—")}
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
                  <span className="text-gray-500">Status:</span>{" "}
                  {user.status || "—"}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="text-gray-500">Locked Until:</span>{" "}
                  {formatDateTime(user.lockUntil)}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="text-gray-500">Created At:</span>{" "}
                  {formatDateTime(user.createdAt)}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="text-gray-500">Last Login:</span>{" "}
                  {formatDateTime(user.lastLoginAt)}
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
                    <p className="text-sm font-medium text-gray-800">{perm}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

export default function RootArchivePage() {
  const [activeTab, setActiveTab] = useState<ArchiveTab>("residents");
  const [stats, setStats] = useState<ArchiveStatsDTO | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Residents
  const [residentRows, setResidentRows] = useState<ResidentSummary[]>([]);
  const [residentLoading, setResidentLoading] = useState(true);
  const [residentPage, setResidentPage] = useState(1);

  // Users
  const [userRows, setUserRows] = useState<AdminTable[]>([]);
  const [userLoading, setUserLoading] = useState(true);
  const [userPage, setUserPage] = useState(1);

  // Officers
  const [officerRows, setOfficerRows] = useState<EmployeeTable[]>([]);
  const [officerLoading, setOfficerLoading] = useState(true);
  const [officerPage, setOfficerPage] = useState(1);
  const [officerTotalPages, setOfficerTotalPages] = useState(1);
  const [officerTotalItems, setOfficerTotalItems] = useState(0);

  // View/Restore state
  const [selectedResidentId, setSelectedResidentId] = useState<number | null>(
    null,
  );
  const [selectedUser, setSelectedUser] = useState<AdminTable | null>(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState<number | null>(
    null,
  );
  const [restoreTarget, setRestoreTarget] = useState<RestoreTarget | null>(
    null,
  );

  // ── Loaders ────────────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      setStats(await getArchiveStats());
    } catch {
      setStats({
        totalArchived: 0,
        totalArchivedResidents: 0,
        totalArchivedOfficers: 0,
        totalArchivedUsers: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadResidents = useCallback(
    async (resetPage = true) => {
      try {
        setResidentLoading(true);
        const rows = await getResidentTable({ search: search || undefined });
        setResidentRows(
          (rows || []).filter(
            (r) => normalizeResidentStatus(r.status) !== "ACTIVE",
          ),
        );
        if (resetPage) setResidentPage(1);
      } catch {
        setResidentRows([]);
      } finally {
        setResidentLoading(false);
      }
    },
    [search],
  );

  const loadUsers = useCallback(
    async (resetPage = true) => {
      try {
        setUserLoading(true);
        const res = await getAdminTable({
          page: 0,
          size: 200,
          search: search || undefined,
          status: "ARCHIVED",
        });
        setUserRows(res.content || []);
        if (resetPage) setUserPage(1);
      } catch {
        setUserRows([]);
      } finally {
        setUserLoading(false);
      }
    },
    [search],
  );

  const loadOfficers = useCallback(async () => {
    try {
      setOfficerLoading(true);
      const res = await employeeApi.getPagedTable({
        page: Math.max(officerPage - 1, 0),
        size: PAGE_SIZE,
        search: search || undefined,
        status: "ARCHIVED",
      });
      setOfficerRows(res.content || []);
      setOfficerTotalItems(res.totalElements || 0);
      setOfficerTotalPages(Math.max(res.totalPages || 1, 1));
    } catch {
      setOfficerRows([]);
      setOfficerTotalItems(0);
      setOfficerTotalPages(1);
    } finally {
      setOfficerLoading(false);
    }
  }, [officerPage, search]);

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (activeTab === "residents") loadResidents();
    if (activeTab === "users") loadUsers();
    if (activeTab === "officers") loadOfficers();
  }, [activeTab, loadResidents, loadUsers, loadOfficers]);

  useEffect(() => {
    if (activeTab === "officers") setOfficerPage(1);
  }, [search, activeTab]);

  useEffect(() => {
    if (activeTab === "officers") loadOfficers();
  }, [officerPage, activeTab, loadOfficers]);

  // ── Paged data ─────────────────────────────────────────────────────────────
  const pagedResidents = useMemo(
    () =>
      residentRows.slice(
        (residentPage - 1) * PAGE_SIZE,
        residentPage * PAGE_SIZE,
      ),
    [residentRows, residentPage],
  );
  const residentTotalPages = Math.max(
    Math.ceil(residentRows.length / PAGE_SIZE),
    1,
  );

  const pagedUsers = useMemo(
    () => userRows.slice((userPage - 1) * PAGE_SIZE, userPage * PAGE_SIZE),
    [userRows, userPage],
  );
  const userTotalPages = Math.max(Math.ceil(userRows.length / PAGE_SIZE), 1);

  // Removed pagedAdmins and adminTotalPages as only first 2 admins are shown

  // ── Restore action ─────────────────────────────────────────────────────────
  const performRestore = async (reason: string) => {
    if (!restoreTarget) return;
    if (restoreTarget.kind === "resident") {
      if (!isResidentStatusRestorable(restoreTarget.status)) return;
      await updateResidentStatus(Number(restoreTarget.id), {
        status: "ACTIVE",
        reason,
      });
      await loadResidents();
    }
    if (restoreTarget.kind === "user") {
      await userManagementApi.updateStatus(String(restoreTarget.id), {
        newStatus: Statuses.ACTIVE,
        remarks: reason,
      });
      await loadUsers();
    }
    if (restoreTarget.kind === "officer") {
      await employeeApi.updateStatus(Number(restoreTarget.id), {
        reason,
        newStatus: EmployeeStatuses.ACTIVE,
      });
      await loadOfficers();
    }
    await loadStats();
  };

  // ── Sub-page views ─────────────────────────────────────────────────────────
  if (selectedResidentId !== null) {
    return (
      <ResidentsView
        residentId={selectedResidentId}
        onBack={() => setSelectedResidentId(null)}
        fetchProfile={getResidentProfile}
        readOnly
      />
    );
  }

  if (selectedUser) {
    return (
      <UserArchiveProfileView
        user={selectedUser}
        onBack={() => setSelectedUser(null)}
      />
    );
  }

  if (selectedOfficerId !== null) {
    return (
      <OfficerProfileView
        employeeId={selectedOfficerId}
        onBack={() => setSelectedOfficerId(null)}
        onEdit={() => {}}
        onArchive={() => {}}
        onStatusChange={() => {}}
        readOnly
      />
    );
  }

  // ── Skeleton rows ──────────────────────────────────────────────────────────
  const skeletonCells = (count: number) =>
    Array.from({ length: count }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-24" />
      </td>
    ));

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* KPI Stats */}
        <KPIGrid columns={4}>
          <KPICard
            title="Total Archived"
            value={statsLoading ? "—" : (stats?.totalArchived ?? 0)}
            icon={KPIIcons.chart}
            color="slate"
            subtitle="All archived records"
          />
          <KPICard
            title="Archived Residents"
            value={statsLoading ? "—" : (stats?.totalArchivedResidents ?? 0)}
            icon={KPIIcons.users}
            color="blue"
            subtitle="Residents in archive"
          />
          <KPICard
            title="Archived Officers"
            value={statsLoading ? "—" : (stats?.totalArchivedOfficers ?? 0)}
            icon={KPIIcons.pending}
            color="amber"
            subtitle="Officers/staff archived"
          />
          <KPICard
            title="Archived Users"
            value={statsLoading ? "—" : (stats?.totalArchivedUsers ?? 0)}
            icon={KPIIcons.check}
            color="violet"
            subtitle="User accounts archived"
          />
        </KPIGrid>

        {/* Tab Bar + Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  ["residents", "Residents"],
                  ["users", "Users"],
                  ["officers", "Officers"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    activeTab === key
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-80">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── RESIDENTS TAB ─────────────────────────────────────────────────── */}
        {activeTab === "residents" && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {[
                      "Full Name",
                      "Barangay ID",
                      "Contact",
                      "Status",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {residentLoading ? (
                    Array.from({ length: PAGE_SIZE }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {skeletonCells(5)}
                      </tr>
                    ))
                  ) : pagedResidents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No archived residents found.
                      </td>
                    </tr>
                  ) : (
                    pagedResidents.map((r) => {
                      const restorable = isResidentStatusRestorable(r.status);
                      return (
                        <tr
                          key={r.residentId}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {r.fullName}
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {r.barangayIdNumber || "—"}
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {r.contactNumber || "—"}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getResidentStatusClass(r.status)}`}
                            >
                              {prettify(r.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  setSelectedResidentId(r.residentId)
                                }
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="View"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              {restorable && (
                                <button
                                  onClick={() =>
                                    setRestoreTarget({
                                      kind: "resident",
                                      id: r.residentId,
                                      name: r.fullName,
                                      status: r.status,
                                    })
                                  }
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                  title="Restore"
                                >
                                  <RotateCcwIcon className="w-4 h-4" />
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
            <Pagination
              prefix="resident"
              currentPage={residentPage}
              totalPages={residentTotalPages}
              totalItems={residentRows.length}
              pageSize={PAGE_SIZE}
              onPageChange={setResidentPage}
            />
          </div>
        )}

        {/* ── USERS TAB ─────────────────────────────────────────────────────── */}
        {activeTab === "users" && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {[
                      "Full Name",
                      "Email",
                      "Role",
                      "Departments",
                      "Status",
                      "Last Login",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {userLoading ? (
                    Array.from({ length: PAGE_SIZE }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {skeletonCells(7)}
                      </tr>
                    ))
                  ) : pagedUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No archived users found.
                      </td>
                    </tr>
                  ) : (
                    pagedUsers.map((u) => {
                      const userStatus = normalizeUserStatus(u);
                      const userStatusClass =
                        userStatus === "ARCHIVED"
                          ? "bg-slate-100 text-slate-700"
                          : userStatus === "LOCK"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700";
                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {u.firstName} {u.lastName}
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {u.email || "—"}
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {prettify(u.roleName)}
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {Array.isArray(u.departments)
                              ? u.departments.map(prettify).join(", ")
                              : prettify(u.departments)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${userStatusClass}`}
                            >
                              {userStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {formatLastLogin(u.lastLoginAt)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedUser(u)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="View"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setRestoreTarget({
                                    kind: "user",
                                    id: u.id,
                                    name: `${u.firstName} ${u.lastName}`,
                                  })
                                }
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                title="Restore"
                              >
                                <RotateCcwIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              prefix="user"
              currentPage={userPage}
              totalPages={userTotalPages}
              totalItems={userRows.length}
              pageSize={PAGE_SIZE}
              onPageChange={setUserPage}
            />
          </div>
        )}

        {/* ── OFFICERS TAB ──────────────────────────────────────────────────── */}
        {activeTab === "officers" && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {[
                      "Employee",
                      "Department",
                      "Position",
                      "Status",
                      "Status Remarks",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {officerLoading ? (
                    Array.from({ length: PAGE_SIZE }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {skeletonCells(6)}
                      </tr>
                    ))
                  ) : officerRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No archived officers found.
                      </td>
                    </tr>
                  ) : (
                    officerRows.map((o) => (
                      <tr
                        key={o.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-800">
                          {o.fullName}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {prettify(o.departmentName)}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {o.position || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            {String(o.status || "ARCHIVED").toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {o.statusRemarks || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedOfficerId(o.id)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="View"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                setRestoreTarget({
                                  kind: "officer",
                                  id: o.id,
                                  name: o.fullName,
                                })
                              }
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              title="Restore"
                            >
                              <RotateCcwIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              prefix="officer"
              currentPage={officerPage}
              totalPages={officerTotalPages}
              totalItems={officerTotalItems}
              pageSize={PAGE_SIZE}
              onPageChange={setOfficerPage}
            />
          </div>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {restoreTarget && (
        <StatusUpdateModal
          isOpen
          onClose={() => setRestoreTarget(null)}
          title={`Restore ${restoreTarget.kind}`}
          mode="reason-only"
          subjectName={restoreTarget.name}
          subjectLabel={restoreTarget.kind}
          submitLabel="Restore"
          onSubmit={async ({ reason }) => {
            await performRestore(reason);
            setRestoreTarget(null);
          }}
        />
      )}
    </div>
  );
}
