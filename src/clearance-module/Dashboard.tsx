import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  KPICard,
  KPIGrid,
  KPIIcons,
  ResponsiveTable,
  type ColumnDef,
} from "../reusable";
import { LoadingModal } from "../reusable";
import {
  type ClearanceStats,
  fetchClearanceStats,
  type RecentCertificate,
  fetchRecentCertificates,
  type TopCertificateType,
  fetchTopCertificateTypes,
} from "../clearance-api/dashboard-api";
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClearanceDashboard;