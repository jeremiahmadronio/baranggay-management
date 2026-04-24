import { useCallback, useEffect, useMemo, useState } from "react";
import {
  KPICard,
  KPIGrid,
  KPIIcons,
  LoadingModal,
  Table,
  TableFilter,
  type TableColumn,
} from "../../../reusable";
import {
  revenueApi,
  type DailyCollectionResponseDTO,
  type RevenueResponseByCertificate,
  type RevenueStatsResponseDTO,
  type RevenueTrendDTO,
} from "../../../service/clearance-api/revenue";
import { fetchIssuedCertificates } from "../../../clearance-api/issued-certificate-api";
import { clearanceTemplateApi } from "../../../service/clearance-api/Template";
import { useKapitanaMockData } from "../mock/kapitana-mock-flag";
import {
  mockKapitanaClearanceIssuedRaw,
  mockKapitanaDailyCollections,
  mockKapitanaRevenueByType,
  mockKapitanaRevenueStats,
  mockKapitanaRevenueTrend,
} from "../mock/clearance-kapitana-mock";

type RevenueIssuedRow = {
  certificateType: string;
  dateIssued: string;
  status: string;
  isArchived: boolean;
  fee: number;
};

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const unwrapData = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === "object") {
    const maybeWrapped = value as Record<string, unknown>;
    if (maybeWrapped.data && typeof maybeWrapped.data === "object") {
      return maybeWrapped.data as Record<string, unknown>;
    }
    return maybeWrapped;
  }
  return {};
};

const normalizeRevenueStats = (value: unknown): RevenueStatsResponseDTO => {
  const raw = unwrapData(value);

  return {
    totalRevenue: toNumber(raw.totalRevenue ?? raw.totalCollections),
    totalRevenueThisWeek: toNumber(
      raw.totalRevenueThisWeek ?? raw.totalCollectionsThisWeek,
    ),
    totalRevenueThisMonth: toNumber(
      raw.totalRevenueThisMonth ?? raw.totalCollectionsThisMonth,
    ),
    totalRevenueThisYear: toNumber(
      raw.totalRevenueThisYear ?? raw.totalCollectionsThisYear,
    ),
  };
};

const normalizeArrayPayload = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    const raw = value as Record<string, unknown>;
    if (Array.isArray(raw.content)) return raw.content as T[];
    if (Array.isArray(raw.data)) return raw.data as T[];
    if (raw.data && typeof raw.data === "object") {
      const nested = raw.data as Record<string, unknown>;
      if (Array.isArray(nested.content)) return nested.content as T[];
      if (Array.isArray(nested.items)) return nested.items as T[];
    }
  }
  return [];
};

const isVoidedStatus = (statusRaw: string): boolean => {
  const status = String(statusRaw || "")
    .trim()
    .toUpperCase();
  return status.includes("VOID") || status.includes("CANCEL");
};

const normalizeRevenueByTypeRows = (
  value: unknown,
): RevenueResponseByCertificate[] => {
  return normalizeArrayPayload<Record<string, unknown>>(value).map((row) => {
    const fee = toNumber(row.fee ?? row.amount ?? 0);
    const count = toNumber(row.count ?? row.totalCertIssue ?? 0);
    const totalRevenue = toNumber(
      row.totalRevenue ?? row.totalCollections ?? fee * count,
    );
    return {
      certificateTitle: String(
        row.certificateTitle ?? row.certTitle ?? row.templateName ?? "",
      ),
      count,
      fee,
      totalRevenue,
    };
  });
};

const normalizeIssuedRevenueRows = (value: unknown): RevenueIssuedRow[] => {
  const raw = value as { content?: unknown };
  const rows = Array.isArray(raw?.content)
    ? (raw.content as Array<Record<string, unknown>>)
    : normalizeArrayPayload<Record<string, unknown>>(value);

  return rows.map((row) => {
    const fee = toNumber(
      row.fee ?? row.amount ?? row.certFee ?? row.totalFee ?? 0,
    );
    const rawIsFree = row.isFree;
    const isFree =
      typeof rawIsFree === "boolean" ? (fee > 0 ? false : rawIsFree) : fee <= 0;

    return {
      certificateType: String(
        row.certificateType ?? row.certTitle ?? row.templateName ?? "",
      ),
      dateIssued: String(row.dateIssued ?? row.requestedAt ?? row.date ?? ""),
      status: String(row.status ?? ""),
      isArchived: Boolean(row.isArchived ?? false),
      fee: isFree ? 0 : fee,
    };
  });
};

const normalizeSummaryRevenueRows = (value: unknown): RevenueIssuedRow[] => {
  const rows = normalizeArrayPayload<Record<string, unknown>>(value);
  return rows.map((row) => ({
    certificateType: String(
      row.certificateType ?? row.certTitle ?? row.templateName ?? "",
    ),
    dateIssued: String(row.dateIssued ?? row.requestedAt ?? row.date ?? ""),
    status: String(row.status ?? ""),
    isArchived: false,
    fee: toNumber(row.fee ?? row.amount ?? row.totalFee ?? 0),
  }));
};

const isInDateRange = (
  dateValue: string,
  from: string,
  to: string,
): boolean => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const dateOnly = `${y}-${m}-${d}`;

  if (from && dateOnly < from) return false;
  if (to && dateOnly > to) return false;
  return true;
};

const buildRevenueByTypeFromIssued = (
  rows: RevenueIssuedRow[],
  from: string,
  to: string,
): RevenueResponseByCertificate[] => {
  const map = new Map<string, RevenueResponseByCertificate>();

  rows.forEach((row) => {
    if (!row.certificateType || row.isArchived || isVoidedStatus(row.status))
      return;
    if (!isInDateRange(row.dateIssued, from, to)) return;

    const existing = map.get(row.certificateType) || {
      certificateTitle: row.certificateType,
      count: 0,
      fee: 0,
      totalRevenue: 0,
    };

    const nextCount = existing.count + 1;
    const nextFee = row.fee > 0 ? row.fee : existing.fee;
    const nextRevenue = existing.totalRevenue + row.fee;

    map.set(row.certificateType, {
      certificateTitle: row.certificateType,
      count: nextCount,
      fee: nextFee,
      totalRevenue: nextRevenue,
    });
  });

  return [...map.values()].sort((a, b) => b.totalRevenue - a.totalRevenue);
};

const buildDailyCollectionsFromIssued = (
  rows: RevenueIssuedRow[],
  from: string,
  to: string,
): DailyCollectionResponseDTO[] => {
  const map = new Map<string, DailyCollectionResponseDTO>();

  rows.forEach((row) => {
    if (row.isArchived || isVoidedStatus(row.status)) return;
    if (!isInDateRange(row.dateIssued, from, to)) return;

    const date = new Date(row.dateIssued);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate(),
    ).padStart(2, "0")}`;

    const existing = map.get(key) || {
      date: key,
      totalCertIssue: 0,
      totalCollections: 0,
      oRNumberStartToEnd: "-",
    };

    map.set(key, {
      ...existing,
      totalCertIssue: existing.totalCertIssue + 1,
      totalCollections: existing.totalCollections + row.fee,
    });
  });

  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
};

const buildRevenueTrendFromDaily = (
  dailyRows: DailyCollectionResponseDTO[],
): RevenueTrendDTO[] => {
  return dailyRows.map((row) => ({
    label: row.date,
    revenue: row.totalCollections,
  }));
};

const buildStatsFromIssued = (
  rows: RevenueIssuedRow[],
): RevenueStatsResponseDTO => {
  const active = rows.filter(
    (row) => !row.isArchived && !isVoidedStatus(row.status),
  );
  const total = active.reduce((sum, row) => sum + row.fee, 0);

  return {
    totalRevenue: total,
    totalRevenueThisWeek: total,
    totalRevenueThisMonth: total,
    totalRevenueThisYear: total,
  };
};

export const KapitanaRevenueAndCollectionPage = () => {
  const [loading, setLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [stats, setStats] = useState<RevenueStatsResponseDTO | null>(null);
  const [revenueByType, setRevenueByType] = useState<
    RevenueResponseByCertificate[]
  >([]);
  const [topRevenue, setTopRevenue] = useState<RevenueResponseByCertificate[]>(
    [],
  );
  const [dailyCollections, setDailyCollections] = useState<
    DailyCollectionResponseDTO[]
  >([]);
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrendDTO[]>([]);

  const peso = (n: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(n || 0);

  const formatNumber = (n: number) => new Intl.NumberFormat("en-US").format(n);

  const todayISO = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  const firstDayOfMonthISO = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}-01`;
  }, []);

  const apiDateFrom = dateFrom || firstDayOfMonthISO;
  const apiDateTo = dateTo || todayISO;

  const applyRangeLabel = useMemo(() => {
    if (!dateFrom && !dateTo) {
      return `Default: ${new Date(firstDayOfMonthISO).toLocaleDateString("en-PH")} - ${new Date(todayISO).toLocaleDateString("en-PH")}`;
    }
    if (dateFrom && !dateTo)
      return `From ${new Date(dateFrom).toLocaleDateString("en-PH")}`;
    if (!dateFrom && dateTo)
      return `Up to ${new Date(dateTo).toLocaleDateString("en-PH")}`;
    return `${new Date(dateFrom).toLocaleDateString("en-PH")} - ${new Date(dateTo).toLocaleDateString("en-PH")}`;
  }, [dateFrom, dateTo, firstDayOfMonthISO, todayISO]);

  const loadData = useCallback(
    async (isInitial = false) => {
      if (isInitial) setLoading(true);
      else setIsApplying(true);
      setErrorMessage("");

      try {
        if (useKapitanaMockData()) {
          const issuedRows = normalizeIssuedRevenueRows({
            content: mockKapitanaClearanceIssuedRaw(),
          });
          const byType = buildRevenueByTypeFromIssued(
            issuedRows,
            apiDateFrom,
            apiDateTo,
          );
          const daily = buildDailyCollectionsFromIssued(
            issuedRows,
            apiDateFrom,
            apiDateTo,
          );
          const trend = buildRevenueTrendFromDaily(daily);
          const statsFromRows = buildStatsFromIssued(issuedRows);
          const byTypeFinal =
            byType.length > 0 ? byType : mockKapitanaRevenueByType();
          setStats(
            statsFromRows.totalRevenue > 0
              ? statsFromRows
              : mockKapitanaRevenueStats(),
          );
          setRevenueByType(byTypeFinal);
          setTopRevenue(byTypeFinal.slice(0, 5));
          setDailyCollections(
            daily.length > 0
              ? daily
              : mockKapitanaDailyCollections(apiDateFrom, apiDateTo),
          );
          setRevenueTrend(
            trend.length > 0
              ? trend
              : mockKapitanaRevenueTrend(apiDateFrom, apiDateTo),
          );
          return;
        }

        const [
          statsRes,
          byTypeRes,
          topRes,
          dailyRes,
          trendRes,
          issuedRes,
          summaryRes,
        ] = await Promise.allSettled([
          revenueApi.getRevenueStats(),
          revenueApi.getRevenueByCertificateType(apiDateFrom, apiDateTo),
          revenueApi.getTop5Revenue(apiDateFrom, apiDateTo),
          revenueApi.getDailyCollections(apiDateFrom, apiDateTo),
          revenueApi.getRevenueTrend(apiDateFrom, apiDateTo),
          fetchIssuedCertificates(0, 1000),
          clearanceTemplateApi.getSummaryTable(),
        ]);

        const failedSections: string[] = [];
        const issuedRows =
          issuedRes.status === "fulfilled"
            ? normalizeIssuedRevenueRows(issuedRes.value)
            : [];
        const summaryRows =
          summaryRes.status === "fulfilled"
            ? normalizeSummaryRevenueRows(summaryRes.value)
            : [];
        const fallbackSourceRows =
          issuedRows.length > 0 ? issuedRows : summaryRows;
        const fallbackByType = buildRevenueByTypeFromIssued(
          fallbackSourceRows,
          apiDateFrom,
          apiDateTo,
        );
        const fallbackDaily = buildDailyCollectionsFromIssued(
          fallbackSourceRows,
          apiDateFrom,
          apiDateTo,
        );
        const fallbackTrend = buildRevenueTrendFromDaily(fallbackDaily);
        const fallbackStats = buildStatsFromIssued(fallbackSourceRows);

        if (statsRes.status === "fulfilled") {
          const normalizedStats = normalizeRevenueStats(statsRes.value);
          setStats(
            normalizedStats.totalRevenue > 0 || fallbackStats.totalRevenue <= 0
              ? normalizedStats
              : fallbackStats,
          );
        } else {
          setStats(fallbackStats.totalRevenue > 0 ? fallbackStats : null);
          failedSections.push("stats");
        }

        if (byTypeRes.status === "fulfilled") {
          const normalizedByType = normalizeRevenueByTypeRows(byTypeRes.value);
          const apiHasRevenue = normalizedByType.some(
            (row) => row.totalRevenue > 0 || row.count > 0,
          );
          setRevenueByType(apiHasRevenue ? normalizedByType : fallbackByType);
        } else {
          setRevenueByType(fallbackByType);
          failedSections.push("revenue by template");
        }

        if (topRes.status === "fulfilled") {
          const normalizedTop = normalizeRevenueByTypeRows(topRes.value);
          const apiHasRevenue = normalizedTop.some(
            (row) => row.totalRevenue > 0 || row.count > 0,
          );
          setTopRevenue(
            apiHasRevenue ? normalizedTop : fallbackByType.slice(0, 5),
          );
        } else {
          setTopRevenue(fallbackByType.slice(0, 5));
          failedSections.push("top templates");
        }

        if (dailyRes.status === "fulfilled") {
          const normalizedDaily =
            normalizeArrayPayload<DailyCollectionResponseDTO>(dailyRes.value);
          const apiHasRevenue = normalizedDaily.some(
            (row) =>
              toNumber(row.totalCollections) > 0 ||
              toNumber(row.totalCertIssue) > 0,
          );
          setDailyCollections(apiHasRevenue ? normalizedDaily : fallbackDaily);
        } else {
          setDailyCollections(fallbackDaily);
          failedSections.push("daily collections");
        }

        if (trendRes.status === "fulfilled") {
          const normalizedTrend = normalizeArrayPayload<RevenueTrendDTO>(
            trendRes.value,
          );
          const apiHasRevenue = normalizedTrend.some(
            (row) => toNumber(row.revenue) > 0,
          );
          setRevenueTrend(apiHasRevenue ? normalizedTrend : fallbackTrend);
        } else {
          setRevenueTrend(fallbackTrend);
          failedSections.push("trend summary");
        }

        if (issuedRes.status === "rejected")
          failedSections.push("issued records");
        if (summaryRes.status === "rejected")
          failedSections.push("summary records");

        // Do not show any error message if some revenue sections fail to load
        // setErrorMessage is intentionally omitted for open access
      } catch (error) {
        console.error("Failed to load revenue report data", error);
        setErrorMessage(
          "Failed to load some revenue report data. Please try again.",
        );
      } finally {
        setLoading(false);
        setIsApplying(false);
      }
    },
    [apiDateFrom, apiDateTo],
  );

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
  };

  const byTypeColumns: TableColumn<RevenueResponseByCertificate>[] = [
    {
      key: "certificateTitle",
      header: "Certificate Type",
      render: (item) => (
        <span className="font-medium">{item.certificateTitle}</span>
      ),
    },
    {
      key: "count",
      header: "Issued",
      align: "right",
      render: (item) => <span>{formatNumber(item.count)}</span>,
    },
    {
      key: "fee",
      header: "Fee",
      align: "right",
      render: (item) => <span>{peso(item.fee)}</span>,
    },
    {
      key: "totalRevenue",
      header: "Total Revenue",
      align: "right",
      render: (item) => (
        <span className="font-semibold">{peso(item.totalRevenue)}</span>
      ),
    },
  ];

  const topColumns: TableColumn<RevenueResponseByCertificate>[] = [
    {
      key: "certificateTitle",
      header: "Top Template",
      render: (item) => (
        <span className="font-medium">{item.certificateTitle}</span>
      ),
    },
    {
      key: "count",
      header: "Issued",
      align: "right",
      render: (item) => <span>{formatNumber(item.count)}</span>,
    },
    {
      key: "totalRevenue",
      header: "Revenue",
      align: "right",
      render: (item) => (
        <span className="font-semibold">{peso(item.totalRevenue)}</span>
      ),
    },
  ];

  const collectionColumns: TableColumn<DailyCollectionResponseDTO>[] = [
    {
      key: "date",
      header: "Date",
      render: (item) => (
        <span>{new Date(item.date).toLocaleDateString("en-PH")}</span>
      ),
    },
    {
      key: "totalCertIssue",
      header: "Certificates Issued",
      align: "right",
      render: (item) => <span>{formatNumber(item.totalCertIssue)}</span>,
    },
    {
      key: "totalCollections",
      header: "Collections",
      align: "right",
      render: (item) => (
        <span className="font-semibold">{peso(item.totalCollections)}</span>
      ),
    },
    {
      key: "oRNumberStartToEnd",
      header: "OR Number Range",
      render: (item) => <span>{item.oRNumberStartToEnd || "-"}</span>,
    },
  ];

  const trendColumns: TableColumn<RevenueTrendDTO>[] = [
    {
      key: "label",
      header: "Period",
      render: (item) => <span>{item.label}</span>,
    },
    {
      key: "revenue",
      header: "Revenue",
      align: "right",
      render: (item) => (
        <span className="font-semibold">{peso(item.revenue)}</span>
      ),
    },
  ];

  if (loading)
    return <LoadingModal isOpen message="Loading revenue report..." />;

  return (
    <div className="min-h-screen bg-gray-50/60">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-4 py-3 text-sm">
            {errorMessage}
          </div>
        )}

        <KPIGrid columns={4}>
          <KPICard
            title="Total Revenue"
            value={peso(stats?.totalRevenue || 0)}
            icon={KPIIcons.revenue}
            color="blue"
            subtitle="Overall collected amount"
          />
          <KPICard
            title="This Week"
            value={peso(stats?.totalRevenueThisWeek || 0)}
            icon={KPIIcons.month}
            color="emerald"
            subtitle="Weekly collections"
          />
          <KPICard
            title="This Month"
            value={peso(stats?.totalRevenueThisMonth || 0)}
            icon={KPIIcons.issued}
            color="amber"
            subtitle="Monthly collections"
          />
          <KPICard
            title="This Year"
            value={peso(stats?.totalRevenueThisYear || 0)}
            icon={KPIIcons.total}
            color="rose"
            subtitle="Year-to-date revenue"
          />
        </KPIGrid>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Revenue and Collections Report
              </h2>
              <p className="text-sm text-gray-500">
                Coverage: {applyRangeLabel}
              </p>
            </div>
          </div>

          <TableFilter
            showSearch={false}
            dateRange={{
              startLabel: "Start Date",
              endLabel: "End Date",
              startValue: dateFrom,
              endValue: dateTo,
              maxDate: todayISO,
              onStartChange: setDateFrom,
              onEndChange: setDateTo,
            }}
            onFilterClick={() => loadData(false)}
            onClearClick={clearFilters}
            filterButtonText={isApplying ? "Applying..." : "Apply Date Range"}
            clearButtonText="Clear Dates"
            showFilterButton
            showClearButton
            disabled={isApplying}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Revenue by Certificate Type
            </h3>
            <Table
              columns={byTypeColumns}
              data={revenueByType}
              keyExtractor={(item) => item.certificateTitle}
              minRows={6}
              emptyMessage="No revenue data found for selected period"
            />
          </div>

          <div className="xl:col-span-4 bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Top 5 Revenue Templates
            </h3>
            <Table
              columns={topColumns}
              data={topRevenue}
              keyExtractor={(item) => item.certificateTitle}
              minRows={6}
              emptyMessage="No top templates available"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Daily Collection Log
            </h3>
            <Table
              columns={collectionColumns}
              data={dailyCollections}
              keyExtractor={(item) => `${item.date}-${item.oRNumberStartToEnd}`}
              minRows={6}
              emptyMessage="No daily collection records for selected period"
            />
          </div>

          <div className="xl:col-span-4 bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Revenue Trend Summary
            </h3>
            <Table
              columns={trendColumns}
              data={revenueTrend}
              keyExtractor={(item, index) => `${item.label}-${index}`}
              minRows={6}
              emptyMessage="No trend data for selected period"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default KapitanaRevenueAndCollectionPage;
