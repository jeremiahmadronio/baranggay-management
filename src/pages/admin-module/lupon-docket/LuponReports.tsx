import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
} from "lucide-react";
import {
  getReportStats,
  getStatusStats,
  getTopNature,
  getCasesTrend,
  type ReportStatsDTO,
  type StatusStatDTO,
  type NatureReportDTO,
  type ChartDataDTO,
} from "../../../service/lupon-api/LuponReport";
import { KPICard, KPIGrid } from "../../../hooks/KPICard";
import { getStatusLabel } from "../../lupon-module/lib/StatusMapper";
import { CenteredLoader, NoRecords } from "../../../hooks/LoadingStates";

const NATURE_COLORS = [
  "#c98e46",
  "#2563EB",
  "#94A3B8",
  "#31397d",
  "#54b4d6",
  "#60A5FA",
];

const STATUS_DONUT_COLORS = [
  "#8b98b3",
  "#434e53",
  "#94A3B8",
  "#64748B",
  "#DC2626",
];

// Admin page: do not gate by user permissions here — admin should have access.

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function parseDateInputToLocal(dateInput: string): Date {
  const [y, m, d] = dateInput.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function formatTrendLabel(date: Date, withLeadingZeroDay = false): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: withLeadingZeroDay ? "2-digit" : "numeric",
  }).format(date);
}

function normalizeTrendLabel(label: string): string {
  return String(label || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/([a-z]{3}\s)0(\d\b)/i, "$1$2");
}

function buildDailyTrendData(
  startDateInput: string,
  endDateInput: string,
  source: ChartDataDTO[],
): ChartDataDTO[] {
  if (!startDateInput || !endDateInput) return source;

  const countsByLabel = new Map<string, number>();
  source.forEach((item) => {
    const key = normalizeTrendLabel(item.label);
    countsByLabel.set(key, (countsByLabel.get(key) ?? 0) + (item.count ?? 0));
  });

  const start = parseDateInputToLocal(startDateInput);
  const end = parseDateInputToLocal(endDateInput);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return source;
  }

  const result: ChartDataDTO[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    const displayLabel = formatTrendLabel(cursor, false);
    const noZeroKey = normalizeTrendLabel(displayLabel);
    const withZeroKey = normalizeTrendLabel(formatTrendLabel(cursor, true));
    const count =
      countsByLabel.get(noZeroKey) ?? countsByLabel.get(withZeroKey) ?? 0;

    result.push({
      label: displayLabel,
      count,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}

function getDefaultDates(): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 29);
  return { start: toDateInputValue(start), end: toDateInputValue(end) };
}

function getMaxEndDate(startDateInput: string): string {
  if (!startDateInput) return toDateInputValue(new Date());
  const max = new Date(startDateInput);
  max.setFullYear(max.getFullYear() + 1);
  const today = new Date();
  return toDateInputValue(max > today ? today : max);
}

function SectionCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: any;
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

function getStatusColor(raw: string, index: number): string {
  const key = String(raw || "")
    .toUpperCase()
    .replace(/\s+/g, "_");

  const map: Record<string, string> = {
    PENDING: "#c98e46",
    UNDER_MEDIATION: "#0EA5E9",
    UNDER_CONCILIATION: "#3B82F6",
    SETTLED: "#2563EB",
    UNSETTLED: "#64748B",
    ESCALATED: "#2563EB",
    CLOSED: "#94A3B8",
    WITHDRAWN: "#64748B",
    DISMISSED: "#DC2626",
    CERTIFIED_TO_FILE_ACTION: "#2563EB",
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
    UNDER_MEDIATION: "Mediation ongoing",
    UNDER_CONCILIATION: "Conciliation in progress",
    SETTLED: "Resolved through amicable settlement",
    UNSETTLED: "Not resolved during proceedings",
    ESCALATED: "Elevated for further legal action",
    CLOSED: "Case lifecycle completed",
    CERTIFIED_TO_FILE_ACTION: "Issued with Certificate to File Action",
  };
  return map[key] ?? "Case lifecycle status";
}

export function AdminLuponReportsPage() {
  const defaults = getDefaultDates();
  const [pendingStart, setPendingStart] = useState(defaults.start);
  const [pendingEnd, setPendingEnd] = useState(defaults.end);
  const [appliedStart, setAppliedStart] = useState(defaults.start);
  const [appliedEnd, setAppliedEnd] = useState(defaults.end);

  const [stats, setStats] = useState<ReportStatsDTO | null>(null);
  const [statusData, setStatusData] = useState<StatusStatDTO[]>([]);
  const [natureData, setNatureData] = useState<NatureReportDTO[]>([]);
  const [trendData, setTrendData] = useState<ChartDataDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateError, setDateError] = useState<string | null>(null);

  const toLocalDateTime = (date: string, endOfDay = false) =>
    date ? `${date}T${endOfDay ? "23:59:59" : "00:00:00"}` : "";

  const fetchDashboardData = async (start: string, end: string) => {
    setIsLoading(true);
    try {
      const statsStart = toLocalDateTime(start);
      const statsEnd = toLocalDateTime(end, true);
      const [statsRes, statusRes, natureRes, trendRes] = await Promise.all([
        getReportStats(statsStart, statsEnd),
        getStatusStats(statsStart, statsEnd),
        getTopNature(statsStart, statsEnd),
        getCasesTrend(statsStart, statsEnd),
      ]);
      setStats(statsRes);
      const mappedStatusData = statusRes.map((item) => ({
        ...item,
        status: getStatusLabel(item.status),
      }));
      setStatusData(mappedStatusData.filter((s) => s.count > 0));
      setNatureData(
        natureRes.filter((n) => Number.isInteger(n.count) && n.count >= 1),
      );
      setTrendData(trendRes);
    } catch (err) {
      console.error("Failed to fetch lupon reports:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Always fetch dashboard data for admin page when dates change.
  useEffect(() => {
    fetchDashboardData(appliedStart, appliedEnd);
  }, [appliedStart, appliedEnd]);

  // continue rendering — admin view always available

  const handleApplyGlobalFilter = () => {
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
  };

  const handleClearGlobalFilter = () => {
    const d = getDefaultDates();
    setDateError(null);
    setPendingStart(d.start);
    setPendingEnd(d.end);
    setAppliedStart(d.start);
    setAppliedEnd(d.end);
  };

  const handlePrintReport = () => {
    const fmtDate = (d: string) =>
      new Date(d).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    const totalNaturePrint = natureData.reduce((s, i) => s + i.count, 0);
    const totalStatusPrint = statusData.reduce((s, i) => s + i.count, 0);
    const kpiCards = [
      {
        label: "Settled",
        value: stats?.totalSettled ?? 0,
        sub: "Cases amicably resolved",
      },
      {
        label: "Closed",
        value: stats?.totalClosed ?? 0,
        sub: "Cases officially closed",
      },
      {
        label: "Escalated",
        value: stats?.escalate ?? 0,
        sub: "Cases elevated to court",
      },
      {
        label: "Certified to File Action",
        value: stats?.totalCFA ?? 0,
        sub: "Certificates to File Action",
      },
    ];
    const kpiHtml = kpiCards
      .map(
        (k) =>
          `<div style="border:1px solid #E5E7EB;border-radius:8px;padding:16px 20px;flex:1;min-width:130px;"><p style="margin:0;font-size:11px;color:#6B7280;text-transform:uppercase;">${k.label}</p><p style="margin:6px 0 2px;font-size:28px;font-weight:700;color:#111827;">${k.value.toLocaleString()}</p><p style="margin:0;font-size:10px;color:#9CA3AF;">${k.sub}</p></div>`,
      )
      .join("");
    const trendRows2 = chartTrendData
      .map(
        (m) =>
          `<tr><td style="padding:5px 8px;font-size:12px;">${m.label}</td><td style="padding:5px 8px;font-size:12px;text-align:right;">${m.count ?? 0}</td></tr>`,
      )
      .join("");
    const natureRows2 = [...natureData]
      .sort((a, b) => b.count - a.count)
      .map((item) => {
        const p =
          totalNaturePrint > 0
            ? ((item.count / totalNaturePrint) * 100).toFixed(1)
            : "0.0";
        const bw =
          totalNaturePrint > 0
            ? Math.max(4, (item.count / totalNaturePrint) * 100)
            : 4;
        return `<tr><td style="padding:6px 8px;font-size:12px;">${String(item.natureName || "").trim() || "Unspecified"}</td><td style="padding:6px 8px;font-size:12px;text-align:right;">${item.count} (${p}%)</td><td style="padding:6px 8px;width:40%;"><div style="background:#F3F4F6;border-radius:4px;height:8px;"><div style="background:#c98e46;height:100%;border-radius:4px;width:${bw}%;"></div></div></td></tr>`;
      })
      .join("");
    const statusRows2 = statusData
      .map((item) => {
        const p =
          totalStatusPrint > 0
            ? ((item.count / totalStatusPrint) * 100).toFixed(1)
            : "0.0";
        const name = item.status
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        return `<tr><td style="padding:5px 8px;font-size:12px;">${name}</td><td style="padding:5px 8px;font-size:12px;text-align:right;">${item.count}</td><td style="padding:5px 8px;font-size:12px;text-align:right;color:#6B7280;">${p}%</td></tr>`;
      })
      .join("");
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Lupon Report</title><style>*{box-sizing:border-box;}body{font-family:'Segoe UI',Arial,sans-serif;color:#111827;margin:0;padding:32px 40px;}h1{font-size:20px;font-weight:700;margin:0 0 2px;}.sub{font-size:12px;color:#6B7280;margin:0 0 24px;}.section{margin-bottom:28px;}.section-title{font-size:14px;font-weight:700;border-bottom:2px solid #E5E7EB;padding-bottom:6px;margin-bottom:12px;}table{width:100%;border-collapse:collapse;}th{text-align:left;font-size:11px;color:#6B7280;text-transform:uppercase;padding:4px 8px;border-bottom:1px solid #E5E7EB;}td{border-bottom:1px solid #F3F4F6;}.kpi-row{display:flex;gap:12px;flex-wrap:wrap;}@page{margin:1.2cm;size:A4;}@media print{body{padding:0;}}</style></head><body><div style="display:flex;justify-content:space-between;margin-bottom:20px;"><div><h1>Lupon Tagapamayapa Report</h1><p class="sub">Period: ${fmtDate(appliedStart)} &mdash; ${fmtDate(appliedEnd)}</p></div><div style="text-align:right;"><p style="margin:0;font-size:11px;color:#6B7280;">Generated</p><p style="margin:2px 0 0;font-size:12px;font-weight:600;">${new Date().toLocaleString("en-PH")}</p></div></div><div class="section"><div class="section-title">Summary</div><div class="kpi-row">${kpiHtml}</div></div><div class="section"><div class="section-title">Cases Trend</div><table><thead><tr><th>Period</th><th style="text-align:right;">Cases</th></tr></thead><tbody>${trendRows2 || '<tr><td colspan="2" style="padding:10px 8px;font-size:12px;color:#9CA3AF;">No data.</td></tr>'}</tbody></table></div><div class="section"><div class="section-title">Cases by Nature &mdash; ${totalNaturePrint} total</div><table><thead><tr><th>Nature</th><th>Count</th><th>Distribution</th></tr></thead><tbody>${natureRows2 || '<tr><td colspan="3" style="padding:10px 8px;font-size:12px;color:#9CA3AF;">No data.</td></tr>'}</tbody></table></div><div class="section"><div class="section-title">Cases by Status &mdash; ${totalStatusPrint} total</div><table><thead><tr><th>Status</th><th style="text-align:right;">Count</th><th style="text-align:right;">Share</th></tr></thead><tbody>${statusRows2 || '<tr><td colspan="3" style="padding:10px 8px;font-size:12px;color:#9CA3AF;">No data.</td></tr>'}</tbody></table></div></body></html>`;
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

  if (isLoading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <CenteredLoader minHeight="min-h-screen" />
      </div>
    );
  }

  const totalStatusCases = statusData.reduce(
    (sum, item) => sum + item.count,
    0,
  );
  const totalNatureCases = natureData.reduce(
    (sum, item) => sum + item.count,
    0,
  );
  const sortedNature = [...natureData].sort((a, b) => b.count - a.count);
  const dailyTrendData = buildDailyTrendData(
    appliedStart,
    appliedEnd,
    trendData,
  );
  const selectedDays =
    Math.floor(
      (new Date(appliedEnd).getTime() - new Date(appliedStart).getTime()) /
        (1000 * 60 * 60 * 24),
    ) + 1;
  const isWithinThirtyDays = selectedDays <= 30;
  const chartTrendData = isWithinThirtyDays ? dailyTrendData : trendData;
  const trendBarSize = selectedDays > 20 ? 14 : selectedDays > 12 ? 20 : 28;

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
                Default range is last 30 days. Maximum selectable range is 1
                year.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                Range: {appliedStart} to {appliedEnd}
              </span>
              <button
                onClick={handlePrintReport}
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
              onClick={handleApplyGlobalFilter}
              className="px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Apply Filter
            </button>

            <button
              onClick={handleClearGlobalFilter}
              className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Reset Range
            </button>
          </div>

          {dateError ? (
            <p className="text-xs text-red-500 px-1 mt-2">{dateError}</p>
          ) : null}
        </div>

        <KPIGrid columns={4}>
          <KPICard
            title="Settled"
            value={(stats?.totalSettled ?? 0).toLocaleString()}
            icon={<CheckCircle2 className="w-6 h-6" />}
            color="emerald"
            subtitle="Cases amicably resolved"
          />
          <KPICard
            title="Closed"
            value={(stats?.totalClosed ?? 0).toLocaleString()}
            icon={<XCircle className="w-6 h-6" />}
            color="slate"
            subtitle="Cases officially closed"
          />
          <KPICard
            title="Escalated"
            value={(stats?.escalate ?? 0).toLocaleString()}
            icon={<AlertTriangle className="w-6 h-6" />}
            color="amber"
            subtitle="Cases elevated to court"
          />
          <KPICard
            title="Certified to File Action"
            value={(stats?.totalCFA ?? 0).toLocaleString()}
            icon={<FileText className="w-6 h-6" />}
            color="blue"
            subtitle="Certificates to File Action"
          />
        </KPIGrid>

        <SectionCard
          title="Monthly Cases Filed"
          subtitle="Distribution of filed cases by month"
          className="rounded-xl border-gray-300"
        >
          {trendData.length === 0 ? (
            <NoRecords text="No monthly case filed for the selected period." />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartTrendData}
                  margin={{
                    top: 8,
                    right: 10,
                    bottom: 20,
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
                    tick={{ fontSize: 11, fill: "#4B5563" }}
                    axisLine={{ stroke: "#9CA3AF", strokeWidth: 1.2 }}
                    tickLine={false}
                    angle={0}
                    textAnchor="middle"
                    height={40}
                    interval={0}
                    minTickGap={8}
                    tickFormatter={(value, index) =>
                      isWithinThirtyDays ? String(index + 1) : String(value)
                    }
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
                  <Bar
                    dataKey="count"
                    radius={[6, 6, 0, 0]}
                    barSize={isWithinThirtyDays ? trendBarSize : 44}
                  >
                    {chartTrendData.map((_, i) => (
                      <Cell key={i} fill="#3B82F6" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

            {sortedNature.length === 0 ? (
              <NoRecords text="No case nature data for the selected period." />
            ) : (
              <div className="max-h-[340px] overflow-y-auto pr-1 space-y-3">
                {sortedNature.map((item, index) => {
                  const pct =
                    totalNatureCases > 0
                      ? (item.count / totalNatureCases) * 100
                      : 0;
                  const natureLabel =
                    String(item.natureName || "").trim() ||
                    "Unspecified Nature";

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
                            backgroundColor:
                              NATURE_COLORS[index % NATURE_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
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

            {statusData.length === 0 ? (
              <NoRecords text="No case status distribution for selected period." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="count"
                        nameKey="status"
                        innerRadius={58}
                        outerRadius={90}
                        paddingAngle={1.5}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      >
                        {statusData.map((item, index) => (
                          <Cell
                            key={`status-${index}`}
                            fill={getStatusColor(item.status, index)}
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
                  {statusData.map((item, index) => (
                    <div
                      key={`${item.status}-${index}`}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full mt-1.5"
                          style={{
                            backgroundColor: getStatusColor(item.status, index),
                          }}
                        />
                        <div>
                          <p className="text-sm text-gray-700 leading-tight">
                            {formatStatusName(item.status)}
                          </p>
                          <p className="text-xs text-gray-500 leading-tight mt-0.5">
                            {getStatusDescription(item.status)}
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
        </div>
      </div>
    </div>
  );
}
