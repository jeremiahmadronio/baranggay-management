<<<<<<< HEAD
import React from "react";
=======
import React, { useEffect } from "react";
>>>>>>> 09c4e5e5c7b9a3bb84a9c7ef1c538cee62fe5905
import { useNavigate } from "react-router-dom";
import {
  KPICard,
  KPIGrid,
  KPIIcons,
<<<<<<< HEAD
} from "../../reusable";
import { LoadingModal } from "../../reusable";
import {
  clearanceDashboardApi,
  type DashboardStatsResponseDTO,
  type TopTemplateResponseDTO,
  type RecentRequestResponseDTO,
  type WeeklyIssuedTrendDTO,
} from "../../service/clearance-api/dashboard";
import { LayoutList, Plus } from "lucide-react";

export const ClearanceDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = React.useState<DashboardStatsResponseDTO | null>(null);
  const [recentIssued, setRecentIssued] = React.useState<RecentRequestResponseDTO[]>([]);
  const [topTemplates, setTopTemplates] = React.useState<TopTemplateResponseDTO[]>([]);
  const [weeklyTrend, setWeeklyTrend] = React.useState<WeeklyIssuedTrendDTO[]>([]);
  const [loading, setLoading] = React.useState(true);

  const numberFormat = (num?: number) => (num ?? 0).toLocaleString();
  const revenueFormat = (num?: number) =>
    num !== undefined ? num.toLocaleString("en-PH", { style: "currency", currency: "PHP" }) : "₱0.00";

  React.useEffect(() => {
    setLoading(true);
    Promise.all([
      clearanceDashboardApi.getStats(),
      clearanceDashboardApi.getRecentIssued(),
      clearanceDashboardApi.getTopTemplates(),
      clearanceDashboardApi.getWeeklyTrend(),
    ])
      .then(([stats, recent, top, trend]) => {
        setStats(stats);
        setRecentIssued(recent);
        setTopTemplates(top);
        setWeeklyTrend(trend);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingModal isOpen={true} message="Loading dashboard data..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <KPIGrid columns={4}>
          <KPICard
            title="Issued Today"
            value={numberFormat(stats?.totalIssuedToday)}
            subtitle="Certificates issued today"
            color="blue"
            icon={KPIIcons.issued}
          />
          <KPICard
            title="Revenue Today"
            value={revenueFormat(stats?.revenueToday)}
            subtitle="Today's revenue"
            color="emerald"
            icon={KPIIcons.revenue}
          />
          <KPICard
            title="Archived Today"
            value={numberFormat(stats?.totalArchiveToday)}
            subtitle="Archived certificates"
            color="rose"
            icon={KPIIcons.pending}
          />
          <KPICard
            title="Free Certs Released"
            value={numberFormat(stats?.totalFreeCertsReleaseToday)}
            subtitle="Free certificates"
            color="amber"
            icon={KPIIcons.month}
          />
        </KPIGrid>

        {/* Weekly Trend Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-[15px] font-bold text-gray-700 uppercase tracking-widest mb-4">Weekly Issued Trend</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Issued Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {weeklyTrend.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-5 py-10 text-center text-sm text-gray-500">No trend data to display.</td>
                  </tr>
                ) : (
                  weeklyTrend.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">{new Date(item.date).toLocaleDateString("en-PH", { dateStyle: "medium" })}</td>
                      <td className="px-5 py-4 text-center">{numberFormat(item.count)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Recent Issued Certificates</h2>
                <p className="text-sm text-gray-500 mt-1">Latest certificates issued</p>
              </div>
              <button
                onClick={() => navigate("/clearance/issued-certificates")}
                className="text-sm font-semibold text-blue-700 hover:text-blue-800 transition-colors"
              >
                View All →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Resident Name</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Certificate Type</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Issued</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentIssued.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-sm text-gray-500">No recent certificates to display.</td>
                    </tr>
                  ) : (
                    recentIssued.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap">{item.requestorName}</td>
                        <td className="px-5 py-4">{item.certificateType}</td>
                        <td className="px-5 py-4 text-center">{new Date(item.date).toLocaleDateString("en-PH", { dateStyle: "medium" })}</td>
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === "Issued" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Top Certificates</h3>
            <div className="space-y-5">
              {topTemplates.length > 0 ? (
                topTemplates.map((cert, index) => {
                  const maxCount = Math.max(...topTemplates.map((c) => c.issuanceCount));
                  const percentage = (cert.issuanceCount / maxCount) * 100;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-gray-700">{cert.certificateTitle}</span>
                        <span className="font-bold text-blue-600">{cert.issuanceCount}</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-400 text-center py-4">No data available</p>
              )}
=======
  ResponsiveTable,
  type ColumnDef,
} from "../../reusable";
import { LoadingModal } from "../../reusable";
import {
  type ClearanceStats,
  fetchClearanceStats,
  type RecentCertificate,
  fetchRecentCertificates,
  type TopCertificateType,
  fetchTopCertificateTypes,
} from "../../clearance-api/dashboard-api";
import { LayoutList, Plus } from "lucide-react";

export const ClearanceDashboard = () => {
  const [kpiData, setKpiData] = React.useState<ClearanceStats | null>(null);
  const [recentCerts, setRecentCerts] = React.useState<RecentCertificate[]>([]);
  const [topCertTypes, setTopCertTypes] = React.useState<TopCertificateType[]>(
    [],
  );
  const [loading, setLoading] = React.useState(true);

  //revenue formatter
  const revenueFormatted = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(kpiData?.TotalRevenue || 0);

  //number formatter
  const numberFormatted = (num: number) =>
    new Intl.NumberFormat("en-US").format(num);

  //navigation
  const navigate = useNavigate();

  //table
  const columns: ColumnDef<RecentCertificate>[] = [
    { header: "Resident Name", accessorKey: "name" },
    { header: "Certificate Type", accessorKey: "type" },
    {
      header: "Date Issued",
      render: (row) =>
        new Intl.DateTimeFormat("en-PH", {
          dateStyle: "medium",
        }).format(new Date(row.dateIssued)),
    },
    {
      header: "Status",
      render: () => (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
          Issued
        </span>
      ),
    },
  ];

  // Fetching api
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        const [stats, certs, topTypes] = await Promise.all([
          fetchClearanceStats(),
          fetchRecentCertificates(),
          fetchTopCertificateTypes(),
        ]);

        setKpiData(stats);
        setRecentCerts(certs);
        setTopCertTypes(topTypes);
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  if (loading)
    return <LoadingModal isOpen={true} message="Loading dashboard data..." />;

  return (
    <div className="p-4 w-full">
      <div className="max-w-[1600px] mx-auto w-full space-y-6">
        <KPIGrid columns={4}>
          <KPICard
            title="Issued Today"
            value={numberFormatted(kpiData?.IssuedToday || 0)}
            icon={KPIIcons.issued}
            color="amber"
            subtitle="Certificates issued"
          />
          <KPICard
            title="This Month"
            value={numberFormatted(kpiData?.IssuedThisMonth || 0)}
            icon={KPIIcons.month}
            color="emerald"
            subtitle="Certificate issued"
          />
          <KPICard
            title="Total Revenue"
            value={revenueFormatted}
            icon={KPIIcons.revenue}
            color="blue"
            trend={
              kpiData
                ? {
                    value: `${kpiData.RevenueGrowth}%`,
                    direction: kpiData.RevenueDirection,
                    label: "vs last month",
                  }
                : undefined
            }
          />
          <KPICard
            title="Pending Requests"
            value={numberFormatted(kpiData?.PendingRequests || 0)}
            icon={KPIIcons.pending}
            color="rose"
            subtitle="Pending clearance requests"
          />
        </KPIGrid>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8">
            <ResponsiveTable
              title="Recent Issued Certificates"
              data={recentCerts}
              columns={columns}
              onViewAll={() => navigate("/clearance/issued-certificates")}
              onRowClick={(item) => alert(`Viewing ${item.name}`)}
            />
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-4">
                Quick Actions
              </h3>

              <div className="flex flex-col gap-2.5">
                <button
                  className="group w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 px-4 rounded-xl flex items-center justify-between transition-all active:scale-[0.98] shadow-sm shadow-blue-100"
                  onClick={() => navigate("/clearance/issue-certificate")}
                >
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Issue Certificate</span>
                  </div>
                </button>

                <button
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-semibold py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all active:scale-[0.98] border border-transparent hover:border-slate-200"
                  onClick={() => navigate("/clearance/issued-certificates")}
                >
                  <LayoutList className="w-4 h-4 text-slate-400" />
                  <span>View All Records</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                Top Certificates
              </h3>
              <div className="space-y-5">
                {topCertTypes.length > 0 ? (
                  topCertTypes.map((cert, index) => {
                    const maxCount = Math.max(
                      ...topCertTypes.map((c) => c.count),
                    );
                    const percentage = (cert.count / maxCount) * 100;
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-gray-700">
                            {cert.type}
                          </span>
                          <span className="font-bold text-blue-600">
                            {cert.count}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-400 text-center py-4">
                    No data available
                  </p>
                )}
              </div>
>>>>>>> 09c4e5e5c7b9a3bb84a9c7ef1c538cee62fe5905
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

<<<<<<< HEAD
export default ClearanceDashboard;
=======
export default ClearanceDashboard;
>>>>>>> 09c4e5e5c7b9a3bb84a9c7ef1c538cee62fe5905
