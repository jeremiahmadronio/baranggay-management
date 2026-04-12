import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CalendarDays,
  CircleAlert,
  FileText,
  CheckCircle2,
  TimerOff,
  Timer,
  Search,
} from "lucide-react";
import {
  getVawcReportStats,
  getVawcNatureStats,
  getVawcTrend,
  getVawcCategorySummary,
  type ReportStatsDTO,
  type NatureStatsDTO,
  type TrendStatsDTO,
  type CategorySummaryDTO,
} from "../../service/vawc-api/report-api";
import { CenteredLoader, NoRecords } from "../../hooks/LoadingStates";

const NATURE_COLORS = [
  "#6366F1",
  "#3B82F6",
  "#0891B2",
  "#059669",
  "#D97706",
  "#E11D48",
  "#8B5CF6",
  "#EC4899",
];

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultDates(): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth(), 1);
  return { start: toDateInputValue(start), end: toDateInputValue(end) };
}

function getMaxEndDate(startDateInput: string): string {
  if (!startDateInput) return toDateInputValue(new Date());
  const max = new Date(startDateInput);
  max.setFullYear(max.getFullYear() + 1);
  const today = new Date();
  return toDateInputValue(max > today ? today : max);
}

function formatDuration(hours: number): string {
  if (!hours || Number.isNaN(hours)) return "0h";
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.floor(hours / 24);
  const remainderHours = Math.round(hours % 24);
  return remainderHours > 0 ? `${days}d ${remainderHours}h` : `${days}d`;
}

function formatAppliedRange(start: string, end: string): string {
  try {
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    return `${fmt(start)} — ${fmt(end)}`;
  } catch {
    return `${start} to ${end}`;
  }
}

export default function ReportsPage() {
  const defaults = getDefaultDates();

  const [pendingStart, setPendingStart] = useState(defaults.start);
  const [pendingEnd, setPendingEnd] = useState(defaults.end);
  const [appliedStart, setAppliedStart] = useState(defaults.start);
  const [appliedEnd, setAppliedEnd] = useState(defaults.end);

  const [stats, setStats] = useState<ReportStatsDTO | null>(null);
  const [nature, setNature] = useState<NatureStatsDTO[]>([]);
  const [trend, setTrend] = useState<TrendStatsDTO[]>([]);
  const [category, setCategory] = useState<CategorySummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState("");

  const fetchAll = useCallback(async (start: string, end: string) => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, trendRes, natureRes, categoryRes] =
        await Promise.allSettled([
          getVawcReportStats(start, end),
          getVawcTrend(start, end),
          getVawcNatureStats(start, end),
          getVawcCategorySummary(start, end),
        ]);
      setStats(statsRes.status === "fulfilled" ? statsRes.value : null);
      setTrend(
        trendRes.status === "fulfilled" && Array.isArray(trendRes.value)
          ? trendRes.value
          : [],
      );
      setNature(
        natureRes.status === "fulfilled" && Array.isArray(natureRes.value)
          ? natureRes.value
          : [],
      );
      setCategory(
        categoryRes.status === "fulfilled" && Array.isArray(categoryRes.value)
          ? categoryRes.value
          : [],
      );

      const rejected = [statsRes, trendRes, natureRes, categoryRes].filter(
        (result) => result.status === "rejected",
      );

      if (rejected.length === 4) {
        const firstReason = rejected[0];
        if (firstReason.status === "rejected") {
          throw firstReason.reason;
        }
      }

      if (rejected.length > 0) {
        setError(
          "Some report sections could not be loaded. Displaying available API data.",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll(appliedStart, appliedEnd);
  }, [appliedStart, appliedEnd, fetchAll]);

  const handleApplyFilter = () => {
    setDateError(null);
    if (!pendingStart || !pendingEnd) {
      setDateError("Please select both dates.");
      return;
    }
    const s = new Date(pendingStart),
      e = new Date(pendingEnd);
    if (e < s) {
      setDateError("End date cannot be before start date.");
      return;
    }
    if (Math.ceil((e.getTime() - s.getTime()) / 86400000) > 365) {
      setDateError("Date range cannot exceed 1 year.");
      return;
    }
    setAppliedStart(pendingStart);
    setAppliedEnd(pendingEnd);
  };

  const handleReset = () => {
    const fresh = getDefaultDates();
    setDateError(null);
    setPendingStart(fresh.start);
    setPendingEnd(fresh.end);
    setAppliedStart(fresh.start);
    setAppliedEnd(fresh.end);
  };

  // ── Derived from CategorySummaryDTO ──

  const statusRows = useMemo(() => {
    const totals = category.reduce(
      (s, i) => ({
        active: s.active + i.active,
        resolved: s.resolved + i.resolved,
        pending: s.pending + i.pending,
      }),
      { active: 0, resolved: 0, pending: 0 },
    );
    return [
      { label: "Active", count: totals.active, color: "#F59E0B" },
      { label: "Resolved", count: totals.resolved, color: "#10B981" },
      { label: "Pending", count: totals.pending, color: "#3B82F6" },
    ];
  }, [category]);

  const filteredCategory = useMemo(() => {
    if (!categorySearch.trim()) return category;
    const q = categorySearch.toLowerCase();
    return category.filter((c) => c.category?.toLowerCase().includes(q));
  }, [category, categorySearch]);

  const hasAnyReportData =
    stats !== null ||
    trend.length > 0 ||
    nature.length > 0 ||
    category.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <CenteredLoader minHeight="min-h-[400px]" />
        </div>
      </div>
    );
  }

  if (error && !hasAnyReportData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/70 p-6">
        <div className="max-w-sm w-full space-y-3 rounded-xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <CircleAlert className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-sm font-medium text-slate-700">
            Failed to load reports
          </p>
          <p className="text-xs text-slate-400">{error}</p>
          <button
            onClick={() => fetchAll(appliedStart, appliedEnd)}
            className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const safe: ReportStatsDTO = stats || {
    totalCases: 0,
    totalExpired: 0,
    resolvedCases: 0,
    avgResolutionTime: 0,
  };
  const statusTotal = statusRows.reduce((s, r) => s + r.count, 0);
  const totalNature = nature.reduce((s, i) => s + i.count, 0);
  const effPct =
    safe.totalCases > 0 ? (safe.resolvedCases / safe.totalCases) * 100 : 0;

  const kpiCards = [
    {
      label: "Total Cases",
      value: safe.totalCases,
      icon: <FileText className="w-5 h-5" />,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Resolved",
      value: safe.resolvedCases,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Expired",
      value: safe.totalExpired,
      icon: <TimerOff className="w-5 h-5" />,
      color: "bg-rose-50 text-rose-600",
    },
    {
      label: "Avg. Resolution",
      value: formatDuration(safe.avgResolutionTime),
      icon: <Timer className="w-5 h-5" />,
      color: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/70">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {error && hasAnyReportData && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            {error}
          </div>
        )}

        {/* ── DATE FILTER ── */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  From
                </label>
                <div className="relative">
                  <CalendarDays className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={pendingStart}
                    max={pendingEnd || undefined}
                    onChange={(e) => {
                      setPendingStart(e.target.value);
                      setDateError(null);
                      if (pendingEnd) {
                        const mx = getMaxEndDate(e.target.value);
                        if (pendingEnd > mx) setPendingEnd(mx);
                      }
                    }}
                    className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  To
                </label>
                <div className="relative">
                  <CalendarDays className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={pendingEnd}
                    min={pendingStart || undefined}
                    max={getMaxEndDate(pendingStart)}
                    onChange={(e) => {
                      setPendingEnd(e.target.value);
                      setDateError(null);
                    }}
                    className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleApplyFilter}
                className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Apply
              </button>
              <button
                onClick={handleReset}
                className="px-5 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
          <div className="mt-2">
            {dateError ? (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <CircleAlert className="w-3.5 h-3.5" />
                {dateError}
              </p>
            ) : (
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                {formatAppliedRange(appliedStart, appliedEnd)}
              </p>
            )}
          </div>
        </div>

        {/* ── KPI ROW ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${card.color}`}>
                  {card.icon}
                </div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {card.label}
                </p>
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">
                {typeof card.value === "number"
                  ? card.value.toLocaleString()
                  : card.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── MONTHLY TREND (area chart) ── */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Monthly Case Trend
          </h3>
          <p className="text-sm text-slate-500 mt-0.5 mb-4">
            Filed cases over time
          </p>
          {trend.length === 0 ? (
            <NoRecords text="No trend data for the selected period." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trend}
                  margin={{ top: 4, right: 12, left: -12, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#3B82F6"
                        stopOpacity={0.15}
                      />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E2E8F0"
                  />
                  <XAxis
                    dataKey="label"
                    fontSize={11}
                    stroke="#94A3B8"
                    tickLine={false}
                  />
                  <YAxis
                    fontSize={11}
                    stroke="#94A3B8"
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid #E2E8F0",
                      fontSize: 12,
                      boxShadow: "0 4px 12px -4px rgb(15 23 42 / 0.15)",
                    }}
                    formatter={(v: number | undefined) => [v ?? 0, "Cases"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#trendFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ── NATURE + STATUS ROW ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Nature bar chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-7">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Cases by Nature
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  Complaint category breakdown
                </p>
              </div>
              <span className="text-xl font-bold text-slate-900 tabular-nums">
                {totalNature.toLocaleString()}
              </span>
            </div>
            {nature.length === 0 ? (
              <NoRecords text="No nature data for the selected period." />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[...nature].sort((a, b) => b.count - a.count)}
                    layout="vertical"
                    margin={{ top: 0, right: 12, left: 4, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="#E2E8F0"
                    />
                    <XAxis
                      type="number"
                      fontSize={11}
                      stroke="#94A3B8"
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      dataKey="nature"
                      type="category"
                      width={120}
                      fontSize={11}
                      stroke="#94A3B8"
                      tickLine={false}
                      tickFormatter={(v: string) =>
                        (v || "Unspecified").length > 18
                          ? `${(v || "Unspecified").slice(0, 18)}…`
                          : v || "Unspecified"
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #E2E8F0",
                        fontSize: 12,
                      }}
                      formatter={(v: number | undefined) => [v ?? 0, "Cases"]}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                      {[...nature]
                        .sort((a, b) => b.count - a.count)
                        .map((_, i) => (
                          <Cell
                            key={i}
                            fill={NATURE_COLORS[i % NATURE_COLORS.length]}
                          />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Status donut + legend */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-5">
            <h3 className="text-lg font-semibold text-slate-900">
              Case Status
            </h3>
            <p className="text-sm text-slate-500 mt-0.5 mb-4">
              Lifecycle distribution
            </p>
            {statusTotal === 0 ? (
              <NoRecords text="No status data for the selected period." />
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="relative h-48 w-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusRows.filter((r) => r.count > 0)}
                        dataKey="count"
                        nameKey="label"
                        innerRadius={56}
                        outerRadius={80}
                        paddingAngle={2}
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {statusRows
                          .filter((r) => r.count > 0)
                          .map((r) => (
                            <Cell key={r.label} fill={r.color} />
                          ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          border: "1px solid #E2E8F0",
                          fontSize: 12,
                        }}
                        formatter={(v: number | undefined) =>
                          (v ?? 0).toLocaleString()
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-slate-900 tabular-nums">
                      {statusTotal.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                      Total
                    </span>
                  </div>
                </div>
                <div className="w-full grid grid-cols-3 gap-3">
                  {statusRows.map((r) => (
                    <div
                      key={r.label}
                      className="border border-slate-100 rounded-xl p-3 text-center"
                    >
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: r.color }}
                        />
                        <span className="text-[10px] text-slate-500 font-medium uppercase">
                          {r.label}
                        </span>
                      </div>
                      <p className="text-lg font-bold text-slate-800 tabular-nums">
                        {r.count.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── SETTLEMENT EFFICIENCY ── */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Settlement Efficiency
          </h3>
          <p className="text-sm text-slate-500 mt-0.5 mb-5">
            Resolution rate and average time
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col items-center justify-center border border-slate-100 rounded-xl p-6">
              <svg width="100" height="100" className="-rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={
                    effPct >= 70
                      ? "#10B981"
                      : effPct >= 40
                        ? "#F59E0B"
                        : "#EF4444"
                  }
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={
                    2 * Math.PI * 40 - (effPct / 100) * 2 * Math.PI * 40
                  }
                  style={{ transition: "stroke-dashoffset 0.8s ease" }}
                />
              </svg>
              <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
                {effPct.toFixed(0)}%
              </p>
              <p className="text-xs text-slate-400 uppercase tracking-wide">
                Efficiency
              </p>
            </div>
            <div className="flex flex-col items-center justify-center border border-slate-100 rounded-xl p-6">
              <p className="text-3xl font-bold text-slate-900 tabular-nums">
                {safe.resolvedCases.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                of {safe.totalCases.toLocaleString()} cases resolved
              </p>
            </div>
            <div className="flex flex-col items-center justify-center border border-slate-100 rounded-xl p-6">
              <p className="text-3xl font-bold text-slate-900 tabular-nums">
                {formatDuration(safe.avgResolutionTime)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Average resolution time
              </p>
            </div>
          </div>
        </div>

        {/* ── CATEGORY SUMMARY TABLE ── */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 border-b border-slate-200">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Category Summary
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Breakdown by complaint category with status distribution
              </p>
            </div>
            <div className="relative shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search category..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700 w-56"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredCategory.length === 0 ? (
              <div className="p-6">
                <NoRecords text="No category data for the selected period." />
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                      Total
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                      Active
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                      Resolved
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                      Pending
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Progress
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCategory.map((item, idx) => (
                    <tr
                      key={`${item.category}-${idx}`}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {item.category || "Uncategorized"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 text-center tabular-nums">
                        {item.totalCases.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700">
                          {item.active}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                          {item.resolved}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                          {item.pending}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 w-40">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                              style={{
                                width: `${Math.min(100, item.percentage)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 tabular-nums w-10 text-right">
                            {item.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
