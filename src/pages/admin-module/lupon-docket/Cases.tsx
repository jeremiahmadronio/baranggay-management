import { useEffect, useState, useCallback } from "react";
import { AlertCircle, Archive, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { KPICard, KPIGrid, KPIIcons } from "../../../hooks/KPICard";
import { Table, type TableColumn } from "../../../hooks/Table";
import { TableFilter } from "../../../hooks/TableFilter";
import { ActionModal } from "../../../reusable";
import { ArchiveReasonModal } from "../../../hooks/archive-modal";

import {
  archiveLuponCase,
  getLuponDashboardStats,
  getLuponSummary,
  type LuponCaseStatsDTO,
  type LuponSummaryDTO,
  type LuponSummaryParams,
} from "../../../service/lupon-api/LuponCaseManagement-api";
import { getMyAccess } from "../../../service/lupon-api/LuponCasePermission";

type LoadState = "idle" | "loading" | "success" | "error";

const PAGE_SIZE = 10;
const ARCHIVABLE_STATUSES = new Set([
  "SETTLED",
  "EXPIRED_UNACTIONED",
  "DISMISSED",
  "CERTIFIED_TO_FILE_ACTION",
  "WITHDRAWN",
  "CLOSED",
]);

const ARCHIVE_CASES_PERMISSIONS = ["Archive Cases", "ARCHIVE_CASES"];

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

const isArchivedCase = (status: string) =>
  String(status || "")
    .toUpperCase()
    .trim() === "ARCHIVED";

const getStatusPillClass = (status: string) => {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "UNDER_MEDIATION":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    case "UNDER_CONCILIATION":
      return "bg-indigo-50 text-indigo-700 border border-indigo-200";
    case "REFERRED_TO_LUPON":
      return "bg-violet-50 text-violet-700 border border-violet-200";
    case "SETTLED":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "DISMISSED":
      return "bg-rose-50 text-rose-700 border border-rose-200";
    case "CERTIFIED_TO_FILE_ACTION":
      return "bg-cyan-50 text-cyan-700 border border-cyan-200";
    case "EXPIRED_UNACTIONED":
      return "bg-red-50 text-red-700 border border-red-200";
    case "WITHDRAWN":
      return "bg-orange-50 text-orange-700 border border-orange-200";
    case "CLOSED":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    default:
      return "bg-gray-100 text-gray-600 border border-gray-200";
  }
};

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

const AdminLuponCases = () => {
  const navigate = useNavigate();

  // ── KPI state
  const [stats, setStats] = useState<LuponCaseStatsDTO | null>(null);
  const [statsState, setStatsState] = useState<LoadState>("idle");
  const [statsError, setStatsError] = useState("");

  // ── Table state
  const [rows, setRows] = useState<LuponSummaryDTO[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState("");
  const [archiveEntry, setArchiveEntry] = useState<LuponSummaryDTO | null>(
    null,
  );
  const [archiveSuccessOpen, setArchiveSuccessOpen] = useState(false);
  const [canArchive, setCanArchive] = useState(false);

  // ── Filter / pagination state
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(0); // 0-indexed (Spring)

  // ─── Fetch KPI stats ──────────────────────────────────────────────────────

  const fetchStats = async () => {
    setStatsState("loading");
    setStatsError("");
    try {
      const data = await getLuponDashboardStats();
      setStats(data);
      setStatsState("success");
    } catch (err) {
      setStatsError("Failed to load stats.");
      setStatsState("error");
    }
  };

  // ─── Fetch table rows ─────────────────────────────────────────────────────

  const fetchSummary = useCallback(async (params: LuponSummaryParams) => {
    setTableLoading(true);
    setTableError("");
    try {
      const res = await getLuponSummary(params);
      setRows(res.content);
      setTotalElements(res.totalElements);
      setTotalPages(res.totalPages);
    } catch (err) {
      setTableError("Failed to load cases.");
    } finally {
      setTableLoading(false);
    }
  }, []);

  // ─── On mount ─────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchStats();
    fetchSummary({ page: 0, size: PAGE_SIZE });
    setCanArchive(false);
  }, []);

  // ─── Re-fetch when page changes ───────────────────────────────────────────

  useEffect(() => {
    fetchSummary({
      search: search || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page,
      size: PAGE_SIZE,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // ─── Apply / Clear ────────────────────────────────────────────────────────

  const handleApply = () => {
    setPage(0);
    fetchSummary({
      search: search || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page: 0,
      size: PAGE_SIZE,
    });
  };

  const handleClear = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setPage(0);
    fetchSummary({ page: 0, size: PAGE_SIZE });
  };

  const handleArchiveSubmit = async (reason: string) => {
    if (!archiveEntry) return;
    await archiveLuponCase(archiveEntry.id, { reason });
    setArchiveEntry(null);
    setArchiveSuccessOpen(true);
    fetchSummary({
      search: search || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page,
      size: PAGE_SIZE,
    });
    fetchStats();
  };

  const activeFilterCount = [search, startDate, endDate].filter(Boolean).length;
  const safeTotalPages = Math.max(1, totalPages || 0);
  const visibleRows = rows.filter((item) => !isArchivedCase(item.status));

  const columns: TableColumn<LuponSummaryDTO>[] = [
    {
      key: "blotterNumber",
      header: "Case / Blotter No.",
      width: "250px",
      render: (item) => (
        <span className="text-gray-600">{item.blotterNumber}</span>
      ),
    },
    {
      key: "complainantName",
      header: "Complainant",
      width: "260px",
      render: (item) => (
        <span className="block whitespace-normal break-words text-gray-600 leading-snug">
          {item.complainantName}
        </span>
      ),
    },
    {
      key: "respondentName",
      header: "Respondent",
      width: "175px",
      render: (item) => (
        <span className="text-gray-600">{item.respondentName}</span>
      ),
    },
    {
      key: "natureOfComplaint",
      header: "Nature of Complaint",
      render: (item) => (
        <span className="text-gray-600 truncate block max-w-[180px]">
          {item.natureOfComplaint}
        </span>
      ),
    },
    {
      key: "dateFiled",
      header: "Date Filed",
      width: "120px",
      render: (item) => (
        <span className="text-gray-600 whitespace-nowrap">
          {formatDate(item.dateFiled)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "175px",
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
      key: "actions",
      header: "Actions",
      align: "right",
      width: "160px",
      render: (item) => {
        const statusKey = String(item.status || "")
          .toUpperCase()
          .trim();
        const canArchiveThisStatus = ARCHIVABLE_STATUSES.has(statusKey);

        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/admin/lupon-cases/view/${item.blotterNumber}`, {
                  state: { caseId: item.id },
                });
              }}
              title="View case"
              className="p-1.5 rounded-lg transition-colors text-blue-600 hover:bg-blue-50"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full space-y-5">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {archiveEntry && (
          <ArchiveReasonModal
            isOpen={!!archiveEntry}
            onClose={() => setArchiveEntry(null)}
            title="Archive Lupon Case"
            subjectName={archiveEntry.blotterNumber}
            subjectLabel="case"
            submitLabel="Archive"
            placeholder="Provide reason for archiving this case..."
            onSubmit={handleArchiveSubmit}
          />
        )}

        <ActionModal
          isOpen={archiveSuccessOpen}
          onClose={() => setArchiveSuccessOpen(false)}
          title="Case archived"
          type="success"
        >
          The Lupon case has been archived successfully.
        </ActionModal>

        {statsState === "error" && (
          <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
            <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-rose-700">{statsError}</p>
            </div>
          </div>
        )}

        <KPIGrid columns={4}>
          <KPICard
            title="Total Referred"
            value={
              statsState === "loading" ? "..." : (stats?.totalReferred ?? 0)
            }
            color="blue"
            icon={KPIIcons["document"]}
            subtitle="All cases referred to Lupon"
          />
          <KPICard
            title="Active Conciliation"
            value={
              statsState === "loading"
                ? "..."
                : (stats?.activeConciliation ?? 0)
            }
            color="amber"
            icon={KPIIcons["pending"]}
            subtitle="Cases currently under handling"
          />
          <KPICard
            title="Successfully Settled"
            value={
              statsState === "loading"
                ? "..."
                : (stats?.successfullySettled ?? 0)
            }
            color="emerald"
            icon={KPIIcons["check"]}
            subtitle="Cases closed through settlement"
          />
          <KPICard
            title="CFA Issued"
            value={statsState === "loading" ? "..." : (stats?.cfaIssued ?? 0)}
            color="violet"
            icon={KPIIcons["issued"]}
            subtitle="Certificates to File Action"
          />
        </KPIGrid>

        <TableFilter
          searchPlaceholder="Search by case no."
          searchValue={search}
          onSearchChange={setSearch}
          dateRange={{
            startLabel: "Date From",
            endLabel: "Date To",
            startValue: startDate,
            endValue: endDate,
            onStartChange: setStartDate,
            onEndChange: setEndDate,
          }}
          onFilterClick={handleApply}
          onClearClick={handleClear}
          filterButtonText="Apply"
          activeFilterCount={activeFilterCount}
        />

        {tableError && (
          <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 mb-3">
            <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
            <p className="text-sm text-rose-700">{tableError}</p>
          </div>
        )}

        <Table<LuponSummaryDTO>
          columns={columns}
          data={visibleRows}
          keyExtractor={(item) => item.id}
          loading={tableLoading}
          emptyMessage="No docket records found."
          variant="resident"
          onRowClick={(item) => {
            navigate(`/lupongtagapamayapa/cases/${item.blotterNumber}`, {
              state: { caseId: item.id },
            });
          }}
          hoverable
          striped
          minRows={PAGE_SIZE}
          pagination={{
            currentPage: Math.min(page + 1, safeTotalPages),
            totalPages: safeTotalPages,
            totalItems: totalElements,
            itemsPerPage: PAGE_SIZE,
            onPageChange: (p) => setPage(p - 1),
          }}
        />
      </div>
    </div>
  );
};

export default AdminLuponCases;
