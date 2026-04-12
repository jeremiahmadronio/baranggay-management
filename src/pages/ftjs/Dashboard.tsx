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
  Calendar,
  CheckCircle,
  Clock,
  FileBadge2,
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
} from "../../service/ftjs/FirstTimeJobSeekerDashboard";
import {
  CHART_COLORS,
  formatDateTime,
  formatStatusLabel,
  getStatusBadgeClass,
  getStatusDescription,
  SectionCard,
} from "./shared";

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

export default function FtjsDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStatsResponseDTO | null>(null);
  const [lastSixMonths, setLastSixMonths] = useState<TrendResponseDTO[]>([]);
  const [lastWeek, setLastWeek] = useState<TrendResponseDTO[]>([]);
  const [distribution, setDistribution] = useState<StatusCountDTO[]>([]);
  const [recentIssues, setRecentIssues] = useState<FtjsRecentIssueDTO[]>([]);
  const [loading, setLoading] = useState(true);

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

    fetchDashboard();
  }, []);

  const totalStatuses = useMemo(
    () => distribution.reduce((sum, item) => sum + (item.total || 0), 0),
    [distribution],
  );

  const cardValue = (value?: number | null) => {
    if (loading) return <CircleLoader size="sm" />;
    return value ?? 0;
  };

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
              ) : lastSixMonths.length === 0 ? (
                <NoRecords text="No FTJS trend data available." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={lastSixMonths}
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
                    <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={42}>
                      {lastSixMonths.map((_, index) => (
                        <Cell
                          key={index}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
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
            title="Last Week Activity"
            subtitle="Daily FTJS counts for the past seven days"
            className="lg:col-span-4"
          >
            {loading ? (
              <CenteredLoader minHeight="min-h-[240px]" />
            ) : lastWeek.length === 0 ? (
              <NoRecords text="No FTJS weekly activity yet." />
            ) : (
              <div className="space-y-4">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={lastWeek}
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

                <div className="space-y-3">
                  {lastWeek.map((item) => (
                    <div
                      key={`${item.label}-${item.total}`}
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 bg-gray-50/60"
                    >
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-100 text-blue-700 p-2 rounded-lg">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.label}
                          </p>
                          <p className="text-xs text-gray-500">Daily total</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {item.total}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => navigate("/first-time-job-seeker/entry")}
            className="bg-white rounded-lg border border-gray-200 p-5 text-left hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
          >
            <div className="inline-flex items-center justify-center p-3 rounded-lg bg-blue-100 text-blue-700 mb-3">
              <FileBadge2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              Create New FTJS Entry
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Encode new first-time job seeker request using the FTJS entry
              workflow.
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate("/first-time-job-seeker/management")}
            className="bg-white rounded-lg border border-gray-200 p-5 text-left hover:border-violet-300 hover:bg-violet-50/30 transition-colors"
          >
            <div className="inline-flex items-center justify-center p-3 rounded-lg bg-violet-100 text-violet-700 mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              Manage Active Requests
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Review, annotate, edit, and process FTJS records in one place.
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate("/first-time-job-seeker/reports")}
            className="bg-white rounded-lg border border-gray-200 p-5 text-left hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors"
          >
            <div className="inline-flex items-center justify-center p-3 rounded-lg bg-emerald-100 text-emerald-700 mb-3">
              <Archive className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              Open FTJS Reports
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Inspect archive totals, trend charts, and report case listings.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
