"use client";

import { useState, useEffect, useCallback } from "react";
import { Eye, Lock, LockOpen, Trash2, RotateCcw, Pencil } from "lucide-react";
import {
  userManagementApi,
  type UserStats,
  type UserTable,
} from "../admin-module-api/user-management";
import { KPICard, KPIGrid, KPIIcons } from "../reusable/KPICard";
import { Table, type TableColumn } from "../reusable/Table";
import { TableFilter } from "../reusable/TableFilter";
import { StatusBadge, getStatusFromValue } from "../reusable/StatusBadge";
import CreateStaffModal from "./Create-Staff-Modal";
import { ViewStaffModal } from "./view-staff-modal";
import { LockStaffModal } from "./Lock-staff-modal";
import { DeleteStaffModal } from "./delete-staff-modal";
import { RestoreStaffModal } from "./restore-staff-modal";
import { EditStaffModal } from "./edit-staff-modal";

const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

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
    return <span className="text-xs text-gray-400">—</span>;
  }
  const visible = permissions.slice(0, 2);
  const overflow = permissions.length - 2;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((perm) => (
        <span
          key={perm}
          className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded font-medium"
        >
          {perm}
        </span>
      ))}
      {overflow > 0 && (
        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-semibold">
          +{overflow}
        </span>
      )}
    </div>
  );
}

const buildColumns = (
  onView: (u: UserTable) => void,
  onEdit: (u: UserTable) => void,
  onLock: (u: UserTable) => void,
  onDelete: (u: UserTable) => void,
  onRestore: (u: UserTable) => void,
): TableColumn<UserTable>[] => [
  {
    key: "profile",
    header: "Profile",
    render: (item) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
          {item.firstName[0]}
          {item.lastName[0]}
        </div>
        <div>
          <div className="font-semibold text-gray-800 text-sm">
            {item.firstName} {item.lastName}
          </div>
          <div className="text-xs text-gray-400">@{item.username}</div>
        </div>
      </div>
    ),
  },
  {
    key: "roleName",
    header: "Role",
    render: (item) => (
      <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
        {item.roleName}
      </span>
    ),
  },
  {
    key: "departmentName",
    header: "Department",
    render: (item) => (
      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-medium">
        {item.departmentName || "—"}
      </span>
    ),
  },
  {
    key: "permissions",
    header: "Permissions",
    render: (item) => <PermissionsCell permissions={item.permissions} />,
  },
  {
    key: "status",
    header: "Status",
    align: "center",
    render: (item) => {
      const rawStatus = item.isLocked ? "locked" : item.status;
      const statusType =
        rawStatus.toLowerCase() === "locked"
          ? "danger"
          : getStatusFromValue(rawStatus);
      const label =
        rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
      return <StatusBadge status={statusType} label={label} size="sm" />;
    },
  },
  {
    key: "lastLoginAt",
    header: "Last Login",
    render: (item) => (
      <span className="text-xs text-gray-500">
        {formatLastLogin(item.lastLoginAt)}
      </span>
    ),
  },
  {
    key: "actions",
    header: "Actions",
    align: "center",
    render: (item) => {
      const isInactive = item.status?.toUpperCase() === "INACTIVE";
      // Check both isLocked boolean AND status string for consistency
      const isLocked = item.isLocked || item.status?.toUpperCase() === "LOCKED";
      const LockIcon = isLocked ? LockOpen : Lock;
      const lockTitle = isLocked ? "Unlock" : "Lock";

      return (
        <div className="flex justify-center items-center gap-3">
          <button
            title="View"
            onClick={(e) => {
              e.stopPropagation();
              onView(item);
            }}
            className="p-1.5 rounded-md hover:bg-gray-100 transition"
          >
            <Eye className="w-4 h-4 text-gray-400 hover:text-blue-500" />
          </button>

          {/* Edit button - only show if user is not inactive */}
          {!isInactive && (
            <button
              title="Edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className="p-1.5 rounded-md hover:bg-blue-50 transition"
            >
              <Pencil className="w-4 h-4 text-blue-400 hover:text-blue-600" />
            </button>
          )}

          {/* Hide lock/unlock button if user is inactive */}
          {!isInactive && (
            <button
              title={lockTitle}
              onClick={(e) => {
                e.stopPropagation();
                onLock(item);
              }}
              className="p-1.5 rounded-md hover:bg-amber-50 transition"
            >
              <LockIcon className="w-4 h-4 text-amber-400 hover:text-amber-600" />
            </button>
          )}

          {isInactive ? (
            <button
              title="Restore"
              onClick={(e) => {
                e.stopPropagation();
                onRestore(item);
              }}
              className="p-1.5 rounded-md hover:bg-blue-50 transition"
            >
              <RotateCcw className="w-4 h-4 text-blue-400 hover:text-blue-600" />
            </button>
          ) : (
            <button
              title="Deactivate"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item);
              }}
              className="p-1.5 rounded-md hover:bg-rose-50 transition"
            >
              <Trash2 className="w-4 h-4 text-rose-400 hover:text-rose-600" />
            </button>
          )}
        </div>
      );
    },
  },
];

export default function UserManagement() {
  // ─── Stats ─────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ─── Table ─────────────────────────────────────────────────────────────────
  const [tableData, setTableData] = useState<UserTable[]>([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // ─── Filters ───────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // ─── Modals ────────────────────────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserTable | null>(null);
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openLock, setOpenLock] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openRestore, setOpenRestore] = useState(false);

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
      const result = await userManagementApi.getStaffTable({
        page: currentPage - 1,
        size: 5,
        search: search || undefined,
        roleName: roleFilter || undefined,
        departmentName: departmentFilter || undefined,
      });
      setTableData(result.content);
      setTotalItems(result.totalElements);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error("Failed to fetch staff table:", err);
    } finally {
      setTableLoading(false);
    }
  }, [currentPage, search, roleFilter, departmentFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);
  useEffect(() => {
    fetchTable();
  }, [fetchTable]);

  // ─── Filter Handlers ───────────────────────────────────────────────────────
  const handleFilterApply = () => {
    setCurrentPage(1);
    fetchTable();
  };
  const handleFilterClear = () => {
    setSearch("");
    setRoleFilter("");
    setDepartmentFilter("");
    setCurrentPage(1);
  };

  // ─── Action Handlers ───────────────────────────────────────────────────────
  const handleView = (u: UserTable) => {
    setSelectedUser(u);
    setOpenView(true);
  };
  const handleEdit = (u: UserTable) => {
    setSelectedUser(u);
    setOpenEdit(true);
  };
  const handleLock = (u: UserTable) => {
    setSelectedUser(u);
    setOpenLock(true);
  };
  const handleDelete = (u: UserTable) => {
    setSelectedUser(u);
    setOpenDelete(true);
  };
  const handleRestore = (u: UserTable) => {
    setSelectedUser(u);
    setOpenRestore(true);
  };

  const columns = buildColumns(
    handleView,
    handleEdit,
    handleLock,
    handleDelete,
    handleRestore,
  );

  return (
    <div className="min-h-screen p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
       

        {/* ── KPI Stats ── */}
        <KPIGrid columns={4}>
          <KPICard
            title="Total Staff"
            value={statsLoading ? "—" : (stats?.totalUser ?? 0)}
            icon={KPIIcons.users}
            color="blue"
          />
          <KPICard
            title="Active"
            value={statsLoading ? "—" : (stats?.totalActiveUser ?? 0)}
            icon={KPIIcons.check}
            color="emerald"
          />
          <KPICard
            title="Locked"
            value={statsLoading ? "—" : (stats?.totalLock ?? 0)}
            icon={KPIIcons.pending}
            color="amber"
          />
          <KPICard
            title="Inactive"
            value={statsLoading ? "—" : (stats?.totalInactive ?? 0)}
            icon={KPIIcons.chart}
            color="slate"
          />
        </KPIGrid>

         <div className="flex  justify-end">
         
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <PlusIcon />
            Create Staff Account
          </button>
        </div>

        {/* ── Filters ── */}
        <TableFilter
          searchPlaceholder="Search by name or username..."
          searchValue={search}
          onSearchChange={setSearch}
          filters={[
            {
              label: "Role",
              key: "role",
              value: roleFilter,
              options: [
                { value: "STAFF", label: "Staff" },
                { value: "CLEARANCE_OFFICER", label: "Clearance Officer" },
                { value: "BCPC_OFFICER", label: "BCPC Officer" },
                { value: "VAWC_OFFICER", label: "VAWC Officer" },
              ],
            },
            {
              label: "Department",
              key: "department",
              value: departmentFilter,
              options: [
                { value: "Clearance", label: "Clearance" },
                { value: "BCPC", label: "BCPC" },
                { value: "VAWC", label: "VAWC" },
                { value: "Blotter", label: "Blotter" },
              ],
            },
          ]}
          onFilterChange={(key, value) => {
            if (key === "role") setRoleFilter(value);
            if (key === "department") setDepartmentFilter(value);
          }}
          onFilterClick={handleFilterApply}
          onClearClick={handleFilterClear}
        />

        <Table<UserTable>
          columns={columns}
          data={tableData}
          keyExtractor={(item) => item.id}
          loading={tableLoading}
          emptyMessage="No staff accounts found."
          minRows={5}
          hoverable
          pagination={{
            currentPage,
            totalPages,
            totalItems,
            itemsPerPage: 5,
            onPageChange: setCurrentPage,
          }}
        />
      </div>

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

      {openView && selectedUser && (
        <ViewStaffModal
          user={selectedUser}
          isOpen={openView}
          onClose={() => {
            setOpenView(false);
            setSelectedUser(null);
          }}
        />
      )}

      {openEdit && selectedUser && (
        <EditStaffModal
          user={selectedUser}
          onClose={() => {
            setOpenEdit(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            fetchTable();
            fetchStats();
          }}
        />
      )}

      {openLock && selectedUser && (
        <LockStaffModal
          user={selectedUser}
          onClose={() => {
            setOpenLock(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            fetchTable();
            fetchStats();
          }}
        />
      )}

      {openDelete && selectedUser && (
        <DeleteStaffModal
          user={selectedUser}
          onClose={() => {
            setOpenDelete(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            fetchTable();
            fetchStats();
          }}
        />
      )}

      {openRestore && selectedUser && (
        <RestoreStaffModal
          user={selectedUser}
          onClose={() => {
            setOpenRestore(false);
            setSelectedUser(null);
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
