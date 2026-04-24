import { useEffect, useState, useCallback, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  getReportsStats,
  getCasesTrend,
  getCasesByNature,
  getCasesByStatus,
  getSettlementEfficiency,
  type ReportsStatsDTO,
  type NatureStatDTO,
  type ChartDataDTO,
  type StatusStatDTO,
  type SettlementEfficiencyDTO,
} from "../../../service/blotter-api/BlotterReports";
import { useKapitanaMockData } from "../mock/kapitana-mock-flag";
import {
  mockCasesByNature,
  mockCasesByStatus,
  mockCasesTrendForRange,
  mockReportsStats,
  mockSettlementEfficiency,
} from "../mock/blotter-kapitana-mock";
import { KPICard, KPIGrid, KPIIcons } from "../../../hooks/KPICard";

import {
  CenteredLoader,
  CircleLoader,
  NoRecords,
} from "../../../hooks/LoadingStates";
import { CalendarDays } from "lucide-react";

// ─── Palette ────────────────────────────────────────────────────────────────
const NATURE_COLORS = [
  "#c98e46",
  "#2563EB",
  "#94A3B8",
  "#31397d",
  "#54b4d6",
  "#60A5FA",
];

// ─── Date helpers ────────────────────────────────────────────────────────────

/** "YYYY-MM-DD" — used only for <input type="date"> values */
function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function getDefaultDates(): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end);
  start.setMonth(start.getMonth() - 6);
  return { start: toDateInputValue(start), end: toDateInputValue(end) };
}

/** Returns the max allowed end date (input value) given a start date — capped at today. */
function getMaxEndDate(startDateInput: string): string {
  if (!startDateInput) return toDateInputValue(new Date());
  const max = new Date(startDateInput);
  max.setFullYear(max.getFullYear() + 1);
  const today = new Date();
  return toDateInputValue(max > today ? today : max);
}

function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthShortLabel(date: Date): string {
  return date.toLocaleString("en-US", { month: "short" });
}

function normalizeMonthName(value: string): string {
  return value.slice(0, 3).toLowerCase();
}

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

// ─── Tiny helpers ────────────────────────────────────────────────────────────
function SectionCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-5 ${className}`}
    >
      <div className="mb-5">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        {subtitle ? (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

const STATUS_DONUT_COLORS = [
  "#8b98b3",
  "#434e53",
  "#94A3B8",
  "#64748B",
  "#DC2626",
];

function getStatusColor(raw: string, index: number): string {
  const key = String(raw || "")
    .toUpperCase()
    .replace(/\s+/g, "_");
  const map: Record<string, string> = {
    PENDING: "#c98e46",
    RECORDED: "#435973",
    UNDER_MEDIATION: "#0EA5E9",
    UNDER_CONCILIATION: "#3B82F6",
    UNDER_INVESTIGATION: "#94A3B8",
    SETTLED: "#2563EB",
    UNSETTLED: "#64748B",
    REFERRED_TO_LUPON: "#3B82F6",
    ESCALATED: "#2563EB",
    ELEVATED_TO_FORMAL: "#2563EB",
    CLOSED: "#94A3B8",
    DISMISSED: "#DC2626",
    WITHDRAWN: "#64748B",
    EXPIRED_UNACTIONED: "#DC2626",
    ARCHIVED: "#64748B",
  };
  return map[key] ?? STATUS_DONUT_COLORS[index % STATUS_DONUT_COLORS.length];
}

function formatStatusName(raw: string): string {
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getStatusDescription(raw: string): string {
  const key = raw.toUpperCase().replace(/\s+/g, "_");
  const map: Record<string, string> = {
    PENDING: "Awaiting initial handling",
    RECORDED: "Logged in blotter records",
    UNDER_INVESTIGATION: "Currently under investigation",
    UNDER_MEDIATION: "Mediation ongoing",
    SETTLED: "Resolved through mediation",
    UNSETTLED: "Not resolved during mediation",
    REFERRED_TO_LUPON: "Forwarded to lupon process",
    ESCALATED: "Escalated for further action",
    ELEVATED_TO_FORMAL: "Converted to formal complaint",
    CLOSED: "Case process completed",
  };
  return map[key] ?? "Case lifecycle status";
}

function SettlementGauge({
  efficiency,
}: {
  efficiency: SettlementEfficiencyDTO;
}) {
  const pct = efficiency.efficiencyPercentage ?? 0;
  const radius = 62;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-3">
      <div className="relative flex items-center justify-center">
        <svg width="168" height="168" className="-rotate-90">
          <circle
            cx="84"
            cy="84"
            r={radius}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="14"
          />
          <circle
            cx="84"
            cy="84"
            r={radius}
            fill="none"
            stroke="#2563EB"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-bold text-slate-800 tabular-nums">
            {pct.toFixed(0)}%
          </span>
          <span className="text-xs text-slate-500 font-semibold -mt-0.5 uppercase tracking-wide">
            efficiency
          </span>
        </div>
      </div>

      <div className="w-full grid grid-cols-2 gap-3">
        <div className="border border-slate-200 bg-slate-50/40 rounded-xl p-3.5 text-center">
          <p className="text-xl font-bold text-slate-800 tabular-nums leading-none">
            {efficiency.totalFormalComplaints}
          </p>
          <p className="text-xs text-slate-600 mt-1 leading-tight font-medium">
            Formal Complaints
          </p>
        </div>
        <div className="border border-slate-200 bg-slate-50/40 rounded-xl p-3.5 text-center">
          <p className="text-xl font-bold text-slate-800 tabular-nums leading-none">
            {efficiency.settledCases}
          </p>
          <p className="text-xs text-slate-600 mt-1 leading-tight font-medium">
            Settled Cases
          </p>
        </div>
      </div>

      {efficiency.totalFormalComplaints > 0 && (
        <p className="text-xs text-slate-600 text-center leading-relaxed">
          {efficiency.totalFormalComplaints - efficiency.settledCases} case
          {efficiency.totalFormalComplaints - efficiency.settledCases !== 1
            ? "s"
            : ""}{" "}
          still pending resolution
        </p>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
// Permission checks removed: all users can access and filter
export default function KapitanaReportsPage() {
  const defaults = getDefaultDates();

  // ── Filter state ────────────────────────────────────────────────────────────
  const [pendingStart, setPendingStart] = useState(defaults.start);
  const [pendingEnd, setPendingEnd] = useState(defaults.end);
  const [appliedStart, setAppliedStart] = useState(defaults.start);
  const [appliedEnd, setAppliedEnd] = useState(defaults.end);

  // ── Data state ──────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<ReportsStatsDTO | null>(null);
  const [nature, setNature] = useState<NatureStatDTO[]>([]);
  const [trend, setTrend] = useState<ChartDataDTO[]>([]);
  const [status, setStatus] = useState<StatusStatDTO[]>([]);
  const [efficiency, setEfficiency] = useState<SettlementEfficiencyDTO | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [dateError, setDateError] = useState<string | null>(null);

  const monthlyTrend = useMemo(() => {
    const start = new Date(appliedStart);
    const end = new Date(appliedEnd);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return [] as ChartDataDTO[];
    }

    const monthBuckets: Array<{ key: string; label: string }> = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (cursor <= endMonth) {
      monthBuckets.push({
        key: toMonthKey(cursor),
        label: monthShortLabel(cursor),
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    const counts = new Map<string, number>();

    const resolveYearForMonth = (monthIndex: number) => {
      if (start.getFullYear() === end.getFullYear()) return start.getFullYear();
      return monthIndex >= start.getMonth()
        ? start.getFullYear()
        : end.getFullYear();
    };

    const getPointMonthKey = (label: string): string | null => {
      const directDate = new Date(label);
      if (!Number.isNaN(directDate.getTime())) {
        return toMonthKey(directDate);
      }

      const monthDayYearMatch = label
        .trim()
        .match(/^([A-Za-z]{3,9})\s+\d{1,2}(?:,\s*(\d{4}))?$/);
      if (monthDayYearMatch) {
        const month = MONTH_INDEX[normalizeMonthName(monthDayYearMatch[1])];
        if (month !== undefined) {
          const explicitYear = monthDayYearMatch[2]
            ? Number(monthDayYearMatch[2])
            : resolveYearForMonth(month);
          return `${explicitYear}-${String(month + 1).padStart(2, "0")}`;
        }
      }

      const monthOnlyMatch = label.trim().match(/^([A-Za-z]{3,9})$/);
      if (monthOnlyMatch) {
        const month = MONTH_INDEX[normalizeMonthName(monthOnlyMatch[1])];
        if (month !== undefined) {
          const year = resolveYearForMonth(month);
          return `${year}-${String(month + 1).padStart(2, "0")}`;
        }
      }

      return null;
    };

    trend.forEach((point) => {
      const key = getPointMonthKey(point.label);
      if (!key) return;
      counts.set(key, (counts.get(key) || 0) + (point.count || 0));
    });

    return monthBuckets.map((bucket) => ({
      label: bucket.label,
      count: counts.get(bucket.key) || 0,
    }));
  }, [appliedStart, appliedEnd, trend]);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async (start: string, end: string) => {
    setLoading(true);
    try {
      if (useKapitanaMockData()) {
        setStats(mockReportsStats());
        setTrend(mockCasesTrendForRange(start, end));
        setNature(mockCasesByNature());
        setStatus(mockCasesByStatus());
        setEfficiency(mockSettlementEfficiency());
        return;
      }
      const [s, t, n, st, e] = await Promise.all([
        getReportsStats(start, end),
        getCasesTrend(start, end),
        getCasesByNature(start, end),
        getCasesByStatus(start, end),
        getSettlementEfficiency(start, end),
      ]);

      setStats(s);
      setTrend(t);
      setNature(n);
      setStatus(st);
      setEfficiency(e);
    } catch (err) {
      console.error(
        err instanceof Error ? err.message : "Failed to load reports.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  // useEffect for permission removed

  useEffect(() => {
    fetchAll(appliedStart, appliedEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handler: apply filter ───────────────────────────────────────────────────
  const handleApplyFilter = () => {
    setDateError(null);

    if (!pendingStart || !pendingEnd) {
      setDateError("Please select both a start and end date.");
      return;
    }

    const start = new Date(pendingStart);
    const end = new Date(pendingEnd);

    if (end < start) {
      setDateError("End date cannot be before start date.");
      return;
    }

    // Max 1-year range (365 days)
    const diffDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays > 365) {
      setDateError(
        "Date range cannot exceed 1 year. Please narrow your selection.",
      );
      return;
    }

    setAppliedStart(pendingStart);
    setAppliedEnd(pendingEnd);
    fetchAll(pendingStart, pendingEnd);
  };

  // ── Handler: clear filter ───────────────────────────────────────────────────
  const handleClearFilter = () => {
    const d = getDefaultDates();
    setDateError(null);
    setPendingStart(d.start);
    setPendingEnd(d.end);
    setAppliedStart(d.start);
    setAppliedEnd(d.end);
    fetchAll(d.start, d.end);
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
          <KPIGrid columns={4}>
            {Array.from({ length: 4 }).map((_, i) => (
              <KPICard
                key={i}
                title="Loading"
                value={<CircleLoader size="sm" />}
                color="slate"
                icon={KPIIcons.document}
              />
            ))}
          </KPIGrid>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Cases Trend">
              <CenteredLoader minHeight="min-h-[250px]" />
            </SectionCard>
            <SectionCard title="Cases by Status">
              <CenteredLoader minHeight="min-h-[250px]" />
            </SectionCard>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SectionCard title="Cases by Nature" className="lg:col-span-2">
              <CenteredLoader minHeight="min-h-[220px]" />
            </SectionCard>
            <SectionCard title="Settlement Efficiency">
              <CenteredLoader minHeight="min-h-[220px]" />
            </SectionCard>
          </div>
        </div>
      </div>
    );
  }

  const trendBarColors = monthlyTrend.map(() => "#3B82F6");
  const totalStatusCases = status.reduce((sum, item) => sum + item.count, 0);
  const totalNatureCases = nature.reduce((sum, item) => sum + item.count, 0);
  const sortedNature = [...nature].sort((a, b) => b.count - a.count);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Date Range Filter
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Default range is last 6 months. Maximum selectable range is 1
                year.
              </p>
            </div>
            <span className="text-xs font-medium uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
              Max 1 Year
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From
              </label>
              <div className="relative">
                <CalendarDays className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={pendingStart}
                  max={pendingEnd || undefined}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPendingStart(v);
                    setDateError(null);
                    if (pendingEnd) {
                      const max = getMaxEndDate(v);
                      if (pendingEnd > max) setPendingEnd(max);
                    }
                  }}
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>
              <div className="relative">
                <CalendarDays className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={pendingEnd}
                  min={pendingStart || undefined}
                  max={getMaxEndDate(pendingStart)}
                  onChange={(e) => {
                    setPendingEnd(e.target.value);
                    setDateError(null);
                  }}
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                />
              </div>
            </div>

            <button
              onClick={handleApplyFilter}
              className="px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Apply Filter
            </button>

            <button
              onClick={handleClearFilter}
              className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Reset Range
            </button>
          </div>

          {/* Validation / info messages */}
          <div className="flex items-center gap-2 px-1 mt-1">
            {dateError ? (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z"
                  />
                </svg>
                {dateError}
              </p>
            ) : null}
          </div>

          {/* Permission info removed: all users can filter */}
        </div>

        <KPIGrid columns={4}>
          <KPICard
            title="Total Entries"
            value={stats ? stats.totalEntries.toLocaleString() : 0}
            color="blue"
            icon={KPIIcons.document}
            subtitle="All filed blotter reports"
          />
          <KPICard
            title="Formal Complaints"
            value={stats ? stats.formalComplaints.toLocaleString() : 0}
            color="rose"
            icon={KPIIcons.chart}
            subtitle="Cases with formal complaint"
          />
          <KPICard
            title="For the Record"
            value={stats ? stats.forTheRecord.toLocaleString() : 0}
            color="violet"
            icon={KPIIcons.total}
            subtitle="Records without formal complaint"
          />
          <KPICard
            title="Referred to Lupon"
            value={stats ? stats.referredToLupon.toLocaleString() : 0}
            color="emerald"
            icon={KPIIcons.users}
            subtitle="Forwarded for lupon handling"
          />
        </KPIGrid>

        <SectionCard
          title="Monthly Cases Filed"
          subtitle="Distribution of filed cases by month"
          className="rounded-xl border-gray-300"
        >
          {monthlyTrend.length === 0 ? (
            <NoRecords text="No monthly case filed for the selected period." />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyTrend}
                  margin={{
                    top: 8,
                    right: 10,
                    bottom: 8,
                    left: -18,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="#D1D5DB"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 13, fill: "#4B5563" }}
                    axisLine={{ stroke: "#9CA3AF", strokeWidth: 1.2 }}
                    tickLine={false}
                    angle={0}
                    textAnchor="middle"
                    height={40}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 13, fill: "#4B5563" }}
                    axisLine={{ stroke: "#9CA3AF", strokeWidth: 1.2 }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid #E5E7EB",
                      fontSize: 12,
                      boxShadow: "0 8px 20px -12px rgb(15 23 42 / 0.25)",
                    }}
                    cursor={{ fill: "#EFF6FF" }}
                    formatter={(v?: number) => [v ?? 0, "Cases"]}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={44}>
                    {monthlyTrend.map((_, i) => (
                      <Cell key={i} fill={trendBarColors[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        {/* ── Row 3: Cases by Nature (full width, below trend) ── */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Cases by Nature
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Most common complaint categories
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-2xl font-semibold text-gray-900 leading-none">
                {totalNatureCases.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Total categorized cases
              </p>
            </div>
          </div>

          {nature.length === 0 ? (
            <NoRecords text="No case nature data for the selected period." />
          ) : (
            <div className="max-h-[320px] overflow-y-auto pr-1 space-y-3">
              {sortedNature.map((item, index) => {
                const pct =
                  totalNatureCases > 0
                    ? (item.count / totalNatureCases) * 100
                    : 0;
                const natureLabel =
                  String(item.natureName || "").trim() || "Unspecified Nature";
                const barColor = NATURE_COLORS[index % NATURE_COLORS.length];

                return (
                  <div key={`${natureLabel}-${index}`} className="space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-gray-700 truncate">
                        {natureLabel}
                      </p>
                      <span className="text-sm text-gray-800 tabular-nums shrink-0">
                        {item.count.toLocaleString()} ({pct.toFixed(1)}%)
                      </span>
                    </div>

                    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(4, pct)}%`,
                          backgroundColor: barColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Row 4: Cases by Status + Settlement Efficiency ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5 lg:col-span-7">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Cases by Status
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Relative distribution across case lifecycle states
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-3xl font-semibold text-gray-900 leading-none">
                  {totalStatusCases.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Total case statuses
                </p>
              </div>
            </div>

            {status.length === 0 ? (
              <NoRecords text="No case status distribution for selected period." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={status}
                        dataKey="count"
                        nameKey="statusName"
                        innerRadius={64}
                        outerRadius={96}
                        paddingAngle={1.5}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      >
                        {status.map((_, index) => (
                          <Cell
                            key={`status-${index}`}
                            fill={getStatusColor(
                              status[index]?.statusName,
                              index,
                            )}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          border: "1px solid #E5E7EB",
                          fontSize: 12,
                          boxShadow: "0 8px 20px -12px rgb(15 23 42 / 0.25)",
                        }}
                        formatter={(value: number | string | undefined) =>
                          typeof value === "number"
                            ? value.toLocaleString()
                            : (value ?? "0")
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {status.map((item, index) => (
                    <div
                      key={`${item.statusName}-${index}`}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full mt-1.5"
                          style={{
                            backgroundColor: getStatusColor(
                              item.statusName,
                              index,
                            ),
                          }}
                        />
                        <div>
                          <p className="text-sm text-gray-700 leading-tight">
                            {formatStatusName(item.statusName)}
                          </p>
                          <p className="text-xs text-gray-500 leading-tight mt-0.5">
                            {getStatusDescription(item.statusName)}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-900 font-medium">
                        {item.count.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {efficiency && (
            <SectionCard
              title="Settlement Efficiency"
              subtitle="Ratio of settled formal complaints"
              className="lg:col-span-5 lg:py-6"
            >
              <SettlementGauge efficiency={efficiency} />
            </SectionCard>
          )}
          {!efficiency && (
            <SectionCard
              title="Settlement Efficiency"
              subtitle="Ratio of settled formal complaints"
              className="lg:col-span-5 lg:py-6"
            >
              <NoRecords text="No settlement data for the selected period." />
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
