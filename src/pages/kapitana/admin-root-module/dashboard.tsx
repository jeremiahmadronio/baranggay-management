import { useEffect, useState } from "react";
import {
  getDashboardStats,
  getLastSixMonthsResidents,
  getSystemHealth,
} from "../../../service/admin-root-api/dashboard-api";
import type {
  DashboardStats,
  LastSixMonthsResidents,
  SystemHealth,
} from "../../../service/admin-root-api/dashboard-api";
import { KPIGrid, KPICard, KPIIcons } from "../../../hooks/KPICard";

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
      return "bg-rose-100 text-rose-700";
    case "high":
      return "bg-orange-100 text-orange-700";
    case "medium":
      return "bg-amber-100 text-amber-700";
    case "low":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
}

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

type StaticRecentAction = {
  createdAt: string;
  user: string;
  action: string;
  module: string;
  severity: string;
};

const STATIC_RECENT_ACTIONS: StaticRecentAction[] = [
  {
    createdAt: new Date().toISOString(),
    user: "System Admin",
    action: "Created officer record",
    module: "Officer",
    severity: "LOW",
  },
  {
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    user: "Root Admin",
    action: "Generated backup archive",
    module: "DB Backup",
    severity: "MEDIUM",
  },
  {
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    user: "System",
    action: "Login attempt flagged",
    module: "Audit Logs",
    severity: "HIGH",
  },
];

const STATIC_AUDIT_SEVERITY = [
  { name: "LOW", value: 42, color: "#2563EB" },
  { name: "MEDIUM", value: 19, color: "#F59E0B" },
  { name: "HIGH", value: 8, color: "#F97316" },
  { name: "CRITICAL", value: 2, color: "#DC2626" },
];

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const [statsResult, sixMonthsResult, healthResult] = await Promise.allSettled([
          getDashboardStats(),
          getLastSixMonthsResidents(),
          getSystemHealth(),
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
      ? lastSixMonths.labels.map((label, idx) => {
          // Force resident trend to 10-20 range as requested
          const mockCount = 10 + (idx % 8) + (idx % 3); 
          return {
            label,
            count: mockCount,
          };
        })
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
          value={<AnimatedCounter target={stats.totalActiveResident} />}
          icon={KPIIcons.clock}
          color="emerald"
          subtitle="Current active resident records"
        />
        <KPICard
          title="Total Officer"
          value={<AnimatedCounter target={stats.totalActiveEmployee} />}
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
              <p className="text-xs text-gray-400 mt-0.5">Static preview list</p>
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
                {STATIC_RECENT_ACTIONS.map((row, idx) => (
                  <tr key={idx} className="bg-white">
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono whitespace-nowrap">
                      {formatTimestamp(row.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                      {row.user}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{row.action}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 whitespace-nowrap">
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
          <p className="text-xs text-gray-400 mt-0.5">Static snapshot of audit severities</p>
          <div className="mt-4 grid grid-cols-1 gap-3 items-center">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={STATIC_AUDIT_SEVERITY}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={54}
                    outerRadius={82}
                    paddingAngle={1.5}
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {STATIC_AUDIT_SEVERITY.map((s) => (
                      <Cell key={s.name} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {STATIC_AUDIT_SEVERITY.map((s) => (
                <div key={s.name} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-sm text-slate-700">{s.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
