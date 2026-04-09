import { useState, useEffect, useCallback } from "react";
import { Eye, RotateCcw } from "lucide-react";
import { Table, type TableColumn, ActionModal } from "../../../reusable";
import { TableFilter } from "../../../hooks/TableFilter";
import { KPICard, KPIGrid, KPIIcons } from "../../../hooks/KPICard";
import { ArchiveReasonModal } from "../../../hooks/archive-modal";
import { LuponCaseDetailView } from "./LuponCaseView";
import {
  getLuponArchiveStats,
  getLuponArchiveTable,
  restoreLuponCase,
  type ArchiveLuponStatsDTO,
  type ArchiveTableDTO,
  type ArchiveTableParams,
  type ArchiveTableResponse,
} from "../../../service/lupon-api/LuponCaseManagement-api";
import {
  getMyAccess,
  type UserSecurityProfile,
} from "../../../service/lupon-api/LuponCasePermission";

const PAGE_SIZE = 10;

const CASE_TYPE_FILTER_OPTIONS = [
  { label: "Formal Complaint", value: "FORMAL_COMPLAINT" },
  { label: "For the Record", value: "FOR_THE_RECORD" },
];

const VIEW_CASES_PERMISSIONS = ["View Cases", "VIEW_CASES", "View Records"];
const ARCHIVE_PERMISSIONS = ["Archive Cases", "ARCHIVE_CASES", "Archive Case"];

const normalizePermission = (value: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[&/]+/g, " ")
    .replace(/\s+/g, " ");

const hasAnyPermission = (owned: string[], required: string[]) => {
  const ownedSet = new Set(owned.map((perm) => normalizePermission(perm)));
  return required.some((perm) => ownedSet.has(normalizePermission(perm)));
};

const toStartDateTime = (value: string) =>
  value ? `${value}T00:00:00` : undefined;
const toEndDateTime = (value: string) =>
  value ? `${value}T23:59:59` : undefined;

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatCaseType = (value: string) => {
  const key = String(value || "").toUpperCase();
  if (key === "FORMAL_COMPLAINT") return "Formal Complaint";
  if (key === "FOR_THE_RECORD") return "For the Record";
  return key.replace(/_/g, " ");
};

const getStatusPillClass = (status: string) => {
  switch (status) {
    case "ARCHIVED":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    case "SETTLED":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "DISMISSED":
      return "bg-rose-50 text-rose-700 border border-rose-200";
    case "CLOSED":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    case "WITHDRAWN":
      return "bg-orange-50 text-orange-700 border border-orange-200";
    case "CERTIFIED_TO_FILE_ACTION":
      return "bg-cyan-50 text-cyan-700 border border-cyan-200";
    case "EXPIRED_UNACTIONED":
      return "bg-red-50 text-red-700 border border-red-200";
    default:
      return "bg-gray-100 text-gray-600 border border-gray-200";
  }
};

function normalizeArchivePage(data: ArchiveTableResponse) {
  const pageMeta = data.page;
  const number = pageMeta?.number ?? data.number ?? 0;
  const size = pageMeta?.size ?? data.size ?? PAGE_SIZE;
  const totalElements = pageMeta?.totalElements ?? data.totalElements ?? 0;
  const totalPages = pageMeta?.totalPages ?? data.totalPages ?? 0;

  return {
    content: data.content ?? [],
    number,
    size,
    totalElements,
    totalPages,
  };
}

export default function LuponArchiveCasesPage() {
  const currentMonthName = new Date().toLocaleDateString("en-PH", {
    month: "long",
  });

  const [selectedBlotterNumber, setSelectedBlotterNumber] = useState<
    string | null
  >(null);

  const [search, setSearch] = useState("");
  const [caseType, setCaseType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [params, setParams] = useState<ArchiveTableParams>({
    search: "",
    caseType: "",
    dateFrom: undefined,
    dateTo: undefined,
    page: 0,
    size: PAGE_SIZE,
    sort: "dateFiled,desc",
  });

  const [userAccess, setUserAccess] = useState<UserSecurityProfile | null>(
    null,
  );
  const [tableData, setTableData] = useState<ArchiveTableDTO[]>([]);
  const [stats, setStats] = useState<ArchiveLuponStatsDTO | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [restoreEntry, setRestoreEntry] = useState<ArchiveTableDTO | null>(
    null,
  );
  const [restoreSuccessOpen, setRestoreSuccessOpen] = useState(false);

  const fetchTable = useCallback(async (p: ArchiveTableParams) => {
    setLoading(true);
    try {
      const raw = await getLuponArchiveTable(p);
      const data = normalizeArchivePage(raw);
      setTableData(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setCurrentPage(data.number);
    } catch {
      console.error("Failed to load archived lupon records.");
      setTableData([]);
      setTotalPages(0);
      setTotalElements(0);
      setCurrentPage(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      setStats(await getLuponArchiveStats());
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetchStats(),
      fetchTable(params),
      getMyAccess()
        .then((access) => setUserAccess(access))
        .catch(() => setUserAccess(null)),
    ]);
  }, []);

  const grantedPermissions = userAccess?.permissions ?? [];
  const canView = hasAnyPermission(grantedPermissions, VIEW_CASES_PERMISSIONS);
  const canArchiveCases = hasAnyPermission(
    grantedPermissions,
    ARCHIVE_PERMISSIONS,
  );

  const handleRestoreSubmit = async (reason: string) => {
    if (!restoreEntry) return;
    await restoreLuponCase(restoreEntry.caseId, { reason });
    setRestoreEntry(null);
    setRestoreSuccessOpen(true);
    fetchTable(params);
    fetchStats();
  };

  const handleApplyFilter = () => {
    const updated: ArchiveTableParams = {
      search,
      caseType: caseType || undefined,
      dateFrom: toStartDateTime(startDate),
      dateTo: toEndDateTime(endDate),
      page: 0,
      size: PAGE_SIZE,
      sort: "dateFiled,desc",
    };
    setParams(updated);
    fetchTable(updated);
  };

  const handleClearFilter = () => {
    setSearch("");
    setCaseType("");
    setStartDate("");
    setEndDate("");

    const reset: ArchiveTableParams = {
      search: "",
      caseType: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      page: 0,
      size: PAGE_SIZE,
      sort: "dateFiled,desc",
    };

    setParams(reset);
    fetchTable(reset);
  };

  const handlePageChange = (page: number) => {
    const updated: ArchiveTableParams = { ...params, page: page - 1 };
    setParams(updated);
    fetchTable(updated);
  };

  const activeFilterCount = [caseType, startDate, endDate].filter(
    Boolean,
  ).length;

  const columns: TableColumn<ArchiveTableDTO>[] = [
    {
      key: "blotterNumber",
      header: "Case / Blotter No.",
      width: "220px",
      render: (item) => (
        <span className="text-gray-600">{item.blotterNumber}</span>
      ),
    },
    {
      key: "caseType",
      header: "Case Type",
      width: "170px",
      render: (item) => (
        <span className="text-gray-600">{formatCaseType(item.caseType)}</span>
      ),
    },
    {
      key: "complainant",
      header: "Complainant",
      width: "240px",
      render: (item) => (
        <span className="block whitespace-normal break-words text-gray-700 leading-snug">
          {item.complainant || "—"}
        </span>
      ),
    },
    {
      key: "respondent",
      header: "Respondent",
      width: "220px",
      render: (item) => (
        <span className="block whitespace-normal break-words text-gray-700 leading-snug">
          {item.respondent || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "170px",
      render: (item) => {
        const statusKey = String(item.status || "")
          .toUpperCase()
          .trim();
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusPillClass(statusKey)}`}
          >
            {statusKey ? statusKey.replace(/_/g, " ") : "UNKNOWN"}
          </span>
        );
      },
    },
    {
      key: "archivedRemarks",
      header: "Archive Remarks",
      width: "290px",
      render: (item) => (
        <span
          className="block whitespace-normal break-words text-gray-700 leading-snug"
          title={item.archivedRemarks || ""}
        >
          {item.archivedRemarks || "—"}
        </span>
      ),
    },
    {
      key: "dateFiled",
      header: "Date Filed",
      width: "140px",
      render: (item) => (
        <span className="text-gray-600 whitespace-nowrap">
          {formatDate(item.dateFiled)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      width: "130px",
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            disabled={!canView}
            onClick={(e) => {
              e.stopPropagation();
              if (canView) setSelectedBlotterNumber(item.blotterNumber);
            }}
            title="View case"
            className={`p-1.5 rounded-lg transition-colors ${
              !canView
                ? "text-gray-400 bg-gray-50 cursor-not-allowed opacity-60"
                : "text-blue-600 hover:bg-blue-50"
            }`}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            disabled={!canArchiveCases}
            onClick={(e) => {
              e.stopPropagation();
              if (canArchiveCases) setRestoreEntry(item);
            }}
            title="Restore case"
            className={`p-1.5 rounded-lg transition-colors ${
              !canArchiveCases
                ? "text-gray-400 bg-gray-50 cursor-not-allowed opacity-60"
                : "text-emerald-600 hover:bg-emerald-50"
            }`}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (selectedBlotterNumber) {
    return (
      <LuponCaseDetailView
        blotterNumber={selectedBlotterNumber}
        onBack={() => {
          setSelectedBlotterNumber(null);
          fetchTable(params);
          fetchStats();
        }}
      />
    );
  }

  return (
    <div className="w-full space-y-5">
      <KPIGrid columns={4}>
        <KPICard
          title="Total Archived"
          value={statsLoading ? "..." : (stats?.totalArchived ?? 0)}
          color="slate"
          icon={KPIIcons.document}
          subtitle="All archived lupon cases"
        />
        <KPICard
          title="Archived This Month"
          value={statsLoading ? "..." : (stats?.archivedThisMonth ?? 0)}
          color="blue"
          icon={KPIIcons.month}
          subtitle={`Cases archived in ${currentMonthName}`}
        />
        <KPICard
          title="Archived Settled"
          value={statsLoading ? "..." : (stats?.totalArchiveSettled ?? 0)}
          color="emerald"
          icon={KPIIcons.check}
          subtitle="Archived settled cases"
        />
        <KPICard
          title="Archived CFA"
          value={statsLoading ? "..." : (stats?.totalArchiveCFA ?? 0)}
          color="violet"
          icon={KPIIcons.issued}
          subtitle="Archived certified to file action"
        />
      </KPIGrid>

      {restoreEntry && (
        <ArchiveReasonModal
          isOpen={!!restoreEntry}
          onClose={() => setRestoreEntry(null)}
          title="Restore Archived Lupon Case"
          subjectName={restoreEntry.blotterNumber}
          subjectLabel="case"
          submitLabel="Restore"
          placeholder="Provide reason for restoring this case..."
          onSubmit={handleRestoreSubmit}
        />
      )}

      <ActionModal
        isOpen={restoreSuccessOpen}
        onClose={() => setRestoreSuccessOpen(false)}
        title="Case restored"
        type="success"
      >
        Archived Lupon case has been restored successfully.
      </ActionModal>

      <TableFilter
        searchPlaceholder="Search by blotter no., complainant, respondent"
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          {
            label: "Case Type",
            key: "caseType",
            options: CASE_TYPE_FILTER_OPTIONS,
            value: caseType,
          },
        ]}
        onFilterChange={(key, value) => {
          if (key === "caseType") setCaseType(value);
        }}
        dateRange={{
          startLabel: "Date From",
          endLabel: "Date To",
          startValue: startDate,
          endValue: endDate,
          onStartChange: setStartDate,
          onEndChange: setEndDate,
        }}
        onFilterClick={handleApplyFilter}
        onClearClick={handleClearFilter}
        filterButtonText="Apply"
        activeFilterCount={activeFilterCount}
      />

      <Table<ArchiveTableDTO>
        columns={columns}
        data={tableData}
        keyExtractor={(item) => item.caseId}
        loading={loading}
        emptyMessage="No archived lupon records found."
        variant="resident"
        onRowClick={(item) => {
          if (canView) setSelectedBlotterNumber(item.blotterNumber);
        }}
        hoverable
        striped
        minRows={PAGE_SIZE}
        pagination={
          totalElements > 0
            ? {
                currentPage: currentPage + 1,
                totalPages,
                totalItems: totalElements,
                itemsPerPage: PAGE_SIZE,
                onPageChange: handlePageChange,
              }
            : undefined
        }
      />
    </div>
  );
}
