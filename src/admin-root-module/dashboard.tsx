import { useEffect, useState } from "react"
import { getDashboardStats } from "../admin-root-api/dashboard-api"
import type { DashboardStats } from "../admin-root-api/dashboard-api"

// ─── Mock Data ────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  { code: "VAWC",      count: 245, percent: "23.6%", shade: "from-blue-400 to-blue-500" },
  { code: "BLOTTER",   count: 189, percent: "17.7%", shade: "from-blue-500 to-blue-600" },
  { code: "BCPC",      count: 156, percent: "14.6%", shade: "from-blue-500 to-blue-600" },
  { code: "ITUS",      count: 98,  percent: "9.2%",  shade: "from-blue-600 to-blue-700" },
  { code: "CLEARANCE", count: 312, percent: "29.2%", shade: "from-blue-400 to-blue-500" },
  { code: "LUPON",     count: 67,  percent: "6.3%",  shade: "from-blue-600 to-blue-700" },
  { code: "KAPITANA",  count: 82,  percent: "7.7%",  shade: "from-blue-500 to-blue-600" },
  { code: "OPS",       count: 118, percent: "11.1%", shade: "from-blue-500 to-blue-700" },
]

const TOTAL_ACTIVITY = DEPARTMENTS.reduce((sum, d) => sum + d.count, 0)

const RECENT_ACTIONS = [
  { timestamp: "2026-02-21  14:32:51", user: "Maria Santos", action: "Case #2026-001 created",               module: "VAWC",      moduleColor: "bg-blue-100 text-blue-700"   },
  { timestamp: "2026-02-21  14:28:03", user: "Pedro Reyes",  action: "Child record #BC-445 modified",        module: "BCPC",      moduleColor: "bg-indigo-100 text-indigo-700"},
  { timestamp: "2026-02-21  14:15:12", user: "Root Admin",   action: "New admin: juan.admin@ugong.gov.ph",   module: "System",    moduleColor: "bg-gray-100 text-gray-600"   },
  { timestamp: "2026-02-21  13:55:11", user: "Juan Cruz",    action: "Cert #CLR-2026-089 issued",            module: "Clearance", moduleColor: "bg-green-100 text-green-700" },
  { timestamp: "2026-02-21  13:42:07", user: "Ana Lopez",    action: "3rd failed attempt — account locked",  module: "System",    moduleColor: "bg-gray-100 text-gray-600"   },
]

// ─── Icons ────────────────────────────────────────────────────────────────────

const StaffIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4.13a4 4 0 10-8 0 4 4 0 008 0zm6 0a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)
const SessionIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)
const AlertIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
  </svg>
)
const AuditIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v12a2 2 0 01-2 2z" />
  </svg>
)

// ─── Animated Counter ─────────────────────────────────────────────────────────

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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RootAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getDashboardStats()
        setStats(data)
      } catch {
        // Fallback to mock data kung walang backend pa
        setStats({ totalStaff: 47, activeSessions: 23, securityAlerts: 3, totalAuditEntries: 1247 })
      }
    }
    fetchData()
  }, [])

  if (!stats) {
    return <div className="p-6 text-center text-gray-400">Loading dashboard...</div>
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Total Staff</p>
            <p className="text-4xl font-bold text-gray-900 leading-none">
              <AnimatedCounter target={stats.totalStaff} />
            </p>
            <span className="text-xs text-gray-400 mt-1 block">Active accounts</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-400 flex items-center justify-center flex-shrink-0">
            <StaffIcon />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Active Sessions</p>
            <p className="text-4xl font-bold text-gray-900 leading-none">
              <AnimatedCounter target={stats.activeSessions} />
            </p>
            <span className="text-xs text-gray-400 mt-1 block">Currently online</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-400 flex items-center justify-center flex-shrink-0">
            <SessionIcon />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Security Alerts</p>
            <p className="text-4xl font-bold text-gray-900 leading-none">
              <AnimatedCounter target={stats.securityAlerts} />
            </p>
            <span className="text-xs text-gray-400 mt-1 block">Require attention</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-400 flex items-center justify-center flex-shrink-0">
            <AlertIcon />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Total Audit Entries</p>
            <p className="text-4xl font-bold text-gray-900 leading-none">
              <AnimatedCounter target={stats.totalAuditEntries} />
            </p>
            <span className="text-xs text-gray-400 mt-1 block">This month</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-400 flex items-center justify-center flex-shrink-0">
            <AuditIcon />
          </div>
        </div>

      </div>

      {/* ── Activity Overview ── */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">

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

        <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mt-5">
          {DEPARTMENTS.map((dept) => (
            <div
              key={dept.code}
              className={`bg-gradient-to-b ${dept.shade} rounded-xl p-3.5 text-white flex flex-col gap-1 hover:scale-105 transition-transform duration-150 cursor-default`}
            >
              <span className="text-[10px] font-bold tracking-wider opacity-90 leading-tight">
                {dept.code}
              </span>
              <span className="text-2xl font-extrabold leading-none mt-0.5">
                {dept.count}
              </span>
              <span className="text-[10px] opacity-75 mt-0.5">{dept.percent}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">Activity Level</span>
            <div className="flex gap-1">
              <div className="w-5 h-2 rounded-full bg-blue-200" />
              <div className="w-5 h-2 rounded-full bg-blue-400" />
              <div className="w-5 h-2 rounded-full bg-blue-600" />
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

      {/* ── Recent System Actions ── */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">

        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-800">Recent System Actions</h3>
            <p className="text-xs text-gray-400 mt-0.5">Last 5 activities across all modules</p>
          </div>
          <button className="text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors cursor-pointer">
            View All
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3 pr-6">Timestamp</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3 pr-6">User</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3 pr-6">Action</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3">Module</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {RECENT_ACTIONS.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3.5 pr-6 text-xs text-gray-400 font-mono whitespace-nowrap">{row.timestamp}</td>
                  <td className="py-3.5 pr-6 font-semibold text-gray-800 whitespace-nowrap">{row.user}</td>
                  <td className="py-3.5 pr-6 text-gray-500">{row.action}</td>
                  <td className="py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${row.moduleColor}`}>
                      {row.module}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  )
}