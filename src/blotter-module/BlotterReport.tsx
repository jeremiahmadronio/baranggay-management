import { useEffect, useState } from "react";
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
  getCasesByNature,
  getMonthlyTrends,
  getCasesByStatus,
  getSettlementEfficiency,
  type ReportsStatsDTO,
  type NatureStatDTO,
  type MonthlyTrendDTO,
  type StatusStatDTO,
  type SettlementEfficiencyDTO,
} from "../blotter-api/BlotterReports";
import { KPICard, KPIGrid, KPIIcons } from "../reusable/KPICard";

// ─── Palette ────────────────────────────────────────────────────────────────
const NATURE_COLORS = [
  "#3B82F6", "#10B981", "#EF4444", "#8B5CF6", "#EC4899",
  "#F59E0B", "#06B6D4", "#F97316", "#84CC16", "#6366F1",
];

// ─── Helper: last 4 months from today, zero-filled ──────────────────────────
function getLast4MonthsData(apiData: MonthlyTrendDTO[]): MonthlyTrendDTO[] {
  const now = new Date();
  const result: MonthlyTrendDTO[] = [];

  for (let i = 3; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    // Try to match API label — supports "Jan", "Jan 25", "January", "Jan '25", etc.
    const shortLabel = d.toLocaleString("en-US", { month: "short" }); // "Jan"
    const fullLabel  = d.toLocaleString("en-US", { month: "long" });  // "January"
    const yearShort  = String(d.getFullYear()).slice(-2);              // "25"
    const yearFull   = String(d.getFullYear());                        // "2025"

    const match = apiData.find((item) => {
      const m = item.month ?? "";
      return (
        m === shortLabel ||
        m === fullLabel  ||
        m === `${shortLabel} ${yearShort}` ||
        m === `${shortLabel} ${yearFull}` ||
        m === `${shortLabel} '${yearShort}` ||
        m.toLowerCase().startsWith(fullLabel.toLowerCase())
      );
    });

    result.push({ month: shortLabel, count: match?.count ?? 0 });
  }

  return result;
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
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 ${className}`}>
      <h3 className="text-sm font-semibold text-slate-700 mb-5">{title}</h3>
      {children}
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded-xl ${className}`} />;
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

// ─── Status color map ────────────────────────────────────────────────────────
const STATUS_BAR_COLORS: Record<string, { bar: string; bg: string; text: string }> = {
  pending:              { bar: "#94A3B8", bg: "bg-slate-100",   text: "text-slate-500"  },
  recorded:             { bar: "#14B8A6", bg: "bg-teal-50",     text: "text-teal-600"   },
  "under investigation":{ bar: "#3B82F6", bg: "bg-blue-50",     text: "text-blue-600"   },
  "under mediation":    { bar: "#6366F1", bg: "bg-indigo-50",   text: "text-indigo-600" },
  resolved:             { bar: "#10B981", bg: "bg-emerald-50",  text: "text-emerald-600"},
  settled:              { bar: "#10B981", bg: "bg-emerald-50",  text: "text-emerald-600"},
  unsettled:            { bar: "#F43F5E", bg: "bg-rose-50",     text: "text-rose-500"   },
  escalated:            { bar: "#EF4444", bg: "bg-red-50",      text: "text-red-500"    },
  elevated_to_formal:   { bar: "#EF4444", bg: "bg-red-50",      text: "text-red-500"    },
  "elevated to formal": { bar: "#EF4444", bg: "bg-red-50",      text: "text-red-500"    },
  summoned:             { bar: "#F59E0B", bg: "bg-amber-50",    text: "text-amber-600"  },
  "referred to lupon":  { bar: "#8B5CF6", bg: "bg-purple-50",  text: "text-purple-600" },
  closed:               { bar: "#CBD5E1", bg: "bg-slate-50",    text: "text-slate-400"  },
};

function formatStatusName(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getStatusStyle(raw: string) {
  const key = raw.toLowerCase().replace(/_/g, " ");
  const keyUnderscore = raw.toLowerCase();
  return (
    STATUS_BAR_COLORS[key] ??
    STATUS_BAR_COLORS[keyUnderscore] ??
    { bar: "#94A3B8", bg: "bg-slate-100", text: "text-slate-500" }
  );
}

// ─── Cases by Status — colored rows ──────────────────────────────────────────
function CasesByStatusList({ data }: { data: StatusStatDTO[] }) {
  if (!data.length) {
    return <p className="text-xs text-slate-400 italic py-6 text-center">No status data available.</p>;
  }

  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex flex-col divide-y divide-slate-50">
      {data.map((item, i) => {
        const pct   = Math.round((item.count / max) * 100);
        const style = getStatusStyle(item.statusName);
        return (
          <div key={i} className="py-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: style.bar }}
                />
                <span className={`text-xs font-medium truncate pr-2 ${style.text}`}>
                  {formatStatusName(item.statusName)}
                </span>
              </div>
              <span className={`text-xs font-bold tabular-nums shrink-0 px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
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

// ─── Settlement Efficiency — monochrome ──────────────────────────────────────
function SettlementGauge({ efficiency }: { efficiency: SettlementEfficiencyDTO }) {
  const pct     = efficiency.efficiencyPercentage ?? 0;
  const radius  = 54;
  const circ    = 2 * Math.PI * radius;
  const offset  = circ - (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-2">
      {/* Ring */}
      <div className="relative flex items-center justify-center">
        <svg width="140" height="140" className="-rotate-90">
          <circle
            cx="70" cy="70" r={radius}
            fill="none" stroke="#E2E8F0" strokeWidth="12"
          />
          <circle
            cx="70" cy="70" r={radius}
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

      {/* Sub-stats */}
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

      {/* Unsettled hint */}
      {efficiency.totalFormalComplaints > 0 && (
        <p className="text-[10px] text-slate-400 text-center">
          {efficiency.totalFormalComplaints - efficiency.settledCases} case
          {efficiency.totalFormalComplaints - efficiency.settledCases !== 1 ? "s" : ""} still pending resolution
        </p>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [stats,      setStats]      = useState<ReportsStatsDTO | null>(null);
  const [nature,     setNature]     = useState<NatureStatDTO[]>([]);
  const [monthly,    setMonthly]    = useState<MonthlyTrendDTO[]>([]);
  const [status,     setStatus]     = useState<StatusStatDTO[]>([]);
  const [efficiency, setEfficiency] = useState<SettlementEfficiencyDTO | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, n, m, st, e] = await Promise.all([
          getReportsStats(),
          getCasesByNature(),
          getMonthlyTrends(),
          getCasesByStatus(),
          getSettlementEfficiency(),
        ]);
        setStats(s);
        setNature(n);
        setMonthly(getLast4MonthsData(m)); // ← last 4 months only, zero-filled
        setStatus(st);
        setEfficiency(e);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reports.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
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
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700">Failed to load reports</p>
          <p className="text-xs text-slate-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-xs font-semibold text-blue-500 hover:text-blue-600 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 p-1">
      <div>
        {/* ── Row 1: KPI Stats ── */}
        {stats && (
          <KPIGrid columns={4}>
            <KPICard
              title="Total Entries"
              value={stats.totalEntries.toLocaleString()}
              color="blue"
              icon={KPIIcons.document}
              trend={{ value: `${Math.abs(stats.totalTrend)}%`, direction: stats.totalTrend >= 0 ? "up" : "down", label: "vs last month" }}
            />
            <KPICard
              title="Formal Complaints"
              value={stats.formalComplaints.toLocaleString()}
              color="rose"
              icon={KPIIcons.chart}
              trend={{ value: `${Math.abs(stats.formalTrend)}%`, direction: stats.formalTrend >= 0 ? "up" : "down", label: "vs last month" }}
            />
            <KPICard
              title="For the Record"
              value={stats.forTheRecord.toLocaleString()}
              color="violet"
              icon={KPIIcons.total}
              trend={{ value: `${Math.abs(stats.recordTrend)}%`, direction: stats.recordTrend >= 0 ? "up" : "down", label: "vs last month" }}
            />
            <KPICard
              title="Referred to Lupon"
              value={stats.referredToLupon.toLocaleString()}
              color="emerald"
              icon={KPIIcons.users}
              trend={{ value: `${Math.abs(stats.luponTrend)}%`, direction: stats.luponTrend >= 0 ? "up" : "down", label: "vs last month" }}
            />
          </KPIGrid>
        )}

        <br />

        {/* ── Row 2: Monthly + Cases by Nature ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Monthly Trends — last 4 months only */}
          <SectionCard title="Monthly Blotter Entries">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={monthly}
                barSize={40}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
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
                  formatter={(v?: number) => [v ?? 0, "Entries"]}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {monthly.map((_, i) => (
                    <Cell
                      key={i}
                      fill={i === monthly.length - 1 ? "#3B82F6" : "#BFDBFE"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>

          {/* Cases by Nature */}
          <SectionCard title="Cases by Nature">
            <div className="flex items-center gap-4">
              <div className="shrink-0" style={{ width: 180, height: 200 }}>
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
                        <Cell key={i} fill={NATURE_COLORS[i % NATURE_COLORS.length]} />
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
          </SectionCard>
        </div>

        <br />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Cases by Status — clean list, no colors */}
          <SectionCard title="Cases by Status" className="lg:col-span-2">
            <CasesByStatusList data={status} />
          </SectionCard>

          {/* Settlement Efficiency — monochrome */}
          {efficiency && (
            <SectionCard title="Settlement Efficiency">
              <SettlementGauge efficiency={efficiency} />
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}