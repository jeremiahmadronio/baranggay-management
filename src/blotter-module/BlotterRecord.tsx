import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Table, type TableColumn } from "../reusable";
import { KPICard, KPIGrid, KPIIcons } from "../reusable/KPICard";
import { TableFilter } from "../reusable/TableFilter";
import {
  getPagedBlotters,
  getRecordStats,
  type BlotterSummaryDTO,
  type RecordTableParams,
  type FtrSummaryStatsDTO,
} from "../blotter-api/RecordView";

// Normalize status for internal logic
const normalizeStatus = (s: string) => s.toLowerCase().replace(/_/g, " ");

// Map status to display label (ALL CAPS, special case for elevated_to_formal)
const getStatusDisplay = (status: string) => {
  if (normalizeStatus(status) === "elevated to formal")
    return "ESCALATED TO CASE";
  if (normalizeStatus(status) === "recorded") return "RECORDED";
  return status.replace(/_/g, " ").toUpperCase();
};

interface StatusStyle {
  bg: string;
  text: string;
  dot: string;
}

const STATUS_CONFIG: Record<string, StatusStyle> = {
  pending: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" },
  "under investigation": {
    bg: "bg-blue-50",
    text: "text-blue-600",
    dot: "bg-blue-400",
  },
  "under mediation": {
    bg: "bg-indigo-50",
    text: "text-indigo-500",
    dot: "bg-indigo-400",
  },
  resolved: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    dot: "bg-emerald-400",
  },
  "elevated to formal": {
    bg: "bg-red-50",
    text: "text-red-500",
    dot: "bg-red-400",
  },
  unsettled: { bg: "bg-rose-50", text: "text-rose-500", dot: "bg-rose-400" },
  summoned: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-400" },
  "referred to lupon": {
    bg: "bg-purple-50",
    text: "text-purple-500",
    dot: "bg-purple-400",
  },
  recorded: { bg: "bg-teal-50", text: "text-teal-600", dot: "bg-teal-400" },
  closed: { bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" },
};

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[normalizeStatus(status)] ?? {
    bg: "bg-gray-100",
    text: "text-gray-500",
    dot: "bg-gray-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {getStatusDisplay(status)}
    </span>
  );
};

const STATUS_OPTIONS = [
  { value: "recorded", label: "Recorded" }
  
];

const PAGE_SIZE = 10;

const BlotterRecordsPage: React.FC = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [appliedParams, setAppliedParams] = useState<RecordTableParams>({
    page: 0,
    size: PAGE_SIZE,
  });

  const [records, setRecords] = useState<BlotterSummaryDTO[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // KPI stats state
  const [stats, setStats] = useState<FtrSummaryStatsDTO | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  // Fetch KPI stats on mount
  useEffect(() => {
    setStatsLoading(true);
    getRecordStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, []);

  const fetchRecords = useCallback(async (params: RecordTableParams) => {
    setLoading(true);
    setError(null);
    try {
      const page = await getPagedBlotters(params);
      setRecords(page.content);
      setTotalPages(page.totalPages);
      setTotalItems(page.totalElements);
      setCurrentPage(page.number);
    } catch (err: any) {
      setError("Failed to load blotter records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords(appliedParams);
  }, [appliedParams, fetchRecords]);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleApplyFilter = () => {
    // Map dropdown value to backend value (always string)
    let backendStatus = "";
    if (status === "recorded") backendStatus = "RECORDED";
    else if (status === "elevated_to_formal")
      backendStatus = "ELEVATED_TO_FORMAL";
    // Only include status if not empty
    setAppliedParams({
      page: 0,
      size: PAGE_SIZE,
      ...(search && { search }),
      ...(backendStatus ? { status: backendStatus } : {}),
      ...(startDate && { start: startDate }),
      ...(endDate && { end: endDate }),
    });
  };

  const handleClearFilter = () => {
    setSearch("");
    setStatus("");
    setStartDate("");
    setEndDate("");
    setAppliedParams({ page: 0, size: PAGE_SIZE });
  };

  const handlePageChange = (page: number) => {
    setAppliedParams((prev) => ({ ...prev, page: page - 1 }));
  };

  // Pass blotterNumber as query param to view page
  const handleView = (item: BlotterSummaryDTO) => {
    navigate(
      `/blotter/record-view?blotterNumber=${encodeURIComponent(item.blotterNumber)}`,
    );
  };

  const activeFilterCount = [
    appliedParams.status,
    appliedParams.start,
    appliedParams.end,
  ].filter(Boolean).length;

  // ── Columns ───────────────────────────────────────────────────────────────────
  const columns: TableColumn<BlotterSummaryDTO>[] = [
    {
      key: "blotterNumber",
      header: "Blotter No.",
      width: "180px",
      render: (item) => (
        <span className="font-mono text-xxs font-semibold text-blue-600 tracking-wide whitespace-nowrap">
          {" "}
          {item.blotterNumber}
        </span>
      ),
    },

    {
      key: "complainantName",
      header: "Complainant",
      width: "200px",
      render: (item) => (
        <span className="text-sm font-medium text-slate-700">
          {item.complainantName}
        </span>
      ),
    },
    {
      key: "respondentName",
      width: "200px",
      header: "Respondent",
      render: (item) => (
        <span className="text-sm text-slate-600">{item.respondentName}</span>
      ),
    },

    {
      key: "status",
      header: "Status",
      width: "175px",
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "dateFiled",
      header: "Date Filed",
      width: "110px",
      render: (item) => (
        <span className="text-sm text-slate-500">
          {item.dateFiled
            ? new Date(item.dateFiled).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "short",
                day: "2-digit",
              })
            : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "100px",
      render: (item) => (
        <div className="flex items-center gap-2 flex-wrap">
          {/* View — always shown, passes blotterNumber to view page */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleView(item);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 rounded-lg ring-1 ring-slate-200 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            View
          </button>
        </div>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="mb-4 ">
      <KPIGrid columns={4}>
        <KPICard
          title="Total Records"
          value={statsLoading ? "..." : (stats?.totalFtr ?? 0)}
          icon={KPIIcons.document}
          color="blue"
          subtitle={
          "Total of all blotter records."
          }
        />

        <KPICard
          title="Repeat Respondents"
          value={statsLoading ? "..." : (stats?.frequentSubjectsCount ?? 0)}
          icon={KPIIcons.alert}
          color="amber"
          subtitle="Residents with 2+ reports filed against them"
        />

        <KPICard
          title="Top Incident Nature"
          value={statsLoading ? "..." : (stats?.mostReportedIssue ?? "N/A")}
          icon={KPIIcons.chart}
          color="violet"
          subtitle="Most frequent category"
        />

        <KPICard
          title="Peak Reporting Time"
          value={statsLoading ? "..." : (stats?.peakIncidentTime ?? "N/A")}
          icon={KPIIcons.clock}
          color="emerald"
          subtitle="Based on incident logs"
        />
      </KPIGrid>
      <br />

      <TableFilter
        searchPlaceholder="Search by blotter number"
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          {
            label: "Status",
            key: "status",
            options: STATUS_OPTIONS,
            value: status,
          },
        ]}
        onFilterChange={(key, value) => {
          if (key === "status") setStatus(value);
        }}
        dateRange={{
          startLabel: "Date Filed From",
          endLabel: "Date Filed To",
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

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </div>
      )}

      <Table<BlotterSummaryDTO>
        columns={columns}
        data={records}
        keyExtractor={(item) => item.id}
        loading={loading}
        emptyMessage="No blotter records found."
        onRowClick={handleView}
        hoverable
        striped
        minRows={PAGE_SIZE}
        pagination={
          totalItems > 0
            ? {
                currentPage: currentPage + 1,
                totalPages,
                totalItems,
                itemsPerPage: PAGE_SIZE,
                onPageChange: handlePageChange,
              }
            : undefined
        }
      />
    </div>
  );
};

export default BlotterRecordsPage;
