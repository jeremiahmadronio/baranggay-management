import { useEffect, useState } from "react";
import {
  getDashboardStats,
  getLastSixMonthsResidents,
  getSystemHealth,
  getRecentActions,
  getAuditSeverityDistribution,
} from "../../service/admin-root-api/dashboard-api";
import type {
  DashboardStats,
  LastSixMonthsResidents,
  SystemHealth,
} from "../../service/admin-root-api/dashboard-api";
import { KPIGrid, KPICard, KPIIcons } from "../../hooks/KPICard";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ArrowLeft, RefreshCcw, ShieldAlert, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let current = 0;
    const step = Math.ceil(target / (700 / 16));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else setCount(current);
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <>{count.toLocaleString()}</>;
}

function getSeverityStyle(severity: string): string {
  switch (severity?.toLowerCase()) {
    case "critical":
      return "bg-red-100 text-red-800 font-semibold";
    case "high":
    case "warning":
      return "bg-orange-100 text-orange-800 font-semibold";
    case "medium":
      return "bg-amber-100 text-amber-800 font-semibold";
    case "low":
      return "bg-lime-100 text-lime-800 font-semibold";
    case "info":
      return "bg-indigo-100 text-indigo-800 font-semibold";
    case "error":
      return "bg-rose-100 text-rose-800 font-semibold";
    default:
      return "bg-slate-100 text-slate-700 font-semibold";
  }
}

function getSeverityColor(severity: string): string {
  switch (severity?.toLowerCase()) {
    case "critical":
      return "#DC2626";
    case "high":
    case "warning":
      return "#EA580C";
    case "medium":
      return "#FBBF24";
    case "low":
      return "#84CC16";
    case "info":
      return "#4F46E5";
    case "error":
      return "#F43F5E";
    default:
      return "#6B7280";
  }
}

const MOD_STYLES: Record<string, string> = {
  VAWC: "bg-violet-100 text-violet-700",
  BCPC: "bg-fuchsia-100 text-fuchsia-700",
  System: "bg-gray-100 text-gray-600",
  USER_SECURITY: "bg-pink-100 text-pink-700",
  FTJS: "bg-cyan-100 text-cyan-700",
  Operational: "bg-teal-100 text-teal-700",
  Blotter: "bg-emerald-100 text-emerald-700",
  Clearance: "bg-green-100 text-green-700",
  Lupong: "bg-yellow-100 text-yellow-700",
  "LOGIN_AUTHENTICATION": "bg-blue-100 text-blue-700",
  "SECURITY": "bg-purple-100 text-purple-700",
  "USER_MANAGEMENT": "bg-rose-100 text-rose-700",
  "Admin Management": "bg-purple-100 text-purple-700",
};

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}


// Remove static data, will use API

const chartTooltipStyle = {
  borderRadius: "10px",
  border: "1px solid #E5E7EB",
  fontSize: 12,
  boxShadow: "0 8px 20px -12px rgb(15 23 42 / 0.25)",
} as const;

export default function RootAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lastSixMonths, setLastSixMonths] = useState<LastSixMonthsResidents>({
    labels: [],
    counts: [],
  });
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [auditSeverity, setAuditSeverity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const [statsResult, sixMonthsResult, healthResult, recentActionsResult, auditSeverityResult] = await Promise.allSettled([
          getDashboardStats(),
          getLastSixMonthsResidents(),
          getSystemHealth(),
          getRecentActions(),
          getAuditSeverityDistribution(),
        ]);
        if (statsResult.status !== "fulfilled") {
          throw statsResult.reason;
        }
        setStats(statsResult.value);
        setLastSixMonths(
          sixMonthsResult.status === "fulfilled"
            ? sixMonthsResult.value
            : { labels: [], counts: [] },
        );
        setSystemHealth(
          healthResult.status === "fulfilled" ? healthResult.value : null,
        );
        setRecentActions(
          recentActionsResult.status === "fulfilled" ? recentActionsResult.value : []
        );
        setAuditSeverity(
          auditSeverityResult.status === "fulfilled" ? auditSeverityResult.value : []
        );
      } catch (err) {
        setError("Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[300px] gap-3">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center min-h-[400px] w-full p-4"
      >
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 text-center">
          {/* Animated Icon Container */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-50 mb-6">
            <AlertCircle className="w-8 h-8 text-rose-500" />
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Failed to load dashboard
          </h3>

          

          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all active:scale-[0.98]"
            >
              <RefreshCcw className="w-4 h-4" />
              Retry Connection
            </button>

            <button
              onClick={() => navigate("/login")}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg font-semibold transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  const residentsTrendData =
    lastSixMonths.labels.length && lastSixMonths.counts.length
      ? lastSixMonths.labels.map((label, idx) => ({
          label,
          count: Number(lastSixMonths.counts[idx] ?? 0),
        }))
      : [];

  return (
    <div className="p-8 min-h-screen bg-gray-50/60">
      <KPIGrid columns={4}>
        <KPICard
          title="Total Users"
          value={<AnimatedCounter target={stats.totalUser} />}
          icon={KPIIcons.users}
          color="blue"
          subtitle="All active system accounts"
        />
        <KPICard
          title="Total Residents"
          value={<AnimatedCounter target={stats.totalResidents} />}
          icon={KPIIcons.clock}
          color="emerald"
          subtitle="Current active resident records"
        />
        <KPICard
          title="Total Officer"
          value={<AnimatedCounter target={stats.totalOfficer} />}
          icon={<ShieldAlert className="w-6 h-6" />}
          color="rose"
          subtitle="Active personnel in barangay office"
        />
        <KPICard
          title="Total Audit Entries"
          value={<AnimatedCounter target={stats.totalAuditEntry} />}
          icon={KPIIcons.document}
          color="violet"
          subtitle="All logged system audit events"
        />
      </KPIGrid>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-800">System Health</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time server resources: CPU, memory, and disk utilization.
          </p>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">Overall Status</p>
                <p
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    systemHealth?.status?.toUpperCase() === "HEALTHY"
                      ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                      : systemHealth?.status?.toUpperCase() === "WARNING"
                        ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
                        : systemHealth?.status?.toUpperCase() === "CRITICAL"
                          ? "bg-rose-100 text-rose-700 ring-1 ring-rose-200"
                          : "bg-blue-100 text-blue-700 ring-1 ring-blue-200"
                  }`}
                >
                  {systemHealth?.status ?? "UNKNOWN"}
                </p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <p className="text-slate-500">CPU</p>
                  <p className="mt-1 text-base font-bold text-slate-800">
                    {(systemHealth?.cpuUsage ?? 0).toFixed(2)}%
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">Processor load now</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <p className="text-slate-500">Memory</p>
                  <p className="mt-1 text-base font-bold text-slate-800">
                    {(systemHealth?.memoryUsedMB ?? 0).toFixed(2)} /{" "}
                    {(systemHealth?.memoryMaxMB ?? 0).toFixed(0)} MB
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">RAM used vs limit</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-100 bg-white p-4">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-600">Memory Usage</span>
                  <span className="text-base font-bold text-slate-800">
                    {(systemHealth?.memoryPercent ?? 0).toFixed(2)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, systemHealth?.memoryPercent ?? 0))}%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-500">
                  Higher percentage means less free memory.
                </p>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-600">Disk Usage</span>
                  <span className="text-base font-bold text-slate-800">
                    {(systemHealth?.diskPercent ?? 0).toFixed(2)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className={`h-2 rounded-full ${
                      (systemHealth?.diskPercent ?? 0) >= 85
                        ? "bg-rose-500"
                        : (systemHealth?.diskPercent ?? 0) >= 70
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(0, systemHealth?.diskPercent ?? 0))}%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-500">
                  Track this to avoid low disk storage.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-[11px] text-slate-500">Disk Free</p>
                  <p className="text-base font-bold text-slate-800">
                    {(systemHealth?.diskFreeGB ?? 0).toFixed(2)} GB
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-[11px] text-slate-500">Disk Total</p>
                  <p className="text-base font-bold text-slate-800">
                    {(systemHealth?.diskTotalGB ?? 0).toFixed(2)} GB
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-800">Residents Trend (Last 6 Months)</h3>
          <p className="text-xs text-gray-400 mt-0.5">Live monthly resident count trend</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={residentsTrendData}>
                <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#E5E7EB" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "#4B5563" }}
                  axisLine={{ stroke: "#9CA3AF", strokeWidth: 1.2 }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#4B5563" }}
                  axisLine={{ stroke: "#9CA3AF", strokeWidth: 1.2 }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "#EFF6FF" }} />
                <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-800">Recent System Actions</h3>
              <p className="text-xs text-gray-400 mt-0.5">All logged system audit events</p>
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-xs text-slate-500">
                  <th className="px-4 py-3 text-left font-semibold">Timestamp</th>
                  <th className="px-4 py-3 text-left font-semibold">User</th>
                  <th className="px-4 py-3 text-left font-semibold">Action</th>
                  <th className="px-4 py-3 text-left font-semibold">Module</th>
                  <th className="px-4 py-3 text-left font-semibold">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentActions.map((row, idx) => (
                  <tr key={idx} className="bg-white">
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono whitespace-nowrap">
                      {formatTimestamp(row.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                      {row.firstName} {row.lastName}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{row.actionTaken}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${MOD_STYLES[row.module?.replace(/\s+/g, "_").toUpperCase()] ?? "bg-purple-100 text-purple-700"}`}>
                        {row.module}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getSeverityStyle(row.severity)}`}>
                        {row.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-800">Audit Severity Distribution</h3>
          <p className="text-xs text-gray-400 mt-0.5">Distribution of audit event severities</p>
          {auditSeverity && auditSeverity.length > 0 ? (
            <div className="mt-4 flex flex-row gap-8 items-center justify-center">
              <div className="h-52 w-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={auditSeverity}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {auditSeverity.map((s) => (
                        <Cell key={s.name} fill={getSeverityColor(s.name)} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2 min-w-[120px]">
                {auditSeverity.map((s) => (
                  <div key={s.name} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: getSeverityColor(s.name) }}
                      />
                      <span className="text-sm font-semibold text-gray-700">{s.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center justify-center h-64 text-gray-400">
              <p className="text-sm">No audit severity data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
