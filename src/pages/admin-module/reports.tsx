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
import { KPIGrid, KPICard, KPIIcons } from "../../hooks/KPICard";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Printer } from "lucide-react";
import { adminReportsApi } from "../../service/admin-root-api/report";

type GrowthPoint = {
  label: string;
  fullLabel: string;
  residents: number;
  officers: number;
  events: number;
};

type ArchivePoint = {
  category: string;
  value: number;
};

function normalizeArchiveSummary(input: unknown): ArchivePoint[] {
  const rows = Array.isArray(input) ? input : [];
  const totals = new Map<string, number>([
    ["Residents", 0],
    ["Users", 0],
    ["Officers", 0],
  ]);

  for (const row of rows as Array<Record<string, unknown>>) {
    const rawCategory = String(row.category ?? row.name ?? row.label ?? "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_");
    const value = Number(row.value ?? row.count ?? 0) || 0;

    if (rawCategory === "RESIDENT" || rawCategory === "RESIDENTS") {
      totals.set("Residents", (totals.get("Residents") ?? 0) + value);
      continue;
    }

    if (rawCategory === "USER" || rawCategory === "USERS") {
      totals.set("Users", (totals.get("Users") ?? 0) + value);
      continue;
    }

    if (rawCategory === "OFFICER" || rawCategory === "OFFICERS") {
      totals.set("Officers", (totals.get("Officers") ?? 0) + value);
    }
  }

  return Array.from(totals, ([category, value]) => ({ category, value }));
}

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
          <span className="text-emerald-600">Residents</span>
          <span className="font-semibold text-slate-900">
            {point.residents.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-violet-600">Officers</span>
          <span className="font-semibold text-slate-900">
            {point.officers.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-amber-600">Events</span>
          <span className="font-semibold text-slate-900">
            {point.events.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toStartAndEndDate(
  startISO: string,
  endISO: string,
): { start: Date; end: Date } {
  const start = new Date(`${startISO}T00:00:00`);
  const end = new Date(`${endISO}T23:59:59`);
  return { start, end };
}

function getRangeDays(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
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

export default function AdminReportsPage() {
  const today = new Date();
  const defaultStart = new Date();
  defaultStart.setDate(today.getDate() - 29);

  const [pendingStartDate, setPendingStartDate] = useState(
    toDateInputValue(defaultStart),
  );
  const [pendingEndDate, setPendingEndDate] = useState(toDateInputValue(today));
  const [startDate, setStartDate] = useState(toDateInputValue(defaultStart));
  const [endDate, setEndDate] = useState(toDateInputValue(today));
  const [dateError, setDateError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // States for hardcoded data
  const [stats, setStats] = useState<any>(null);
  const [growthData, setGrowthData] = useState<GrowthPoint[]>([]);
  const [eventsData, setEventsData] = useState<any[]>([]);
  const [archiveData, setArchiveData] = useState<any[]>([]);

  const appliedRange = useMemo(
    () => toStartAndEndDate(startDate, endDate),
    [startDate, endDate],
  );
  const appliedRangeDays = useMemo(
    () => getRangeDays(appliedRange.start, appliedRange.end),
    [appliedRange],
  );

  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadReports = async () => {
      setLoading(true);
      setApiError(null);

      try {
        const data = await adminReportsApi.getAdminSummary(
          appliedRange.start,
          appliedRange.end,
        );
        if (!isMounted) return;

        setStats({
          totalResidents: data.totalResidents,
          totalOfficers: data.totalOfficers,
          totalEvents: data.totalEvents,
          totalUsers: data.totalUsers,
        });

        setGrowthData(data.growthTrend);
        setEventsData(data.eventStatusDistribution);
        setArchiveData(normalizeArchiveSummary(data.archiveSummary));
      } catch (err: any) {
        if (!isMounted) return;
        setApiError(err.message || "Failed to load report data");
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadReports();
    return () => {
      isMounted = false;
    };
  }, [appliedRange.end, appliedRange.start]);

  const lowDomainMax = useMemo(() => {
    if (!growthData.length) return 100;
    const maxVal = Math.max(
      ...growthData.map((d) => Math.max(d.residents, d.officers, d.events)),
    );
    return Math.ceil(maxVal / 10) * 10 || 20; // Round up to nearest 10
  }, [growthData]);

  const eventsTotal = useMemo(
    () => eventsData.reduce((acc, curr) => acc + curr.value, 0),
    [eventsData],
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
    setPendingStartDate(toDateInputValue(resetStart));
    setPendingEndDate(toDateInputValue(resetEnd));
    setStartDate(toDateInputValue(resetStart));
    setEndDate(toDateInputValue(resetEnd));
  };

  const handlePrintReport = () => {
    const formatDateStr = (d: string) =>
      new Date(d).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

    const kpiCards = [
      {
        label: "Residents",
        value: stats?.totalResidents ?? 0,
        sub: "Registered residents",
      },
      {
        label: "Officers",
        value: stats?.totalOfficers ?? 0,
        sub: "Active officers",
      },
      {
        label: "Events",
        value: stats?.totalEvents ?? 0,
        sub: "Barangay events",
      },
      {
        label: "Users",
        value: stats?.totalUsers ?? 0,
        sub: "Registered users",
      },
    ];

    const trendRows = growthData
      .map(
        (m) => `
          <tr>
            <td style="padding:5px 8px;font-size:12px;color:#374151;">${m.fullLabel}</td>
            <td style="padding:5px 8px;font-size:12px;color:#374151;text-align:right;">${m.residents.toLocaleString()}</td>
            <td style="padding:5px 8px;font-size:12px;color:#374151;text-align:right;">${m.officers.toLocaleString()}</td>
            <td style="padding:5px 8px;font-size:12px;color:#374151;text-align:right;">${m.events.toLocaleString()}</td>
          </tr>`,
      )
      .join("");

    const eventsRows = eventsData
      .map(
        (m) => `
          <tr>
            <td style="padding:5px 8px;font-size:12px;color:#374151;">${m.name}</td>
            <td style="padding:5px 8px;font-size:12px;color:#374151;text-align:right;">${m.value.toLocaleString()}</td>
          </tr>`,
      )
      .join("");

    const kpiHtml = kpiCards
      .map(
        (k) => `
        <div style="border:1px solid #E5E7EB;border-radius:8px;padding:16px 20px;flex:1;min-width:130px;">
          <p style="margin:0;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:.05em;">${k.label}</p>
          <p style="margin:6px 0 2px;font-size:28px;font-weight:700;color:#111827;">${k.value.toLocaleString()}</p>
          <p style="margin:0;font-size:10px;color:#9CA3AF;">${k.sub}</p>
        </div>`,
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Admin Report — ${formatDateStr(appliedRange.start.toISOString())} to ${formatDateStr(appliedRange.end.toISOString())}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; padding: 32px 40px; background: #fff; }
    h1 { font-size: 20px; font-weight: 700; margin: 0 0 2px; }
    .sub { font-size: 12px; color: #6B7280; margin: 0 0 24px; }
    .section { margin-bottom: 28px; }
    .section-title { font-size: 14px; font-weight: 700; color: #1F2937; border-bottom: 2px solid #E5E7EB; padding-bottom: 6px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: .05em; padding: 4px 8px; border-bottom: 1px solid #E5E7EB; }
    td { border-bottom: 1px solid #F3F4F6; }
    .kpi-row { display: flex; gap: 12px; flex-wrap: wrap; }
    @page { margin: 1.2cm; size: A4; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
    <div>
      <h1>Admin Activity Report</h1>
      <p class="sub">Period: ${formatDateStr(appliedRange.start.toISOString())} &mdash; ${formatDateStr(appliedRange.end.toISOString())}</p>
    </div>
    <div style="text-align:right;">
      <p style="margin:0;font-size:11px;color:#6B7280;">Generated</p>
      <p style="margin:2px 0 0;font-size:12px;font-weight:600;color:#374151;">${new Date().toLocaleString("en-PH")}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Summary</div>
    <div class="kpi-row">${kpiHtml}</div>
  </div>

  <div class="section">
    <div class="section-title">Activity Trend</div>
    <table>
      <thead><tr><th>Date</th><th style="text-align:right;">Residents</th><th style="text-align:right;">Officers</th><th style="text-align:right;">Events</th></tr></thead>
      <tbody>${trendRows || '<tr><td colspan="4" style="padding:10px 8px;font-size:12px;color:#9CA3AF;">No data for selected period.</td></tr>'}</tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Events Distribution</div>
    <table>
      <thead><tr><th>Status</th><th style="text-align:right;">Count</th></tr></thead>
      <tbody>${eventsRows || '<tr><td colspan="2" style="padding:10px 8px;font-size:12px;color:#9CA3AF;">No data for selected period.</td></tr>'}</tbody>
    </table>
  </div>
</body>
</html>`;

    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;top:0;left:0;width:0;height:0;border:none;visibility:hidden;";
    document.body.appendChild(iframe);
    const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      return;
    }
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 300);
    };
  };

  return (
    <div className="min-h-screen bg-gray-50/60 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <KPIGrid columns={4}>
          <KPICard
            title="Residents"
            value={stats ? stats.totalResidents.toLocaleString() : "--"}
            subtitle="Registered residents"
            icon={KPIIcons.home}
            color="emerald"
          />
          <KPICard
            title="Barangay Officers"
            value={stats ? stats.totalOfficers.toLocaleString() : "--"}
            subtitle="Active officers"
            icon={KPIIcons.check}
            color="violet"
          />
          <KPICard
            title="Events"
            value={stats ? stats.totalEvents.toLocaleString() : "--"}
            subtitle="Barangay events"
            icon={KPIIcons.month}
            color="amber"
          />
          <KPICard
            title="System Users"
            value={stats ? stats.totalUsers.toLocaleString() : "--"}
            subtitle="Registered users"
            icon={KPIIcons.users}
            color="blue"
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
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                Max 1 Year
              </span>
              <button
                onClick={handlePrintReport}
                title="Print Report"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-full hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Report
              </button>
            </div>
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

          {dateError ? (
            <p className="text-xs text-red-500 px-1 mt-2">{dateError}</p>
          ) : null}

          {apiError ? (
            <p className="text-xs text-red-500 px-1 mt-2">{apiError}</p>
          ) : null}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Activity Trend ({appliedRangeDays <= 30 ? "Daily" : "Monthly"})
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Focused trend view for core operations (Residents, Officers,
                Events).
                <span className="ml-1 text-gray-400">
                  ({formatRangeDate(appliedRange.start)} –{" "}
                  {formatRangeDate(appliedRange.end)})
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                Residents
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-violet-600" />
                Officers
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Events
              </span>
            </div>
          </div>
          <div className="mt-4">
            {growthData.length ? (
              <div className="h-80 rounded-xl border border-gray-100 bg-gradient-to-b from-slate-50 to-white p-3">
                <div className="h-full">
                  <div className="h-[calc(100%-10px)] rounded-lg border border-slate-100 bg-white/70 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={growthData}
                        barCategoryGap="20%"
                        barGap={2}
                      >
                        <CartesianGrid
                          vertical={false}
                          strokeDasharray="4 4"
                          stroke="#E5E7EB"
                        />
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
                          domain={[0, lowDomainMax]}
                        />
                        <Tooltip content={<GrowthTooltip />} />
                        <Bar
                          dataKey="residents"
                          name="Residents"
                          fill="#059669"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={22}
                        />
                        <Bar
                          dataKey="officers"
                          name="Officers"
                          fill="#7C3AED"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={22}
                        />
                        <Bar
                          dataKey="events"
                          name="Events"
                          fill="#F59E0B"
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
                No activity trend data for selected date range.
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Events Status Distribution
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Breakdown of events by current status
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-3xl font-semibold text-gray-900 leading-none">
                  {eventsTotal}
                </p>
                <p className="text-sm text-gray-500 mt-1">Total Events</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={eventsData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={64}
                      outerRadius={96}
                      paddingAngle={2}
                      minAngle={8}
                      stroke="#FFFFFF"
                      strokeWidth={2}
                    >
                      {eventsData.map((item, index) => (
                        <Cell key={`cell-${index}`} fill={item.color} />
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
                {eventsData.map((item, index) => (
                  <div
                    key={`case-${index}`}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <p className="text-sm text-gray-700 leading-tight">
                        {item.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-900 font-medium">
                        {item.value}
                      </span>
                    </div>
                  </div>
                ))}
                {!eventsData.length ? (
                  <p className="text-sm text-gray-500">No event data.</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Archive Summary
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Archived records by category from selected date range.
            </p>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={archiveData}>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="#D1D5DB"
                  />
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
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Data Table Section */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm mt-6 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 bg-white">
            <h2 className="text-lg font-semibold text-gray-900">
              Tabular Data Summary
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Detailed breakdown of daily or monthly metric growth.
            </p>
          </div>
          <div className="overflow-auto max-h-[400px]">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-4 font-semibold tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 font-semibold tracking-wider text-right"
                  >
                    Residents
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 font-semibold tracking-wider text-right"
                  >
                    Officers
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 font-semibold tracking-wider text-right"
                  >
                    Events
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {growthData.map((row, i) => (
                  <tr
                    key={i}
                    className="bg-white hover:bg-blue-50/50 transition-colors"
                  >
                    <td className="px-6 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                      {row.fullLabel}
                    </td>
                    <td className="px-6 py-3.5 text-right font-medium text-emerald-600">
                      {row.residents.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-right font-medium text-violet-600">
                      {row.officers.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-right font-medium text-amber-600">
                      {row.events.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {!growthData.length && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-gray-400 bg-gray-50"
                    >
                      No data available for the selected range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
