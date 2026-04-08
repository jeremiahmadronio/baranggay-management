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
} from "../../service/blotter-api/blotter-api";
import { KPICard, KPIGrid, KPIIcons } from "../../reusable/KPICard";
import {
  BLOTTER_PERMISSIONS,
  getMyAccess,
  hasBlotterPermission,
} from "../../service/blotter-api/blotter-api";
import {
  CenteredLoader,
  CircleLoader,
  NoRecords,
} from "../../reusable/LoadingStates";
import { LayoutDashboard, CalendarRange, CalendarDays } from "lucide-react";

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
  "#2563EB",
  "#0EA5E9",
  "#64748B",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#94A3B8",
];

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

function getNatureDescription(raw: string): string {
  const key = raw.toUpperCase();
  if (key.includes("PHYSICAL")) return "Physical injury related complaints";
  if (key.includes("VERBAL")) return "Verbal abuse and related concerns";
  if (key.includes("THREAT")) return "Threat and intimidation incidents";
  if (key.includes("PROPERTY")) return "Property-related disputes";
  if (key.includes("NOISE")) return "Noise and disturbance complaints";
  return "Complaint category distribution";
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
  const [hasReportPermission, setHasReportPermission] = useState<
    boolean | null
  >(null);

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
  const [dateError, setDateError] = useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async (start: string, end: string) => {
    setLoading(true);
    try {
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
  useEffect(() => {
    getMyAccess()
      .then((access) => {
        setHasReportPermission(
          hasBlotterPermission(access, BLOTTER_PERMISSIONS.MANAGE_REPORTS),
        );
      })
      .catch(() => setHasReportPermission(false));
  }, []);

  useEffect(() => {
    fetchAll(appliedStart, appliedEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canManageFilters = hasReportPermission === true;

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

  const trendBarColors = trend.map(() => "#3B82F6");
  const totalStatusCases = status.reduce((sum, item) => sum + item.count, 0);
  const totalNatureCases = nature.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Blotter Reports Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Analytics summary for filed cases, status trends, and settlement
                performance.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
            <CalendarRange className="w-3.5 h-3.5" />
            Range: {appliedStart} to {appliedEnd}
          </span>
        </div>

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
                  disabled={!canManageFilters}
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
                  disabled={!canManageFilters}
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                />
              </div>
            </div>

            <button
              onClick={canManageFilters ? handleApplyFilter : undefined}
              disabled={!canManageFilters}
              className="px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Apply Filter
            </button>

            <button
              onClick={canManageFilters ? handleClearFilter : undefined}
              disabled={!canManageFilters}
              className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
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

          {!canManageFilters && hasReportPermission !== null ? (
            <p className="text-xs text-amber-600 px-1 mt-1">
              You can view reports, but filtering requires Manage Reports
              permission.
            </p>
          ) : null}
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
          title="Cases Trend"
          subtitle="Monthly volume of blotter entries in selected date range"
        >
          {trend.length === 0 ? (
            <NoRecords text="No monthly case filed for the selected period." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trend}
                  margin={{
                    top: 5,
                    right: 30,
                    bottom: 20,
                    left: 10,
                  }}
                >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    fontSize: 12,
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  cursor={{ fill: "#f8fafc" }}
                  formatter={(v?: number) => [v ?? 0, "Cases"]}
                />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  barSize={35}
                >
                  {trend.map((_, i) => (
                    <Cell key={i} fill={trendBarColors[i]} />
                  ))}
                </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        {/* ── Row 3: Cases by Status (full width, below trend) ── */}
        <SectionCard
          title="Cases by Status"
          subtitle="Relative distribution across case lifecycle states"
        >
          {status.length === 0 ? (
            <NoRecords text="No case status distribution for selected period." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={status}
                      dataKey="count"
                      nameKey="statusName"
                      innerRadius={62}
                      outerRadius={92}
                      paddingAngle={2}
                    >
                      {status.map((_, index) => (
                        <Cell
                          key={`status-${index}`}
                          fill={
                            STATUS_DONUT_COLORS[
                              index % STATUS_DONUT_COLORS.length
                            ]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
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
                <div className="mb-4">
                  <p className="text-3xl font-semibold text-gray-900">
                    {totalStatusCases.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">Total case statuses</p>
                </div>

                {status.map((item, index) => (
                  <div
                    key={`${item.statusName}-${index}`}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full mt-1.5"
                        style={{
                          backgroundColor:
                            STATUS_DONUT_COLORS[
                              index % STATUS_DONUT_COLORS.length
                            ],
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
        </SectionCard>

        {/* ── Row 3: Cases by Nature + Settlement Efficiency ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SectionCard
            title="Cases by Nature"
            subtitle="Most common complaint categories"
            className="lg:col-span-2"
          >
            {nature.length === 0 ? (
              <NoRecords text="No case nature data for the selected period." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={nature}
                        dataKey="count"
                        nameKey="natureName"
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={92}
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

                <div className="space-y-3">
                  <div className="mb-4">
                    <p className="text-3xl font-semibold text-gray-900">
                      {totalNatureCases.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Total categorized cases
                    </p>
                  </div>

                  {nature.map((item, index) => {
                    const pct =
                      totalNatureCases > 0
                        ? (item.count / totalNatureCases) * 100
                        : 0;
                    return (
                      <div
                        key={`${item.natureName}-${index}`}
                        className="flex items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full mt-1.5"
                            style={{
                              backgroundColor:
                                NATURE_COLORS[index % NATURE_COLORS.length],
                            }}
                          />
                          <div>
                            <p className="text-sm text-gray-700 leading-tight">
                              {item.natureName}
                            </p>
                            <p className="text-xs text-gray-500 leading-tight mt-0.5">
                              {getNatureDescription(item.natureName)}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-900 font-medium whitespace-nowrap">
                          {item.count.toLocaleString()} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </SectionCard>
          {efficiency && (
            <SectionCard
              title="Settlement Efficiency"
              subtitle="Ratio of settled formal complaints"
            >
              <SettlementGauge efficiency={efficiency} />
            </SectionCard>
          )}
          {!efficiency && (
            <SectionCard
              title="Settlement Efficiency"
              subtitle="Ratio of settled formal complaints"
            >
              <NoRecords text="No settlement data for the selected period." />
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
