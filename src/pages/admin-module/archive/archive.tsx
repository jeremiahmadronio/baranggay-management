import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RotateCcwIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  SearchIcon,
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
} from "../../../service/admin-module-api/archive";
import {
  getResidentProfile,
  getResidentTable,
  updateResidentStatus,
  type ResidentSummary,
} from "../../../service/admin-module-api/ResidentsManagement";
import {
  userManagementApi,
  updateUserStatus,
  Statuses,
  type UserViewDTO,
  type UserTable,
} from "../../../service/admin-root-api/user-management";
import {
  employeeApi,
  EmployeeStatuses,
  type EmployeeTable,
} from "../../../service/admin-module-api/officer";
import { ResidentsView } from "../resident/ResidentsView";
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
  const normalized = normalizeResidentStatus(status);
  return normalized !== "DECEASED";
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

function normalizeUserStatus(
  user: UserTable,
): "ACTIVE" | "INACTIVE" | "ARCHIVED" | "LOCK" {
  if (user.isLocked) return "LOCK";
  const normalized = user.status?.toUpperCase();
  if (normalized === "ARCHIVED") return "ARCHIVED";
  if (normalized === "INACTIVE") return "INACTIVE";
  return "ACTIVE";
}

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

function UserArchiveProfileView({
  user,
  onBack,
}: {
  user: UserTable;
  onBack: () => void;
}) {
  const [details, setDetails] = useState<UserViewDTO | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "access">("overview");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setDetailsLoading(true);
      try {
        const res = await userManagementApi.getUserDetails(user.id);
        if (!active) return;
        setDetails(res);
      } catch {
        if (!active) return;
        setDetails(null);
      } finally {
        if (active) setDetailsLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [user.id]);

  const fullName = `${user.firstName} ${user.lastName}`;
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  const status = normalizeUserStatus(user);
  const permissions = details?.permissions || user.permissions || [];

  const field = (label: string, value?: string | number | null) => (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
        {label}
      </p>
      <p className="text-sm text-gray-800">{value || "—"}</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors w-fit"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        Back to Archive
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
          {initials || "US"}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
          <p className="text-sm text-gray-500 mt-1">@{user.username}</p>
          <p className="text-sm text-gray-500">
            {details?.systemEmail || user.email || "No system email"}
          </p>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status === "ACTIVE" ? "bg-green-100 text-green-700" : status === "INACTIVE" ? "bg-gray-100 text-gray-600" : status === "LOCK" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}
            >
              {status}
            </span>
          </div>
          <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-500">Assigned Department(s)</p>
            <p className="text-sm text-gray-800 mt-0.5">
              {details?.departments || prettify(user.departmentName)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
        <div className="flex border-b border-gray-200 px-6 bg-white overflow-x-auto whitespace-nowrap">
          {(
            [
              ["overview", "Overview"],
              ["access", `Permissions (${permissions.length})`],
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
                <h2 className="text-sm font-semibold text-gray-900">
                  User Information
                </h2>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
                  {field("Full Name", details?.fullName || fullName)}
                  {field("Username", `@${user.username}`)}
                  {field(
                    "System Email",
                    details?.systemEmail || user.email || "—",
                  )}
                  {field(
                    "Contact Number",
                    details?.contactNumber || user.contactNumber || "—",
                  )}
                  {field(
                    "Age",
                    details?.age ? `${details.age} years old` : "—",
                  )}
                  {field("Gender", details?.gender || "—")}
                  {field("Civil Status", details?.civilStatus || "—")}
                  {field("Role", details?.roleName || prettify(user.roleName))}
                  {field(
                    "Department(s)",
                    details?.departments || prettify(user.departmentName),
                  )}
                  {field("Complete Address", details?.completeAddress || "—")}
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-5 bg-white">
                <h2 className="text-sm font-semibold text-gray-900">
                  System Information
                </h2>
                <div className="mt-4 space-y-5">
                  {field("Account Lock", user.isLocked ? "Locked" : "Unlocked")}
                  {field("Status", details?.status || status)}
                  {field(
                    "Created At",
                    details?.createdAt
                      ? formatLastLogin(details.createdAt)
                      : user.createdAt
                        ? formatLastLogin(user.createdAt)
                        : "Never",
                  )}
                  {field(
                    "Last Updated At",
                    details?.updatedAt
                      ? formatLastLogin(details.updatedAt)
                      : "Never",
                  )}
                  {field(
                    "Last Login",
                    formatLastLogin(details?.lastLoginAt || user.lastLoginAt),
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl p-5 bg-white">
              <h2 className="text-sm font-semibold text-gray-900">
                Assigned Permissions
              </h2>
              {permissions.length === 0 ? (
                <p className="text-sm text-gray-500 mt-4">
                  No assigned permissions.
                </p>
              ) : (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {permissions.map((perm, index) => (
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

export default function ArchivePage() {
  const [activeTab, setActiveTab] = useState<ArchiveTab>("residents");
  const [stats, setStats] = useState<ArchiveStatsDTO | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [residentRows, setResidentRows] = useState<ResidentSummary[]>([]);
  const [residentLoading, setResidentLoading] = useState(true);
  const [residentPage, setResidentPage] = useState(1);

  const [userRows, setUserRows] = useState<UserTable[]>([]);
  const [userLoading, setUserLoading] = useState(true);
  const [userPage, setUserPage] = useState(1);

  const [officerRows, setOfficerRows] = useState<EmployeeTable[]>([]);
  const [officerLoading, setOfficerLoading] = useState(true);
  const [officerPage, setOfficerPage] = useState(1);
  const [officerTotalPages, setOfficerTotalPages] = useState(1);
  const [officerTotalItems, setOfficerTotalItems] = useState(0);

  const [selectedResidentId, setSelectedResidentId] = useState<number | null>(
    null,
  );
  const [selectedUser, setSelectedUser] = useState<UserTable | null>(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState<number | null>(
    null,
  );

  const [restoreTarget, setRestoreTarget] = useState<RestoreTarget | null>(
    null,
  );

  const PAGE_SIZE = 10;

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      setStats(await getArchiveStats());
    } catch (e) {
      console.error("Failed to load archive stats", e);
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
        if (resetPage) {
          setResidentPage(1);
        }
      } catch (e) {
        console.error("Failed to load archived residents", e);
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
        const first = await userManagementApi.getStaffTable({
          page: 0,
          size: 200,
          search: search || undefined,
        });
        setUserRows(
          (first.content || []).filter((u) => {
            const status = String(u.status || "").toUpperCase();
            return status === "ARCHIVED" || status === "INACTIVE";
          }),
        );
        if (resetPage) {
          setUserPage(1);
        }
      } catch (e) {
        console.error("Failed to load archived users", e);
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
    } catch (e) {
      console.error("Failed to load archived officers", e);
      setOfficerRows([]);
      setOfficerTotalItems(0);
      setOfficerTotalPages(1);
    } finally {
      setOfficerLoading(false);
    }
  }, [officerPage, search]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (activeTab === "residents") loadResidents();
    if (activeTab === "users") loadUsers();
    if (activeTab === "officers") loadOfficers();
  }, [activeTab, loadResidents, loadUsers, loadOfficers]);

  useEffect(() => {
    if (activeTab === "officers") {
      setOfficerPage(1);
    }
  }, [search, activeTab]);

  useEffect(() => {
    if (activeTab === "officers") {
      loadOfficers();
    }
  }, [officerPage, activeTab, loadOfficers]);

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

  const performRestore = async (reason: string) => {
    if (!restoreTarget) return;

    if (restoreTarget.kind === "resident") {
      if (!isResidentStatusRestorable(restoreTarget.status)) {
        return;
      }
      await updateResidentStatus(Number(restoreTarget.id), {
        status: "ACTIVE",
        reason,
      });
      await loadResidents();
    }

    if (restoreTarget.kind === "user") {
      await updateUserStatus(String(restoreTarget.id), Statuses.ACTIVE, {
        reason,
        lockUntil: null,
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

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6">
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
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${activeTab === key ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-80">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by first name or lastname"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {activeTab === "residents" && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Brgy. ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Full Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status Remarks
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {residentLoading ? (
                    Array.from({ length: PAGE_SIZE }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-24" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-32" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-28" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-20 mx-auto" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-48" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-16 ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : pagedResidents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No archived residents found.
                      </td>
                    </tr>
                  ) : (
                    pagedResidents.map((r) => (
                      <tr
                        key={r.residentId}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {(() => {
                          const restorable = isResidentStatusRestorable(
                            r.status,
                          );
                          return (
                            <>
                              <td className="px-6 py-4">
                                {r.barangayIdNumber || "—"}
                              </td>
                              <td className="px-6 py-4 font-medium text-gray-800">
                                {r.fullName}
                              </td>
                              <td className="px-6 py-4 text-gray-700">
                                {r.contactNumber || "—"}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getResidentStatusClass(r.status)}`}
                                >
                                  {normalizeResidentStatus(r.status) ||
                                    "ARCHIVED"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-gray-700">
                                {r.statusRemarks || "—"}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() =>
                                      setSelectedResidentId(r.residentId)
                                    }
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                    title="View All"
                                  >
                                    <EyeIcon className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      setRestoreTarget({
                                        kind: "resident",
                                        id: r.residentId,
                                        name: r.fullName,
                                        status: r.status,
                                      })
                                    }
                                    disabled={!restorable}
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                    title={
                                      restorable
                                        ? "Restore"
                                        : "Deceased records cannot be restored"
                                    }
                                  >
                                    <RotateCcwIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          );
                        })()}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {residentTotalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Showing {(residentPage - 1) * PAGE_SIZE + 1} to{" "}
                  {Math.min(residentPage * PAGE_SIZE, residentRows.length)} of{" "}
                  {residentRows.length} residents
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setResidentPage((p) => Math.max(1, p - 1))}
                    disabled={residentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {getVisiblePages(residentPage, residentTotalPages).map(
                      (page, idx) =>
                        page === "..." ? (
                          <span
                            key={`resident-ellipsis-${idx}`}
                            className="px-2 py-1 text-sm text-gray-400"
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            key={`resident-page-${page}`}
                            onClick={() => setResidentPage(page)}
                            className={`min-w-9 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${residentPage === page ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
                          >
                            {page}
                          </button>
                        ),
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setResidentPage((p) =>
                        Math.min(residentTotalPages, p + 1),
                      )
                    }
                    disabled={residentPage === residentTotalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "users" && (
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
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status Remarks
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {userLoading ? (
                    Array.from({ length: PAGE_SIZE }).map((_, i) => (
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
                          <div className="h-4 w-20 bg-gray-200 rounded mx-auto" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-24 bg-gray-200 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-16 bg-gray-200 rounded ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : pagedUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No archived users found.
                      </td>
                    </tr>
                  ) : (
                    pagedUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/** Display status: LOCK if locked, otherwise actual status */}
                        {(() => {
                          const userStatus = normalizeUserStatus(u);
                          const userStatusClass =
                            userStatus === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : userStatus === "INACTIVE"
                                ? "bg-gray-100 text-gray-600"
                                : userStatus === "LOCK"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700";

                          return (
                            <>
                              <td className="px-6 py-4">
                                <div className="font-medium text-gray-800">
                                  {u.firstName} {u.lastName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  @{u.username}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-gray-700">
                                {prettify(u.roleName)}
                              </td>
                              <td className="px-6 py-4 text-gray-700">
                                {prettify(u.departmentName)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${userStatusClass}`}
                                >
                                  {userStatus}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-gray-500">
                                Not available
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => setSelectedUser(u)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                    title="View All"
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
                            </>
                          );
                        })()}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {userTotalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Showing {(userPage - 1) * PAGE_SIZE + 1} to{" "}
                  {Math.min(userPage * PAGE_SIZE, userRows.length)} of{" "}
                  {userRows.length} users
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                    disabled={userPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {getVisiblePages(userPage, userTotalPages).map(
                      (page, idx) =>
                        page === "..." ? (
                          <span
                            key={`user-ellipsis-${idx}`}
                            className="px-2 py-1 text-sm text-gray-400"
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            key={`user-page-${page}`}
                            onClick={() => setUserPage(page)}
                            className={`min-w-9 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${userPage === page ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
                          >
                            {page}
                          </button>
                        ),
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setUserPage((p) => Math.min(userTotalPages, p + 1))
                    }
                    disabled={userPage === userTotalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "officers" && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status Remarks
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {officerLoading ? (
                    Array.from({ length: PAGE_SIZE }).map((_, i) => (
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
                          <div className="h-4 w-20 bg-gray-200 rounded mx-auto" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-48 bg-gray-200 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-16 bg-gray-200 rounded ml-auto" />
                        </td>
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
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                            {String(o.status || "ARCHIVED").toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {o.statusRemarks || "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedOfficerId(o.id)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="View All"
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

            {officerTotalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Showing {(officerPage - 1) * PAGE_SIZE + 1} to{" "}
                  {Math.min(officerPage * PAGE_SIZE, officerTotalItems)} of{" "}
                  {officerTotalItems} officers
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setOfficerPage((p) => Math.max(1, p - 1))}
                    disabled={officerPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {getVisiblePages(officerPage, officerTotalPages).map(
                      (page, idx) =>
                        page === "..." ? (
                          <span
                            key={`officer-ellipsis-${idx}`}
                            className="px-2 py-1 text-sm text-gray-400"
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            key={`officer-page-${page}`}
                            onClick={() => setOfficerPage(page)}
                            className={`min-w-9 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${officerPage === page ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
                          >
                            {page}
                          </button>
                        ),
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setOfficerPage((p) => Math.min(officerTotalPages, p + 1))
                    }
                    disabled={officerPage === officerTotalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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
