import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { KPIGrid, KPICard, KPIIcons } from "../../../hooks/KPICard";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import {
  adminReportsApi,
  type ArchiveSummaryDTO,
  type GrowthTrendDTO,
  type ModuleRecordsDTO,
  type ReportStatsDTO,
  type SeverityReportDTO,
} from "../../../service/admin-root-api/report";


type GrowthPoint = {
  label: string;
  fullLabel: string;
  users: number;
  admin: number;
  resident: number;
  officer: number;
};

function GrowthTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: GrowthPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs shadow-lg">
      <p className="text-slate-900 font-medium">Date: {point.fullLabel}</p>
      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between gap-6">
          <span className="text-blue-700">Users</span>
          <span className="font-semibold text-slate-900">{point.users.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-blue-500">Admin</span>
          <span className="font-semibold text-slate-900">{point.admin.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-violet-600">Officer</span>
          <span className="font-semibold text-slate-900">{point.officer.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;
const severityColorMap: Record<string, string> = {
  CRITICAL: "#DC2626",   // red
  HIGH:     "#F97316",   // orange
  WARNING:  "#F59E0B",   // amber
  MEDIUM:   "#EAB308",   // yellow
  LOW:      "#2563EB",   // blue
  INFO:     "#14B8A6",   // teal
  DEBUG:    "#8B5CF6",   // violet
};
const fallbackSeverityColor = "#64748B";


function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toStartAndEndDate(startISO: string, endISO: string): { start: Date; end: Date } {
  const start = new Date(`${startISO}T00:00:00`);
  const end = new Date(`${endISO}T23:59:59`);
  return { start, end };
}

function getRangeDays(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
}

function getSeverityColor(level: string): string {
  return severityColorMap[level.trim().toUpperCase()] ?? fallbackSeverityColor;
}

function formatRangeDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function exceedsOneYearLimit(start: Date, end: Date): boolean {
  const oneYearAfterStart = new Date(start);
  oneYearAfterStart.setFullYear(oneYearAfterStart.getFullYear() + 1);
  return end >= oneYearAfterStart;
}

function normalizeGrowthTrend(
  data: GrowthTrendDTO,
  rangeStart: Date,
  isDaily: boolean,
): GrowthPoint[] {
  if (!data.labels.length) return [];

  return data.labels.map((_, idx) => {
    const users = Number(data.userCounts[idx] ?? 0);
    const admin = Number(data.adminCounts[idx] ?? 0);
    const resident = Number(data.residentCounts[idx] ?? 0);
    const officer = Number(data.officerCounts[idx] ?? 0);
    const pointDate = new Date(rangeStart);
    if (isDaily) {
      pointDate.setDate(rangeStart.getDate() + idx);
    } else {
      pointDate.setMonth(rangeStart.getMonth() + idx);
      pointDate.setDate(1);
    }

    const displayLabel = isDaily
      ? new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit" }).format(
          pointDate,
        )
      : new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(
          pointDate,
        );

    return {
      label: displayLabel,
      fullLabel: formatRangeDate(pointDate),
      users,
      admin,
      resident,
      officer,
    };
  });
}

export default function KapitanaAdminReportsPage() {
  const today = new Date();
  const defaultStart = new Date();
  defaultStart.setDate(today.getDate() - 29);

  const [pendingStartDate, setPendingStartDate] = useState(toDateInputValue(defaultStart));
  const [pendingEndDate, setPendingEndDate] = useState(toDateInputValue(today));
  const [startDate, setStartDate] = useState(toDateInputValue(defaultStart));
  const [endDate, setEndDate] = useState(toDateInputValue(today));
  const [dateError, setDateError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ReportStatsDTO | null>(null);
  const [growthTrend, setGrowthTrend] = useState<GrowthTrendDTO | null>(null);
  const [records, setRecords] = useState<ModuleRecordsDTO | null>(null);
  const [severity, setSeverity] = useState<SeverityReportDTO[]>([]);
  const [archiveSummary, setArchiveSummary] = useState<ArchiveSummaryDTO | null>(null);

  const appliedRange = useMemo(() => toStartAndEndDate(startDate, endDate), [startDate, endDate]);
  const appliedRangeDays = useMemo(
    () => getRangeDays(appliedRange.start, appliedRange.end),
    [appliedRange],
  );

  useEffect(() => {
    let isMounted = true;
    const loadReports = async () => {
      setLoading(true);
      setApiError(null);

      const [statsRes, growthRes, recordsRes, severityRes, archiveRes] =
        await Promise.allSettled([
          adminReportsApi.getStats(),
          adminReportsApi.getGrowthTrend(appliedRange.start, appliedRange.end),
          adminReportsApi.getModuleRecords(appliedRange.start, appliedRange.end),
          adminReportsApi.getSeverityReport(appliedRange.start, appliedRange.end),
          adminReportsApi.getArchiveSummary(appliedRange.start, appliedRange.end),
        ]);

      if (!isMounted) return;

      if (statsRes.status === "fulfilled") setStats(statsRes.value);
      if (growthRes.status === "fulfilled") setGrowthTrend(growthRes.value);
      if (recordsRes.status === "fulfilled") setRecords(recordsRes.value);
      if (severityRes.status === "fulfilled") setSeverity(severityRes.value);
      if (archiveRes.status === "fulfilled") setArchiveSummary(archiveRes.value);

      const failures = [statsRes, growthRes, recordsRes, severityRes, archiveRes]
        .filter((r) => r.status === "rejected")
        .map((r) => (r as PromiseRejectedResult).reason);

      if (failures.length > 0) {
        const msg = failures[0] instanceof Error ? failures[0].message : String(failures[0]);
        setApiError(`Some report data failed to load: ${msg}`);
      }

      if (isMounted) setLoading(false);
    };

    loadReports();
    return () => {
      isMounted = false;
    };
  }, [appliedRange.end, appliedRange.start]);

  const growthData = useMemo(
    () =>
      growthTrend
        ? normalizeGrowthTrend(growthTrend, appliedRange.start, appliedRangeDays <= 30)
        : [],
    [growthTrend, appliedRange.start, appliedRangeDays],
  );
  const lowMax = useMemo(() => {
    if (!growthData.length) return 0;
    return growthData.reduce((max, p) => {
      const localMax = Math.max(p.users, p.admin, p.officer);
      return localMax > max ? localMax : max;
    }, 0);
  }, [growthData]);

  const lowDomainMax = useMemo(() => {
    if (!lowMax) return 2;
    if (lowMax <= 2) return 2;
    if (lowMax <= 4) return 4;
    if (lowMax <= 6) return 6;
    if (lowMax <= 8) return 8;
    return 10;
  }, [lowMax]);

  const lowRangeTicks = useMemo(() => {
    if (lowDomainMax <= 2) return [0, 1, 2];
    const ticks: number[] = [];
    for (let i = 0; i <= lowDomainMax; i += 2) ticks.push(i);
    return ticks;
  }, [lowDomainMax]);
  const moduleRecordData = useMemo(
    () =>
      records
        ? [
            { module: "Admin", records: records.admin },
            { module: "Resident", records: records.resident },
            { module: "Officer", records: records.officer },
            { module: "Audit Logs", records: records.auditLogs },
          ]
        : [],
    [records],
  );

  const archiveData = useMemo(
    () =>
      archiveSummary
        ? [
            { category: "Residents", value: archiveSummary.archivedResidents },
            { category: "Users", value: archiveSummary.archivedUsers },
            { category: "Officers", value: archiveSummary.archivedOfficers },
            { category: "Admins", value: archiveSummary.archivedAdmins },
          ]
        : [],
    [archiveSummary],
  );

  const severityTotal = useMemo(
    () => severity.reduce((sum, item) => sum + item.count, 0),
    [severity],
  );
  const handleApplyFilter = () => {
    setDateError(null);
    if (!pendingStartDate || !pendingEndDate) {
      setDateError("Please select both start and end date.");
      return;
    }

    const pendingRange = toStartAndEndDate(pendingStartDate, pendingEndDate);
    if (pendingRange.end < pendingRange.start) {
      setDateError("End date cannot be before start date.");
      return;
    }

    if (exceedsOneYearLimit(pendingRange.start, pendingRange.end)) {
      setDateError("Date range cannot exceed 1 year.");
      return;
    }

    setStartDate(pendingStartDate);
    setEndDate(pendingEndDate);
  };

  const handleResetFilter = () => {
    const resetEnd = new Date();
    const resetStart = new Date();
    resetStart.setDate(resetEnd.getDate() - 29);

    setDateError(null);
    setApiError(null);
    setPendingStartDate(toDateInputValue(resetStart));
    setPendingEndDate(toDateInputValue(resetEnd));
    setStartDate(toDateInputValue(resetStart));
    setEndDate(toDateInputValue(resetEnd));
  };

  return (
    <div className="min-h-screen bg-gray-50/60 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <KPIGrid columns={4}>
          <KPICard
            title="Admin Users"
            value={stats ? stats.totalAdminUsers.toLocaleString() : "--"}
            subtitle="Total admin users"
            icon={KPIIcons.users}
            color="blue"
          />
          <KPICard
            title="Residents"
            value={stats ? stats.totalResidents.toLocaleString() : "--"}
            subtitle="Total residents"
            icon={KPIIcons.home}
            color="emerald"
          />
          <KPICard
            title="Officers"
            value={stats ? stats.totalOfficers.toLocaleString() : "--"}
            subtitle="Total officers"
            icon={KPIIcons.check}
            color="violet"
          />
          <KPICard
            title="Audit Logs"
            value={stats ? stats.totalAuditLogsThisMonth.toLocaleString() : "--"}
            subtitle="This month"
            icon={KPIIcons.document}
            color="slate"
          />
        </KPIGrid>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Date Range Filter
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Maximum date range is 1 year.
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
                  value={pendingStartDate}
                  max={pendingEndDate || undefined}
                  onChange={(e) => {
                    setPendingStartDate(e.target.value);
                    setDateError(null);
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
                  value={pendingEndDate}
                  min={pendingStartDate || undefined}
                  max={toDateInputValue(new Date())}
                  onChange={(e) => {
                    setPendingEndDate(e.target.value);
                    setDateError(null);
                  }}
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                />
              </div>
            </div>

            <button
              onClick={handleApplyFilter}
              disabled={loading}
              className="px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {loading ? "Loading..." : "Apply Filter"}
            </button>

            <button
              onClick={handleResetFilter}
              className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Reset Range
            </button>
          </div>

          {dateError ? <p className="text-xs text-red-500 px-1 mt-2">{dateError}</p> : null}
          {apiError ? <p className="text-xs text-red-500 px-1 mt-2">{apiError}</p> : null}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Growth Trend ({appliedRangeDays <= 30 ? "Daily" : "Monthly"})
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Focused trend view for staff/admin activity (Users, Admin, Officer).
                <span className="ml-1 text-gray-400">
                  ({formatRangeDate(appliedRange.start)} – {formatRangeDate(appliedRange.end)})
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-blue-700" />
                Users
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Admin
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-violet-500" />
                Officer
              </span>
            </div>
          </div>
          <div className="mt-4">
            {growthData.length ? (
              <div className="h-80 rounded-xl border border-gray-100 bg-gradient-to-b from-slate-50 to-white p-3">
                <div className="h-full">
                  <div className="flex items-center justify-between px-1 pb-2">
                    <p className="text-[11px] font-semibold text-slate-700">Accounts (zoomed)</p>
                    <p className="text-[11px] text-slate-500">Range: 0–{lowDomainMax}</p>
                  </div>
                  <div className="h-[calc(100%-24px)] rounded-lg border border-slate-100 bg-white/70 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={growthData} barCategoryGap="25%" barGap={2}>
                        <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#E5E7EB" />
                        <XAxis
                          dataKey="label"
                          interval={
                            appliedRangeDays <= 30
                              ? 1
                              : growthData.length > 20
                                ? Math.ceil(growthData.length / 10) - 1
                                : 0
                          }
                          tick={{ fontSize: 11, fill: "#6B7280" }}
                          axisLine={{ stroke: "#CBD5E1" }}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          width={36}
                          tick={{ fontSize: 10, fill: "#6B7280" }}
                          axisLine={false}
                          tickLine={false}
                          ticks={lowRangeTicks}
                          domain={[0, lowDomainMax]}
                        />
                        <Tooltip content={<GrowthTooltip />} />
                        <Bar
                          dataKey="users"
                          name="Users"
                          fill="#1D4ED8"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={22}
                        />
                        <Bar
                          dataKey="admin"
                          name="Admin"
                          fill="#3B82F6"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={22}
                        />
                        <Bar
                          dataKey="officer"
                          name="Officer"
                          fill="#8B5CF6"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={22}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
                No growth trend data for selected date range.
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Module Records</h2>
            <p className="mt-1 text-sm text-gray-500">
              Records by module from selected date range.
            </p>
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moduleRecordData}>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="#D1D5DB"
                  />
                  <XAxis
                    dataKey="module"
                    tick={{ fontSize: 12, fill: "#4B5563" }}
                    axisLine={{ stroke: "#9CA3AF", strokeWidth: 1.2 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#4B5563" }}
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
                  />
                  <Bar dataKey="records" radius={[6, 6, 0, 0]} fill="#2563EB" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Audit Severity</h3>
                <p className="text-sm text-gray-500 mt-1">Distribution of audit log severity levels</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-3xl font-semibold text-gray-900 leading-none">{severityTotal}</p>
                <p className="text-sm text-gray-500 mt-1">Total logs</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severity}
                      dataKey="count"
                      nameKey="severity"
                      innerRadius={64}
                      outerRadius={96}
                      paddingAngle={2}
                      minAngle={8}
                      stroke="#FFFFFF"
                      strokeWidth={2}
                    >
                      {severity.map((item, index) => (
                        <Cell
                          key={`${item.severity}-${index}`}
                          fill={getSeverityColor(item.severity)}
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
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                {severity.map((item, index) => (
                  <div key={`${item.severity}-${index}`} className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: getSeverityColor(item.severity) }}
                      />
                      <p className="text-sm text-gray-700 leading-tight">{item.severity}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-900 font-medium">{item.count}</span>
                     
                    </div>
                  </div>
                ))}
                {!severity.length ? <p className="text-sm text-gray-500">No severity data.</p> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Archive Summary</h2>
            <p className="mt-1 text-sm text-gray-500">
              Archived records by category from selected date range.
            </p>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={archiveData}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#D1D5DB" />
                  <XAxis dataKey="category" />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid #E5E7EB",
                      fontSize: 12,
                      boxShadow: "0 8px 20px -12px rgb(15 23 42 / 0.25)",
                    }}
                    cursor={{ fill: "#EFF6FF" }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#1e9bd7" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
      </div>
    </div>
  );
}
