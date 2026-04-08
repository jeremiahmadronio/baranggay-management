import  { useEffect, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import {
  AlertCircle,
  ShieldAlert,
  Scale,
  FileWarning,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { KPICard, KPIGrid } from '../../reusable/KPICard'
import {
  getVawcDashboardStats,
  getVawcCaseDistribution,
  getVawcRecentCases,
  type DashboardStatsDTO,
  type DashboardCaseDistributionDTO,
  type DashboardRecentCaseDTO,
} from '../../service/vawc-api/dashboard-api'
// Fallback Mock Data for Preview purposes if API is unavailable
const MOCK_STATS: DashboardStatsDTO = {
  totalCases: 142,
  casesTrend: 12,
  activeBpos: 38,
  totalSettled: 89,
  settledTrend: 5,
  bposIssued: 45,
  bposTrend: -2,
}
const MOCK_DISTRIBUTION: DashboardCaseDistributionDTO[] = [
  {
    label: 'Physical Abuse',
    value: 65,
  },
  {
    label: 'Psychological Abuse',
    value: 45,
  },
  {
    label: 'Economic Abuse',
    value: 20,
  },
  {
    label: 'Sexual Abuse',
    value: 12,
  },
]
const MOCK_RECENT_CASES: DashboardRecentCaseDTO[] = [
  {
    caseNumber: 'VAWC-2023-001',
    complainantName: 'Maria Santos',
    natureOfComplaint: 'Physical Abuse',
    status: 'Active',
  },
  {
    caseNumber: 'VAWC-2023-002',
    complainantName: 'Juana Dela Cruz',
    natureOfComplaint: 'Psychological Abuse',
    status: 'Under Investigation',
  },
  {
    caseNumber: 'VAWC-2023-003',
    complainantName: 'Elena Reyes',
    natureOfComplaint: 'Economic Abuse',
    status: 'Resolved',
  },
  {
    caseNumber: 'VAWC-2023-004',
    complainantName: 'Rosa Garcia',
    natureOfComplaint: 'Physical Abuse',
    status: 'Pending',
  },
  {
    caseNumber: 'VAWC-2023-005',
    complainantName: 'Carmen Bautista',
    natureOfComplaint: 'Sexual Abuse',
    status: 'Active',
  },
]
const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981']
export function VawcDashboard() {
  const [stats, setStats] = useState<DashboardStatsDTO | null>(null)
  const [distribution, setDistribution] = useState<
    DashboardCaseDistributionDTO[]
  >([])
  const [recentCases, setRecentCases] = useState<DashboardRecentCaseDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUsingMock, setIsUsingMock] = useState(false)
  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    setIsUsingMock(false)
    try {
      const [statsData, distData, casesData] = await Promise.all([
        getVawcDashboardStats(),
        getVawcCaseDistribution(),
        getVawcRecentCases(),
      ])
      setStats(statsData)
      setDistribution(distData)
      setRecentCases(casesData)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError('Unable to connect to the server. The API might be offline.')
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(() => {
    fetchData()
  }, [])
  const loadMockData = () => {
    setStats(MOCK_STATS)
    setDistribution(MOCK_DISTRIBUTION)
    setRecentCases(MOCK_RECENT_CASES)
    setError(null)
    setIsUsingMock(true)
  }
 
  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower.includes('resolved') || statusLower.includes('settled')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
          Resolved
        </span>
      )
    }
    if (statusLower.includes('pending')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
          Pending
        </span>
      )
    }
    if (statusLower.includes('active')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
          Active
        </span>
      )
    }
    if (statusLower.includes('investigation')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          Under Investigation
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
        {status}
      </span>
    )
  }
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading dashboard data...</p>
      </div>
    )
  }
  if (error && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Connection Error
          </h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={fetchData}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
            <button
              onClick={loadMockData}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2.5 rounded-lg font-medium transition-colors"
            >
              View Demo Data
            </button>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              VAWC Dashboard
            </h1>
            <p className="text-gray-500 mt-1">
              Overview of Violence Against Women and Children cases
            </p>
          </div>
          {isUsingMock && (
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-medium border border-amber-200">
              <AlertCircle className="w-4 h-4 mr-2" />
              Viewing Demo Data
            </div>
          )}
        </div>

        {/* KPI Grid */}
        {stats && (
          <KPIGrid columns={4}>
            <KPICard
              title="Total Cases"
              value={stats.totalCases.toLocaleString()}
              color="blue"
              icon={<FileWarning className="w-6 h-6" />}
             
            />
            <KPICard
              title="Active BPOs"
              value={stats.activeBpos.toLocaleString()}
              color="rose"
              icon={<ShieldAlert className="w-6 h-6" />}
              subtitle="Currently enforced orders"
            />
            <KPICard
              title="Total Settled"
              value={stats.totalSettled.toLocaleString()}
              color="emerald"
              icon={<Scale className="w-6 h-6" />}
             
            />
            <KPICard
              title="BPOs Issued"
              value={stats.bposIssued.toLocaleString()}
              color="amber"
              icon={<FileWarning className="w-6 h-6" />}
              
            />
          </KPIGrid>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Case Distribution
            </h2>
            <div className="h-[300px] w-full">
              {distribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {distribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  No distribution data available
                </div>
              )}
            </div>
          </div>

          {/* Table Section */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Cases
              </h2>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View All
              </button>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">Case Number</th>
                    <th className="px-6 py-4 font-medium">Complainant</th>
                    <th className="px-6 py-4 font-medium">
                      Nature of Complaint
                    </th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {recentCases.length > 0 ? (
                    recentCases.map((caseItem, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                          {caseItem.caseNumber}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {caseItem.complainantName}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {caseItem.natureOfComplaint}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(caseItem.status)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No recent cases found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
