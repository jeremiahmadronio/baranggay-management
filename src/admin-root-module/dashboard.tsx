import { useEffect, useState } from "react"
import { getDashboardStats, getActivityOverview, getRecentActions } from "../admin-root-api/dashboard-api"
import type { ActivityOverview, DashboardStats, RecentActions } from "../admin-root-api/dashboard-api"
import { KPIGrid, KPICard, KPIIcons } from '../reusable/KPICard'
import { ResponsiveTable } from '../reusable/RecentSystemActions'
import type { ColumnDef } from '../reusable/RecentSystemActions'
import { ArrowLeft, RefreshCcw, ShieldAlert, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"


function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let current = 0
    const step = Math.ceil(target / (700 / 16))
    const timer = setInterval(() => {
      current += step
      if (current >= target) { setCount(target); clearInterval(timer) }
      else setCount(current)
    }, 16)
    return () => clearInterval(timer)
  }, [target])
  return <>{count.toLocaleString()}</>
}

const DEPT_BLUE_SHADES = [
  "from-blue-600 to-blue-700",
  "from-blue-500 to-blue-600",
  "from-blue-500 to-blue-600",
  "from-blue-400 to-blue-500",
  "from-blue-700 to-blue-800",
  "from-blue-300 to-blue-400",
  "from-blue-400 to-blue-500",
  "from-blue-500 to-blue-600",
]

function mapDepartments(overview: ActivityOverview) {
  return overview.departments.map((dept, idx) => ({
    code:    dept.departmentName.toUpperCase(),
    shade:   DEPT_BLUE_SHADES[idx % DEPT_BLUE_SHADES.length],
    count:   dept.count,
    percent: `${dept.percentage}%`,
  }))
}

function getSeverityStyle(severity: string): string {
  switch (severity?.toLowerCase()) {
    case "critical": return "bg-rose-100 text-rose-700"
    case "high":     return "bg-orange-100 text-orange-700"
    case "medium":   return "bg-amber-100 text-amber-700"
    case "low":      return "bg-emerald-100 text-emerald-700"
    default:         return "bg-blue-100 text-blue-700"
  }
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    })
  } catch {
    return iso
  }
}


const recentActionsColumns: ColumnDef<RecentActions>[] = [
  {
    header: "Timestamp",
    render: (row) => (
      <span className="text-xs text-gray-400 font-mono whitespace-nowrap">
        {formatTimestamp(row.createdAt)}
      </span>
    ),
  },
  {
    header: "User",
    render: (row) => (
      <span className="font-semibold text-gray-800 whitespace-nowrap">
        {row.firstName} {row.lastName}
      </span>
    ),
  },
  {
    header: "Action",
    render: (row) => (
      <span className="text-gray-500">{row.actionTaken}</span>
    ),
  },
  {
    header: "Module",
    render: (row) => (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 whitespace-nowrap">
        {row.module}
      </span>
    ),
  },
  {
    header: "Severity",
    render: (row) => (
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getSeverityStyle(row.severity)}`}>
        {row.severity}
      </span>
    ),
  },
]


export default function RootAdminDashboard() {
  const [stats,         setStats]         = useState<DashboardStats   | null>(null)
  const [overview,      setOverview]      = useState<ActivityOverview | null>(null)
  const [recentActions, setRecentActions] = useState<RecentActions[]>([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState<string | null>(null)

   const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        const [statsData, overviewData, recentData] = await Promise.all([
          getDashboardStats(),
          getActivityOverview(),
          getRecentActions(),
        ])
        setStats(statsData)
        setOverview(overviewData)
        setRecentActions(recentData)
      } catch (err) {
        setError( "Failed to load dashboard.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[300px] gap-3">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading dashboard...</p>
      </div>
    )
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
        
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          {error || "Nagkaroon ng problema sa pagkuha ng data mula sa server. Pakisuri ang iyong koneksyon."}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all active:scale-[0.98]"
          >
            <RefreshCcw className="w-4 h-4" />
            Retry Connection
          </button>
          
          <button
            onClick={() => navigate('/login')}
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

  const DEPARTMENTS    = overview ? mapDepartments(overview) : []
  const TOTAL_ACTIVITY = overview?.totalActivity ?? 0

  return (
    <div className="p-8 min-h-screen">

      {/* ── KPI Cards ── */}
      <KPIGrid columns={4}>
        <KPICard
          title="Total Admin Users"
          value={<AnimatedCounter target={stats.totalUser} />}
          icon={KPIIcons.users}
          color="blue"
        
        />
        <KPICard
          title="Active Admin Users"
          value={<AnimatedCounter target={stats.totalActiveUser} />}
          icon={KPIIcons.clock}
          color="emerald"
        />
        <KPICard
          title="Security Alerts"
          value={<AnimatedCounter target={stats.totalCritical} />}
          icon={<ShieldAlert className="w-6 h-6" />}
          color="rose"
        
        />
        <KPICard
          title="Total Audit Entries"
          value={<AnimatedCounter target={stats.totalAuditEntry} />}
          icon={KPIIcons.document}
          color="violet"
            
        />
      </KPIGrid>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 mt-5">

        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-base font-bold text-gray-800">Activity Overview</h3>
            <p className="text-xs text-gray-400 mt-0.5">System usage across departments</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            {TOTAL_ACTIVITY.toLocaleString()} Total
          </div>
        </div>

        {DEPARTMENTS.length > 0 ? (
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mt-5">
            {DEPARTMENTS.map((dept) => (
              <div
                key={dept.code}
                className={`bg-gradient-to-b ${dept.shade} rounded-xl p-3.5 text-white flex flex-col gap-1 hover:scale-105 transition-transform duration-150 cursor-default`}
              >
                <span className="text-[10px] font-bold tracking-wider opacity-90 leading-tight truncate">
                  {dept.code}
                </span>
                <span className="text-2xl font-extrabold leading-none mt-0.5">
                  {dept.count.toLocaleString()}
                </span>
                <span className="text-[10px] opacity-75 mt-0.5">{dept.percent}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 text-center text-sm text-gray-400 py-6">
            No department data available.
          </div>
        )}

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">Activity Level</span>
            <div className="flex gap-1">
              <div className="w-5 h-2 rounded-full bg-blue-200" />
              <div className="w-5 h-2 rounded-full bg-blue-400" />
              <div className="w-5 h-2 rounded-full bg-blue-600" />
              <div className="w-5 h-2 rounded-full bg-blue-800" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Last 30 days
          </div>
        </div>

      </div>

      {/* ── Recent System Actions — using ResponsiveTable reusable ── */}
      <ResponsiveTable<RecentActions>
        title="Recent System Actions"
        data={recentActions}
        columns={recentActionsColumns}
      />

    </div>
  )
}