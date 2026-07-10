import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import { Table, type TableColumn } from "../../../reusable";
import { KPICard, KPIGrid, KPIIcons } from "../../../hooks/KPICard";
import { TableFilter } from "../../../hooks/TableFilter";
import {
  getPagedBlotters,
  getRecordStats,
  type RecordTableParams,
  type FtrSummaryStatsDTO,
} from "../../../service/blotter-api/RecordView";
// import { archiveCase } from "../../../service/blotter-api/DocketView"; // Archive removed
import {
  BLOTTER_PERMISSIONS,
  getMyAccess,
  hasBlotterPermission,
  type UserSecurityProfile,
} from "../../../service/blotter-api/BlotterPermission";
import { type BlotterSummaryDTO as RecordBlotterSummaryDTO } from "../../../service/blotter-api/DocketView";
import { CircleLoader } from "../../../hooks/LoadingStates";
import { useKapitanaMockData } from "../mock/kapitana-mock-flag";
import {
  mockKapitanaBlotterAccess,
  mockRecordStats,
  mockRecordTablePage,
} from "../mock/blotter-kapitana-mock";
// Archive modals and actions removed

// Normalize status for internal logic
const normalizeStatus = (s: string) => s.toLowerCase().replace(/_/g, " ");

// Map status to display label (ALL CAPS, special case for elevated_to_formal)
const getStatusDisplay = (status: string) => {
  if (normalizeStatus(status) === "elevated to formal")
    return "ESCALATED TO CASE";
  if (normalizeStatus(status) === "recorded") return "RECORDED";
  return status.replace(/_/g, " ").toUpperCase();
};

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
    case "RECORDED":
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

const STATUS_OPTIONS = [{ value: "recorded", label: "Recorded" }];
// Archive logic removed

const PAGE_SIZE = 10;

const KapitanaBlotterRecordsPage: React.FC = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [appliedParams, setAppliedParams] = useState<RecordTableParams>({
    page: 0,
    size: PAGE_SIZE,
  });

  const [records, setRecords] = useState<RecordBlotterSummaryDTO[]>([]);
  const [userAccess, setUserAccess] = useState<UserSecurityProfile | null>(
    null,
  );
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Archive state removed
  const safeTotalPages = Math.max(1, totalPages || 0);

  // KPI stats state
  const [stats, setStats] = useState<FtrSummaryStatsDTO | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    setStatsLoading(true);
    if (useKapitanaMockData()) {
      setStats(mockRecordStats());
      setStatsLoading(false);
      setUserAccess(mockKapitanaBlotterAccess);
      return;
    }
    getRecordStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));

    getMyAccess()
      .then((access) => setUserAccess(access))
      .catch(() => setUserAccess(null));
  }, []);

  const canView = hasBlotterPermission(
    userAccess,
    BLOTTER_PERMISSIONS.VIEW_CASES,
  );
  // Archive permission removed

  const fetchRecords = useCallback(async (params: RecordTableParams) => {
    setLoading(true);
    setError(null);
    try {
      if (useKapitanaMockData()) {
        const page = mockRecordTablePage(params);
        setRecords(page.content);
        setTotalPages(page.totalPages);
        setTotalItems(page.totalElements);
        setCurrentPage(page.number);
        return;
      }
      const page = await getPagedBlotters(params);
      setRecords(page.content);
      setTotalPages(page.totalPages);
      setTotalItems(page.totalElements);
      setCurrentPage(page.number);
    } catch (err: any) {
      console.error("Failed to load blotter records.");
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
  const handleView = (item: RecordBlotterSummaryDTO) => {
    if (!canView) return;
    navigate(
      `/blotter/record-view?blotterNumber=${encodeURIComponent(item.blotterNumber)}`,
    );
  };

  // Archive handler removed

  const activeFilterCount = [
    appliedParams.status,
    appliedParams.start,
    appliedParams.end,
  ].filter(Boolean).length;

  // ── Columns ───────────────────────────────────────────────────────────────────
  const columns: TableColumn<RecordBlotterSummaryDTO>[] = [
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
      width: "175px",
      header: "Respondent",
      render: (item) => (
        <span className="text-gray-600">{item.respondentName}</span>
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
      width: "120px",
      render: (item) => (
        <span className="text-gray-600 whitespace-nowrap">
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
      align: "right",
      width: "170px",
      render: (item) => {
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              disabled={!canView}
              onClick={(e) => {
                e.stopPropagation();
                handleView(item);
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
          </div>
        );
      },
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="mb-4 ">
      {/* Archive modals removed */}

      <KPIGrid columns={4}>
        <KPICard
          title="Total Records"
          value={
            statsLoading ? <CircleLoader size="sm" /> : (stats?.totalFtr ?? 0)
          }
          icon={KPIIcons.document}
          color="blue"
          subtitle={"Total of all blotter records."}
        />

        <KPICard
          title="Repeat Respondents"
          value={
            statsLoading ? (
              <CircleLoader size="sm" />
            ) : (
              (stats?.frequentSubjectsCount ?? 0)
            )
          }
          icon={KPIIcons.alert}
          color="amber"
          subtitle="Residents with 2+ reports filed against them"
        />

        <KPICard
          title="Top Nature of Complaint"
          value={
            statsLoading ? (
              <CircleLoader size="sm" />
            ) : (
              (stats?.mostReportedIssue ?? 0)
            )
          }
          icon={KPIIcons.chart}
          color="violet"
          subtitle="Most frequent category"
        />

        <KPICard
          title="Peak Reporting Time"
          value={
            statsLoading ? (
              <CircleLoader size="sm" />
            ) : (
              (stats?.peakIncidentTime ?? 0)
            )
          }
          icon={KPIIcons.clock}
          color="emerald"
          subtitle="Based on incident logs"
        />
      </KPIGrid>

      <TableFilter
        searchPlaceholder="Search by case no. or name"
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

      <Table<RecordBlotterSummaryDTO>
        columns={columns}
        data={records}
        keyExtractor={(item) => item.id}
        loading={loading}
        emptyMessage="No blotter records found."
        variant="resident"
        onRowClick={(item) => {
          if (canView) handleView(item);
        }}
        hoverable
        striped
        minRows={PAGE_SIZE}
        pagination={{
          currentPage: Math.min(currentPage + 1, safeTotalPages),
          totalPages: safeTotalPages,
          totalItems,
          itemsPerPage: PAGE_SIZE,
          onPageChange: handlePageChange,
        }}
      />
    </div>
  );
};

export default KapitanaBlotterRecordsPage;
