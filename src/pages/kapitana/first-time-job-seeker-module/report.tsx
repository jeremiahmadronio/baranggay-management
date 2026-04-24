import { useEffect, useMemo, useState } from "react";
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
import { CalendarDays } from "lucide-react";
import { Table, type TableColumn } from "../../../reusable";
import { KPICard, KPIGrid, KPIIcons } from "../../../hooks/KPICard";
import {
  CenteredLoader,
  CircleLoader,
  NoRecords,
} from "../../../hooks/LoadingStates";
import {
  ftjsReportApi,
  type FtjsReportTableDTO,
  type ReportStatsResponseDTO,
  type StatusDistributionDTO,
  type TrendResponseDTO,
} from "../../../service/first-time-job-seeker-api/FirstTimeJobSeekerReport";
import {
  formatDate,
  formatStatusLabel,
  getDefaultDateRange,
  getMaxEndDate,
  getStatusBadgeClass,
  getStatusDescription,
  paginateItems,
  SectionCard,
} from "./shared";
import { useKapitanaMockData } from "../mock/kapitana-mock-flag";
import {
  mockKapitanaFtjsDistribution,
  mockKapitanaFtjsReportCases,
  mockKapitanaFtjsReportStats,
  mockKapitanaFtjsTrend,
} from "../mock/ftjs-kapitana-mock";

const PAGE_SIZE = 8;
const DONUT_COLORS = [
  "#2563EB",
  "#0EA5E9",
  "#14B8A6",
  "#8B5CF6",
  "#F59E0B",
  "#64748B",
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

function getDayStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
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
      const year = monthDayYearMatch[3]
        ? Number(monthDayYearMatch[3])
        : (fallbackYear ?? new Date().getFullYear());
      return new Date(year, month, Number(monthDayYearMatch[2]));
    }
  }

  const monthOnlyMatch = trimmed.match(/^([A-Za-z]{3,9})(?:\s+(\d{4}))?$/);
  if (monthOnlyMatch) {
    const month = MONTH_INDEX[normalizeMonthName(monthOnlyMatch[1])];
    if (month !== undefined) {
      const year = monthOnlyMatch[2]
        ? Number(monthOnlyMatch[2])
        : (fallbackYear ?? new Date().getFullYear());
      return new Date(year, month, 1);
    }
  }

  const numericYear = Number(trimmed);
  if (!Number.isNaN(numericYear) && trimmed.length === 4) {
    return new Date(numericYear, 0, 1);
  }

  return null;
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

function formatTrendAxisLabel(value: string, granularity: TrendGranularity): string {
  const parsedDate = parseTrendPointDate(value);

  if (!parsedDate) return value;

  if (granularity === "day") {
    return parsedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  if (granularity === "month") {
    return parsedDate.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
  }

  return parsedDate.toLocaleDateString("en-US", { year: "numeric" });
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

  return parsedDate.toLocaleDateString("en-PH", { year: "numeric" });
}

function getTrendTickInterval(length: number, granularity: TrendGranularity): number {
  if (length <= 1) return 0;

  if (granularity === "day") {
    if (length > 24) return 1;
    return 0;
  }

  return 0;
}

function getDailyTickFontSize(length: number): number {
  if (length > 24) return 9;
  if (length > 18) return 10;
  return 11;
}

function getDailyTickAngle(length: number): number {
  if (length > 24) return -45;
  if (length > 16) return -32;
  return -20;
}

function getBarCategoryGap(length: number, granularity: TrendGranularity): string {
  if (granularity === "month") {
    if (length <= 12) return "18%";
    if (length <= 24) return "22%";
    return "28%";
  }

  if (granularity !== "day") return "28%";
  if (length > 24) return "18%";
  if (length > 16) return "20%";
  return "24%";
}

function getMaxBarSize(length: number, granularity: TrendGranularity): number {
  if (granularity === "month") {
    if (length <= 12) return 44;
    if (length <= 24) return 32;
    return 24;
  }

  if (granularity !== "day") return 48;
  if (length > 24) return 14;
  if (length > 16) return 18;
  return 24;
}

function getTrendYAxisMax(data: Array<{ total: number }>): number {
  const highest = data.reduce((max, item) => Math.max(max, item.total || 0), 0);

  if (highest <= 0) return 1;
  if (highest <= 5) return highest + 1;

  return Math.ceil(highest * 1.15);
}

function formatAppliedRange(start: string, end: string): string {
  try {
    const fmt = (value: string) =>
      new Date(value).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    return `${fmt(start)} — ${fmt(end)}`;
  } catch {
    return `${start} to ${end}`;
  }
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(status)}`}
    >
      {formatStatusLabel(status)}
    </span>
  );
}

export default function KapitanaFtjsReportPage() {
  const defaults = getDefaultDateRange();

  const [pendingStart, setPendingStart] = useState(defaults.start);
  const [pendingEnd, setPendingEnd] = useState(defaults.end);
  const [appliedStart, setAppliedStart] = useState(defaults.start);
  const [appliedEnd, setAppliedEnd] = useState(defaults.end);

  const [stats, setStats] = useState<ReportStatsResponseDTO | null>(null);
  const [distribution, setDistribution] = useState<StatusDistributionDTO[]>([]);
  const [trend, setTrend] = useState<TrendResponseDTO[]>([]);
  const [cases, setCases] = useState<FtjsReportTableDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [dateError, setDateError] = useState<string | null>(null);

  async function fetchAll(startDate: string, endDate: string) {
    try {
      setLoading(true);
      if (useKapitanaMockData()) {
        setStats(mockKapitanaFtjsReportStats());
        setDistribution(mockKapitanaFtjsDistribution());
        setTrend(mockKapitanaFtjsTrend(startDate, endDate));
        setCases(mockKapitanaFtjsReportCases());
        return;
      }
      const [statsRes, distributionRes, trendRes, casesRes] = await Promise.all(
        [
          ftjsReportApi.getReportSummary(startDate, endDate),
          ftjsReportApi.getStatusDistribution(startDate, endDate),
          ftjsReportApi.getTrend(startDate, endDate),
          ftjsReportApi.getReportCases(startDate, endDate),
        ],
      );

      setStats(statsRes);
      setDistribution(distributionRes);
      setTrend(trendRes);
      setCases(casesRes);
    } catch (error) {
      console.error(
        error instanceof Error ? error.message : "Failed to load FTJS reports.",
      );
      setDateError(
        error instanceof Error ? error.message : "Failed to load FTJS reports.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll(appliedStart, appliedEnd);
  }, [appliedStart, appliedEnd]);

  const filteredCases = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return cases.filter((item) => {
      return (
        !keyword ||
        item.ftjsNumber.toLowerCase().includes(keyword) ||
        item.fullName.toLowerCase().includes(keyword) ||
        item.contactNumber.toLowerCase().includes(keyword) ||
        item.status.toLowerCase().includes(keyword)
      );
    });
  }, [cases, search]);

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / PAGE_SIZE));
  const pagedCases = useMemo(
    () => paginateItems(filteredCases, page, PAGE_SIZE),
    [filteredCases, page],
  );

  useEffect(() => {
    if (page > totalPages - 1) setPage(0);
  }, [page, totalPages]);

  const columns: TableColumn<FtjsReportTableDTO>[] = [
    {
      key: "ftjsNumber",
      header: "FTJS No.",
      width: "180px",
      render: (item) => (
        <span className="text-gray-700 font-medium">{item.ftjsNumber}</span>
      ),
    },
    {
      key: "fullName",
      header: "Applicant",
      width: "240px",
      render: (item) => (
        <span className="block whitespace-normal break-words text-gray-900 font-semibold">
          {item.fullName}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "160px",
      render: (item) => <StatusPill status={item.status} />,
    },
    {
      key: "contactNumber",
      header: "Contact Number",
      width: "170px",
      render: (item) => (
        <span className="text-gray-700">{item.contactNumber || "—"}</span>
      ),
    },
    {
      key: "dateSubmitted",
      header: "Date Submitted",
      width: "150px",
      render: (item) => (
        <span className="text-gray-700 whitespace-nowrap">
          {formatDate(item.dateSubmitted)}
        </span>
      ),
    },
  ];

  function handleApplyFilter() {
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
      setDateError("Date range cannot exceed 1 year.");
      return;
    }

    setAppliedStart(pendingStart);
    setAppliedEnd(pendingEnd);
    setPage(0);
  }

  function handleReset() {
    const nextDefaults = getDefaultDateRange();
    setPendingStart(nextDefaults.start);
    setPendingEnd(nextDefaults.end);
    setAppliedStart(nextDefaults.start);
    setAppliedEnd(nextDefaults.end);
    setSearch("");
    setDateError(null);
    setPage(0);
  }

  const totalDistribution = distribution.reduce(
    (sum, item) => sum + item.total,
    0,
  );
  const reissuedCount =
    distribution.find(
      (item) => String(item.status || "").toUpperCase() === "RE_ISSUANCE",
    )?.total ?? 0;

  const trendMeta = useMemo(() => {
    const start = new Date(appliedStart);
    const end = new Date(appliedEnd);
    const startDay = getDayStart(start);
    const endDay = getDayStart(end);
    const caseDates = cases
      .map((item) => {
        const parsed = new Date(item.dateSubmitted);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      })
      .filter((value): value is Date => value !== null);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return {
        label: "FTJS Trend",
        subtitle: "Counts returned by the FTJS trend endpoint for the selected range",
        granularity: "day" as TrendGranularity,
        data: [] as TrendResponseDTO[],
      };
    }

    const diffDays = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;

    if (diffDays <= 30) {
      const dayBuckets: Array<{ key: string; label: string }> = [];
      const totals = new Map<string, number>();
      caseDates.forEach((parsedDate) => {
        const day = getDayStart(parsedDate);
        if (day < startDay || day > endDay) return;
        const key = formatDayLabel(day);
        totals.set(key, (totals.get(key) || 0) + 1);
      });

      const cursor = new Date(startDay);

      while (cursor <= endDay) {
        dayBuckets.push({
          key: formatDayLabel(cursor),
          label: formatDayLabel(cursor),
        });
        cursor.setDate(cursor.getDate() + 1);
      }

      trend.forEach((point) => {
        const parsedDate = resolveTrendPointDateInRange(point.label, start, end);
        if (!parsedDate) return;
        const key = formatDayLabel(parsedDate);
        totals.set(key, (totals.get(key) || 0) + (point.total || 0));
      });

      return {
        label: "Daily FTJS Trend",
        subtitle: "FTJS records shown across each day in the selected range",
        granularity: "day" as TrendGranularity,
        data: dayBuckets.map((bucket) => ({
          label: bucket.label,
          total: totals.get(bucket.key) || 0,
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

      const totals = new Map<string, number>();
      caseDates.forEach((parsedDate) => {
        if (parsedDate < start || parsedDate > end) return;
        const key = toMonthKey(getMonthStart(parsedDate));
        totals.set(key, (totals.get(key) || 0) + 1);
      });

      if (totals.size === 0) {
        trend.forEach((point) => {
          const parsedDate = resolveTrendPointDateInRange(point.label, start, end);
          if (!parsedDate) return;
          const key = toMonthKey(getMonthStart(parsedDate));
          totals.set(key, (totals.get(key) || 0) + (point.total || 0));
        });
      }

      return {
        label: "Monthly FTJS Trend",
        subtitle: "FTJS records grouped month by month for the selected filter range",
        granularity: "month" as TrendGranularity,
        data: monthBuckets.map((bucket) => ({
          label: bucket.label,
          total: totals.get(bucket.key) || 0,
        })),
      };
    }

    const yearBuckets: Array<{ key: string; label: string }> = [];
    for (let year = start.getFullYear(); year <= end.getFullYear(); year += 1) {
      const current = new Date(year, 0, 1);
      yearBuckets.push({ key: toYearKey(current), label: formatYearLabel(current) });
    }

    const totals = new Map<string, number>();
    caseDates.forEach((parsedDate) => {
      if (parsedDate < start || parsedDate > end) return;
      const key = toYearKey(parsedDate);
      totals.set(key, (totals.get(key) || 0) + 1);
    });

    if (totals.size > 0) {
      return {
        label: "Yearly FTJS Trend",
        subtitle: "FTJS records grouped only for years with submitted records",
        granularity: "year" as TrendGranularity,
        data: yearBuckets
          .filter((bucket) => totals.has(bucket.key))
          .map((bucket) => ({
            label: bucket.label,
            total: totals.get(bucket.key) || 0,
          })),
      };
    }

    if (totals.size === 0) {
      trend.forEach((point) => {
        const parsedDate = resolveTrendPointDateInRange(point.label, start, end);
        if (!parsedDate) return;
        const key = toYearKey(parsedDate);
        totals.set(key, (totals.get(key) || 0) + (point.total || 0));
      });
    }

    return {
      label: "Yearly FTJS Trend",
      subtitle: "FTJS records grouped by year for the selected range",
      granularity: "year" as TrendGranularity,
      data: yearBuckets.map((bucket) => ({
        label: bucket.label,
        total: totals.get(bucket.key) || 0,
      })),
    };
  }, [appliedEnd, appliedStart, cases, trend]);



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
            <SectionCard title="FTJS Trend">
              <CenteredLoader minHeight="min-h-[260px]" />
            </SectionCard>
            <SectionCard title="FTJS Status Distribution">
              <CenteredLoader minHeight="min-h-[260px]" />
            </SectionCard>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                FTJS Report Date Range
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Default range is the last 6 months. Trend switches automatically
                to daily, monthly, or yearly view based on the selected range.
              </p>
            </div>
            <span className="text-xs font-medium uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
              Range: {formatAppliedRange(appliedStart, appliedEnd)}
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
                  onChange={(event) => {
                    setPendingStart(event.target.value);
                    setDateError(null);
                  }}
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg"
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
                  onChange={(event) => {
                    setPendingEnd(event.target.value);
                    setDateError(null);
                  }}
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleApplyFilter}
              className="px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Apply Filter
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Reset Range
            </button>
          </div>

          {dateError ? (
            <p className="text-xs text-red-500 mt-3">{dateError}</p>
          ) : null}
        </div>

        <KPIGrid columns={4}>
          <KPICard
            title="Total Certificate Records"
            value={stats?.totalRecords ?? 0}
            color="slate"
            icon={KPIIcons.document}
            subtitle="Issued and re-issued FTJS certificates within range"
          />
          <KPICard
            title="With Resident Record"
            value={stats?.residentRecords ?? 0}
            color="emerald"
            icon={KPIIcons.users}
            subtitle="Certificates issued to applicants found in the resident system"
          />
          <KPICard
            title="Without Resident Record"
            value={stats?.nonResidentRecords ?? 0}
            color="amber"
            icon={KPIIcons.alert}
            subtitle="Certificates issued without a linked resident system record"
          />
          <KPICard
            title="Re-issued Records"
            value={reissuedCount}
            color="blue"
            icon={KPIIcons.month}
            subtitle="Records currently counted under RE_ISSUANCE status"
          />
        </KPIGrid>

        <SectionCard
          title={trendMeta.label}
          subtitle={trendMeta.subtitle}
        >
          {trendMeta.data.length === 0 ? (
            <NoRecords text="No FTJS trend data for the selected range." />
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
                    tickMargin={trendMeta.granularity === "day" ? 10 : 10}
                    height={trendMeta.granularity === "day" ? 88 : 52}
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
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "#475569" }}
                    axisLine={{ stroke: "#94A3B8", strokeWidth: 1.1 }}
                    tickLine={false}
                    domain={[0, getTrendYAxisMax(trendMeta.data)]}
                  />
                  <Tooltip
                    labelFormatter={(value) =>
                      formatTrendTooltipLabel(String(value), trendMeta.granularity)
                    }
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid #E5E7EB",
                      fontSize: 12,
                      boxShadow: "0 10px 24px -14px rgb(15 23 42 / 0.3)",
                      backgroundColor: "#FFFFFF",
                    }}
                    formatter={(value?: number) => [value ?? 0, "Total"]}
                  />
                  <Bar
                    dataKey="total"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={getMaxBarSize(
                      trendMeta.data.length,
                      trendMeta.granularity,
                    )}
                  >
                    {trendMeta.data.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.total > 0 ? "#2563EB" : "transparent"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            </div>
          )}
        </SectionCard>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <SectionCard
          title="FTJS Report Cases"
          subtitle="Searchable list of FTJS report rows returned by the API for the selected date range"
          className="xl:col-span-8 h-full"
        >
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Search report rows
            </label>
            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              placeholder="Search by FTJS no., applicant, contact, or status"
              className="w-full md:max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <Table<FtjsReportTableDTO>
            columns={columns}
            data={pagedCases}
            keyExtractor={(item) => item.id}
            variant="resident"
            striped
            hoverable
            minRows={4}
            emptyMessage="No FTJS report cases found for the selected range."
            pagination={{
              currentPage: Math.min(page + 1, totalPages),
              totalPages,
              totalItems: filteredCases.length,
              itemsPerPage: PAGE_SIZE,
              onPageChange: (nextPage) => setPage(nextPage - 1),
            }}
          />
        </SectionCard>


        <SectionCard
          title="Status Distribution"
          subtitle="Current status totals reported by the FTJS report endpoint"
          className="xl:col-span-4 h-full"
        >
          {distribution.length === 0 ? (
            <NoRecords text="No FTJS status distribution for the selected range." />
          ) : (
            <div className="grid grid-cols-1 gap-4 items-center h-full content-start">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribution}
                      dataKey="total"
                      nameKey="status"
                      innerRadius={54}
                      outerRadius={82}
                      paddingAngle={1.5}
                      stroke="#FFFFFF"
                      strokeWidth={2}
                    >
                      {distribution.map((_, index) => (
                        <Cell
                          key={`ftjs-report-status-${index}`}
                          fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #E5E7EB",
                        fontSize: 12,
                      }}
                      formatter={(value?: number) => [value ?? 0, "Requests"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                <div className="mb-3">
                  <p className="text-3xl font-semibold text-gray-900">
                    {totalDistribution.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Total tracked requests
                  </p>
                </div>

                {distribution.map((item, index) => (
                  <div
                    key={`${item.status}-${index}`}
                    className="flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full mt-1.5"
                        style={{
                          backgroundColor:
                            DONUT_COLORS[index % DONUT_COLORS.length],
                        }}
                      />
                      <div>
                        <p className="text-sm text-gray-700 leading-tight">
                          {formatStatusLabel(item.status)}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {getStatusDescription(item.status)}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {item.total.toLocaleString()}
                    </span>
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
