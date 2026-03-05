import { useEffect, useState, useCallback } from "react";
import { Pencil, Lock, Trash2, Eye, ShieldAlert } from "lucide-react";
import CreateAdminModal from "./create-admin-modal";
import { EditUserModal } from "./edit-user-modal";
import { ViewUserModal } from "./view-user-modal";
import { LockUserModal } from "./lock-user-modal";
import { DeleteUserModal } from "./delete-user-modal";
import { KPIGrid, KPICard, KPIIcons } from "../reusable/KPICard";
import { Table, type TableColumn } from "../reusable/Table";
import { TableFilter } from "../reusable/TableFilter";
import { StatusBadge, getStatusFromValue } from "../reusable/StatusBadge";
import {
  getAdminStats,
  getAdminTable,
  type AdminStats,
  type AdminTable,
} from "../admin-root-api/admin-management";

function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let current = 0;
    const step = Math.ceil(target / (700 / 16));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else setCount(current);
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <>{count.toLocaleString()}</>;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatLastLogin(iso: string): string {
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

function DepartmentCell({ departments }: { departments: string[] }) {
  if (!departments || departments.length === 0) {
    return <span className="text-xs text-gray-400">—</span>;
  }
  const visible  = departments.slice(0, 2);
  const overflow = departments.length - 2;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((dept) => (
        <span key={dept} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-medium">
          {dept}
        </span>
      ))}
      {overflow > 0 && (
        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-500 rounded font-semibold">
          +{overflow}
        </span>
      )}
    </div>
  );
}

const buildColumns = (
  onView:   (a: AdminTable) => void,
  onEdit:   (a: AdminTable) => void,
  onLock:   (a: AdminTable) => void,
  onDelete: (a: AdminTable) => void,
): TableColumn<AdminTable>[] => [
  {
    key: "profile",
    header: "Profile",
    render: (item) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
          {item.firstName[0]}{item.lastName[0]}
        </div>
        <div>
          <div className="font-semibold text-gray-800 text-sm">{item.firstName} {item.lastName}</div>
          <div className="text-xs text-gray-400">{item.email}</div>
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
    key: "departments",
    header: "Department Access",
    render: (item) => <DepartmentCell departments={item.departments} />,
  },
  {
    key: "status",
    header: "Status",
    align: "center",
    render: (item) => {
      const rawStatus  = item.isLocked ? "locked" : item.status;
      const statusType = rawStatus.toLowerCase() === "locked" ? "danger" : getStatusFromValue(rawStatus);
      const label      = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
      return <StatusBadge status={statusType} label={label} size="sm" />;
    },
  },
  {
    key: "lastLoginAt",
    header: "Last Login",
    render: (item) => (
      <span className="text-xs text-gray-500">{formatLastLogin(item.lastLoginAt)}</span>
    ),
  },
  {
    key: "actions",
    header: "Actions",
    align: "center",
    render: (item) => (
      <div className="flex justify-center items-center gap-3">
        <button title="View"   onClick={(e) => { e.stopPropagation(); onView(item);   }} className="p-1.5 rounded-md hover:bg-gray-100 transition">
          <Eye    className="w-4 h-4 text-gray-400 hover:text-blue-500" />
        </button>
        <button title="Edit"   onClick={(e) => { e.stopPropagation(); onEdit(item);   }} className="p-1.5 rounded-md hover:bg-blue-50 transition">
          <Pencil className="w-4 h-4 text-blue-400 hover:text-blue-600" />
        </button>
        <button title={item.isLocked ? "Unlock" : "Lock"} onClick={(e) => { e.stopPropagation(); onLock(item); }} className="p-1.5 rounded-md hover:bg-amber-50 transition">
          <Lock   className="w-4 h-4 text-amber-400 hover:text-amber-600" />
        </button>
        <button title="Deactivate" onClick={(e) => { e.stopPropagation(); onDelete(item); }} className="p-1.5 rounded-md hover:bg-rose-50 transition">
          <Trash2 className="w-4 h-4 text-rose-400 hover:text-rose-600" />
        </button>
      </div>
    ),
  },
];

export default function AdminManagement() {
  const [stats,        setStats]        = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError,   setStatsError]   = useState<string | null>(null);

  const [tableData,    setTableData]    = useState<AdminTable[]>([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [totalItems,   setTotalItems]   = useState(0);
  const [totalPages,   setTotalPages]   = useState(0);

  const [search,       setSearch]       = useState("");
  const [roleFilter,   setRoleFilter]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage,  setCurrentPage]  = useState(1);

  const [openCreate,    setOpenCreate]    = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminTable | null>(null);
  const [openEdit,      setOpenEdit]      = useState(false);
  const [openView,      setOpenView]      = useState(false);
  const [openLock,      setOpenLock]      = useState(false);
  const [openDelete,    setOpenDelete]    = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        setStatsLoading(true);
        setStatsError(null);
        const data = await getAdminStats();
        setStats(data);
      } catch (err) {
        setStatsError(err instanceof Error ? err.message : "Failed to load stats.");
      } finally {
        setStatsLoading(false);
      }
    }
    fetchStats();
  }, []);

  const fetchTable = useCallback(async () => {
    try {
      setTableLoading(true);
      const result = await getAdminTable({
        page:   currentPage - 1,
        size:   5,
        search: search       || undefined,
        role:   roleFilter   || undefined,
        status: statusFilter || undefined,
      });
      setTableData(result.content);
      setTotalItems(result.totalElements);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error("Failed to fetch admin table:", err);
    } finally {
      setTableLoading(false);
    }
  }, [currentPage, search, roleFilter, statusFilter]);

  useEffect(() => { fetchTable(); }, [fetchTable]);

  const handleFilterApply = () => { setCurrentPage(1); fetchTable(); };
  const handleFilterClear = () => { setSearch(""); setRoleFilter(""); setStatusFilter(""); setCurrentPage(1); };

  const handleView   = (a: AdminTable) => { setSelectedAdmin(a); setOpenView(true);   };
  const handleEdit   = (a: AdminTable) => { setSelectedAdmin(a); setOpenEdit(true);   };
  const handleLock   = (a: AdminTable) => { setSelectedAdmin(a); setOpenLock(true);   };
  const handleDelete = (a: AdminTable) => { setSelectedAdmin(a); setOpenDelete(true); };

  const columns = buildColumns(handleView, handleEdit, handleLock, handleDelete);

  return (
    <div className="p-6 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-800">Admin Management</h2>
            <span className="text-xs font-medium px-2 py-1 rounded bg-red-100 text-red-600">Root Admin Only</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Manage administrator accounts and access control</p>
        </div>
        <button
          onClick={() => setOpenCreate(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg shadow"
        >
          + Create Admin Account
        </button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-6">
        <div className="font-semibold">⚠ Elevated Privilege Zone</div>
        <p className="text-sm mt-1">This section is only accessible to Root Admins. All actions performed here are logged in the audit trail with high-priority flags.</p>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 h-24 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-6 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : statsError ? (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">⚠ {statsError}</div>
      ) : (
        stats && (
          <div className="mb-6">
            <KPIGrid columns={4}>
              <KPICard title="Total Admins"     value={<AnimatedCounter target={stats.totalAdmin}    />} icon={KPIIcons.users}    color="blue"    subtitle="Registered accounts" />
              <KPICard title="Active Admins"    value={<AnimatedCounter target={stats.totalActive}   />} icon={KPIIcons.clock}    color="emerald" subtitle="Currently active"    />
              <KPICard title="Locked Accounts"  value={<AnimatedCounter target={stats.totalLock}     />} icon={<ShieldAlert className="w-6 h-6" />} color="rose" subtitle="Require attention" />
              <KPICard title="Inactive Accounts" value={<AnimatedCounter target={stats.totalInactive} />} icon={KPIIcons.document} color="amber"   subtitle="No recent activity"  />
            </KPIGrid>
          </div>
        )
      )}

      <TableFilter
        searchPlaceholder="Search by name, username or email..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          {
            label: "Role",
            key: "role",
            value: roleFilter,
            options: [
              { value: "ADMIN",      label: "Admin" },
              { value: "ROOT_ADMIN", label: "Root Admin" },
            ],
          },
          {
            label: "Status",
            key: "status",
            value: statusFilter,
            options: [
              { value: "ACTIVE",   label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
              { value: "LOCKED",   label: "Locked" },
              { value: "PENDING",  label: "Pending" },
            ],
          },
        ]}
        onFilterChange={(key, value) => {
          if (key === "role")   setRoleFilter(value);
          if (key === "status") setStatusFilter(value);
        }}
        onFilterClick={handleFilterApply}
        onClearClick={handleFilterClear}
      />

      <Table<AdminTable>
        columns={columns}
        data={tableData}
        keyExtractor={(item) => item.id}
        loading={tableLoading}
        emptyMessage="No admin accounts found."
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

      {openCreate && (
        <CreateAdminModal onClose={() => { setOpenCreate(false); fetchTable(); }} />
      )}

      {openView && selectedAdmin && (
        <ViewUserModal
          admin={selectedAdmin}
          isOpen={openView}
          onClose={() => { setOpenView(false); setSelectedAdmin(null); }}
        />
      )}

      {openEdit && selectedAdmin && (
        <EditUserModal
          admin={selectedAdmin}
          onClose={() => { setOpenEdit(false); setSelectedAdmin(null); fetchTable(); }}
        />
      )}

      {openLock && selectedAdmin && (
        <LockUserModal
          admin={selectedAdmin}
          onClose={() => { setOpenLock(false); setSelectedAdmin(null); fetchTable(); }}
        />
      )}

      {openDelete && selectedAdmin && (
        <DeleteUserModal
          admin={selectedAdmin}
          onClose={() => { setOpenDelete(false); setSelectedAdmin(null); fetchTable(); }}
        />
      )}
    </div>
  );
}