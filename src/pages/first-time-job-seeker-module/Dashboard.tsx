import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  ArrowRight,
  Archive,
  CheckCircle,
  FolderArchive,
} from "lucide-react";
import { KPICard, KPIGrid, KPIIcons } from "../../hooks/KPICard";
import {
  CenteredLoader,
  CircleLoader,
  NoRecords,
} from "../../hooks/LoadingStates";
import {
  ftjsDashboardApi,
  type DashboardStatsResponseDTO,
  type FtjsRecentIssueDTO,
  type StatusCountDTO,
  type TrendResponseDTO,
} from "../../service/first-time-job-seeker-api/FirstTimeJobSeekerDashboard";
import {
  FTJS_PERMISSIONS,
  hasFtjsPermission,
} from "../../service/first-time-job-seeker-api/FirstTimeJobSeeker";
import { PermissionDeniedPage } from "../blotter-module/reusable/PermissionDeniedPage";
import {
  formatDateTime,
  formatStatusLabel,
  getStatusBadgeClass,
  getStatusDescription,
  SectionCard,
} from "./shared";
import { useFtjsAccess } from "./useFtjsAccess";

const DONUT_COLORS = [
  "#2563EB",
  "#0EA5E9",
  "#14B8A6",
  "#8B5CF6",
  "#F59E0B",
  "#64748B",
];

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(status)}`}
    >
      {formatStatusLabel(status)}
    </span>
  );
}

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

function normalizeMonthName(value: string): string {
  return value.slice(0, 3).toLowerCase();
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short" });
}

function getDayStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDayKey(date: Date): string {
  return date.toLocaleDateString("en-CA");
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

  return null;
}

function buildLastSixMonthsTrend(data: TrendResponseDTO[]): TrendResponseDTO[] {
  const currentMonth = getMonthStart(new Date());
  const buckets: Array<{ key: string; label: string }> = [];
  const cursor = new Date(currentMonth);
  cursor.setMonth(cursor.getMonth() - 5);

  while (cursor <= currentMonth) {
    buckets.push({
      key: formatMonthKey(cursor),
      label: formatMonthLabel(cursor),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const totals = new Map<string, number>();
  data.forEach((item) => {
    const parsedDate = parseTrendPointDate(item.label, currentMonth.getFullYear());
    if (!parsedDate) return;
    const key = formatMonthKey(getMonthStart(parsedDate));
    totals.set(key, (totals.get(key) || 0) + (item.total || 0));
  });

  return buckets.map((bucket) => ({
    label: bucket.label,
    total: totals.get(bucket.key) || 0,
  }));
}

function buildRecentWeekTrend(
  data: TrendResponseDTO[],
  recentIssues: FtjsRecentIssueDTO[],
): TrendResponseDTO[] {
  const today = getDayStart(new Date());
  const startDay = new Date(today);
  startDay.setDate(today.getDate() - 6);
  const endDay = new Date(today);

  const buckets: Array<{ key: string; label: string }> = [];
  const cursor = new Date(startDay);
  while (cursor <= endDay) {
    buckets.push({
      key: formatDayKey(cursor),
      label: formatDayLabel(cursor),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const totals = new Map<string, number>();
  data.forEach((item) => {
    const parsedDate = parseTrendPointDate(item.label, endDay.getFullYear());
    if (!parsedDate) return;
    const day = getDayStart(parsedDate);
    if (day < startDay || day > endDay) return;
    const key = formatDayKey(day);
    totals.set(key, (totals.get(key) || 0) + (item.total || 0));
  });

  const hasWeeklyTotals = Array.from(totals.values()).some((value) => value > 0);
  if (!hasWeeklyTotals) {
    recentIssues.forEach((item) => {
      const parsedDate = new Date(item.createdAt);
      if (Number.isNaN(parsedDate.getTime())) return;
      const day = getDayStart(parsedDate);
      if (day < startDay || day > endDay) return;
      const key = formatDayKey(day);
      totals.set(key, (totals.get(key) || 0) + 1);
    });
  }

  return buckets.map((bucket) => ({
    label: bucket.label,
    total: totals.get(bucket.key) || 0,
  }));
}

export default function FtjsDashboardPage() {
  const navigate = useNavigate();
  const { accessLoading, userAccess } = useFtjsAccess();
  const [stats, setStats] = useState<DashboardStatsResponseDTO | null>(null);
  const [lastSixMonths, setLastSixMonths] = useState<TrendResponseDTO[]>([]);
  const [lastWeek, setLastWeek] = useState<TrendResponseDTO[]>([]);
  const [distribution, setDistribution] = useState<StatusCountDTO[]>([]);
  const [recentIssues, setRecentIssues] = useState<FtjsRecentIssueDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const canViewRecords = hasFtjsPermission(
    userAccess,
    FTJS_PERMISSIONS.VIEW_RECORDS,
  );

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        const [
          statsRes,
          sixMonthsRes,
          lastWeekRes,
          distributionRes,
          recentRes,
        ] = await Promise.all([
          ftjsDashboardApi.getStats(),
          ftjsDashboardApi.getLastSixMonthsTrend(),
          ftjsDashboardApi.getLastWeekTrend(),
          ftjsDashboardApi.getStatusDistribution(),
          ftjsDashboardApi.getRecentIssues(),
        ]);

        setStats(statsRes);
        setLastSixMonths(sixMonthsRes);
        setLastWeek(lastWeekRes);
        setDistribution(distributionRes);
        setRecentIssues(recentRes);
      } catch (error) {
        console.error(
          error instanceof Error
            ? error.message
            : "Failed to load FTJS dashboard.",
        );
      } finally {
        setLoading(false);
      }
    }

    if (!accessLoading && canViewRecords) {
      fetchDashboard();
      return;
    }

    if (!accessLoading) {
      setLoading(false);
    }
  }, [accessLoading, canViewRecords]);

  const totalStatuses = useMemo(
    () => distribution.reduce((sum, item) => sum + (item.total || 0), 0),
    [distribution],
  );

  const normalizedSixMonths = useMemo(
    () => buildLastSixMonthsTrend(lastSixMonths),
    [lastSixMonths],
  );

  const normalizedLastWeek = useMemo(
    () => buildRecentWeekTrend(lastWeek, recentIssues),
    [lastWeek, recentIssues],
  );

  const cardValue = (value?: number | null) => {
    if (loading) return <CircleLoader size="sm" />;
    return value ?? 0;
  };

  if (accessLoading) {
    return <CenteredLoader minHeight="min-h-[70vh]" />;
  }

  if (!canViewRecords) {
    return (
      <PermissionDeniedPage
        message="You do not have permission to view FTJS records."
        hint="Ask your administrator to grant the View FTJS Records permission."
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <KPIGrid columns={4}>
          <KPICard
            title="Issued Today"
            value={cardValue(stats?.totalIssueToday)}
            color="blue"
            icon={<CheckCircle className="w-6 h-6" />}
            subtitle="Certificates released today"
          />
          <KPICard
            title="Issued Last Week"
            value={cardValue(stats?.totalIssueLastWeek)}
            color="emerald"
            icon={KPIIcons.issued}
            subtitle="Released across the last 7 days"
          />
          <KPICard
            title="Archived This Week"
            value={cardValue(stats?.totalArchiveThisWeek)}
            color="slate"
            icon={<FolderArchive className="w-6 h-6" />}
            subtitle="Requests moved to archive"
          />
          <KPICard
            title="Non-resident This Week"
            value={cardValue(stats?.totalNonResidentIssueThisWeek)}
            color="amber"
            icon={<Archive className="w-6 h-6" />}
            subtitle="Walk-in / non-resident issuances"
          />
        </KPIGrid>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard
            title="Last 6 Months Trend"
            subtitle="Monthly FTJS processing and issuance activity"
          >
            <div className="h-72">
              {loading ? (
                <CenteredLoader minHeight="min-h-[288px]" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={normalizedSixMonths}
                    margin={{ top: 8, right: 8, left: -16, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      vertical={false}
                      stroke="#D1D5DB"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: "#4B5563" }}
                      tickLine={false}
                      interval={0}
                      minTickGap={12}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: "#4B5563" }}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "#EFF6FF" }}
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #E5E7EB",
                        fontSize: 12,
                      }}
                      formatter={(value?: number) => [value ?? 0, "Total"]}
                    />
                    <Bar
                      dataKey="total"
                      fill="#2563EB"
                      radius={[6, 6, 0, 0]}
                      barSize={42}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Status Distribution"
            subtitle="Current spread of FTJS request states"
          >
            {loading ? (
              <CenteredLoader minHeight="min-h-[288px]" />
            ) : distribution.length === 0 ? (
              <NoRecords text="No FTJS status distribution yet." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distribution}
                        dataKey="total"
                        nameKey="status"
                        innerRadius={62}
                        outerRadius={94}
                        paddingAngle={1.5}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      >
                        {distribution.map((_, index) => (
                          <Cell
                            key={`ftjs-status-${index}`}
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
                      {totalStatuses.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Total tracked statuses
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <SectionCard
            title="Recent FTJS Issues"
            subtitle="Latest certificates and requests processed"
            className="lg:col-span-8"
          >
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={() => navigate("/first-time-job-seeker/management")}
                className="text-sm font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
              >
                Open Management <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      FTJS No.
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10">
                        <CenteredLoader minHeight="min-h-[120px]" />
                      </td>
                    </tr>
                  ) : recentIssues.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10">
                        <NoRecords text="No recent FTJS issues." />
                      </td>
                    </tr>
                  ) : (
                    recentIssues.map((item) => (
                      <tr
                        key={`${item.ftjsNumber}-${item.createdAt}`}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-600">
                          {item.ftjsNumber}
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-semibold">
                          {item.fullName}
                        </td>
                        <td className="px-6 py-4">
                          <StatusPill status={item.status} />
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {formatDateTime(item.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard
            title="Recent Week Activity"
            subtitle="Daily FTJS counts for the last 7 days"
            className="lg:col-span-4"
          >
            {loading ? (
              <CenteredLoader minHeight="min-h-[240px]" />
            ) : (
              <div className="space-y-4">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={normalizedLastWeek}
                      margin={{ top: 8, right: 0, left: -28, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#E5E7EB"
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 12, fill: "#64748B" }}
                        tickLine={false}
                        interval={0}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: "#64748B" }}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          border: "1px solid #E5E7EB",
                          fontSize: 12,
                        }}
                        formatter={(value?: number) => [value ?? 0, "Total"]}
                      />
                      <Bar
                        dataKey="total"
                        fill="#2563EB"
                        radius={[6, 6, 0, 0]}
                        barSize={26}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
