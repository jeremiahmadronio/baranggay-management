import { useState, useEffect, useCallback } from "react";
import { Eye, Archive } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { KPICard, KPIGrid, KPIIcons } from "../../hooks/KPICard";
import { TableFilter } from "../../hooks/TableFilter";
import { Table, type TableColumn } from "../../reusable";
import {
  getBcpcCaseTable,
  getBcpcStats,
  type BcpcCaseSummaryDTO,
  type BcpcStatsDTO,
} from "../../service/bcpc-api/BcpcFormService";
import { archiveCase } from "../../service/bcpc-api/CaseDetail";
import { ArchiveReasonModal } from "../../hooks/archive-modal";
import { ActionModal } from "../../hooks/SuccessModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VIOLENCE_TYPE_TONE: string[] = [
  "bg-rose-50 text-rose-700 border border-rose-200",
  "bg-amber-50 text-amber-700 border border-amber-200",
  "bg-blue-50 text-blue-700 border border-blue-200",
  "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "bg-violet-50 text-violet-700 border border-violet-200",
];

// Normalize status for internal logic
const normalizeStatus = (s: string) => s.toLowerCase().replace(/_/g, " ");

// Map status to display label
const getStatusDisplay = (status: string) => {
  if (normalizeStatus(status) === "elevated to formal")
    return "ESCALATED TO CASE";
  if (normalizeStatus(status) === "recorded") return "RECORDED";
  return status.replace(/_/g, " ").toUpperCase();
};

const formatNameAsInitials = (fullName?: string) => {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "-";
  return parts.map((p) => `${p.charAt(0).toUpperCase()}.`).join(" ");
};

const getStatusPillClass = (status: string) => {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "UNDER_MEDIATION":
    case "UNDER_INTERVENTION":
      return "bg-sky-50 text-sky-700 border border-sky-200";
    case "UNDER_CONCILIATION":
      return "bg-indigo-50 text-indigo-700 border border-indigo-200";
    case "REFERRED_TO_LUPON":
    case "REFERRED":
    case "ISSUED_REFERRAL":
      return "bg-violet-50 text-violet-700 border border-violet-200";
    case "SETTLED":
    case "RESOLVED":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "RECORDED":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "DISMISSED":
      return "bg-rose-50 text-rose-700 border border-rose-200";
    case "CERTIFIED_TO_FILE_ACTION":
      return "bg-cyan-50 text-cyan-700 border border-cyan-200";
    case "EXPIRED_UNACTIONED":
      return "bg-red-50 text-red-700 border border-red-200";
    case "WITHDRAWN":
      return "bg-gray-100 text-gray-600 border border-gray-200";
    case "CLOSED":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    case "ELEVATED_TO_FORMAL":
      return "bg-red-50 text-red-700 border border-red-200";
    default:
      return "bg-gray-100 text-gray-600 border border-gray-200";
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const normalized = String(status || "")
    .toUpperCase()
    .trim();
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusPillClass(normalized)}`}
    >
      {getStatusDisplay(status)}
    </span>
  );
};

const ARCHIVABLE_STATUSES = new Set([
  "RECORDED",
  "SETTLED",
  "RESOLVED",
  "DISMISSED",
  "WITHDRAWN",
  "CLOSED",
  "CERTIFIED_TO_FILE_ACTION",
]);

// nature stored as "NATURE" or "NATURE | VIOLENCE_TYPE"
const parseNatureAndViolence = (raw: string) => {
  if (!raw) return { nature: "-", violenceTypes: [] as string[] };
  const parts = raw.split("|").map((p) => p.trim());
  return {
    nature: parts[0] || "-",
    violenceTypes: parts.slice(1).filter(Boolean),
  };
};

// ─── Component ────────────────────────────────────────────────────────────────

const EMPTY_STATS: BcpcStatsDTO = {
  totalPending: 0,
  totalClosed: 0,
  totalExpiringSoon: 0,
  totalCases: 0,
};

const SIZE = 10;

export default function BcpcCaseManagement() {
  const navigate = useNavigate();

  const [stats, setStats]           = useState<BcpcStatsDTO>(EMPTY_STATS);
  const [loadingStats, setLoadingStats] = useState(true);

  const [cases, setCases]               = useState<BcpcCaseSummaryDTO[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages]       = useState(0);
  const [currentPage, setCurrentPage]     = useState(0);
  const [loadingTable, setLoadingTable]   = useState(false);
  const [tableError, setTableError]       = useState<string | null>(null);

  const [search, setSearch]           = useState("");
  const [status, setStatus]           = useState("");
  const [dateFrom, setDateFrom]       = useState("");
  const [dateTo, setDateTo]           = useState("");

  const [archiveEntry, setArchiveEntry] = useState<BcpcCaseSummaryDTO | null>(null);
  const [archiveSuccessOpen, setArchiveSuccessOpen] = useState(false);

  // ── Fetch KPI stats ─────────────────────────────────────────────────────────
  useEffect(() => {
    getBcpcStats()
      .then(setStats)
      .catch(() => setStats(EMPTY_STATS))
      .finally(() => setLoadingStats(false));
  }, []);

  // ── Fetch case table ────────────────────────────────────────────────────────
  const fetchCases = useCallback(async () => {
    setLoadingTable(true);
    setTableError(null);
    try {
      const page = await getBcpcCaseTable({
        search: search || undefined,
        status: status || undefined,
        start:  dateFrom || undefined,
        end:    dateTo   || undefined,
        page:   currentPage,
        size:   SIZE,
      });
      setCases(page.content ?? []);
      setTotalElements(page.totalElements ?? 0);
      setTotalPages(page.totalPages ?? 0);
    } catch (err: any) {
      setTableError(err?.message || "Failed to load BCPC cases.");
      setCases([]);
      setTotalElements(0);
      setTotalPages(0);
    } finally {
      setLoadingTable(false);
    }
  }, [search, status, dateFrom, dateTo, currentPage]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  const handleArchiveSubmit = async (reason: string) => {
    if (!archiveEntry) return;
    try {
      await archiveCase(archiveEntry.id, reason);
      setArchiveEntry(null);
      setArchiveSuccessOpen(true);
      fetchCases();
      // Refresh stats
      getBcpcStats()
        .then(setStats)
        .catch(() => setStats(EMPTY_STATS));
    } catch (err) {
      console.error("Failed to archive case:", err);
      alert("Failed to archive case. Please try again.");
    }
  };

  // ── Table columns ────────────────────────────────────────────────────────────
  const columns: TableColumn<BcpcCaseSummaryDTO>[] = [
    { key: "caseNumber", header: "CASE NUMBER", align: "left" },
    {
      key: "victimFullName",
      header: "VICTIM",
      align: "left",
      render: (item) => formatNameAsInitials(item.victimFullName),
    },
    {
      key: "natureOfCase",
      header: "NATURE / VIOLENCE TYPE",
      align: "left",
      render: (item) => {
        const { nature, violenceTypes } = parseNatureAndViolence(item.natureOfCase);
        return (
          <div className="flex flex-col gap-1">
            <span className="text-sm text-slate-700">{nature}</span>
            {violenceTypes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {violenceTypes.map((v, i) => (
                  <span
                    key={i}
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      VIOLENCE_TYPE_TONE[i % VIOLENCE_TYPE_TONE.length]
                    }`}
                  >
                    {v}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "STATUS",
      align: "center",
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "dateFiled",
      header: "DATE FILED",
      align: "left",
      render: (item) =>
        item.dateFiled
          ? new Date(item.dateFiled).toLocaleDateString("en-PH")
          : "-",
    },
    { key: "assignedOfficer", header: "ASSIGNED OFFICER", align: "left" },
    {
      key: "actions" as any,
      header: "ACTION",
      align: "center",
      render: (item) => {
        const statusKey = String(item.status || "").toUpperCase().trim();
        const canArchiveThisStatus = ARCHIVABLE_STATUSES.has(statusKey);
        
        return (
          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/bcpc/casedetailview?id=${item.id}`);
              }}
              className="rounded-lg p-2 text-neutral-400 hover:bg-gray-50 hover:text-blue-600 transition-colors"
              title="View case details"
            >
              <Eye className="h-5 w-5" />
            </button>

            <button
              disabled={!canArchiveThisStatus}
              onClick={(e) => {
                e.stopPropagation();
                if (canArchiveThisStatus) setArchiveEntry(item);
              }}
              title={
                canArchiveThisStatus
                  ? "Archive case"
                  : "Archiving is not allowed for this status"
              }
              className={`p-2 rounded-lg transition-colors ${
                !canArchiveThisStatus
                  ? "text-gray-300 bg-gray-50/50 cursor-not-allowed"
                  : "text-neutral-400 hover:bg-rose-50 hover:text-rose-600"
              }`}
            >
              <Archive className="h-5 w-5" />
            </button>
          </div>
        );
      },
    },
  ];

  // ── Filter configs ───────────────────────────────────────────────────────────
  const filterConfigs = [
    {
      label: "Status",
      key: "status",
      options: [
        { value: "PENDING",                  label: "Pending" },
        { value: "UNDER_INTERVENTION",       label: "Under Intervention" },
        { value: "SETTLED",                  label: "Resolved / Settled" },
        { value: "CERTIFIED_TO_FILE_ACTION", label: "Certified To File Action" },
        { value: "REFERRED",                 label: "Referred" },
        { value: "WITHDRAWN",                label: "Withdrawn" },
        { value: "DISMISSED",                label: "Dismissed" },
        { value: "CLOSED",                   label: "Closed" },
      ],
      value: status,
    },
  ];

  const dateRangeConfig = {
    startLabel: "Date Filed From",
    endLabel: "To",
    startValue: dateFrom,
    endValue: dateTo,
    onStartChange: (v: string) => { setDateFrom(v); setCurrentPage(0); },
    onEndChange:   (v: string) => { setDateTo(v);   setCurrentPage(0); },
  };

  const activeFilterCount = [status, dateFrom, dateTo].filter(Boolean).length;

  const handleSearchChange = (v: string) => { setSearch(v);  setCurrentPage(0); };
  const handleFilterChange = (key: string, v: string) => {
    if (key === "status") setStatus(v);
    setCurrentPage(0);
  };
  const handleClearAll = () => {
    setSearch(""); setStatus(""); setDateFrom(""); setDateTo(""); setCurrentPage(0);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 py-8">

        {/* Modals */}
        {archiveEntry && (
          <ArchiveReasonModal
            isOpen={!!archiveEntry}
            onClose={() => setArchiveEntry(null)}
            title="Archive BCPC Case"
            subjectName={archiveEntry.caseNumber}
            subjectLabel="case"
            submitLabel="Archive"
            onSubmit={handleArchiveSubmit}
          />
        )}

        <ActionModal
          isOpen={archiveSuccessOpen}
          onClose={() => setArchiveSuccessOpen(false)}
          title="Case archived"
          type="success"
        >
          The BCPC case has been archived successfully.
        </ActionModal>

        {/* KPI Cards */}
        <div className="mb-8">
          <KPIGrid columns={4}>
            <KPICard
              title="Pending Cases"
              value={loadingStats ? "—" : stats.totalPending.toLocaleString()}
              icon={KPIIcons["clock"]}
              color="amber"
              subtitle="Awaiting action or review"
            />
            <KPICard
              title="Closed Cases"
              value={loadingStats ? "—" : stats.totalClosed.toLocaleString()}
              icon={KPIIcons["check"]}
              color="emerald"
              subtitle="Settled, dismissed or closed"
            />
            <KPICard
              title="Expiring Soon"
              value={loadingStats ? "—" : stats.totalExpiringSoon.toLocaleString()}
              icon={KPIIcons["month"]}
              color="rose"
              subtitle="Pending cases near 15-day limit"
            />
            <KPICard
              title="Total Cases"
              value={loadingStats ? "—" : stats.totalCases.toLocaleString()}
              icon={KPIIcons["document"]}
              color="blue"
              subtitle="All BCPC records"
            />
          </KPIGrid>
        </div>

        {/* Error banner */}
        {tableError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {tableError}
          </div>
        )}

        {/* Filters */}
        <TableFilter
          searchPlaceholder="Search by Case Number or Victim Name..."
          searchValue={search}
          onSearchChange={handleSearchChange}
          filters={filterConfigs}
          onFilterChange={handleFilterChange}
          dateRange={dateRangeConfig}
          showSearch={true}
          showFilterButton={false}
          showClearButton={true}
          clearButtonText="Clear All Filters"
          activeFilterCount={activeFilterCount}
          onClearClick={handleClearAll}
        />

        {/* Table */}
        <Table
          columns={columns}
          data={cases}
          keyExtractor={(item) => String(item.id)}
          emptyMessage="No BCPC cases found."
          loading={loadingTable}
          hoverable={true}
          striped={true}
          variant="resident"
          minRows={SIZE}
          onRowClick={(item) => navigate(`/bcpc/casedetailview?id=${item.id}`)}
          pagination={{
            currentPage: Math.min(currentPage + 1, Math.max(1, totalPages || 0)),
            totalPages: Math.max(1, totalPages || 0),
            totalItems: totalElements,
            itemsPerPage: SIZE,
            onPageChange: (p) => setCurrentPage(p - 1),
          }}
        />
      </div>
    </div>
  );
}