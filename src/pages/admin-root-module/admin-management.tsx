import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Pencil,
  Lock,
  LockOpen,
  Archive,
  Eye,
  ShieldAlert,
  RotateCcw,
} from "lucide-react";
import CreateAdminModal from "./create-admin-modal";
import { EditUserModal } from "./edit-user-modal";
import { ArchiveReasonModal } from "../../hooks/archive-modal";
import { KPIGrid, KPICard, KPIIcons } from "../../hooks/KPICard";
import { Table, type TableColumn } from "../../hooks/Table";
import { TableFilter } from "../../hooks/TableFilter";

import {
  getAdminStats,
  getAdminTable,
  type AdminStats,
  type AdminTable,
} from "../../service/admin-root-api/admin-management";
import { StatusUpdateModal } from "../../reusable/StatusUpdateModal";
import {
  archiveAdmin,
  restoreArchive,
} from "../../service/admin-root-api/admin-management";

function AnimatedCounter({ target }: { target: number | null | undefined }) {
  const safeTarget = target ?? 0;
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (safeTarget === 0) {
      setCount(0);
      return;
    }
    let current = 0;
    const step = Math.ceil(safeTarget / (700 / 16));
    const timer = setInterval(() => {
      current += step;
      if (current >= safeTarget) {
        setCount(safeTarget);
        clearInterval(timer);
      } else setCount(current);
    }, 16);
    return () => clearInterval(timer);
  }, [safeTarget]);
  return <>{count.toLocaleString()}</>;
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
  const visible = departments.slice(0, 2);
  const overflow = departments.length - 2;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((dept) => (
        <span
          key={dept}
          className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-medium"
        >
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
  onView: (a: AdminTable) => void,
  onEdit: (a: AdminTable) => void,
  onLock: (a: AdminTable) => void,
  onArchive: (a: AdminTable) => void,
  onUnarchive: (a: AdminTable) => void,
): TableColumn<AdminTable>[] => [
  {
    key: "profile",
    header: "Profile",
    render: (item) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
          {item.firstName?.[0] || ""}
          {item.lastName?.[0] || ""}
        </div>
        <div>
          <div className="font-semibold text-gray-800 text-sm">
            {item.firstName || ""} {item.lastName || ""}
          </div>
          <div className="text-xs text-gray-400">{item.email || "—"}</div>
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
      // Custom pill style for status
      const status = (item.status || "").toUpperCase();
      if (item.isLocked) {
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">
            LOCKED
          </span>
        );
      }
      if (status === "ACTIVE") {
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
            ACTIVE
          </span>
        );
      }
      if (status === "INACTIVE") {
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
            INACTIVE
          </span>
        );
      }
      if (status === "PENDING") {
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
            PENDING
          </span>
        );
      }
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
          {status || "UNKNOWN"}
        </span>
      );
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
      const isArchived = item.status?.toUpperCase() === "ARCHIVED";
      const LockIcon = item.isLocked ? LockOpen : Lock;
      const lockTitle = item.isLocked ? "Unlock" : "Lock";

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

          {isArchived ? (
            <button
              title="Unarchive"
              onClick={(e) => {
                e.stopPropagation();
                onUnarchive(item);
              }}
              className="p-1.5 rounded-md hover:bg-blue-50 transition"
            >
              <RotateCcw className="w-4 h-4 text-blue-400 hover:text-blue-600" />
            </button>
          ) : (
            <button
              title="Archive"
              onClick={(e) => {
                e.stopPropagation();
                onArchive(item);
              }}
              className="p-1.5 rounded-md hover:bg-rose-50 transition"
            >
              <Archive className="w-4 h-4 text-rose-400 hover:text-rose-600" />
            </button>
          )}
        </div>
      );
    },
  },
];

export default function AdminManagement() {
  // ...existing code...
  const navigate = useNavigate();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [tableData, setTableData] = useState<AdminTable[]>([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [openCreate, setOpenCreate] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminTable | null>(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [openLock, setOpenLock] = useState(false);
  const [openArchive, setOpenArchive] = useState(false);
  const [openUnarchive, setOpenUnarchive] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<AdminTable | null>(null);
  const [unarchiveTarget, setUnarchiveTarget] = useState<AdminTable | null>(
    null,
  );

  useEffect(() => {
    async function fetchStats() {
      try {
        setStatsLoading(true);
        setStatsError(null);
        const data = await getAdminStats();
        setStats(data);
      } catch (err) {
        setStatsError(
          err instanceof Error ? err.message : "Failed to load stats.",
        );
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
        page: currentPage - 1,
        size: 5,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      const content = result.content || [];
      // Filter out archived admins
      const visibleTableData = content.filter(
        (item) => (item.status || "").toUpperCase() !== "ARCHIVED",
      );
      setTableData(visibleTableData);

      // Use totalElements from API, or fallback to content.length
      const totalElementsFromApi = result.totalElements ?? 0;
      const actualTotalItems =
        totalElementsFromApi > 0
          ? totalElementsFromApi
          : visibleTableData.length;

      // Use totalPages from API, or calculate from totalElements
      const totalPagesFromApi = result.totalPages ?? 0;
      const calculatedTotalPages =
        actualTotalItems > 0 ? Math.ceil(actualTotalItems / 5) : 1;

      setTotalItems(actualTotalItems);
      setTotalPages(
        totalPagesFromApi > 0 ? totalPagesFromApi : calculatedTotalPages,
      );
    } catch (err) {
      console.error("Failed to fetch admin table:", err);
    } finally {
      setTableLoading(false);
    }
  }, [currentPage, search, statusFilter]);

  useEffect(() => {
    fetchTable();
  }, [fetchTable]);

  const handleFilterApply = () => {
    setCurrentPage(1);
    fetchTable();
  };
  const handleFilterClear = () => {
    setSearch("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  const handleView = (a: AdminTable) => {
    navigate(`/rootadmin/admin-management/view/${a.id}`, {
      state: { admin: a },
    });
  };
  const handleEdit = (a: AdminTable) => {
    setSelectedAdmin(a);
    setOpenEdit(true);
  };
  const handleLock = (a: AdminTable) => {
    setSelectedAdmin(a);
    setOpenLock(true);
  };

  const handleArchive = (a: AdminTable) => {
    setArchiveTarget(a);
    setOpenArchive(true);
  };
  const handleUnarchive = (a: AdminTable) => {
    setUnarchiveTarget(a);
    setOpenUnarchive(true);
  };

  const columns = buildColumns(
    handleView,
    handleEdit,
    handleLock,
    handleArchive,
    handleUnarchive,
  );

  return (
    <div className="p-6 min-h-screen">
      <div className="flex justify-end items-center mb-6">
        <button
          onClick={() => setOpenCreate(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg shadow transition-all active:scale-95"
        >
          + Create Admin Account
        </button>
      </div>

     

      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 p-5 h-24 animate-pulse"
            >
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-6 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : statsError ? (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
          {statsError}
        </div>
      ) : (
        <div className="mb-6">
          <KPIGrid columns={4}>
            <KPICard
              title="Total Admins"
              value={<AnimatedCounter target={stats?.totalAdmin} />}
              icon={KPIIcons.users}
              color="blue"
              subtitle="Registered accounts"
            />
            <KPICard
              title="Active Admins"
              value={<AnimatedCounter target={stats?.totalActive} />}
              icon={KPIIcons.clock}
              color="emerald"
              subtitle="Currently active"
            />
            <KPICard
              title="Locked Accounts"
              value={<AnimatedCounter target={stats?.totalLock} />}
              icon={<ShieldAlert className="w-6 h-6" />}
              color="rose"
              subtitle="Require attention"
            />
            <KPICard
              title="Inactive Accounts"
              value={<AnimatedCounter target={stats?.totalInactive} />}
              icon={KPIIcons.document}
              color="amber"
              subtitle="No recent activity"
            />
          </KPIGrid>
        </div>
      )}

      <TableFilter
        searchPlaceholder="Search by name, username or email..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          {
            label: "Status",
            key: "status",
            value: statusFilter,
            options: [
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
              { value: "LOCKED", label: "Locked" },
              { value: "PENDING", label: "Pending" },
            ],
          },
        ]}
        onFilterChange={(key, value) => {
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
        <CreateAdminModal
          onClose={() => {
            setOpenCreate(false);
            fetchTable();
          }}
        />
      )}

      {openEdit && selectedAdmin && (
        <EditUserModal
          admin={selectedAdmin}
          onClose={() => {
            setOpenEdit(false);
            setSelectedAdmin(null);
            fetchTable();
          }}
        />
      )}

      {openLock && selectedAdmin && (
        <ArchiveReasonModal
          isOpen={openLock}
          onClose={() => {
            setOpenLock(false);
            setSelectedAdmin(null);
            fetchTable();
          }}
          onSubmit={async (reason) => {
            // Lock or unlock depending on current state
            const willLock = !selectedAdmin.isLocked;
            await import("../../service/admin-root-api/admin-management").then(
              ({ toggleUserLock }) =>
                toggleUserLock(selectedAdmin.id, willLock, {
                  reason,
                  lockUntil: null,
                }),
            );
            setOpenLock(false);
            setSelectedAdmin(null);
            fetchTable();
          }}
          title={
            selectedAdmin.isLocked
              ? "Unlock Admin Account"
              : "Lock Admin Account"
          }
          subjectName={selectedAdmin.firstName + " " + selectedAdmin.lastName}
          subjectLabel="admin"
          submitLabel={selectedAdmin.isLocked ? "Unlock" : "Lock"}
          placeholder={`Enter reason for ${selectedAdmin.isLocked ? "unlocking" : "locking"} this account...`}
        />
      )}

      {openArchive && archiveTarget && (
        <StatusUpdateModal
          isOpen={openArchive}
          onClose={() => {
            setOpenArchive(false);
            setArchiveTarget(null);
          }}
          title="Archive Admin Account"
          mode="reason-only"
          subjectName={archiveTarget.firstName + " " + archiveTarget.lastName}
          subjectLabel="admin"
          submitLabel="Archive"
          onSubmit={async ({ reason }) => {
            await archiveAdmin(archiveTarget.id, { remarks: reason });
            setOpenArchive(false);
            setArchiveTarget(null);
            fetchTable();
          }}
        />
      )}

      {openUnarchive && unarchiveTarget && (
        <StatusUpdateModal
          isOpen={openUnarchive}
          onClose={() => {
            setOpenUnarchive(false);
            setUnarchiveTarget(null);
          }}
          title="Unarchive Admin Account"
          mode="reason-only"
          subjectName={
            unarchiveTarget.firstName + " " + unarchiveTarget.lastName
          }
          subjectLabel="admin"
          submitLabel="Unarchive"
          onSubmit={async ({ reason }) => {
            await restoreArchive(unarchiveTarget.id, { remarks: reason });
            setOpenUnarchive(false);
            setUnarchiveTarget(null);
            fetchTable();
          }}
        />
      )}
    </div>
  );
}
