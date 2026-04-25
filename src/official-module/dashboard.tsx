import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  Calendar, ArrowRight, Clock, FileText, CheckCircle, AlertCircle,
  ShieldAlert, Server, Cpu, Database,
} from "lucide-react";
import { KPICard, KPIGrid, KPIIcons } from "../hooks/KPICard";
import { CenteredLoader, CircleLoader } from "../hooks/LoadingStates";
import { useKapitanaMockData } from "../pages/kapitana/mock/kapitana-mock-flag";
import {
  mockDashboardStats, mockDocketStats, mockRecordStats,
  mockRecentCases, mockUpcomingHearings, mockCasesByStatus,
  mockMonthlyChart,
} from "../pages/kapitana/mock/blotter-kapitana-mock";
import { mockKapitanaIssuedStats } from "../pages/kapitana/mock/clearance-kapitana-mock";
import { mockKapitanaFtjsStats } from "../pages/kapitana/mock/ftjs-kapitana-mock";
import { mockLuponDashboardStats } from "../pages/kapitana/mock/lupon-kapitana-mock";
import { MOCK_VAWC_STATS } from "../pages/kapitana/vawc-module/mock-data";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function getDistributionColor(status: string, index: number): string {
  const key = String(status || "").toUpperCase().replace(/\s+/g, "_");
  const map: Record<string, string> = {
    PENDING: "#c98e46", UNDER_MEDIATION: "#2e4888", UNDER_CONCILIATION: "#38BDF8",
    REFERRED_TO_LUPON: "#1D4ED8", SETTLED: "#3bbe5a", DISMISSED: "#DC2626",
    CERTIFIED_TO_FILE_ACTION: "#4F46E5", WITHDRAWN: "#64748B", CLOSED: "#64748B",
    RECORDED: "#12b6e7",
  };
  const fallback = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316", "#64748B"];
  return map[key] ?? fallback[index % fallback.length];
}

function formatStatusText(text: string) {
  if (!text) return "";
  return text.toLowerCase().split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

const getCaseStatusBadge = (statusRaw: string) => {
  const status = String(statusRaw || "").toUpperCase();
  if (status === "PENDING") return "bg-amber-50 text-amber-700 border border-amber-300";
  if (status === "UNDER_MEDIATION") return "bg-blue-50 text-blue-700 border border-blue-300";
  if (status === "UNDER_CONCILIATION") return "bg-indigo-50 text-indigo-700 border border-indigo-300";
  if (status === "REFERRED_TO_LUPON") return "bg-violet-50 text-violet-700 border border-violet-300";
  if (status === "SETTLED") return "bg-emerald-50 text-emerald-700 border border-emerald-300";
  if (status === "DISMISSED") return "bg-rose-50 text-rose-700 border border-rose-300";
  if (status === "WITHDRAWN") return "bg-orange-50 text-orange-700 border border-orange-300";
  if (status === "CLOSED") return "bg-slate-50 text-slate-700 border border-slate-300";
  return "bg-slate-50 text-slate-700 border border-slate-300";
};

function SectionCard({ title, subtitle, className, children }: {
  title: string; subtitle?: string; className?: string; children: React.ReactNode;
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

const formatDate = (dateStr: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(dateStr));

const formatTime = (dateStr: string) =>
  new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(new Date(dateStr));

/* ── Mock system health ──────────────────────────────────────────────────── */
const MOCK_SYSTEM_HEALTH = {
  status: "HEALTHY", cpuUsage: 23.4, memoryUsedMB: 412, memoryMaxMB: 1024,
  memoryPercent: 40.2, diskPercent: 54.8, diskFreeGB: 48.2, diskTotalGB: 106.0,
};

/* ── Component ───────────────────────────────────────────────────────────── */
export default function OfficialDashboard() {
  const navigate = useNavigate();
  const demo = useKapitanaMockData();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const stats = demo ? mockDashboardStats() : null;
  const blotter = demo ? mockDocketStats() : null;
  const ftr = demo ? mockRecordStats() : null;
  const vawc = demo ? MOCK_VAWC_STATS : null;
  const clearance = demo ? mockKapitanaIssuedStats() : null;
  const ftjs = demo ? mockKapitanaFtjsStats : null;
  const lupon = demo ? mockLuponDashboardStats() : null;

  const chartData = demo ? mockMonthlyChart() : [];
  const distribution = demo
    ? mockCasesByStatus().map((item) => ({ ...item, status: item.statusName }))
    : [];
  const recentCases = demo ? mockRecentCases() : [];
  const hearings = demo ? mockUpcomingHearings() : [];
  const health = MOCK_SYSTEM_HEALTH;

  const totalDistribution = distribution.reduce((sum, item) => sum + (item.count || 0), 0);

  const cardValue = (value?: number | null) => {
    if (loading) return <CircleLoader size="sm" />;
    if (value === undefined || value === null) return 0;
    return value;
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* ── KPI Row 1: Blotter Desk Pulse ─────────────────────── */}
        <KPIGrid columns={4}>
          <KPICard title="Hearings Today" value={cardValue(stats?.hearingsToday)}
            color="blue" icon={<Clock className="w-6 h-6" />} subtitle="Scheduled for today" />
          <KPICard title="Pending New Cases" value={cardValue(stats?.pendingNewCases)}
            color="amber" icon={<FileText className="w-6 h-6" />} subtitle="Awaiting initial action" />
          <KPICard title="Nearing Deadline" value={cardValue(stats?.nearingDeadline)}
            color="rose" icon={<AlertCircle className="w-6 h-6" />} subtitle="Cases within 5 days" />
          <KPICard title="Settled This Month" value={cardValue(stats?.settledThisMonth)}
            color="emerald" icon={<CheckCircle className="w-6 h-6" />} subtitle="Successfully mediated" />
        </KPIGrid>

        {/* ── KPI Row 2: Cross-module overview ─────────────────── */}
        <KPIGrid columns={6}>
          <KPICard title="Blotter (Docket)" value={cardValue(blotter?.totalEntries)}
            icon={KPIIcons.document} color="blue"
            subtitle="Active docket entries" />
          <KPICard title="FTR Recorded" value={cardValue(ftr?.totalFtr)}
            icon={KPIIcons.issued} color="slate"
            subtitle="For-the-record incidents" />
          <KPICard title="VAWC Cases" value={cardValue(vawc?.totalCases)}
            icon={<ShieldAlert className="w-6 h-6" />} color="rose"
            subtitle="Total protection cases" />
          <KPICard title="Certificates Issued" value={cardValue(clearance?.totalIssued)}
            icon={KPIIcons.total} color="emerald"
            subtitle="Barangay clearance releases" />
          <KPICard title="FTJS Certificates" value={cardValue(ftjs?.totalCertificatesIssued)}
            icon={KPIIcons.issued} color="violet"
            subtitle="First-time job seeker releases" />
          <KPICard title="Lupon (Referred)" value={cardValue(lupon?.totalReferred)}
            icon={KPIIcons.clock} color="amber"
            subtitle="Referred for conciliation" />
        </KPIGrid>

        {/* ── Charts: Monthly Cases + Case Status Distribution ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title="Monthly Cases Filed" subtitle="Distribution of filed cases by month">
            <div className="h-64">
              {loading ? (
                <CenteredLoader minHeight="min-h-[256px]" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={12} tickMargin={10} />
                    <YAxis fontSize={12} />
                    <Tooltip cursor={{ fill: "#f8fafc" }}
                      contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }} />
                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={35} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Case Status Distribution" subtitle="Current spread of case outcomes">
            {loading ? (
              <CenteredLoader minHeight="min-h-[256px]" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={distribution} dataKey="count" nameKey="status"
                        innerRadius={64} outerRadius={94} paddingAngle={1.5}
                        stroke="#FFFFFF" strokeWidth={2}>
                        {distribution.map((item, index) => (
                          <Cell key={`dist-${index}`} fill={getDistributionColor(item.status, index)} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 12,
                        boxShadow: "0 8px 20px -12px rgb(15 23 42 / 0.25)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  <div className="mb-4">
                    <p className="text-3xl font-semibold text-gray-900">{totalDistribution.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Total cases</p>
                  </div>
                  {distribution.map((item, index) => (
                    <div key={`${item.status}-${index}`} className="flex items-center justify-between gap-4">
                      <div className="flex items-start gap-2">
                        <span className="w-2.5 h-2.5 rounded-full mt-1.5"
                          style={{ backgroundColor: getDistributionColor(item.status, index) }} />
                        <p className="text-sm text-gray-700 leading-tight">{item.status}</p>
                      </div>
                      <span className="text-sm text-gray-900 font-medium">{item.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── Recent Cases table + Upcoming Mediations ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Recent Cases</h3>
                <p className="text-sm text-gray-500 mt-1">Latest records from docket entries</p>
              </div>
              <button className="text-sm font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
                onClick={() => navigate("/official-portal/blotter/docket")}>
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Blotter No.</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Complainant</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Respondent</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={4} className="px-6 py-10"><CenteredLoader minHeight="min-h-[120px]" /></td></tr>
                  ) : (
                    recentCases.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-600">{c.blotterNumber}</td>
                        <td className="px-6 py-4 text-gray-900 font-semibold">{c.complainantName}</td>
                        <td className="px-6 py-4 text-gray-700">{c.respondentName}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${getCaseStatusBadge(c.status)}`}>
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
              <h3 className="text-xl font-semibold text-gray-900">Upcoming Mediations</h3>
              <p className="text-sm text-gray-500 mt-1">Next scheduled mediation sessions</p>
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
                      <p className="text-sm font-semibold text-gray-900 truncate">{h.caseTitle}</p>
                      <p className="text-xs text-gray-500">{h.blotterNumber}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-gray-700">{formatDate(h.scheduledStart)}</p>
                      <p className="text-[10px] font-medium text-gray-500">{formatTime(h.scheduledStart)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                  <p className="text-sm">No upcoming hearings.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── System Health ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <SectionCard title="System Health" subtitle="Real-time server resources: CPU, memory, and disk utilization." className="lg:col-span-5">
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">Overall Status</p>
                  <p className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200">
                    {health.status}
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <p className="text-slate-500 flex items-center gap-1"><Cpu className="w-3 h-3" /> CPU</p>
                    <p className="mt-1 text-base font-bold text-slate-800">{health.cpuUsage.toFixed(2)}%</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">Processor load now</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <p className="text-slate-500 flex items-center gap-1"><Server className="w-3 h-3" /> Memory</p>
                    <p className="mt-1 text-base font-bold text-slate-800">{health.memoryUsedMB} / {health.memoryMaxMB} MB</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">RAM used vs limit</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 rounded-xl border border-slate-100 bg-white p-4">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-slate-600">Memory Usage</span>
                    <span className="text-base font-bold text-slate-800">{health.memoryPercent.toFixed(2)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.min(100, health.memoryPercent)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-slate-600">Disk Usage</span>
                    <span className="text-base font-bold text-slate-800">{health.diskPercent.toFixed(2)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className={`h-2 rounded-full ${health.diskPercent >= 85 ? "bg-rose-500" : health.diskPercent >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${Math.min(100, health.diskPercent)}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <p className="text-[11px] text-slate-500 flex items-center gap-1"><Database className="w-3 h-3" /> Disk Free</p>
                    <p className="text-base font-bold text-slate-800">{health.diskFreeGB.toFixed(2)} GB</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <p className="text-[11px] text-slate-500">Disk Total</p>
                    <p className="text-base font-bold text-slate-800">{health.diskTotalGB.toFixed(2)} GB</p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Module Quick Access" subtitle="Navigate to any department module" className="lg:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { to: "/official-portal/blotter/docket", label: "Blotter Docket", desc: "Active cases at barangay justice desk" },
                { to: "/official-portal/blotter/records", label: "Blotter Records (FTR)", desc: "For-the-record incident logs" },
                { to: "/official-portal/blotter/reports", label: "Blotter Reports", desc: "Trends, nature, and settlement view" },
                { to: "/official-portal/vawc/cases", label: "VAWC Cases", desc: "Protection orders and follow-up" },
                { to: "/official-portal/lupon/cases", label: "Lupon Cases", desc: "Referred cases and conciliation" },
                { to: "/official-portal/clearance/issued-certificates", label: "Issued Certificates", desc: "Barangay clearance issuances" },
                { to: "/official-portal/clearance/revenue-and-collection", label: "Revenue & Collection", desc: "Fees, OR tracking, collections" },
                { to: "/official-portal/ftjs/management", label: "FTJS Management", desc: "First-time job seeker records" },
                { to: "/official-portal/admin-management", label: "Admin Management", desc: "System admin and user accounts" },
                { to: "/official-portal/audit-logs", label: "Audit Logs", desc: "System audit trail and actions" },
              ].map((item) => (
                <button key={item.to} onClick={() => navigate(item.to)}
                  className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3.5 text-left transition hover:border-blue-300 hover:shadow-sm">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                </button>
              ))}
            </div>
          </SectionCard>
        </div>

      </div>
    </div>
  );
}
