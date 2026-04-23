import { useCallback, useEffect, useMemo, useState } from "react";
import {
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
  CheckCircle2,
  FileText,
  TimerOff,
  Timer,
  Search,
  Printer,
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
import {
  getMyAccess,
  hasVawcPermission,
  VAWC_PERMISSIONS,
  type UserAccessPermission,
} from "../../service/vawc-api/vawc-api";
import {
  CenteredLoader,
  CircleLoader,
  NoRecords,
} from "../../hooks/LoadingStates";
import { KPICard, KPIGrid, KPIIcons } from "../../hooks/KPICard";
import { PermissionDeniedPage } from "../blotter-module/reusable/PermissionDeniedPage";

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

type TrendGranularity = "day" | "month" | "year";

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultDates(): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 30);
  return { start: toDateInputValue(start), end: toDateInputValue(end) };
}

function getMaxEndDate(startDateInput: string): string {
  if (!startDateInput) return toDateInputValue(new Date());
  return toDateInputValue(new Date());
}

function normalizeMonthName(value: string): string {
  return value.slice(0, 3).toLowerCase();
}

function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function toYearKey(date: Date): string {
  return String(date.getFullYear());
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString("en-CA");
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatYearLabel(date: Date): string {
  return String(date.getFullYear());
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatTrendAxisLabel(value: string, granularity: TrendGranularity): string {
  const parsedDate = parseTrendPointDate(value);

  if (!parsedDate) return value;

  if (granularity === "day") {
    return parsedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (granularity === "month") {
    return parsedDate.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
  }

  return parsedDate.toLocaleDateString("en-US", {
    year: "numeric",
  });
}

function formatTrendTooltipLabel(value: string, granularity: TrendGranularity): string {
  const parsedDate = parseTrendPointDate(value);

  if (!parsedDate) return value;

  if (granularity === "day") {
    return parsedDate.toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  if (granularity === "month") {
    return parsedDate.toLocaleDateString("en-PH", {
      month: "long",
      year: "numeric",
    });
  }

  return parsedDate.toLocaleDateString("en-PH", {
    year: "numeric",
  });
}

function getTrendTickInterval(length: number, granularity: TrendGranularity): number {
  if (length <= 1) return 0;

  if (granularity === "day") {
    return 0;
  }

  if (granularity === "month") {
    return 0;
  }

  return 0;
}

function getDailyTickFontSize(length: number): number {
  if (length > 24) return 8;
  if (length > 18) return 9;
  return 11;
}

function getDailyTickAngle(length: number): number {
  if (length > 24) return -48;
  if (length > 16) return -38;
  return -28;
}

function getBarCategoryGap(length: number, granularity: TrendGranularity): string {
  if (granularity === "month") {
    if (length <= 12) return "18%";
    if (length <= 24) return "22%";
    return "28%";
  }

  if (granularity !== "day") return "28%";
  if (length > 24) return "8%";
  if (length > 16) return "12%";
  return "18%";
}

function getMaxBarSize(length: number, granularity: TrendGranularity): number {
  if (granularity === "month") {
    if (length <= 12) return 44;
    if (length <= 24) return 32;
    return 24;
  }

  if (granularity !== "day") return 48;
  if (length > 24) return 18;
  if (length > 16) return 24;
  return 28;
}

function getTrendYAxisMax(data: TrendStatsDTO[]): number {
  const highest = data.reduce((max, item) => Math.max(max, item.count || 0), 0);

  if (highest <= 0) return 1;
  if (highest <= 5) return highest + 1;

  return Math.ceil(highest * 1.15);
}

function resolveTrendPointDateInRange(
  label: string,
  start: Date,
  end: Date,
): Date | null {
  const trimmed = label.trim();
  const directDate = new Date(trimmed);

  if (!Number.isNaN(directDate.getTime())) {
    return directDate;
  }

  const monthDayYearMatch = trimmed.match(/^([A-Za-z]{3,9})\s+(\d{1,2})(?:,\s*(\d{4}))?$/);
  if (monthDayYearMatch) {
    const month = MONTH_INDEX[normalizeMonthName(monthDayYearMatch[1])];
    if (month === undefined) return null;

    if (monthDayYearMatch[3]) {
      return new Date(Number(monthDayYearMatch[3]), month, Number(monthDayYearMatch[2]));
    }

    const day = Number(monthDayYearMatch[2]);
    const candidates: Date[] = [];
    for (let year = start.getFullYear(); year <= end.getFullYear(); year += 1) {
      const candidate = new Date(year, month, day);
      if (candidate >= start && candidate <= end) {
        candidates.push(candidate);
      }
    }

    if (candidates.length > 0) {
      return candidates[candidates.length - 1];
    }
  }

  const monthOnlyMatch = trimmed.match(/^([A-Za-z]{3,9})(?:\s+(\d{4}))?$/);
  if (monthOnlyMatch) {
    const month = MONTH_INDEX[normalizeMonthName(monthOnlyMatch[1])];
    if (month === undefined) return null;

    if (monthOnlyMatch[2]) {
      return new Date(Number(monthOnlyMatch[2]), month, 1);
    }

    const candidates: Date[] = [];
    for (let year = start.getFullYear(); year <= end.getFullYear(); year += 1) {
      const candidate = new Date(year, month, 1);
      if (candidate >= getMonthStart(start) && candidate <= getMonthStart(end)) {
        candidates.push(candidate);
      }
    }

    if (candidates.length > 0) {
      return candidates[candidates.length - 1];
    }
  }

  return parseTrendPointDate(label, end.getFullYear());
}

function parseTrendPointDate(label: string, fallbackYear?: number): Date | null {
  const directDate = new Date(label);
  if (!Number.isNaN(directDate.getTime())) {
    return directDate;
  }

  const trimmed = label.trim();
  const monthDayYearMatch = trimmed.match(/^([A-Za-z]{3,9})\s+(\d{1,2})(?:,\s*(\d{4}))?$/);
  if (monthDayYearMatch) {
    const month = MONTH_INDEX[normalizeMonthName(monthDayYearMatch[1])];
    if (month !== undefined) {
      const year = monthDayYearMatch[3] ? Number(monthDayYearMatch[3]) : (fallbackYear ?? new Date().getFullYear());
      return new Date(year, month, Number(monthDayYearMatch[2]));
    }
  }

  const monthOnlyMatch = trimmed.match(/^([A-Za-z]{3,9})(?:\s+(\d{4}))?$/);
  if (monthOnlyMatch) {
    const month = MONTH_INDEX[normalizeMonthName(monthOnlyMatch[1])];
    if (month !== undefined) {
      const year = monthOnlyMatch[2] ? Number(monthOnlyMatch[2]) : (fallbackYear ?? new Date().getFullYear());
      return new Date(year, month, 1);
    }
  }

  const numericYear = Number(trimmed);
  if (!Number.isNaN(numericYear) && trimmed.length === 4) {
    return new Date(numericYear, 0, 1);
  }

  return null;
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

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

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
    <div className={`bg-white rounded-lg border border-gray-200 p-5 ${className}`}>
      <div className="mb-5">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        {subtitle ? <p className="text-sm text-gray-500 mt-1">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
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
  const [accessLoading, setAccessLoading] = useState(true);
  const [userAccess, setUserAccess] = useState<UserAccessPermission | null>(null);

  const canManageReports = hasVawcPermission(userAccess, VAWC_PERMISSIONS.MANAGE_REPORTS);

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
    const loadAccess = async () => {
      try {
        setAccessLoading(true);
        const access = await getMyAccess();
        setUserAccess(access);
      } catch (err) {
        console.error("Failed to load VAWC access:", err);
        setUserAccess(null);
      } finally {
        setAccessLoading(false);
      }
    };

    void loadAccess();
  }, []);

  useEffect(() => {
    if (!accessLoading && canManageReports) {
      fetchAll(appliedStart, appliedEnd);
    }
  }, [appliedStart, appliedEnd, fetchAll, accessLoading, canManageReports]);

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

  const handlePrintReport = () => {
    const fmtDate = (d: string) =>
      new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

    const safe2 = stats || { totalCases: 0, totalExpired: 0, resolvedCases: 0, avgResolutionTime: 0 };
    const effPct2 = safe2.totalCases > 0 ? (safe2.resolvedCases / safe2.totalCases) * 100 : 0;
    const totalNature2 = nature.reduce((s, i) => s + i.count, 0);
    const statusTotal2 = statusRows.reduce((s, r) => s + r.count, 0);

    const kpiCards = [
      { label: "Total Cases", value: safe2.totalCases, sub: "Filed within period" },
      { label: "Resolved Cases", value: safe2.resolvedCases, sub: `${effPct2.toFixed(0)}% resolution rate` },
      { label: "Expired", value: safe2.totalExpired, sub: "Unactioned within deadline" },
      { label: "Avg Resolution", value: formatDuration(safe2.avgResolutionTime), sub: "Average time to resolve" },
    ];
    const kpiHtml = kpiCards.map((k) => `
      <div style="border:1px solid #E5E7EB;border-radius:8px;padding:16px 20px;flex:1;min-width:130px;">
        <p style="margin:0;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:.05em;">${k.label}</p>
        <p style="margin:6px 0 2px;font-size:28px;font-weight:700;color:#111827;">${String(k.value)}</p>
        <p style="margin:0;font-size:10px;color:#9CA3AF;">${k.sub}</p>
      </div>`).join("");

    const trendRows2 = trendMeta.data.map((m) =>
      `<tr><td style="padding:5px 8px;font-size:12px;color:#374151;">${m.label}</td><td style="padding:5px 8px;font-size:12px;color:#374151;text-align:right;">${m.count ?? 0}</td></tr>`
    ).join("");

    const natureRows2 = [...nature].sort((a, b) => b.count - a.count).map((item) => {
      const p = totalNature2 > 0 ? ((item.count / totalNature2) * 100).toFixed(1) : "0.0";
      const bw = totalNature2 > 0 ? Math.max(4, (item.count / totalNature2) * 100) : 4;
      const lbl = String(item.natureName || "").trim() || "Unspecified";
      return `<tr><td style="padding:6px 8px;font-size:12px;color:#374151;">${lbl}</td><td style="padding:6px 8px;font-size:12px;text-align:right;">${item.count} (${p}%)</td><td style="padding:6px 8px;width:40%;">
        <div style="background:#F3F4F6;border-radius:4px;height:8px;"><div style="background:#6366F1;height:100%;border-radius:4px;width:${bw}%;"></div></div></td></tr>`;
    }).join("");

    const statusHtmlRows2 = statusRows.map((r) => {
      const p = statusTotal2 > 0 ? ((r.count / statusTotal2) * 100).toFixed(1) : "0.0";
      return `<tr><td style="padding:5px 8px;font-size:12px;color:#374151;">${r.label}</td><td style="padding:5px 8px;font-size:12px;text-align:right;">${r.count}</td><td style="padding:5px 8px;font-size:12px;text-align:right;color:#6B7280;">${p}%</td></tr>`;
    }).join("");

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
      <title>VAWC Report — ${fmtDate(appliedStart)} to ${fmtDate(appliedEnd)}</title>
      <style>*{box-sizing:border-box;}body{font-family:'Segoe UI',Arial,sans-serif;color:#111827;margin:0;padding:32px 40px;background:#fff;}
        h1{font-size:20px;font-weight:700;margin:0 0 2px;}.sub{font-size:12px;color:#6B7280;margin:0 0 24px;}
        .section{margin-bottom:28px;}.section-title{font-size:14px;font-weight:700;color:#1F2937;border-bottom:2px solid #E5E7EB;padding-bottom:6px;margin-bottom:12px;}
        table{width:100%;border-collapse:collapse;}th{text-align:left;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:.05em;padding:4px 8px;border-bottom:1px solid #E5E7EB;}
        td{border-bottom:1px solid #F3F4F6;}.kpi-row{display:flex;gap:12px;flex-wrap:wrap;}
        @page{margin:1.2cm;size:A4;}@media print{body{padding:0;}}</style></head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
        <div><h1>VAWC Report</h1><p class="sub">Period: ${fmtDate(appliedStart)} &mdash; ${fmtDate(appliedEnd)}</p></div>
        <div style="text-align:right;"><p style="margin:0;font-size:11px;color:#6B7280;">Generated</p><p style="margin:2px 0 0;font-size:12px;font-weight:600;color:#374151;">${new Date().toLocaleString("en-PH")}</p></div>
      </div>
      <div class="section"><div class="section-title">Summary</div><div class="kpi-row">${kpiHtml}</div></div>
      <div class="section"><div class="section-title">${trendMeta.label}</div>
        <table><thead><tr><th>Period</th><th style="text-align:right;">Cases</th></tr></thead><tbody>${trendRows2 || '<tr><td colspan="2" style="padding:10px 8px;font-size:12px;color:#9CA3AF;">No data.</td></tr>'}</tbody></table></div>
      <div class="section"><div class="section-title">Cases by Nature &mdash; ${totalNature2} total</div>
        <table><thead><tr><th>Nature</th><th>Count</th><th>Distribution</th></tr></thead><tbody>${natureRows2 || '<tr><td colspan="3" style="padding:10px 8px;font-size:12px;color:#9CA3AF;">No data.</td></tr>'}</tbody></table></div>
      <div class="section"><div class="section-title">Case Status &mdash; ${statusTotal2} total</div>
        <table><thead><tr><th>Status</th><th style="text-align:right;">Count</th><th style="text-align:right;">Share</th></tr></thead><tbody>${statusHtmlRows2 || '<tr><td colspan="3" style="padding:10px 8px;font-size:12px;color:#9CA3AF;">No data.</td></tr>'}</tbody></table></div>
    </body></html>`;

    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;border:none;visibility:hidden;";
    document.body.appendChild(iframe);
    const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!iframeDoc) { document.body.removeChild(iframe); return; }
    iframeDoc.open(); iframeDoc.write(html); iframeDoc.close();
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 300);
    };
  };

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

  const trendMeta = useMemo(() => {
    const start = new Date(appliedStart);
    const end = new Date(appliedEnd);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return {
        label: "Case Trend",
        subtitle: "Filed VAWC cases over the selected period",
        granularity: "day" as TrendGranularity,
        data: [] as TrendStatsDTO[],
      };
    }

    const diffDays = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;

    if (diffDays <= 30) {
      const dayBuckets: Array<{ key: string; label: string }> = [];
      const cursor = new Date(start);

      while (cursor <= end) {
        dayBuckets.push({
          key: formatDayLabel(cursor),
          label: formatDayLabel(cursor),
        });
        cursor.setDate(cursor.getDate() + 1);
      }

      const counts = new Map<string, number>();
      trend.forEach((point) => {
        const parsedDate = resolveTrendPointDateInRange(point.label, start, end);
        if (!parsedDate) return;
        const key = formatDayLabel(parsedDate);
        counts.set(key, (counts.get(key) || 0) + (point.count || 0));
      });

      return {
        label: "Daily Case Trend",
        subtitle: "Filed VAWC cases shown day by day for the selected range",
        granularity: "day" as TrendGranularity,
        data: dayBuckets.map((bucket) => ({
          label: bucket.label,
          count: counts.get(bucket.key) || 0,
        })),
      };
    }

    if (diffDays <= 366) {
      const monthBuckets: Array<{ key: string; label: string }> = [];
      const cursor = getMonthStart(start);
      const endMonth = getMonthStart(end);

      while (cursor <= endMonth) {
        monthBuckets.push({
          key: toMonthKey(cursor),
          label: formatMonthLabel(cursor),
        });
        cursor.setMonth(cursor.getMonth() + 1);
      }

      const counts = new Map<string, number>();
      trend.forEach((point) => {
        const parsedDate = resolveTrendPointDateInRange(point.label, start, end);
        if (!parsedDate) return;
        const key = toMonthKey(getMonthStart(parsedDate));
        counts.set(key, (counts.get(key) || 0) + (point.count || 0));
      });

      return {
        label: "Monthly Case Trend",
        subtitle: "Filed VAWC cases grouped by the selected months, including months with zero cases",
        granularity: "month" as TrendGranularity,
        data: monthBuckets.map((bucket) => ({
          label: bucket.label,
          count: counts.get(bucket.key) || 0,
        })),
      };
    }

    const yearBuckets: Array<{ key: string; label: string }> = [];
    for (let year = start.getFullYear(); year <= end.getFullYear(); year += 1) {
      const current = new Date(year, 0, 1);
      yearBuckets.push({ key: toYearKey(current), label: formatYearLabel(current) });
    }

    const counts = new Map<string, number>();
    trend.forEach((point) => {
      const parsedDate = resolveTrendPointDateInRange(point.label, start, end);
      if (!parsedDate) return;
      const key = toYearKey(parsedDate);
      counts.set(key, (counts.get(key) || 0) + (point.count || 0));
    });

    return {
      label: "Yearly Case Trend",
      subtitle: "Filed VAWC cases grouped by year for the selected range",
      granularity: "year" as TrendGranularity,
      data: yearBuckets.map((bucket) => ({
        label: bucket.label,
        count: counts.get(bucket.key) || 0,
      })),
    };
  }, [appliedEnd, appliedStart, trend]);

  const hasAnyReportData =
    stats !== null ||
    trend.length > 0 ||
    nature.length > 0 ||
    category.length > 0;

  if (accessLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
          <CenteredLoader minHeight="min-h-[250px]" />
        </div>
      </div>
    );
  }

  if (!canManageReports) {
    return (
      <PermissionDeniedPage
        message="You do not have permission to access VAWC reports."
        hint="Ask your administrator to grant the Manage Reports permission."
        actionLabel="Go to Dashboard"
        onAction={() => window.location.assign('/vawc/dashboard')}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
          <KPIGrid columns={4}>
            {Array.from({ length: 4 }).map((_, index) => (
              <KPICard
                key={index}
                title="Loading"
                value={<CircleLoader size="sm" />}
                color="slate"
                icon={KPIIcons.document}
              />
            ))}
          </KPIGrid>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Case Trend">
              <CenteredLoader minHeight="min-h-[250px]" />
            </SectionCard>
            <SectionCard title="Case Status">
              <CenteredLoader minHeight="min-h-[250px]" />
            </SectionCard>
          </div>
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
  const expiredPct = safe.totalCases > 0 ? (safe.totalExpired / safe.totalCases) * 100 : 0;
  const sortedNature = [...nature].sort((a, b) => b.count - a.count);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {error && hasAnyReportData && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Date Range Filter
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Default range is last 30 days. Trend switches automatically to daily, monthly, or yearly view based on the selected range.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                Range: {formatAppliedRange(appliedStart, appliedEnd)}
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
                    const value = e.target.value;
                    setPendingStart(value);
                    setDateError(null);
                    if (pendingEnd) {
                      const max = getMaxEndDate(value);
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
              onClick={handleReset}
              className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Reset Range
            </button>
          </div>

          {dateError ? (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-2 px-1">
              <CircleAlert className="w-3.5 h-3.5" />
              {dateError}
            </p>
          ) : null}
        </div>

        <KPIGrid columns={4}>
          <KPICard
            title="Total Cases"
            value={safe.totalCases.toLocaleString()}
            icon={<FileText className="w-6 h-6" />}
            color="blue"
            subtitle="All VAWC cases in the report period"
          />
          <KPICard
            title="Resolved Cases"
            value={safe.resolvedCases.toLocaleString()}
            icon={<CheckCircle2 className="w-6 h-6" />}
            color="emerald"
            subtitle={`${formatPercent(effPct)} overall resolution rate`}
          />
          <KPICard
            title="Expired Cases"
            value={safe.totalExpired.toLocaleString()}
            icon={<TimerOff className="w-6 h-6" />}
            color="rose"
            subtitle={`${formatPercent(expiredPct)} of total filed cases`}
          />
          <KPICard
            title="Average Resolution"
            value={formatDuration(safe.avgResolutionTime)}
            icon={<Timer className="w-6 h-6" />}
            color="violet"
            subtitle="Average resolution time from report API"
          />
        </KPIGrid>

        <SectionCard
          title={trendMeta.label}
          subtitle={trendMeta.subtitle}
        >
          {trendMeta.data.length === 0 ? (
            <NoRecords text="No trend data for the selected period." />
          ) : (
            <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-3">
              <div className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trendMeta.data}
                  margin={{ top: 12, right: 12, bottom: 32, left: 0 }}
                  barCategoryGap={getBarCategoryGap(
                    trendMeta.data.length,
                    trendMeta.granularity,
                  )}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#CBD5E1"
                  />
                  <XAxis
                    dataKey="label"
                    tickFormatter={(value) =>
                      formatTrendAxisLabel(String(value), trendMeta.granularity)
                    }
                    interval={getTrendTickInterval(
                      trendMeta.data.length,
                      trendMeta.granularity,
                    )}
                    minTickGap={trendMeta.granularity === "day" ? 8 : 14}
                    tickMargin={trendMeta.granularity === "day" ? 12 : 10}
                    height={trendMeta.granularity === "day" ? 102 : 52}
                    angle={
                      trendMeta.granularity === "day"
                        ? getDailyTickAngle(trendMeta.data.length)
                        : 0
                    }
                    textAnchor={trendMeta.granularity === "day" ? "end" : "middle"}
                    tick={{
                      fontSize:
                        trendMeta.granularity === "day"
                          ? getDailyTickFontSize(trendMeta.data.length)
                          : 11,
                      fill: "#475569",
                    }}
                    axisLine={{ stroke: "#94A3B8", strokeWidth: 1.1 }}
                    tickLine={false}
                    padding={{ left: 12, right: 12 }}
                  />
                  <YAxis
                    width={34}
                    tick={{ fontSize: 12, fill: "#475569" }}
                    axisLine={{ stroke: "#94A3B8", strokeWidth: 1.1 }}
                    tickLine={false}
                    allowDecimals={false}
                    domain={[0, getTrendYAxisMax(trendMeta.data)]}
                  />
                  <Tooltip
                    labelFormatter={(value) =>
                      formatTrendTooltipLabel(
                        String(value),
                        trendMeta.granularity,
                      )
                    }
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid #E5E7EB",
                      fontSize: 12,
                      boxShadow: "0 10px 24px -14px rgb(15 23 42 / 0.3)",
                      backgroundColor: "#FFFFFF",
                    }}
                    formatter={(v: number | undefined) => [v ?? 0, "Cases"]}
                  />
                  <Bar
                    dataKey="count"
                    radius={[6, 6, 0, 0]}
                    background={{ fill: "#DBEAFE", opacity: 0.45 }}
                    maxBarSize={getMaxBarSize(
                      trendMeta.data.length,
                      trendMeta.granularity,
                    )}
                  >
                    {trendMeta.data.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.count > 0 ? "#3B82F6" : "#93C5FD"}
                      />
                    ))}
                  </Bar>
                </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </SectionCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard
            title="Cases by Nature"
            subtitle="Most common complaint categories in the report"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold text-gray-900 leading-none">
                  {totalNature.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Total categorized cases
                </p>
              </div>
            </div>
            {sortedNature.length === 0 ? (
              <NoRecords text="No nature data for the selected period." />
            ) : (
              <div className="max-h-[340px] space-y-3 overflow-y-auto pr-1">
                {sortedNature.map((item, index) => {
                  const pct =
                    totalNature > 0 ? (item.count / totalNature) * 100 : 0;
                  const natureLabel =
                    String(item.nature || "").trim() || "Unspecified Nature";

                  return (
                    <div key={`${natureLabel}-${index}`} className="space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm text-gray-700">
                          {natureLabel}
                        </p>
                        <span className="shrink-0 text-sm text-gray-800 tabular-nums">
                          {item.count.toLocaleString()} ({pct.toFixed(1)}%)
                        </span>
                      </div>

                      <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
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
          </SectionCard>

          <SectionCard
            title="Case Status"
            subtitle="Derived from the category summary response"
          >
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
                        paddingAngle={3}
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
                          border: "1px solid #E5E7EB",
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
                <div className="w-full grid grid-cols-3 gap-3 pt-2">
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
          </SectionCard>
        </div>

        <SectionCard
          title="Category Summary"
          subtitle="Breakdown by complaint category with status distribution"
          className="p-0 overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 border-b border-slate-200">
            <div>
              <p className="text-sm text-slate-500">
                {filteredCategory.length.toLocaleString()} record{filteredCategory.length === 1 ? "" : "s"} in the current view
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
        </SectionCard>
      </div>
    </div>
  );
}
