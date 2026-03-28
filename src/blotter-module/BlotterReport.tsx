import { useEffect, useState, useCallback } from "react";
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
} from "../blotter-api/BlotterReports";
import { KPICard, KPIGrid, KPIIcons } from "../reusable/KPICard";
import { TableFilter } from "../reusable/TableFilter";

// ─── Palette ────────────────────────────────────────────────────────────────
const NATURE_COLORS = [
  "#3B82F6",
  "#10B981",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#06B6D4",
  "#F97316",
  "#84CC16",
  "#6366F1",
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
  const start = new Date(end.getFullYear(), end.getMonth(), 1);
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

// ─── Tiny helpers ────────────────────────────────────────────────────────────
function SectionCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 ${className}`}
    >
      <h3 className="text-sm font-semibold text-slate-700 mb-5">{title}</h3>
      {children}
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-100 rounded-xl ${className}`} />
  );
}

function CustomLegend({
  payload,
}: {
  payload?: Array<{ color: string; value: string; payload: { count: number } }>;
}) {
  return (
    <ul className="flex flex-col gap-2 text-xs">
      {payload?.map((entry, i) => (
        <li key={i} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-600 truncate">{entry.value}</span>
          </div>
          <span className="font-semibold text-slate-800 tabular-nums">
            {entry.payload.count}
          </span>
        </li>
      ))}
    </ul>
  );
}

const STATUS_BAR_COLORS: Record<
  string,
  { bar: string; bg: string; text: string }
> = {
  pending: { bar: "#94A3B8", bg: "bg-slate-100", text: "text-slate-500" },
  recorded: { bar: "#14B8A6", bg: "bg-teal-50", text: "text-teal-600" },
  "under investigation": {
    bar: "#3B82F6",
    bg: "bg-blue-50",
    text: "text-blue-600",
  },
  "under mediation": {
    bar: "#6366F1",
    bg: "bg-indigo-50",
    text: "text-indigo-600",
  },
  resolved: { bar: "#10B981", bg: "bg-emerald-50", text: "text-emerald-600" },
  settled: { bar: "#10B981", bg: "bg-emerald-50", text: "text-emerald-600" },
  unsettled: { bar: "#F43F5E", bg: "bg-rose-50", text: "text-rose-500" },
  escalated: { bar: "#EF4444", bg: "bg-red-50", text: "text-red-500" },
  elevated_to_formal: { bar: "#EF4444", bg: "bg-red-50", text: "text-red-500" },
  "elevated to formal": {
    bar: "#EF4444",
    bg: "bg-red-50",
    text: "text-red-500",
  },
  summoned: { bar: "#F59E0B", bg: "bg-amber-50", text: "text-amber-600" },
  "referred to lupon": {
    bar: "#8B5CF6",
    bg: "bg-purple-50",
    text: "text-purple-600",
  },
  closed: { bar: "#CBD5E1", bg: "bg-slate-50", text: "text-slate-400" },
};

function formatStatusName(raw: string): string {
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getStatusStyle(raw: string) {
  const key = raw.toLowerCase().replace(/_/g, " ");
  const keyUnderscore = raw.toLowerCase();
  return (
    STATUS_BAR_COLORS[key] ??
    STATUS_BAR_COLORS[keyUnderscore] ?? {
      bar: "#94A3B8",
      bg: "bg-slate-100",
      text: "text-slate-500",
    }
  );
}

// ─── Cases by Status — colored rows ──────────────────────────────────────────
function CasesByStatusList({ data }: { data: StatusStatDTO[] }) {
  if (!data.length) {
    return (
      <p className="text-xs text-slate-400 italic py-6 text-center">
        No status data available.
      </p>
    );
  }

  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex flex-col divide-y divide-slate-50">
      {data.map((item, i) => {
        const pct = Math.round((item.count / max) * 100);
        const style = getStatusStyle(item.statusName);
        return (
          <div key={i} className="py-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: style.bar }}
                />
                <span
                  className={`text-xs font-medium truncate pr-2 ${style.text}`}
                >
                  {formatStatusName(item.statusName)}
                </span>
              </div>
              <span
                className={`text-xs font-bold tabular-nums shrink-0 px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}
              >
                {item.count}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: style.bar }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SettlementGauge({
  efficiency,
}: {
  efficiency: SettlementEfficiencyDTO;
}) {
  const pct = efficiency.efficiencyPercentage ?? 0;
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-2">
      <div className="relative flex items-center justify-center">
        <svg width="140" height="140" className="-rotate-90">
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="12"
          />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={pct >= 70 ? "#10B981" : pct >= 40 ? "#F59E0B" : "#EF4444"}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-2xl font-bold text-slate-800 tabular-nums">
            {pct.toFixed(0)}%
          </span>
          <span className="text-[10px] text-slate-400 font-medium -mt-0.5 uppercase tracking-wide">
            efficiency
          </span>
        </div>
      </div>

      <div className="w-full grid grid-cols-2 gap-3">
        <div className="border border-slate-100 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-slate-700 tabular-nums">
            {efficiency.totalFormalComplaints}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
            Formal Complaints
          </p>
        </div>
        <div className="border border-slate-100 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-slate-700 tabular-nums">
            {efficiency.settledCases}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
            Settled Cases
          </p>
        </div>
      </div>

      {efficiency.totalFormalComplaints > 0 && (
        <p className="text-[10px] text-slate-400 text-center">
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
export default function ReportsPage() {
  const defaults = getDefaultDates();

  // ── Filter state ────────────────────────────────────────────────────────────
  const [pendingStart, setPendingStart] = useState(defaults.start);
  const [pendingEnd, setPendingEnd] = useState(defaults.end);
  // Applied dates — only updated when "Filter" is clicked
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
  const [error, setError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async (start: string, end: string) => {
    setLoading(true);
    setError(null);
    try {
      // IPASA ANG PURE DATE STRINGS LANG (e.g., "2026-03-01")
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
      setError(err instanceof Error ? err.message : "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
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
      <div className="min-h-screen bg-slate-50 p-6 md:p-8 space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 max-w-sm w-full text-center space-y-3">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-6 h-6 text-red-400"
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
          </div>
          <p className="text-sm font-medium text-slate-700">
            Failed to load reports
          </p>
          <p className="text-xs text-slate-400">{error}</p>
          <button
            onClick={() => fetchAll(appliedStart, appliedEnd)}
            className="mt-2 text-xs font-semibold text-blue-500 hover:text-blue-600 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const trendBarColors = trend.map(() => "#3B82F6");

  return (
    <div className="mb-4 p-1 space-y-4">
      <div>
        <TableFilter
          showSearch={false}
          showFilterButton
          showClearButton
          filterButtonText="Apply"
          clearButtonText="Reset"
          dateRange={{
            startLabel: "From",
            endLabel: "To",
            startValue: pendingStart,
            endValue: pendingEnd,
            onStartChange: (v) => {
              setPendingStart(v);
              setDateError(null);
              if (pendingEnd) {
                const max = getMaxEndDate(v);
                if (pendingEnd > max) setPendingEnd(max);
              }
            },
            onEndChange: (v) => {
              setPendingEnd(v);
              setDateError(null);
            },
          }}
          onFilterClick={handleApplyFilter}
          onClearClick={handleClearFilter}
        />

        {/* Validation / info messages */}
        <div className="flex items-center gap-2 px-1 -mt-2">
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
          ) : (
            <p className="text-xs text-slate-400">
             
            </p>
          )}
        </div>
      </div>

      {stats && (
        <KPIGrid columns={4}>
          <KPICard
            title="Total Entries"
            value={stats.totalEntries.toLocaleString()}
            color="blue"
            icon={KPIIcons.document}
            
          />
          <KPICard
            title="Formal Complaints"
            value={stats.formalComplaints.toLocaleString()}
            color="rose"
            icon={KPIIcons.chart}
            
          />
          <KPICard
            title="For the Record"
            value={stats.forTheRecord.toLocaleString()}
            color="violet"
            icon={KPIIcons.total}
           
          />
          <KPICard
            title="Referred to Lupon"
            value={stats.referredToLupon.toLocaleString()}
            color="emerald"
            icon={KPIIcons.users}
            
          />
        </KPIGrid>
      )}

      <SectionCard title="Cases Trend">
        {trend.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-16">
            No trend data for the selected period.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={trend}
              barSize={trend.length > 8 ? 25 : 45}
              margin={{ top: 4, right: 10, left: -30, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#d3dae1"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={trend.length > 6 ? -30 : 0}
                textAnchor={trend.length > 6 ? "end" : "middle"}
                height={trend.length > 6 ? 48 : 30}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "#F8FAFC" }}
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid #E2E8F0",
                  fontSize: 12,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                }}
                formatter={(v?: number) => [v ?? 0, "Cases"]}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {trend.map((_, i) => (
                  <Cell key={i} fill={trendBarColors[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      {/* ── Row 3: Cases by Status (full width, below trend) ── */}
      <SectionCard title="Cases by Status">
        <CasesByStatusList data={status} />
      </SectionCard>

      {/* ── Row 3: Cases by Nature + Settlement Efficiency ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Cases by Nature" className="lg:col-span-2">
          {nature.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-16">
              No nature data for the selected period.
            </p>
          ) : (
            <div className="flex items-center gap-4">
              <div className="shrink-0" style={{ width: 180, height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={nature}
                      dataKey="count"
                      nameKey="natureName"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {nature.map((_, i) => (
                        <Cell
                          key={i}
                          fill={NATURE_COLORS[i % NATURE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 min-w-0">
                <CustomLegend
                  payload={nature.map((n, i) => ({
                    color: NATURE_COLORS[i % NATURE_COLORS.length],
                    value: n.natureName,
                    payload: { count: n.count },
                  }))}
                />
              </div>
            </div>
          )}
        </SectionCard>
        {efficiency && (
          <SectionCard title="Settlement Efficiency">
            <SettlementGauge efficiency={efficiency} />
          </SectionCard>
        )}
      </div>
    </div>
  );
}
