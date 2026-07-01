import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  KPICard,
  KPIGrid,
  KPIIcons,
  ResponsiveTable,
  type ColumnDef,
  LoadingModal,
} from "../../reusable";

import {
  clearanceDashboardApi,
  type DashboardStatsResponseDTO,
  type RecentRequestResponseDTO,
  type TopTemplateResponseDTO,
  type WeeklyIssuedTrendDTO,
} from "../../service/clearance-api/dashboard";
import { clearanceTemplateApi } from "../../service/clearance-api/Template";
import { revenueApi } from "../../service/clearance-api/revenue";
import { fetchTemplateOptionsWithStatus } from "../../clearance-api/template-api";
import {
  fetchIssuedCertificates,
  fetchIssuedStats,
} from "../../clearance-api/issued-certificate-api";

import { ArrowRight } from "lucide-react";

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const unwrapObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object") return {};
  const raw = value as Record<string, unknown>;
  if (raw.data && typeof raw.data === "object") {
    return raw.data as Record<string, unknown>;
  }
  return raw;
};

const unwrapArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (!value || typeof value !== "object") return [];

  const raw = value as Record<string, unknown>;
  if (Array.isArray(raw.content)) return raw.content as T[];
  if (Array.isArray(raw.data)) return raw.data as T[];
  if (raw.data && typeof raw.data === "object") {
    const nested = raw.data as Record<string, unknown>;
    if (Array.isArray(nested.content)) return nested.content as T[];
    if (Array.isArray(nested.items)) return nested.items as T[];
  }
  return [];
};

const normalizeStats = (value: unknown): DashboardStatsResponseDTO => {
  const raw = unwrapObject(value);
  return {
    totalIssuedToday: toNumber(
      raw.totalIssuedToday ?? raw.totalIssued ?? raw.totalCertificatesToday,
    ),
    revenueToday: toNumber(raw.revenueToday ?? raw.totalRevenueToday),
    totalArchiveToday: toNumber(raw.totalArchiveToday ?? raw.totalArchivedToday),
    totalFreeCertsReleaseToday: toNumber(
      raw.totalFreeCertsReleaseToday ?? raw.totalFreeCertificatesToday,
    ),
  };
};

const normalizeWeeklyTrend = (value: unknown): WeeklyIssuedTrendDTO[] => {
  const items = unwrapArray<Record<string, unknown>>(value);
  return items.map((item) => ({
    date: String(item.date ?? item.label ?? item.day ?? ""),
    count: toNumber(item.count ?? item.issuanceCount ?? item.totalIssued),
  }));
};

const normalizeTopTemplates = (value: unknown): TopTemplateResponseDTO[] => {
  const items = unwrapArray<Record<string, unknown>>(value);
  return items.map((item) => ({
    certificateTitle: String(
      item.certificateTitle ?? item.certTitle ?? item.templateName ?? "",
    ),
    issuanceCount: toNumber(item.issuanceCount ?? item.count ?? item.totalIssued),
  }));
};

const normalizeRecentIssued = (value: unknown): RecentRequestResponseDTO[] => {
  const items = unwrapArray<Record<string, unknown>>(value);
  return items.map((item) => ({
    requestorName: String(
      item.requestorName ?? item.requesterName ?? item.residentName ?? "",
    ),
    certificateType: String(
      item.certificateType ?? item.certTitle ?? item.templateName ?? "",
    ),
    date: String(item.date ?? item.dateIssued ?? item.requestedAt ?? ""),
    status: String(item.status ?? item.certificateStatus ?? "PENDING"),
  }));
};

const normalizeIssuedRows = (value: unknown) => {
  const raw = unwrapObject(value);
  const list = Array.isArray(raw.content)
    ? (raw.content as Array<Record<string, unknown>>)
    : unwrapArray<Record<string, unknown>>(value);

  return list.map((item) => ({
    id: String(item.id ?? ""),
    requesterName: String(item.requesterName ?? item.requestorName ?? ""),
    certificateType: String(
      item.certificateType ?? item.certificateTitle ?? item.certTitle ?? item.templateName ?? "",
    ),
    dateIssued: String(item.dateIssued ?? item.date ?? item.requestedAt ?? ""),
    status: String(item.status ?? ""),
    fee: toNumber(item.fee ?? item.amount ?? item.certFee ?? item.totalFee ?? 0),
    isFree: (() => {
      const fee = toNumber(item.fee ?? item.amount ?? item.certFee ?? item.totalFee ?? 0);
      const rawIsFree = item.isFree;
      if (typeof rawIsFree === "boolean") {
        return fee > 0 ? false : rawIsFree;
      }
      return fee <= 0;
    })(),
    isArchived: Boolean(item.isArchived ?? false),
    // Preserve OR number for Cert No. column
    orNumber: String(item.orNumber ?? item.ORNumber ?? item.orNo ?? item.certNo ?? ""),
  }));
};

const normalizeSummaryRows = (value: unknown) => {
  const items = unwrapArray<Record<string, unknown>>(value);
  return items.map((item) => ({
    id: toNumber(item.id),
    certNumber: String(item.certNumber ?? item.certificateNumber ?? ""),
    requestor: String(item.requestor ?? item.requestorName ?? item.requesterName ?? ""),
    certificateTitle: String(
      item.certificateTitle ?? item.certTitle ?? item.templateName ?? "",
    ),
    fee: toNumber(item.fee ?? item.amount ?? item.totalFee),
    status: String(item.status ?? ""),
    requestedAt: String(item.requestedAt ?? item.dateIssued ?? item.date ?? ""),
  }));
};

const normalizeArchiveRows = (value: unknown) => {
  const items = unwrapArray<Record<string, unknown>>(value);
  return items.map((item) => ({
    id: toNumber(item.id),
    certTitle: String(item.certTitle ?? item.certificateTitle ?? item.templateName ?? ""),
    status: String(item.status ?? ""),
    archivedAt: String(
      item.archivedAt ?? item.archiveDate ?? item.dateArchived ?? item.updatedAt ?? item.date ?? "",
    ),
  }));
};

const normalizeArchiveStats = (value: unknown) => {
  const raw = unwrapObject(value);
  return {
    totalArchiveIssued: toNumber(raw.totalArchiveIssued ?? raw.totalArchivedIssued),
    totalArchiveTemplate: toNumber(raw.totalArchiveTemplate ?? raw.totalArchivedTemplate),
  };
};

const normalizeIssuedStats = (value: unknown) => {
  const raw = unwrapObject(value);
  return {
    totalRevenue: toNumber(raw.totalRevenue),
  };
};

const normalizeDailyCollections = (value: unknown) => {
  const items = unwrapArray<Record<string, unknown>>(value);
  return items.map((item) => ({
    date: String(item.date ?? item.label ?? ""),
    totalCertIssue: toNumber(item.totalCertIssue ?? item.totalIssued ?? item.issuedCount),
    totalCollections: toNumber(item.totalCollections ?? item.collections ?? item.revenue),
  }));
};

const parseDateValue = (value: string): Date | null => {
  const raw = value.trim();
  if (!raw) return null;

  const numeric = Number(raw);
  if (Number.isFinite(numeric)) {
    const fromEpoch = new Date(numeric);
    if (!Number.isNaN(fromEpoch.getTime())) return fromEpoch;
  }

  const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, y, m, d] = dateOnlyMatch;
    const localDate = new Date(Number(y), Number(m) - 1, Number(d));
    if (!Number.isNaN(localDate.getTime())) return localDate;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const asDate = (value: string): Date | null => {
  return parseDateValue(value);
};

const isSameDate = (value: string, target: Date): boolean => {
  const parsed = asDate(value);
  if (!parsed) return false;
  return (
    parsed.getFullYear() === target.getFullYear() &&
    parsed.getMonth() === target.getMonth() &&
    parsed.getDate() === target.getDate()
  );
};

const isVoidedStatus = (status: string): boolean => {
  const normalized = status.trim().toUpperCase();
  return normalized.includes("VOID") || normalized.includes("CANCEL");
};

const pickMetric = (primary: number, fallback: number): number =>
  primary > 0 ? primary : fallback;

const formatDateYmd = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const deriveTopFromSummary = (
  rows: Array<{ certificateTitle: string; status: string }>,
): TopTemplateResponseDTO[] => {
  const grouped = new Map<string, number>();
  rows.forEach((row) => {
    if (!row.certificateTitle || isVoidedStatus(row.status)) return;
    grouped.set(row.certificateTitle, (grouped.get(row.certificateTitle) ?? 0) + 1);
  });

  return [...grouped.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([certificateTitle, issuanceCount]) => ({ certificateTitle, issuanceCount }));
};

const fillWeeklyTrend = (
  data: WeeklyIssuedTrendDTO[],
): WeeklyIssuedTrendDTO[] => {
  const today = new Date();
  const days: Date[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }

  const counts = new Map<string, number>(
    days.map((d) => [formatDateYmd(d), 0]),
  );

  data.forEach((item) => {
    if (!item.date) return;
    const parsed = asDate(item.date);
    if (!parsed) return;
    const key = formatDateYmd(parsed);
    if (counts.has(key)) {
      counts.set(key, counts.get(key)! + (item.count ?? 0));
    }
  });

  return days.map((d) => {
    const key = formatDateYmd(d);
    return { date: key, count: counts.get(key) ?? 0 };
  });
};

const deriveTrendFromSummary = (
  rows: Array<{ requestedAt: string; status: string }>,
): WeeklyIssuedTrendDTO[] => {
  const today = new Date();
  const days: Date[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }

  const counts = new Map<string, number>(
    days.map((d) => [formatDateYmd(d), 0]),
  );

  rows.forEach((row) => {
    if (isVoidedStatus(row.status)) return;
    const parsed = asDate(row.requestedAt);
    if (!parsed) return;
    const key = formatDateYmd(parsed);
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  });

  return days.map((d) => {
    const key = formatDateYmd(d);
    return { date: key, count: counts.get(key) ?? 0 };
  });
};

const deriveRecentFromSummary = (
  rows: Array<{
    certNumber: string;
    requestor: string;
    certificateTitle: string;
    fee: number;
    requestedAt: string;
    status: string;
  }>,
): Array<Record<string, unknown>> => {
  return [...rows]
    .filter((row) => !isVoidedStatus(row.status))
    .sort((a, b) => {
      const ad = asDate(a.requestedAt)?.getTime() ?? 0;
      const bd = asDate(b.requestedAt)?.getTime() ?? 0;
      return bd - ad;
    })
    .slice(0, 10)
    .map((row) => ({
      // Standard DTO fields
      requestorName: row.requestor,
      certificateType: row.certificateTitle,
      date: row.requestedAt,
      status: row.status || "PENDING",
      // Rich fields for dashboard table columns
      certNumber: row.certNumber,       // → Cert No. column
      orNumber: row.certNumber,         // → also matched by Cert No. column fallback
      requestor: row.requestor,         // → Requestor column
      requesterName: row.requestor,     // → Requestor column fallback
      certificateTitle: row.certificateTitle, // → Certificate column
      fee: row.fee,                     // → Fee column
      isFree: row.fee <= 0,            // → Fee column free detection
      requestedAt: row.requestedAt,     // → Date column
      dateIssued: row.requestedAt,      // → Date column fallback
    }));
};

const deriveTopFromIssued = (
  rows: Array<{ certificateType: string; status: string; isArchived: boolean }>,
): TopTemplateResponseDTO[] => {
  const grouped = new Map<string, number>();
  rows.forEach((row) => {
    if (!row.certificateType || row.isArchived || isVoidedStatus(row.status)) return;
    grouped.set(row.certificateType, (grouped.get(row.certificateType) ?? 0) + 1);
  });

  return [...grouped.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([certificateTitle, issuanceCount]) => ({ certificateTitle, issuanceCount }));
};

const deriveTrendFromIssued = (
  rows: Array<{ dateIssued: string; status: string; isArchived: boolean }>,
): WeeklyIssuedTrendDTO[] => {
  const today = new Date();
  const days: Date[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }

  const counts = new Map<string, number>(days.map((d) => [formatDateYmd(d), 0]));

  rows.forEach((row) => {
    if (row.isArchived || isVoidedStatus(row.status)) return;
    const parsed = asDate(row.dateIssued);
    if (!parsed) return;
    const key = formatDateYmd(parsed);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return days.map((d) => ({ date: formatDateYmd(d), count: counts.get(formatDateYmd(d)) ?? 0 }));
};

const deriveRecentFromIssued = (
  rows: Array<{
    requesterName: string;
    certificateType: string;
    dateIssued: string;
    status: string;
    isArchived: boolean;
    orNumber?: string;
    fee?: number;
    isFree?: boolean;
  }>,
): Array<RecentRequestResponseDTO & { requesterName: string; orNumber?: string; fee?: number; isFree?: boolean }> => {
  return [...rows]
    .filter((row) => !row.isArchived)
    .sort((a, b) => {
      const ad = asDate(a.dateIssued)?.getTime() ?? 0;
      const bd = asDate(b.dateIssued)?.getTime() ?? 0;
      return bd - ad;
    })
    .slice(0, 10)
    .map((row) => ({
      requestorName: row.requesterName,
      requesterName: row.requesterName,
      certificateType: row.certificateType,
      date: row.dateIssued,
      dateIssued: row.dateIssued,
      status: row.status || "PENDING",
      orNumber: row.orNumber,
      fee: row.fee,
      isFree: row.isFree,
    }));
};

function SectionCard({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-5 ${className || ""}`}>
      <div className="mb-5">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        {subtitle ? <p className="text-sm text-gray-500 mt-1">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

export const ClearanceDashboard = () => {
  const [kpiData, setKpiData] = React.useState<DashboardStatsResponseDTO | null>(
    null,
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recentCerts, setRecentCerts] = React.useState<Record<string, any>[]>(
    [],
  );
  const [topCertTypes, setTopCertTypes] = React.useState<TopTemplateResponseDTO[]>(
    [],
  );
  const [weeklyTrend, setWeeklyTrend] = React.useState<WeeklyIssuedTrendDTO[]>(
    [],
  );
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");

  const navigate = useNavigate();

  const revenueFormatted = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(kpiData?.revenueToday || 0);

  const numberFormatted = (num: number) =>
    new Intl.NumberFormat("en-US").format(num);

  const columns: ColumnDef<any>[] = [
    {
      header: "Date",
      render: (row) => {
        const rawDate = row.dateIssued || row.requestedAt || row.date || "";
        if (!rawDate) return "-";
        // Parse YYYY-MM-DD locally to avoid timezone shift
        const match = String(rawDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
          const local = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
          return local.toLocaleDateString("en-PH");
        }
        const parsed = new Date(rawDate);
        return isNaN(parsed.getTime()) ? rawDate : parsed.toLocaleDateString("en-PH");
      },
    },
    {
      header: "Cert No.",
      render: (row) => {
        const certNo = row.orNumber || row.certNumber || row.certificateNumber || "";
        if (!certNo) return <span className="text-gray-400 text-xs">—</span>;
        return <span className="font-mono text-xs">{certNo}</span>;
      },
    },
    {
      header: "Requestor",
      render: (row) => {
        const name = row.requesterName || row.requestorName || row.requestor || "";
        return name || <span className="text-gray-400 text-xs">—</span>;
      },
    },
    {
      header: "Certificate",
      render: (row) => {
        const cert = row.certificateType || row.certificateTitle || row.certTitle || "";
        return cert || <span className="text-gray-400 text-xs">—</span>;
      },
    },
    {
      header: "Fee",
      render: (row) => {
        const fee = Number(row.fee ?? row.amount ?? row.certFee ?? row.totalFee ?? 0);
        if (fee > 0) return `₱${fee.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
        if (row.isFree) return <span className="text-emerald-600 text-xs font-medium">Free</span>;
        return <span className="text-gray-400 text-xs">—</span>;
      },
    },
    {
      header: "Status",
      render: (row) => {
        const normalizedStatus = String(row.status || "").trim().toUpperCase();
        const isReleased = normalizedStatus.includes("RELEASE") || normalizedStatus === "ISSUED";
        const isVoided = normalizedStatus.includes("VOID") || normalizedStatus.includes("CANCEL");
        return (
          <span
            className={`px-2 py-1 text-xs rounded border font-medium ${
              isReleased
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : isVoided
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {row.status || "PENDING"}
          </span>
        );
      },
    },
  ];

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const today = new Date();
        const todayYmd = formatDateYmd(today);

        const [
          stats,
          certs,
          top,
          trend,
          summary,
          archives,
          archiveStats,
          dailyCollections,
          issuedList,
          issuedStats,
          templateOptions,
        ] = await Promise.allSettled([
          clearanceDashboardApi.getStats(),
          clearanceDashboardApi.getRecentIssued(),
          clearanceDashboardApi.getTopTemplates(),
          clearanceDashboardApi.getWeeklyTrend(),
          clearanceTemplateApi.getSummaryTable(),
          clearanceTemplateApi.getAllArchives(),
          clearanceTemplateApi.getArchiveStats(),
          revenueApi.getDailyCollections(todayYmd, todayYmd),
          fetchIssuedCertificates(0, 500),
          fetchIssuedStats(),
          fetchTemplateOptionsWithStatus(),
        ]);

        const failedSections: string[] = [];
        const summaryRows =
          summary.status === "fulfilled" ? normalizeSummaryRows(summary.value) : [];
        const archiveRows =
          archives.status === "fulfilled" ? normalizeArchiveRows(archives.value) : [];
        const archiveStatRow =
          archiveStats.status === "fulfilled"
            ? normalizeArchiveStats(archiveStats.value)
            : { totalArchiveIssued: 0, totalArchiveTemplate: 0 };
        const dailyRows =
          dailyCollections.status === "fulfilled"
            ? normalizeDailyCollections(dailyCollections.value)
            : [];
        const issuedRows =
          issuedList.status === "fulfilled" ? normalizeIssuedRows(issuedList.value) : [];
        const issuedStatsRow =
          issuedStats.status === "fulfilled"
            ? normalizeIssuedStats(issuedStats.value)
            : { totalRevenue: 0 };
        const archivedTemplateCountFromOptions =
          templateOptions.status === "fulfilled"
            ? templateOptions.value.filter((option) => option.isArchived).length
            : 0;

        const issuedTodayFallbackFromSummary = summaryRows.filter(
          (row) => isSameDate(row.requestedAt, today) && !isVoidedStatus(row.status),
        ).length;
        const issuedTodayFallbackFromIssued = issuedRows.filter(
          (row) =>
            isSameDate(row.dateIssued, today) &&
            !isVoidedStatus(row.status),
        ).length;
        const freeTodayFallbackFromSummary = summaryRows.filter(
          (row) =>
            isSameDate(row.requestedAt, today) &&
            !isVoidedStatus(row.status) &&
            row.fee <= 0,
        ).length;
        const freeTodayFallbackFromIssued = issuedRows.filter(
          (row) =>
            isSameDate(row.dateIssued, today) &&
            !row.isArchived &&
            !isVoidedStatus(row.status) &&
            (row.isFree || row.fee <= 0),
        ).length;
        const revenueTodayFallbackFromSummary = summaryRows
          .filter(
            (row) => isSameDate(row.requestedAt, today) && !isVoidedStatus(row.status),
          )
          .reduce((sum, row) => sum + row.fee, 0);
        const revenueTodayFallbackFromIssued = issuedRows
          .filter(
            (row) =>
              isSameDate(row.dateIssued, today) &&
              !row.isArchived &&
              !isVoidedStatus(row.status),
          )
          .reduce((sum, row) => sum + row.fee, 0);
        const totalRevenueFallbackFromIssued = issuedRows
          .filter((row) => !row.isArchived && !isVoidedStatus(row.status))
          .reduce((sum, row) => sum + row.fee, 0);

        const dailyToday = dailyRows.filter((row) => isSameDate(row.date, today));
        const issuedTodayFallbackFromDaily = dailyToday.reduce(
          (sum, row) => sum + row.totalCertIssue,
          0,
        );
        const revenueTodayFallbackFromDaily = dailyToday.reduce(
          (sum, row) => sum + row.totalCollections,
          0,
        );
        const archivedTodayFallbackFromArchives = archiveRows.filter((row) =>
          isSameDate(row.archivedAt, today),
        ).length;
        const archivedTodayFallbackFromIssued = issuedRows.filter(
          (row) => row.isArchived && isSameDate(row.dateIssued, today),
        ).length;
        const archivedIssuedTotalFromRows = issuedRows.filter((row) => row.isArchived).length;
        const archivedIssuedTotalFromArchiveTable = archiveRows.length;
        const archivedIssuedTotal = Math.max(
          archiveStatRow.totalArchiveIssued,
          archivedIssuedTotalFromRows,
          archivedIssuedTotalFromArchiveTable,
        );
        const archivedTemplateTotal = Math.max(
          archivedTemplateCountFromOptions,
          archiveStatRow.totalArchiveTemplate,
        );
        const archivedTotalFallback = archivedIssuedTotal + archivedTemplateTotal;

        const fallbackKpi: DashboardStatsResponseDTO = {
          totalIssuedToday:
            issuedTodayFallbackFromSummary > 0
              ? issuedTodayFallbackFromSummary
              : issuedTodayFallbackFromIssued > 0
                ? issuedTodayFallbackFromIssued
                : issuedTodayFallbackFromDaily,
          revenueToday:
            revenueTodayFallbackFromDaily > 0
              ? revenueTodayFallbackFromDaily
              : revenueTodayFallbackFromSummary > 0
                ? revenueTodayFallbackFromSummary
                : revenueTodayFallbackFromIssued > 0
                  ? revenueTodayFallbackFromIssued
                  : totalRevenueFallbackFromIssued > 0
                    ? totalRevenueFallbackFromIssued
                    : issuedStatsRow.totalRevenue,
          totalArchiveToday:
            archivedTodayFallbackFromArchives > 0 || archivedTodayFallbackFromIssued > 0
              ? archivedTodayFallbackFromArchives + archivedTodayFallbackFromIssued
              : archivedTotalFallback,
          totalFreeCertsReleaseToday:
            freeTodayFallbackFromSummary > 0
              ? freeTodayFallbackFromSummary
              : freeTodayFallbackFromIssued,
        };

        const derivedRecent = deriveRecentFromSummary(summaryRows);
        const derivedTop = deriveTopFromSummary(summaryRows);
        const derivedTrend = deriveTrendFromSummary(summaryRows);
        // Always prefer issuedRows for recent/top/trend since they have orNumber, fee, requesterName
        const derivedRecentFromIssued = deriveRecentFromIssued(issuedRows);
        const derivedTopFromIssued = deriveTopFromIssued(issuedRows);
        const derivedTrendFromIssued = deriveTrendFromIssued(issuedRows);

        if (summary.status === "rejected") failedSections.push("summary table");
        if (archives.status === "rejected") failedSections.push("archive table");
        if (archiveStats.status === "rejected") failedSections.push("archive stats");
        if (dailyCollections.status === "rejected") failedSections.push("daily collections");
        if (issuedList.status === "rejected") failedSections.push("issued records");
        if (issuedStats.status === "rejected") failedSections.push("issued stats");
        if (templateOptions.status === "rejected") failedSections.push("template options");

        if (stats.status === "fulfilled") {
          const normalizedStats = normalizeStats(stats.value);
          setKpiData({
            totalIssuedToday: pickMetric(
              normalizedStats.totalIssuedToday,
              fallbackKpi.totalIssuedToday,
            ),
            revenueToday: pickMetric(normalizedStats.revenueToday, fallbackKpi.revenueToday),
            totalArchiveToday: pickMetric(
              normalizedStats.totalArchiveToday,
              fallbackKpi.totalArchiveToday,
            ),
            totalFreeCertsReleaseToday: pickMetric(
              normalizedStats.totalFreeCertsReleaseToday,
              fallbackKpi.totalFreeCertsReleaseToday,
            ),
          });
        } else {
          setKpiData(fallbackKpi);
          failedSections.push("stats");
        }

        if (certs.status === "fulfilled") {
          // Prefer summaryRows — they have certNumber from /summary-table
          // Fall back to issuedRows (have fee + requesterName but no certNumber)
          const richSummary = summaryRows.length > 0 ? deriveRecentFromSummary(summaryRows) : [];
          const richIssued = issuedRows.length > 0 ? derivedRecentFromIssued : [];
          setRecentCerts(
            richSummary.length > 0
              ? richSummary
              : richIssued.length > 0
                ? richIssued
                : derivedRecent,
          );
        } else {
          // API failed — still prefer summaryRows for certNumber
          const richSummary = summaryRows.length > 0 ? deriveRecentFromSummary(summaryRows) : [];
          setRecentCerts(
            richSummary.length > 0
              ? richSummary
              : derivedRecentFromIssued.length > 0
                ? derivedRecentFromIssued
                : derivedRecent,
          );
          failedSections.push("recent issued");
        }

        if (top.status === "fulfilled") {
          const normalizedTop = normalizeTopTemplates(top.value);
          setTopCertTypes(
            normalizedTop.length > 0
              ? normalizedTop
              : derivedTop.length > 0
                ? derivedTop
                : derivedTopFromIssued,
          );
        } else {
          setTopCertTypes(derivedTop.length > 0 ? derivedTop : derivedTopFromIssued);
          failedSections.push("top templates");
        }

        if (trend.status === "fulfilled") {
          const normalizedTrend = normalizeWeeklyTrend(trend.value);
          const chosenTrend =
            normalizedTrend.length > 0
              ? normalizedTrend
              : derivedTrend.some((row) => row.count > 0)
                ? derivedTrend
                : derivedTrendFromIssued;
          setWeeklyTrend(fillWeeklyTrend(chosenTrend));
        } else {
          const chosenTrend =
            derivedTrend.some((row) => row.count > 0) ? derivedTrend : derivedTrendFromIssued;
          setWeeklyTrend(fillWeeklyTrend(chosenTrend));
          failedSections.push("weekly trend");
        }

        if (failedSections.length > 0) {
          const totalSections = 11;
          setErrorMessage(
            failedSections.length >= totalSections
              ? "Unable to load dashboard data. Please try again."
              : `Some dashboard sections failed to load: ${failedSections.join(", ")}.`,
          );
        }
      } catch (err) {
        console.error("Failed to load clearance dashboard", err);
        setErrorMessage("Unable to load all dashboard data. Showing available data.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <LoadingModal isOpen message="Loading dashboard..." />;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {errorMessage && (
          <div className="bg-amber-50 text-amber-700 border border-amber-200 rounded-lg px-4 py-3 text-sm">
            {errorMessage}
          </div>
        )}

        <KPIGrid columns={4}>
          <KPICard
            title="Issued Today"
            value={numberFormatted(kpiData?.totalIssuedToday || 0)}
            icon={KPIIcons.issued}
            color="amber"
            subtitle="Certificates issued today"
          />
          <KPICard
            title="Revenue"
            value={revenueFormatted}
            icon={KPIIcons.revenue}
            color="blue"
            subtitle="Today, with fallback from issued records"
          />
          <KPICard
            title="Archived Records"
            value={numberFormatted(kpiData?.totalArchiveToday || 0)}
            icon={KPIIcons.month}
            color="emerald"
            subtitle="Archived certificates and templates"
          />
          <KPICard
            title="Free Certificates"
            value={numberFormatted(kpiData?.totalFreeCertsReleaseToday || 0)}
            icon={KPIIcons.pending}
            color="rose"
            subtitle="Released free certificates"
          />
        </KPIGrid>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <SectionCard
            title="Issuance Trend (Weekly)"
            subtitle="Daily clearance issuance count"
            className="lg:col-span-8"
          >
            <div className="h-64">
              {weeklyTrend.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-500">
                  No issuance trend data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => {
                        // Parse YYYY-MM-DD as local date to avoid timezone shift
                        const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
                        if (m) {
                          const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
                          return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                        }
                        return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      }}
                      fontSize={12}
                    />
                    <YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip
                      formatter={(value) => [numberFormatted(Number(value)), "Issued"]}
                      labelFormatter={(value) => {
                        const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
                        if (m) {
                          const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
                          return d.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
                        }
                        return new Date(value).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
                      }}
                    />
                    <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </SectionCard>

          <div className="bg-white rounded-lg border border-gray-200 lg:col-span-4 flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Top Certificates</h3>
              <p className="text-sm text-gray-500 mt-1">Most frequently issued templates</p>
            </div>
            <div className="p-5 space-y-3 flex-1">
              {topCertTypes.length === 0 ? (
                <p className="text-sm text-gray-500">No top template data available.</p>
              ) : (
                topCertTypes.map((item, index) => (
                  <div
                    key={`${item.certificateTitle}-${index}`}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-sm text-gray-700 truncate">{item.certificateTitle}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {numberFormatted(item.issuanceCount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Recent Issued Certificates</h3>
              <p className="text-sm text-gray-500 mt-1">Latest certificate records from clearance API</p>
            </div>
            <button
              className="text-sm font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
              onClick={() => navigate("/clearance/issued-certificates")}
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <ResponsiveTable
            title=""
            data={recentCerts}
            columns={columns}
          />
        </div>
      </div>
    </div>
  );
};

export default ClearanceDashboard;