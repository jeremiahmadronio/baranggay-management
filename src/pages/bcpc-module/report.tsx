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
  Timer,
  Printer,
  ArchiveX,
  ShieldOff
} from "lucide-react";
import * as api from "../../service/bcpc-api/Reports";
import {
  CenteredLoader,
  CircleLoader,
  NoRecords,
} from "../../hooks/LoadingStates";
import { KPICard, KPIGrid, KPIIcons } from "../../hooks/KPICard";
import {
  BCPC_PERMISSIONS,
  getMyAccess,
  hasBcpcPermission,
} from "../../service/bcpc-api/BcpcPermission";
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
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
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
  const start = new Date(end.getFullYear(), 0, 1); // Jan 1st of current year
  return { start: toDateInputValue(start), end: toDateInputValue(end) };
}

function getMaxEndDate(): string {
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

function resolveTrendPointDateInRange(label: string, start: Date, end: Date): Date | null {
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
    if (candidates.length > 0) return candidates[candidates.length - 1];
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
    if (candidates.length > 0) return candidates[candidates.length - 1];
  }
  return parseTrendPointDate(label, end.getFullYear());
}

function formatTrendAxisLabel(value: string, granularity: TrendGranularity): string {
  const parsedDate = parseTrendPointDate(value);
  if (!parsedDate) return value;
  if (granularity === "day") return parsedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (granularity === "month") return parsedDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  return parsedDate.toLocaleDateString("en-US", { year: "numeric" });
}

function formatTrendTooltipLabel(value: string, granularity: TrendGranularity): string {
  const parsedDate = parseTrendPointDate(value);
  if (!parsedDate) return value;
  if (granularity === "day") return parsedDate.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
  if (granularity === "month") return parsedDate.toLocaleDateString("en-PH", { month: "long", year: "numeric" });
  return parsedDate.toLocaleDateString("en-PH", { year: "numeric" });
}

function getTrendYAxisMax(data: api.ChartDataDTO[]): number {
  const highest = data.reduce((max, item) => Math.max(max, item.count || 0), 0);
  if (highest <= 0) return 1;
  if (highest <= 5) return highest + 1;
  return Math.ceil(highest * 1.15);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatStatusDisplay(status?: string): string {
  if (!status) return "Unknown";
  return status.toLowerCase().split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function SectionCard({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: React.ReactNode; className?: string; }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-5 ${className}`}>
      <div className="mb-5">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export default function BcpcReportsPage() {
  const defaults = getDefaultDates();
  const [pendingStart, setPendingStart] = useState(defaults.start);
  const [pendingEnd, setPendingEnd] = useState(defaults.end);
  const [appliedStart, setAppliedStart] = useState(defaults.start);
  const [appliedEnd, setAppliedEnd] = useState(defaults.end);

  const [stats, setStats] = useState<api.BcpcReportStatsDTO | null>(null);
  const [trend, setTrend] = useState<api.ChartDataDTO[]>([]);
  const [nature, setNature] = useState<api.NatureStatDTO[]>([]);
  const [statusData, setStatusData] = useState<api.StatusStatDTO[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  // ── Permissions ────────────────────────────────────────────────────────
  const [canReport, setCanReport] = useState<boolean | null>(null);

  useEffect(() => {
    getMyAccess()
      .then((access) => setCanReport(hasBcpcPermission(access, BCPC_PERMISSIONS.MANAGE_REPORTS)))
      .catch(() => setCanReport(false));
  }, []);

  const fetchAll = useCallback(async (start: string, end: string) => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, trendRes, natureRes, statusRes] = await Promise.allSettled([
        api.getStats(start, end),
        api.getCasesTrend(start, end),
        api.getNatureStats(start, end),
        api.getStatusStats(start, end),
      ]);

      setStats(statsRes.status === "fulfilled" ? statsRes.value : null);
      setTrend(trendRes.status === "fulfilled" && Array.isArray(trendRes.value) ? trendRes.value : []);
      setNature(natureRes.status === "fulfilled" && Array.isArray(natureRes.value) ? natureRes.value : []);
      setStatusData(statusRes.status === "fulfilled" && Array.isArray(statusRes.value) ? statusRes.value : []);

      const rejected = [statsRes, trendRes, natureRes, statusRes].filter(r => r.status === "rejected");
      if (rejected.length === 4) {
        throw (rejected[0] as PromiseRejectedResult).reason;
      }
      if (rejected.length > 0) {
        setError("Some report sections could not be loaded. Displaying available data.");
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
    const startObj = new Date(pendingStart);
    const endObj = new Date(pendingEnd);
    if (endObj < startObj) {
      setDateError("End date cannot be before start date.");
      return;
    }
    const diffDays = Math.ceil((endObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 365) {
      setDateError("Date range cannot exceed 1 year. Please narrow your selection.");
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
    const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
    const safeStats = stats || { totalCases: 0, resolvedCases: 0, closedCases: 0, activeIntervention: 0 };
    const effPct = safeStats.totalCases > 0 ? (safeStats.resolvedCases / safeStats.totalCases) * 100 : 0;
    
    const kpiCards = [
      { label: "Total Cases", value: safeStats.totalCases, sub: "Filed within period" },
      { label: "Resolved Cases", value: safeStats.resolvedCases, sub: `${effPct.toFixed(0)}% resolution rate` },
      { label: "Closed Cases", value: safeStats.closedCases, sub: "Closed / Dismissed" },
      { label: "Active Intervention", value: safeStats.activeIntervention, sub: "Under Mediation" },
    ];
    
    const kpiHtml = kpiCards.map((k) => `
      <div style="border:1px solid #E5E7EB;border-radius:8px;padding:16px 20px;flex:1;min-width:130px;">
        <p style="margin:0;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:.05em;">${k.label}</p>
        <p style="margin:6px 0 2px;font-size:28px;font-weight:700;color:#111827;">${String(k.value)}</p>
        <p style="margin:0;font-size:10px;color:#9CA3AF;">${k.sub}</p>
      </div>`).join("");

    const trendRows = trendMeta.data.map((m) =>
      `<tr><td style="padding:5px 8px;font-size:12px;color:#374151;">${m.label}</td><td style="padding:5px 8px;font-size:12px;color:#374151;text-align:right;">${m.count ?? 0}</td></tr>`
    ).join("");

    const totalNature = nature.reduce((s, i) => s + i.count, 0);
    const natureRows = [...nature].sort((a, b) => b.count - a.count).map((item) => {
      const p = totalNature > 0 ? ((item.count / totalNature) * 100).toFixed(1) : "0.0";
      const bw = totalNature > 0 ? Math.max(4, (item.count / totalNature) * 100) : 4;
      const rawLabel = item.natureName?.trim() || "Unspecified";
      const parts = rawLabel.split('|').map(s => s.trim());
      const natureLabel = parts[0] || "Unspecified";
      const violenceTypeLabel = parts.length > 1 ? parts[1] : null;
      const lbl = violenceTypeLabel ? `${natureLabel} <span style="color:#E11D48;font-size:10px;">(${violenceTypeLabel})</span>` : natureLabel;

      return `<tr><td style="padding:6px 8px;font-size:12px;color:#374151;">${lbl}</td><td style="padding:6px 8px;font-size:12px;text-align:right;">${item.count} (${p}%)</td><td style="padding:6px 8px;width:40%;">
        <div style="background:#F3F4F6;border-radius:4px;height:8px;"><div style="background:#6366F1;height:100%;border-radius:4px;width:${bw}%;"></div></div></td></tr>`;
    }).join("");

    const totalStatus = statusData.reduce((s, r) => s + r.count, 0);
    const statusRows = statusData.map((r) => {
      const p = totalStatus > 0 ? ((r.count / totalStatus) * 100).toFixed(1) : "0.0";
      return `<tr><td style="padding:5px 8px;font-size:12px;color:#374151;">${formatStatusDisplay(r.statusName)}</td><td style="padding:5px 8px;font-size:12px;text-align:right;">${r.count}</td><td style="padding:5px 8px;font-size:12px;text-align:right;color:#6B7280;">${p}%</td></tr>`;
    }).join("");

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
      <title>BCPC Report — ${fmtDate(appliedStart)} to ${fmtDate(appliedEnd)}</title>
      <style>*{box-sizing:border-box;}body{font-family:'Segoe UI',Arial,sans-serif;color:#111827;margin:0;padding:32px 40px;background:#fff;}
        h1{font-size:20px;font-weight:700;margin:0 0 2px;}.sub{font-size:12px;color:#6B7280;margin:0 0 24px;}
        .section{margin-bottom:28px;}.section-title{font-size:14px;font-weight:700;color:#1F2937;border-bottom:2px solid #E5E7EB;padding-bottom:6px;margin-bottom:12px;}
        table{width:100%;border-collapse:collapse;}th{text-align:left;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:.05em;padding:4px 8px;border-bottom:1px solid #E5E7EB;}
        td{border-bottom:1px solid #F3F4F6;}.kpi-row{display:flex;gap:12px;flex-wrap:wrap;}
        @page{margin:1.2cm;size:A4;}@media print{body{padding:0;}}</style></head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
        <div><h1>BCPC Report</h1><p class="sub">Period: ${fmtDate(appliedStart)} &mdash; ${fmtDate(appliedEnd)}</p></div>
        <div style="text-align:right;"><p style="margin:0;font-size:11px;color:#6B7280;">Generated</p><p style="margin:2px 0 0;font-size:12px;font-weight:600;color:#374151;">${new Date().toLocaleString("en-PH")}</p></div>
      </div>
      <div class="section"><div class="section-title">Summary</div><div class="kpi-row">${kpiHtml}</div></div>
      <div class="section"><div class="section-title">${trendMeta.label}</div>
        <table><thead><tr><th>Period</th><th style="text-align:right;">Cases</th></tr></thead><tbody>${trendRows || '<tr><td colspan="2" style="padding:10px 8px;font-size:12px;color:#9CA3AF;">No data.</td></tr>'}</tbody></table></div>
      <div class="section"><div class="section-title">Cases by Nature &mdash; ${totalNature} total</div>
        <table><thead><tr><th>Nature</th><th>Count</th><th>Distribution</th></tr></thead><tbody>${natureRows || '<tr><td colspan="3" style="padding:10px 8px;font-size:12px;color:#9CA3AF;">No data.</td></tr>'}</tbody></table></div>
      <div class="section"><div class="section-title">Case Status &mdash; ${totalStatus} total</div>
        <table><thead><tr><th>Status</th><th style="text-align:right;">Count</th><th style="text-align:right;">Share</th></tr></thead><tbody>${statusRows || '<tr><td colspan="3" style="padding:10px 8px;font-size:12px;color:#9CA3AF;">No data.</td></tr>'}</tbody></table></div>
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

  const trendMeta = useMemo(() => {
    const start = new Date(appliedStart);
    const end = new Date(appliedEnd);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { label: "Monthly Case Trend", subtitle: "Filed BCPC cases grouped by month", granularity: "month" as TrendGranularity, data: [] };
    }

    const monthBuckets: Array<{ key: string; label: string }> = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (cursor <= endMonth) {
      monthBuckets.push({
        key: toMonthKey(cursor),
        label: formatMonthLabel(cursor),
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
      if (!label) return null;
      
      const isoMonthMatch = label.trim().match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
      if (isoMonthMatch) {
        return `${isoMonthMatch[1]}-${isoMonthMatch[2]}`;
      }

      // Handle custom format "MMM YYYY" (e.g., "Jul 2026")
      const monthYearMatch = label.trim().match(/^([A-Za-z]{3,9})\s+(\d{4})$/);
      if (monthYearMatch) {
        const month = MONTH_INDEX[normalizeMonthName(monthYearMatch[1])];
        if (month !== undefined) {
          return `${monthYearMatch[2]}-${String(month + 1).padStart(2, "0")}`;
        }
      }

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

    (trend || []).forEach((point) => {
      const key = getPointMonthKey(point.label);
      if (!key) return;
      counts.set(key, (counts.get(key) || 0) + (point.count || 0));
    });

    return {
      label: "Monthly Case Trend",
      subtitle: "Filed BCPC cases grouped by month",
      granularity: "month" as TrendGranularity,
      data: monthBuckets.map(b => ({ label: b.label, count: counts.get(b.key) || 0 }))
    };
  }, [appliedStart, appliedEnd, trend]);

  const hasAnyReportData = stats !== null || trend.length > 0 || nature.length > 0 || statusData.length > 0;

  if (canReport === null) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
          <KPIGrid columns={4}>
            {Array.from({ length: 4 }).map((_, index) => (
              <KPICard key={index} title="Loading" value={<CircleLoader size="sm" />} color="slate" icon={KPIIcons.document} />
            ))}
          </KPIGrid>
        </div>
      </div>
    );
  }

  if (!canReport) {
    return (
      <PermissionDeniedPage
        message="You do not have permission to access BCPC reports."
        hint="Ask your administrator to grant the Manage Reports permission."
        actionLabel="Go to Dashboard"
        onAction={() => window.location.assign('/bcpc/dashboard')}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
          <KPIGrid columns={4}>
            {Array.from({ length: 4 }).map((_, index) => (
              <KPICard key={index} title="Loading" value={<CircleLoader size="sm" />} color="slate" icon={KPIIcons.document} />
            ))}
          </KPIGrid>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Case Trend"><CenteredLoader minHeight="min-h-[250px]" /></SectionCard>
            <SectionCard title="Case Status"><CenteredLoader minHeight="min-h-[250px]" /></SectionCard>
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
          <p className="text-sm font-medium text-slate-700">Failed to load reports</p>
          <p className="text-xs text-slate-400">{error}</p>
          <button onClick={() => fetchAll(appliedStart, appliedEnd)} className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 underline">Try again</button>
        </div>
      </div>
    );
  }

  const safeStats = {
    totalCases: stats?.totalCases ?? 0,
    resolvedCases: stats?.resolvedCases ?? 0,
    closedCases: stats?.closedCases ?? 0,
    activeIntervention: stats?.activeIntervention ?? 0,
  };
  const effPct = safeStats.totalCases > 0 ? (safeStats.resolvedCases / safeStats.totalCases) * 100 : 0;
  
  const totalNature = nature.reduce((s, i) => s + i.count, 0);
  const sortedNature = [...nature].sort((a, b) => b.count - a.count);
  const totalStatus = statusData.reduce((s, i) => s + i.count, 0);
  const pieColors = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#64748B"];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {error && hasAnyReportData && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">{error}</div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">BCPC Analytics Report</h2>
              <p className="text-sm text-gray-500 mt-1">Filter and view comprehensive case data for the BCPC department.</p>
            </div>
            <div className="flex items-center gap-2">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <div className="relative">
                <CalendarDays className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={pendingStart}
                  max={pendingEnd || undefined}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPendingStart(val);
                    setDateError(null);
                  }}
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <div className="relative">
                <CalendarDays className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={pendingEnd}
                  min={pendingStart || undefined}
                  max={getMaxEndDate()}
                  onChange={(e) => {
                    setPendingEnd(e.target.value);
                    setDateError(null);
                  }}
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
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
          {dateError && <p className="text-xs text-red-500 flex items-center gap-1 mt-2 px-1"><CircleAlert className="w-3.5 h-3.5" />{dateError}</p>}
        </div>

        <KPIGrid columns={4}>
          <KPICard
            title="Total Cases"
            value={safeStats.totalCases.toLocaleString()}
            icon={<FileText className="w-6 h-6" />}
            color="blue"
            subtitle="All BCPC cases in the period"
            trend={typeof stats?.totalCasesTrend === 'number' ? { value: `${Math.abs(Number(stats.totalCasesTrend.toFixed(1)))}%`, direction: stats.totalCasesTrend > 0 ? 'up' : stats.totalCasesTrend < 0 ? 'down' : 'neutral', label: 'vs prev. period' } : undefined}
          />
          <KPICard
            title="Resolved Cases"
            value={safeStats.resolvedCases.toLocaleString()}
            icon={<CheckCircle2 className="w-6 h-6" />}
            color="emerald"
            subtitle={`${formatPercent(effPct)} overall resolution rate`}
            trend={typeof stats?.resolvedCasesTrend === 'number' ? { value: `${Math.abs(Number(stats.resolvedCasesTrend.toFixed(1)))}%`, direction: stats.resolvedCasesTrend > 0 ? 'up' : stats.resolvedCasesTrend < 0 ? 'down' : 'neutral', label: 'vs prev. period' } : undefined}
          />
          <KPICard
            title="Closed Cases"
            value={safeStats.closedCases.toLocaleString()}
            icon={<ArchiveX className="w-6 h-6" />}
            color="rose"
            subtitle="Closed or dismissed cases"
            trend={typeof stats?.closedCasesTrend === 'number' ? { value: `${Math.abs(Number(stats.closedCasesTrend.toFixed(1)))}%`, direction: stats.closedCasesTrend > 0 ? 'up' : stats.closedCasesTrend < 0 ? 'down' : 'neutral', label: 'vs prev. period' } : undefined}
          />
          <KPICard
            title="Active Intervention"
            value={safeStats.activeIntervention.toLocaleString()}
            icon={<Timer className="w-6 h-6" />}
            color="violet"
            subtitle="Under Mediation / Intervention"
            trend={typeof stats?.activeInterventionTrend === 'number' ? { value: `${Math.abs(Number(stats.activeInterventionTrend.toFixed(1)))}%`, direction: stats.activeInterventionTrend > 0 ? 'up' : stats.activeInterventionTrend < 0 ? 'down' : 'neutral', label: 'vs prev. period' } : undefined}
          />
        </KPIGrid>

        <SectionCard title={trendMeta.label} subtitle={trendMeta.subtitle}>
          {trendMeta.data.length === 0 ? (
            <NoRecords text="No trend data for the selected period." />
          ) : (
            <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-3 h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendMeta.data} margin={{ top: 12, right: 12, bottom: 32, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" />
                  <XAxis
                    dataKey="label"
                    tickFormatter={(val) => formatTrendAxisLabel(String(val), trendMeta.granularity)}
                    tickMargin={12}
                    height={trendMeta.granularity === "day" ? 80 : 40}
                    angle={trendMeta.granularity === "day" ? -45 : 0}
                    textAnchor={trendMeta.granularity === "day" ? "end" : "middle"}
                    tick={{ fontSize: 11, fill: "#475569" }}
                    axisLine={{ stroke: "#94A3B8" }}
                    tickLine={false}
                  />
                  <YAxis width={34} tick={{ fontSize: 12, fill: "#475569" }} axisLine={{ stroke: "#94A3B8" }} tickLine={false} allowDecimals={false} domain={[0, getTrendYAxisMax(trendMeta.data)]} />
                  <Tooltip
                    labelFormatter={(val) => formatTrendTooltipLabel(String(val), trendMeta.granularity)}
                    contentStyle={{ borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 12 }}
                    formatter={(v: number) => [v, "Cases"]}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title="Cases by Nature" subtitle="Most common BCPC complaint categories">
            <div className="mb-4">
              <p className="text-2xl font-semibold text-gray-900 leading-none">{totalNature.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Total categorized cases</p>
            </div>
            {sortedNature.length === 0 ? (
              <NoRecords text="No nature data for the selected period." />
            ) : (
              <div className="max-h-[340px] space-y-3 overflow-y-auto pr-1">
                {sortedNature.map((item, index) => {
                  const pct = totalNature > 0 ? (item.count / totalNature) * 100 : 0;
                  const rawLabel = item.natureName?.trim() || "Unspecified";
                  const parts = rawLabel.split('|').map(s => s.trim());
                  const natureLabel = parts[0] || "Unspecified";
                  const violenceTypeLabel = parts.length > 1 ? parts[1] : null;

                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1 items-start">
                          <p className="text-sm text-gray-700 leading-tight">{natureLabel}</p>
                          {violenceTypeLabel && (
                            <span className="inline-block rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-600 border border-rose-100">
                              {violenceTypeLabel}
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 text-sm text-gray-800 tabular-nums mt-0.5">{item.count} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(4, pct)}%`, backgroundColor: NATURE_COLORS[index % NATURE_COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Case Status" subtitle="Status distribution across all selected cases">
            {totalStatus === 0 ? (
              <NoRecords text="No status data for the selected period." />
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="relative h-48 w-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} dataKey="count" nameKey="statusName" innerRadius={56} outerRadius={80} paddingAngle={3} stroke="#fff" strokeWidth={2}>
                        {statusData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 10 }} formatter={(v: number) => v.toLocaleString()} labelFormatter={(l) => formatStatusDisplay(String(l))} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-slate-900 tabular-nums">{totalStatus.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide">Total</span>
                  </div>
                </div>
                <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  {statusData.map((r, i) => (
                    <div key={i} className="border border-slate-100 rounded-xl p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                        <span className="text-[10px] text-slate-500 font-medium uppercase truncate" title={formatStatusDisplay(r.statusName)}>{formatStatusDisplay(r.statusName)}</span>
                      </div>
                      <p className="text-lg font-bold text-slate-800 tabular-nums">{r.count.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
