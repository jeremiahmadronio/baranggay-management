import { useState, useEffect, useCallback } from "react";
import {
  
  Eye,
  ShieldAlert,
  AlertTriangle,
  Database,
  CalendarDays,
} from "lucide-react";

import { KPICard, KPIGrid } from "../reusable/KPICard";
import { Table, type TableColumn } from "../reusable/Table";
import { TableFilter } from "../reusable/TableFilter";
import { ViewModal } from "../reusable/DetailView";

import {
  getAuditStats,
  getAuditTable,
  getFilterOptions,
  getAuditLog,
  type AuditTable,
  type AuditLogStats,
  type AuditFilterOptions,
  type AuditTableView,
} from "../admin-root-api/audit-logs";

const HIDDEN_FIELDS = new Set([
  "id",
  "uuid",
  "password",
  "passwordHash",
  "password_hash",
  "salt",
  "token",
  "refreshToken",
  "refresh_token",
  "accessToken",
  "access_token",
  "secret",
]);

const DATE_FIELDS = new Set([
  "createdAt",
  "created_at",
  "updatedAt",
  "updated_at",
  "lastLoginAt",
  "last_login_at",
  "deletedAt",
  "deleted_at",
  "lockUntil",
  "lock_until",
]);

const isIsoDate = (v: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v);

const fmtDate = (raw: string) => {
  if (!raw) return "—";
  try {
    return new Intl.DateTimeFormat("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(raw));
  } catch {
    return raw;
  }
};

const fmtVal = (v: unknown, key = ""): string => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  const str = String(v);
  if (DATE_FIELDS.has(key) || isIsoDate(str)) return fmtDate(str);
  return str;
};

const humanKey = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const tryParseObj = (raw: string): Record<string, unknown> | null => {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (typeof p === "object" && p !== null && !Array.isArray(p)) return p;
    return null;
  } catch {
    return null;
  }
};

const visible = (obj: Record<string, unknown>) =>
  Object.entries(obj).filter(([k]) => !HIDDEN_FIELDS.has(k));

type StatusType =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "pending"
  | "default";

const statusCfg: Record<
  StatusType,
  { border: string; text: string; dot: string }
> = {
  success: {
    border: "border-emerald-400",
    text: "text-emerald-600",
    dot: "bg-emerald-500",
  },
  warning: {
    border: "border-amber-400",
    text: "text-amber-600",
    dot: "bg-amber-500",
  },
  danger: {
    border: "border-rose-400",
    text: "text-rose-600",
    dot: "bg-rose-500",
  },
  info: { border: "border-sky-400", text: "text-sky-600", dot: "bg-sky-500" },
  pending: {
    border: "border-orange-400",
    text: "text-orange-600",
    dot: "bg-orange-500",
  },
  default: {
    border: "border-slate-300",
    text: "text-slate-500",
    dot: "bg-slate-400",
  },
};

const StatusBadge = ({
  status,
  label,
}: {
  status: StatusType;
  label: string;
}) => {
  const c = statusCfg[status] ?? statusCfg.default;
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border bg-white text-xs px-3 py-1 ${c.border} ${c.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {label}
    </span>
  );
};

const sevToStatus = (s: string): StatusType =>
  (
    ({ critical: "danger", warning: "warning", info: "info" }) as Record<
      string,
      StatusType
    >
  )[s?.toLowerCase()] ?? "default";

const MOD_STYLES: Record<string, string> = {
  VAWC: "bg-blue-100 text-blue-700",
  BCPC: "bg-teal-100 text-teal-700",
  System: "bg-gray-100 text-gray-600",
  USER_SECURITY: "bg-violet-100 text-violet-700",
  FTJS: "bg-cyan-100 text-cyan-700",
  Operational: "bg-pink-100 text-pink-700",
  Blotter: "bg-orange-100 text-orange-700",
  Clearance: "bg-green-100 text-green-700",
  Lupong: "bg-yellow-100 text-yellow-700",
};

const ModuleBadge = ({ module }: { module: string }) => (
  <span
    className={`px-2.5 py-1 text-xs font-semibold rounded-md ${MOD_STYLES[module] ?? "bg-purple-100 text-purple-700"}`}
  >
    {module}
  </span>
);

const PlainCard = ({
  raw,
  variant,
}: {
  raw: string;
  variant: "old" | "new";
}) => {
  if (!raw)
    return <span className="text-gray-400 text-xs italic">No data</span>;
  const isOld = variant === "old";
  const wrapCls = isOld
    ? "border-rose-200 bg-rose-50"
    : "border-emerald-200 bg-emerald-50";
  const labCls = isOld ? "text-rose-600" : "text-emerald-600";
  const valCls = isOld
    ? "text-rose-700 font-semibold"
    : "text-emerald-700 font-semibold";
  const display = isIsoDate(raw) ? fmtDate(raw) : raw;
  return (
    <div className={`rounded-lg border px-4 py-3 ${wrapCls}`}>
      <p className={`text-xs font-semibold mb-1 ${labCls}`}>
        {isOld ? "Before" : "After"}
      </p>
      <p className={`text-sm break-all ${valCls}`}>{display}</p>
    </div>
  );
};

const FieldCard = ({
  entries,
  variant,
}: {
  entries: [string, unknown][];
  variant: "old" | "new";
}) => {
  const isOld = variant === "old";
  const wrapCls = isOld ? "border-rose-200" : "border-emerald-200";
  const headCls = isOld
    ? "bg-rose-50 text-rose-700 border-rose-200"
    : "bg-emerald-50 text-emerald-700 border-emerald-200";
  const rowEven = isOld ? "even:bg-rose-50/30" : "even:bg-emerald-50/30";
  const rowBdr = isOld ? "border-rose-100" : "border-emerald-100";
  const valCls = isOld
    ? "text-rose-700 font-semibold"
    : "text-emerald-700 font-semibold";
  return (
    <div className={`rounded-lg border overflow-hidden ${wrapCls}`}>
      <div className={`px-3 py-1.5 text-xs font-semibold border-b ${headCls}`}>
        {isOld ? "Before" : "After"}
      </div>
      <table className="w-full text-xs">
        <tbody>
          {entries.map(([k, v]) => (
            <tr
              key={k}
              className={`border-b last:border-0 ${rowEven} ${rowBdr}`}
            >
              <td className="px-3 py-1.5 font-medium text-gray-500 whitespace-nowrap w-5/12">
                {humanKey(k)}
              </td>
              <td className={`px-3 py-1.5 break-all ${valCls}`}>
                {fmtVal(v, k)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const DiffViewer = ({ oldRaw, newRaw }: { oldRaw: string; newRaw: string }) => {
  const oldObj = tryParseObj(oldRaw);
  const newObj = tryParseObj(newRaw);

  if (oldObj && newObj) {
    const allKeys = Array.from(
      new Set([...Object.keys(oldObj), ...Object.keys(newObj)]),
    ).filter((k) => !HIDDEN_FIELDS.has(k));
    const changedKeys = allKeys.filter(
      (k) => fmtVal(oldObj[k], k) !== fmtVal(newObj[k], k),
    );
    const unchangedKeys = allKeys.filter(
      (k) => fmtVal(oldObj[k], k) === fmtVal(newObj[k], k),
    );

    if (changedKeys.length === 0)
      return (
        <p className="text-xs text-gray-400 italic px-1">
          No field changes recorded.
        </p>
      );

    return (
      <div className="space-y-1.5">
        <div className="rounded-lg border border-gray-200 overflow-hidden text-xs">
          <div className="grid grid-cols-[1.4fr_1fr_1fr] bg-gray-50 border-b border-gray-200 font-semibold text-gray-500">
            <div className="px-3 py-2">Field</div>
            <div className="px-3 py-2 border-l border-gray-200 text-rose-500">
              Before
            </div>
            <div className="px-3 py-2 border-l border-gray-200 text-emerald-600">
              After
            </div>
          </div>
          {changedKeys.map((k) => (
            <div
              key={k}
              className="grid grid-cols-[1.4fr_1fr_1fr] border-b last:border-0 border-amber-100 bg-amber-50/40"
            >
              <div className="px-3 py-2 font-medium text-gray-700 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                {humanKey(k)}
              </div>
              <div className="px-3 py-2 border-l border-amber-100 text-rose-600 font-semibold break-all line-through decoration-rose-300">
                {fmtVal(oldObj[k], k)}
              </div>
              <div className="px-3 py-2 border-l border-amber-100 text-emerald-600 font-semibold break-all">
                {fmtVal(newObj[k], k)}
              </div>
            </div>
          ))}
        </div>
        {unchangedKeys.length > 0 && (
          <p className="text-xs text-gray-400 pl-1">
            {unchangedKeys.length} field{unchangedKeys.length > 1 ? "s" : ""}{" "}
            unchanged ({unchangedKeys.map(humanKey).join(", ")})
          </p>
        )}
      </div>
    );
  }

  if (!oldObj && !newObj)
    return (
      <div className="grid grid-cols-2 gap-3">
        <PlainCard raw={oldRaw} variant="old" />
        <PlainCard raw={newRaw} variant="new" />
      </div>
    );

  return (
    <div className="grid grid-cols-2 gap-3">
      {oldObj ? (
        <FieldCard entries={visible(oldObj)} variant="old" />
      ) : (
        <PlainCard raw={oldRaw} variant="old" />
      )}
      {newObj ? (
        <FieldCard entries={visible(newObj)} variant="new" />
      ) : (
        <PlainCard raw={newRaw} variant="new" />
      )}
    </div>
  );
};

const SingleSide = ({
  raw,
  variant,
}: {
  raw: string;
  variant: "old" | "new";
}) => {
  const obj = tryParseObj(raw);
  return obj ? (
    <FieldCard entries={visible(obj)} variant={variant} />
  ) : (
    <PlainCard raw={raw} variant={variant} />
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

export default function AuditLogs() {
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [logs, setLogs] = useState<AuditTable[]>([]);
  const [filterOptions, setFilterOptions] = useState<AuditFilterOptions | null>(
    null,
  );
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditTableView | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    getAuditStats().then(setStats).catch(console.error);
    getFilterOptions().then(setFilterOptions).catch(console.error);
  }, []);

  const fetchTable = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAuditTable({
        search: search || undefined,
        severity: severity || undefined,
        module: module || undefined,
        action: action || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: currentPage - 1,
        size: PAGE_SIZE,
      });
      console.log("Audit API Response:", res);
      console.log(
        "totalElements:",
        res.totalElements,
        "totalPages:",
        res.totalPages,
        "content.length:",
        res.content?.length,
      );

      // Backend properly paginates - use the normalized response directly
      setLogs(res.content || []);
      setTotalItems(res.totalElements);
      setTotalPages(res.totalPages);

      console.log(
        "Pagination - Page:",
        currentPage,
        "Showing:",
        res.content?.length,
        "of",
        res.totalElements,
        "Total pages:",
        res.totalPages,
      );
    } catch (err) {
      console.error("Audit table fetch error:", err);
      setLogs([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [search, severity, module, action, startDate, endDate, currentPage]);

  useEffect(() => {
    fetchTable();
  }, [fetchTable]);

  const handleFilterApply = () => {
    setCurrentPage(1);
    fetchTable();
  };
  const handleClear = () => {
    setSearch("");
    setSeverity("");
    setModule("");
    setAction("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const handleView = async (log: AuditTable) => {
    setModalLoading(true);
    setModalOpen(true);
    try {
      const detail = await getAuditLog(log.id);
      setSelectedLog(detail);
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedLog(null);
  };

  // ── Active filter count (for badge on Apply button) ───────────────────────
  const activeFilterCount = [
    search,
    severity,
    module,
    action,
    startDate,
    endDate,
  ].filter(Boolean).length;

  // ── Table Columns ─────────────────────────────────────────────────────────
  const columns: TableColumn<AuditTable>[] = [
    {
      key: "firstName",
      header: "User",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
            {row.firstName?.[0]}
            {row.lastName?.[0]}
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm leading-tight">
              {row.firstName} {row.lastName}
            </p>
            <p className="text-xs text-gray-400">{row.roleName}</p>
          </div>
        </div>
      ),
    },
    {
      key: "actionTaken",
      header: "Action",
      render: (row) => (
        <span className="text-xs font-mono font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
          {row.actionTaken}
        </span>
      ),
    },
    {
      key: "module",
      header: "Module",
      render: (row) => <ModuleBadge module={row.module} />,
    },

    {
      key: "ipAddress",
      header: "IP Address",
      render: (row) => (
        <span className="text-gray-500 text-xs font-mono">{row.ipAddress}</span>
      ),
    },
    {
      key: "severity",
      header: "Severity",
      render: (row) => (
        <StatusBadge status={sevToStatus(row.severity)} label={row.severity} />
      ),
    },
    {
      key: "id",
      header: "",
      align: "center",
      width: "56px",
      render: (row) => (
        <button
          onClick={() => handleView(row)}
          title="View details"
          className="p-1.5 rounded-lg hover:bg-blue-50 transition group"
        >
          <Eye className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition" />
        </button>
      ),
    },
  ];

  // ── Modal sections ────────────────────────────────────────────────────────
  const buildModalSections = (log: AuditTableView) => {
    const hasOld = !!log.oldValue;
    const hasNew = !!log.newValue;
    return [
      {
        title: "Activity Info",
        fields: [
          {
            key: "module",
            label: "Module",
            value: <ModuleBadge module={log.module} />,
          },
          {
            key: "action",
            label: "Action",
            value: (
              <span className="text-xs font-mono font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                {log.actionTaken}
              </span>
            ),
          },
          {
            key: "severity",
            label: "Severity",
            value: (
              <StatusBadge
                status={sevToStatus(log.severity)}
                label={log.severity}
              />
            ),
          },
          {
            key: "ip",
            label: "IP Address",
            value: (
              <span className="font-mono text-sm text-gray-700">
                {log.ipAddress || "—"}
              </span>
            ),
          },
          {
            key: "lastLogin",
            label: "Last Login",
            value: fmtDate(log.lastLoginAt),
          },
          {
            key: "createdAt",
            label: "Logged At",
            value: fmtDate(log.createdAt),
          },
        ],
      },
      {
        title: "Details",
        fields: [
          {
            key: "reason",
            label: "Reason",
            width: "full" as const,
            value: (
              <span className="block bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5 text-sm text-gray-700">
                {log.reason || "—"}
              </span>
            ),
          },
          ...(hasOld || hasNew
            ? [
                {
                  key: "changes",
                  label: "Field Changes",
                  width: "full" as const,
                  value:
                    hasOld && hasNew ? (
                      <DiffViewer oldRaw={log.oldValue} newRaw={log.newValue} />
                    ) : hasOld ? (
                      <SingleSide raw={log.oldValue} variant="old" />
                    ) : (
                      <SingleSide raw={log.newValue} variant="new" />
                    ),
                },
              ]
            : []),
        ],
      },
    ];
  };

  return (
    <div className="p-6 min-h-screen font-sans">
      {/* KPI Cards */}
      <div className="mb-5">
        <KPIGrid columns={4}>
          <KPICard
            title="Total Entries"
            value={stats?.totalEntries ?? "—"}
            icon={<Database className="w-6 h-6" />}
            color="blue"
          />
          <KPICard
            title="Today"
            value={stats?.todayEntry ?? "—"}
            icon={<CalendarDays className="w-6 h-6" />}
            color="emerald"
          />
          <KPICard
            title="Warnings"
            value={stats?.totalWarning ?? "—"}
            icon={<AlertTriangle className="w-6 h-6" />}
            color="amber"
          />
          <KPICard
            title="Critical"
            value={stats?.totalCritical ?? "—"}
            icon={<ShieldAlert className="w-6 h-6" />}
            color="rose"
          />
        </KPIGrid>
      </div>

      <TableFilter
        searchPlaceholder="Search user, action, reason..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          {
            label: "Module",
            key: "module",
            value: module,
            options: (filterOptions?.modules ?? []).map((m) => ({
              value: m,
              label: m,
            })),
          },

          {
            label: "Severity",
            key: "severity",
            value: severity,
            options: (filterOptions?.severities ?? []).map((s) => ({
              value: s,
              label: s,
            })),
          },
        ]}
        onFilterChange={(key, val) => {
          if (key === "module") setModule(val);
          if (key === "action") setAction(val);
          if (key === "severity") setSeverity(val);
        }}
        // ── Date range passed as a single prop ──────────────────────────────
        dateRange={{
          startValue: startDate,
          endValue: endDate,
          onStartChange: setStartDate,
          onEndChange: setEndDate,
        }}
        activeFilterCount={activeFilterCount}
        onFilterClick={handleFilterApply}
        onClearClick={handleClear}
        filterButtonText="Apply"
        clearButtonText="Clear"
      />

      {/* Table */}
      <Table<AuditTable>
        columns={columns}
        data={logs}
        keyExtractor={(row) => row.id}
        loading={loading}
        minRows={PAGE_SIZE}
        emptyMessage="No audit logs found."
        pagination={{
          currentPage,
          totalPages,
          totalItems,
          itemsPerPage: PAGE_SIZE,
          onPageChange: setCurrentPage,
        }}
      />

      {/* Modal loading */}
      {modalLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl px-8 py-6 flex items-center gap-3 shadow-xl">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-200 border-t-blue-600" />
            <span className="text-sm text-gray-600">Loading details…</span>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <ViewModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          title="Audit Log Details"
          subtitle={`Entry ID #${selectedLog.id}`}
          size="lg"
          closeText="Close"
          avatar={{ name: `${selectedLog.firstName} ${selectedLog.lastName}` }}
          sections={buildModalSections(selectedLog)}
        />
      )}
    </div>
  );
}
