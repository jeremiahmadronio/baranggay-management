import  { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  LayoutDashboard,
  ExternalLink,
} from 'lucide-react'
import {
  getReportStats,
  getStatusStats,
  getTopNature,
  getCasesTrend,
  type ReportStatsDTO,
  type StatusStatDTO,
  type NatureReportDTO,
  type ChartDataDTO,
} from '../lupong-tagapamayapa-api/LuponReport'
import { TableFilter } from '../reusable/TableFilter'
import { KPICard,KPIGrid } from '../reusable/KPICard'
import { getStatusLabel } from '../lupong-tagapamayapa-module/lib/StatusMapper'
const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
export function LuponReportsPage() {
  const navigate = useNavigate()
  const today = new Date()
  const currentYear = today.getFullYear()
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`)
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`)
  const [stats, setStats] = useState<ReportStatsDTO | null>(null)
  const [statusData, setStatusData] = useState<StatusStatDTO[]>([])
  const [natureData, setNatureData] = useState<NatureReportDTO[]>([])
  const [trendData, setTrendData] = useState<ChartDataDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const toLocalDateTime = (date: string, endOfDay = false) =>
    date ? `${date}T${endOfDay ? '23:59:59' : '00:00:00'}` : ''
  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const statsStart = toLocalDateTime(startDate)
      const statsEnd = toLocalDateTime(endDate, true)
      const [statsRes, statusRes, natureRes, trendRes] = await Promise.all([
        getReportStats(statsStart, statsEnd),
        getStatusStats(statsStart, statsEnd),
        getTopNature(statsStart, statsEnd),
        getCasesTrend(statsStart, statsEnd),
      ])
      setStats(statsRes)
      // Map status labels for display
      const mappedStatusData = statusRes.map((item) => ({
        ...item,
        status: getStatusLabel(item.status),
      }))
      setStatusData(mappedStatusData)
      setNatureData(
        natureRes.filter((n) => Number.isInteger(n.count) && n.count >= 1),
      )
      setTrendData(trendRes)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(() => {
    fetchDashboardData()
  }, [startDate, endDate])
  const handleApplyGlobalFilter = () => fetchDashboardData()
  const handleClearGlobalFilter = () => {
    setStartDate(`${currentYear}-01-01`)
    setEndDate(`${currentYear}-12-31`)
  }
  if (isLoading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center text-gray-500 gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading reports dashboard...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Lupon Reports Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                Overview of barangay justice system cases and statistics
              </p>
            </div>
          </div>
        </div>

        {/* Global Date Filter */}
        <TableFilter
          showSearch={false}
          filterButtonText="Apply Filter"
          clearButtonText="Reset"
          dateRange={{
            startLabel: 'Date From',
            endLabel: 'Date To',
            startValue: startDate,
            endValue: endDate,
            onStartChange: setStartDate,
            onEndChange: setEndDate,
          }}
          onFilterClick={handleApplyGlobalFilter}
          onClearClick={handleClearGlobalFilter}
        />

        {/* KPI Stats Cards */}
        <KPIGrid columns={4}>
          <KPICard
            title="Settled"
            value={(stats?.totalSettled ?? 0).toLocaleString()}
            icon={<CheckCircle2 className="w-6 h-6" />}
            color="emerald"
            subtitle="Cases amicably resolved"
          />
          <KPICard
            title="Closed"
            value={(stats?.totalClosed ?? 0).toLocaleString()}
            icon={<XCircle className="w-6 h-6" />}
            color="slate"
            subtitle="Cases officially closed"
          />
          <KPICard
            title="Escalated"
            value={(stats?.escalate ?? 0).toLocaleString()}
            icon={<AlertTriangle className="w-6 h-6" />}
            color="amber"
            subtitle="Cases elevated to court"
          />
          <KPICard
            title="Certified to File Action"
            value={(stats?.totalCFA ?? 0).toLocaleString()}
            icon={<FileText className="w-6 h-6" />}
            color="blue"
            subtitle="Certificates to File Action"
          />
        </KPIGrid>

        {/* Cases Trend Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-base font-semibold mb-5 text-gray-800">
            Cases Trend
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trendData}
                margin={{
                  top: 5,
                  right: 30,
                  bottom: 20,
                  left: 10,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: '#6b7280',
                    fontSize: 11,
                  }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: '#6b7280',
                    fontSize: 12,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-base font-semibold mb-5 text-gray-800">
              Status Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="status"
                  >
                    {statusData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
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
            </div>
          </div>

          {/* Top Nature of Complaints */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-base font-semibold mb-5 text-gray-800">
              Top Nature of Complaints
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={natureData}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 30,
                    left: 40,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: '#6b7280',
                      fontSize: 12,
                    }}
                  />
                  <YAxis
                    dataKey="natureName"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: '#4b5563',
                      fontSize: 12,
                    }}
                    width={Math.max(90, Math.min(180, natureData.length * 40))}
                  />
                  <Tooltip
                    cursor={{
                      fill: '#f3f4f6',
                    }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#6366f1"
                    radius={[0, 4, 4, 0]}
                    barSize={Math.max(16, 40 - natureData.length * 2)}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Monthly Report Link */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">
                Monthly DILG Report
              </h3>
              <p className="text-sm text-gray-500">
                View detailed monthly report with full case information
              </p>
            </div>
            <button
              onClick={() => navigate('/lupongtagapamayapa/monthly-report')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              View Report
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
