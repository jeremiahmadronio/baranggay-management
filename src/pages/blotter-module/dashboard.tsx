import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Calendar,
  ArrowRight,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { KPICard, KPIGrid } from "../../hooks/KPICard";
import * as api from "../../service/blotter-api/Dashboard";
import { useNavigate } from "react-router-dom";
import {
  CenteredLoader,
  CircleLoader,
  NoRecords,
} from "../../hooks/LoadingStates";

const DONUT_COLORS = ["#38BDF8", "#2563EB", "#60A5FA", "#93C5FD"];

function getDistributionColor(status: string, index: number): string {
  const key = String(status || "")
    .toUpperCase()
    .replace(/\s+/g, "_");

  const map: Record<string, string> = {
    PENDING: "#c98e46",
    UNDER_MEDIATION: "#2e4888",
    UNDER_CONCILIATION: "#38BDF8",
    REFERRED_TO_LUPON: "#1D4ED8",
    SETTLED: "#3bbe5a",
    DISMISSED: "#DC2626",
    CERTIFIED_TO_FILE_ACTION: "#4F46E5",
    EXPIRED_UNACTIONED: "#B91C1C",
    WITHDRAWN: "#64748B",
    CLOSED: "#64748B",
    RECORDED: "#12b6e7",
    UNDER_INVESTIGATION: "#93C5FD",
    ESCALATED: "#2563EB",
    ELEVATED_TO_FORMAL: "#4F46E5",
  };

  return map[key] ?? DONUT_COLORS[index % DONUT_COLORS.length];
}

function getStatusDistributionDescription(status: string): string {
  const key = status.toUpperCase().replace(/\s+/g, "_");
  const map: Record<string, string> = {
    PENDING: "Awaiting initial handling",
    RECORDED: "Logged in blotter records",
    UNDER_INVESTIGATION: "Currently under investigation",
    UNDER_MEDIATION: "Mediation ongoing",
    SETTLED: "Resolved through mediation",
    UNSETTLED: "Not resolved during mediation",
    REFERRED_TO_LUPON: "Forwarded to lupon process",
    ESCALATED: "Escalated for further action",
    ELEVATED_TO_FORMAL: "Converted to formal complaint",
    CLOSED: "Case process completed",
  };
  return map[key] ?? "Case lifecycle status";
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
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

const getCaseStatusBadge = (statusRaw: string) => {
  const status = String(statusRaw || "").toUpperCase();
  if (status === "PENDING")
    return "bg-amber-50 text-amber-700 border border-amber-300";
  if (status === "UNDER_MEDIATION")
    return "bg-blue-50 text-blue-700 border border-blue-300";
  if (status === "UNDER_CONCILIATION")
    return "bg-indigo-50 text-indigo-700 border border-indigo-300";
  if (status === "REFERRED_TO_LUPON")
    return "bg-violet-50 text-violet-700 border border-violet-300";
  if (status === "SETTLED")
    return "bg-emerald-50 text-emerald-700 border border-emerald-300";
  if (status === "DISMISSED")
    return "bg-rose-50 text-rose-700 border border-rose-300";
  if (status === "CERTIFIED_TO_FILE_ACTION")
    return "bg-cyan-50 text-cyan-700 border border-cyan-300";
  if (status === "EXPIRED_UNACTIONED")
    return "bg-red-50 text-red-700 border border-red-300";
  if (status === "WITHDRAWN")
    return "bg-orange-50 text-orange-700 border border-orange-300";
  if (status === "CLOSED")
    return "bg-slate-50 text-slate-700 border border-slate-300";
  return "bg-slate-50 text-slate-700 border border-slate-300";
};

const BlotterDashboard = () => {
  const [stats, setStats] = useState<api.DashboardStatsDTO | null>(null);
  const [chartData, setChartData] = useState<api.MonthlyCaseChartDTO[]>([]);
  const [distribution, setDistribution] = useState<
    api.CaseStatusDistributionDTO[]
  >([]);
  const [recentCases, setRecentCases] = useState<api.RecentCaseDTO[]>([]);
  const [hearings, setHearings] = useState<api.UpcomingHearingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [s, c, d, r, h] = await Promise.all([
          api.getMainStats(),
          api.getMonthlyChart(),
          api.getCaseDistribution(),
          api.getRecentCases(),
          api.getUpcomingHearings(),
        ]);

        setStats(s);
        setChartData(c);
        // Format names directly here para sa Legend ng Pie Chart
        setDistribution(
          d.map((item) => ({
            ...item,
            status: formatStatusText(item.status),
          })),
        );
        setRecentCases(r);
        setHearings(h);
      } catch (error) {
        console.error("Failed to load dashboard data:");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helper: CERTIFIED_TO_FILE_ACTION -> Certified To File Action
  const formatStatusText = (text: string) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateStr));
  };

  const formatTime = (dateStr: string) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  };

  const cardValue = (value?: number | null) => {
    if (loading) return <CircleLoader size="sm" />;
    if (value === undefined || value === null) return 0;
    return value;
  };

  const totalDistribution = distribution.reduce(
    (sum, item) => sum + (item.count || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <KPIGrid columns={4}>
          <KPICard
            title="Hearings Today"
            value={cardValue(stats?.hearingsToday)}
            color="blue"
            icon={<Clock className="w-6 h-6" />}
            subtitle="Scheduled for today"
          />
          <KPICard
            title="Pending New Cases"
            value={cardValue(stats?.pendingNewCases)}
            color="amber"
            icon={<FileText className="w-6 h-6" />}
            subtitle="Awaiting initial action"
          />
          <KPICard
            title="Nearing Deadline"
            value={cardValue(stats?.nearingDeadline)}
            color="rose"
            icon={<AlertCircle className="w-6 h-6" />}
            subtitle="Cases within 5 days"
          />
          <KPICard
            title="Settled This Month"
            value={cardValue(stats?.settledThisMonth)}
            color="emerald"
            icon={<CheckCircle className="w-6 h-6" />}
            subtitle="Successfully mediated"
          />
        </KPIGrid>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard
            title="Monthly Cases Filed"
            subtitle="Distribution of filed cases by month"
          >
            <div className="h-64">
              {loading ? (
                <CenteredLoader minHeight="min-h-[256px]" />
              ) : chartData.length === 0 ? (
                <NoRecords text="No monthly case filed." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={12} tickMargin={10} />
                    <YAxis fontSize={12} />
                    <Tooltip
                      cursor={{ fill: "#f8fafc" }}
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #E2E8F0",
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                      barSize={35}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Case Status Distribution"
            subtitle="Current spread of case outcomes"
          >
            {loading ? (
              <CenteredLoader minHeight="min-h-[256px]" />
            ) : distribution.length === 0 ? (
              <NoRecords text="No case status distribution yet." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distribution}
                        dataKey="count"
                        nameKey="status"
                        innerRadius={64}
                        outerRadius={94}
                        paddingAngle={1.5}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      >
                        {distribution.map((item, index) => (
                          <Cell
                            key={`dist-${index}`}
                            fill={getDistributionColor(item.status, index)}
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
                  <div className="mb-4">
                    <p className="text-3xl font-semibold text-gray-900">
                      {totalDistribution.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">Total cases</p>
                  </div>

                  {distribution.map((item, index) => (
                    <div
                      key={`${item.status}-${index}`}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full mt-1.5"
                          style={{
                            backgroundColor: getDistributionColor(
                              item.status,
                              index,
                            ),
                          }}
                        />
                        <div>
                          <p className="text-sm text-gray-700 leading-tight">
                            {item.status}
                          </p>
                          <p className="text-xs text-gray-500 leading-tight mt-0.5">
                            {getStatusDistributionDescription(item.status)}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-900 font-medium">
                        {(item?.count ?? 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Recent Cases
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Latest records from docket entries
                </p>
              </div>
              <button
                className="text-sm font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
                onClick={() => navigate(`/blotter/docket`)}
              >
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Blotter No.
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Complainant
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Respondent
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
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
                  ) : recentCases.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10">
                        <NoRecords text="No recent cases." />
                      </td>
                    </tr>
                  ) : (
                    recentCases.map((c) => (
                      <tr
                        key={c.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-600">
                          {c.blotterNumber}
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-semibold">
                          {c.complainantName}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {c.respondentName}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${getCaseStatusBadge(c.status)}`}
                          >
                            {formatStatusText(c.status)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Upcoming Mediations
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Next scheduled mediation sessions
              </p>
            </div>
            <div className="p-5 space-y-5 flex-1">
              {loading ? (
                <CenteredLoader minHeight="min-h-[180px]" />
              ) : hearings.length > 0 ? (
                hearings.map((h) => (
                  <div key={h.hearingId} className="flex items-center gap-4">
                    <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {h.caseTitle}
                      </p>
                      <p className="text-xs text-gray-500">{h.blotterNumber}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-gray-700">
                        {formatDate(h.scheduledStart)}
                      </p>
                      <p className="text-[10px] font-medium text-gray-500">
                        {formatTime(h.scheduledStart)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                  <NoRecords text="No upcoming hearings." />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlotterDashboard;
