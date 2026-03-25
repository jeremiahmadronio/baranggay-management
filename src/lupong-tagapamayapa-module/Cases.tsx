import React, { useEffect, useState, useCallback } from "react";
import { AlertCircle, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { KPICard, KPIGrid, KPIIcons } from "../reusable/KPICard";
import { Table, type TableColumn } from "../reusable/Table";
import { TableFilter } from "../reusable/TableFilter";

import {
  getLuponDashboardStats,
  getLuponSummary,
  type LuponCaseStatsDTO,
  type LuponSummaryDTO,
  type LuponSummaryParams,
} from "../lupong-tagapamayapa-api/LuponCaseManagement-api";

// ─── Types ────────────────────────────────────────────────────────────────────

type LoadState = "idle" | "loading" | "success" | "error";

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  REFERRED: "bg-blue-100 text-blue-700",
  CONCILIATION: "bg-amber-100 text-amber-700",
  SETTLED: "bg-emerald-100 text-emerald-700",
  CFA_ISSUED: "bg-violet-100 text-violet-700",
  DISMISSED: "bg-rose-100 text-rose-700",
};

const StatusBadge = ({ status }: { status: string }) => {
  const style =
    STATUS_STYLES[status.toUpperCase()] ?? "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const LuponCases: React.FC = () => {
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

  // ── Filter / pagination state
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(0); // 0-indexed (Spring)
  const PAGE_SIZE = 10;

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

  const activeFilterCount = [search, startDate, endDate].filter(Boolean).length;

  // ─── Table columns ────────────────────────────────────────────────────────

  const columns: TableColumn<LuponSummaryDTO>[] = [
    {
      key: "blotterNumber",
      header: "Blotter No.",
      width: "140px",
      render: (item) => (
        <span className="font-mono text-xs font-medium text-gray-700">
          {item.blotterNumber}
        </span>
      ),
    },
    { key: "complainantName", header: "Complainant" },
    { key: "respondentName", header: "Respondent" },
    { key: "natureOfComplaint", header: "Nature of Complaint" },
    {
      key: "dateFiled",
      header: "Date Filed",
      width: "140px",
      render: (item) => (
        <span className="text-gray-600 text-sm">
          {new Date(item.dateFiled).toLocaleDateString("en-PH", {
            year: "numeric",
            month: "short",
            day: "2-digit",
          })}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "140px",
      align: "center",
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "actions",
      header: "Action",
      width: "90px",
      align: "center",
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/lupongtagapamayapa/cases/${item.blotterNumber}`);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </button>
      ),
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* ── KPI Error ──────────────────────────────────────────────────── */}
        {statsState === "error" && (
          <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
            <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-rose-700">{statsError}</p>
            </div>
          </div>
        )}

        {/* ── KPI Cards ──────────────────────────────────────────────────── */}
        <section>
          <KPIGrid columns={4}>
            <KPICard
              title="Total Referred"
              value={
                statsState === "loading" ? "—" : (stats?.totalReferred ?? "—")
              }
              icon={KPIIcons["document"]}
              color="blue"
              subtitle="All cases referred to Lupon"
            />
            <KPICard
              title="Active Conciliation"
              value={
                statsState === "loading"
                  ? "—"
                  : (stats?.activeConciliation ?? "—")
              }
              icon={KPIIcons["pending"]}
              color="amber"
              subtitle="Currently under mediation"
            />
            <KPICard
              title="Successfully Settled"
              value={
                statsState === "loading"
                  ? "—"
                  : (stats?.successfullySettled ?? "—")
              }
              icon={KPIIcons["check"]}
              color="emerald"
              subtitle="Resolved through conciliation"
            />
            <KPICard
              title="CFA Issued"
              value={statsState === "loading" ? "—" : (stats?.cfaIssued ?? "—")}
              icon={KPIIcons["issued"]}
              color="violet"
              subtitle="Certificates to File Action"
            />
          </KPIGrid>
        </section>

        {/* ── Case Summary Table ─────────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Case Summary
          </h2>

          <TableFilter
            searchPlaceholder="Search blotter no., complainant, respondent, nature…"
            searchValue={search}
            onSearchChange={setSearch}
            dateRange={{
              startLabel: "Date Filed From",
              endLabel: "Date Filed To",
              startValue: startDate,
              endValue: endDate,
              onStartChange: setStartDate,
              onEndChange: setEndDate,
            }}
            onFilterClick={handleApply}
            onClearClick={handleClear}
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
            data={rows}
            keyExtractor={(item) => item.id}
            loading={tableLoading}
            emptyMessage="No cases found. Try adjusting your filters."
            striped
            minRows={10}
            pagination={{
              currentPage: page + 1,
              totalPages,
              totalItems: totalElements,
              itemsPerPage: PAGE_SIZE,
              onPageChange: (p) => setPage(p - 1),
            }}
          />
        </section>
      </div>
    </div>
  );
};

export default LuponCases;
