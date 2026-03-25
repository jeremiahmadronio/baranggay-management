import { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Calendar, ArrowRight, Clock, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { KPICard, KPIGrid } from '../reusable/KPICard'; 
import * as api from '../blotter-api/Dashboard';
import {  useNavigate } from 'react-router-dom';

const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#6366F1'];

const BlotterDashboard = () => {
  const [stats, setStats] = useState<api.DashboardStatsDTO | null>(null);
  const [chartData, setChartData] = useState<api.MonthlyCaseChartDTO[]>([]);
  const [distribution, setDistribution] = useState<api.CaseStatusDistributionDTO[]>([]);
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
          api.getUpcomingHearings()
        ]);
        
        setStats(s);
        setChartData(c);
        // Format names directly here para sa Legend ng Pie Chart
        setDistribution(d.map(item => ({
          ...item,
          status: formatStatusText(item.status)
        })));
        setRecentCases(r);
        setHearings(h);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
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
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateStr));
  };

  const formatTime = (dateStr: string) => {
    return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
  };

  if (loading) return <div className="p-8 text-center font-medium text-gray-500">Loading Lupon Dashboard...</div>;

  return (
    <div className="p-6  min-h-screen space-y-6">
      <KPIGrid columns={4}>
        <KPICard 
          title="Hearings Today" 
          value={stats?.hearingsToday || 0} 
          color="blue" 
          icon={<Clock className="w-6 h-6" />}
          subtitle="Scheduled for today"
        />
        <KPICard 
          title="Pending New Cases" 
          value={stats?.pendingNewCases || 0} 
          color="amber" 
          icon={<FileText className="w-6 h-6" />}
          subtitle="Awaiting initial action"
        />
        <KPICard 
          title="Nearing Deadline" 
          value={stats?.nearingDeadline || 0} 
          color="rose" 
          icon={<AlertCircle className="w-6 h-6" />}
          subtitle="Cases within 5 days"
        />
        <KPICard 
          title="Settled This Month" 
          value={stats?.settledThisMonth || 0} 
          color="emerald" 
          icon={<CheckCircle className="w-6 h-6" />}
          subtitle="Successfully mediated"
        />
      </KPIGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Monthly Cases Filed</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} tickMargin={10} />
                <YAxis fontSize={12} />
                <Tooltip cursor={{fill: '#f3f4f6'}} />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Case Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%" cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={5}
                >
                  {distribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend 
                  verticalAlign="bottom" 
                  iconType="circle"
                  wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Recent Cases</h3>
            <button className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:text-blue-700" onClick={() => navigate(`/blotter/docket`)}>
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">Blotter No.</th>
                  <th className="px-6 py-4 font-bold">Parties</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentCases.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-600">{c.blotterNumber}</td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-semibold">{c.complainantName}</div>
                      <div className="text-gray-400 text-xs italic">vs {c.respondentName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase
                        ${c.status.includes('PENDING') ? 'bg-amber-100 text-amber-700' : 
                          c.status.includes('SETTLED') ? 'bg-emerald-100 text-emerald-700' : 
                          'bg-blue-100 text-blue-700'}`}>
                        {formatStatusText(c.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="p-5 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Upcoming Hearings</h3>
           
          </div>
          <div className="p-5 space-y-5 flex-1">
            {hearings.length > 0 ? hearings.map((h) => (
              <div key={h.hearingId} className="flex items-center gap-4 group cursor-default">
                <div className="bg-blue-50 p-2.5 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{h.caseTitle}</p>
                  <p className="text-[11px] text-gray-400">{h.blotterNumber}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-gray-700">{formatDate(h.scheduledStart)}</p>
                  <p className="text-[10px] font-medium text-gray-400">{formatTime(h.scheduledStart)}</p>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                <Calendar className="w-8 h-8 opacity-20" />
                <p className="text-xs italic">No upcoming hearings</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlotterDashboard;