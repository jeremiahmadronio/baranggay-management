import React, { useEffect } from "react";
import { KPICard, KPIGrid, KPIIcons,ResponsiveTable, type ColumnDef } from "../reusable";
import { LoadingModal } from "../reusable";

import {
  type ClearanceStats,
  fetchClearanceStats,
  type RecentCertificate,
  fetchRecentCertificates
} from "../clearance-api.ts/dashboard";








export const ClearanceDashboard = () => {
  const [kpiData, setKpiData] = React.useState<ClearanceStats | null>(null);
  const [recentCerts, setRecentCerts] = React.useState<RecentCertificate[]>([]);
  const [loading, setLoading] = React.useState(true);

  //stats money formatting
  const revenueFormatted = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(kpiData?.TotalRevenue || 0);

  //stats number formatting
  const numberFormatted = (num: number) =>
    new Intl.NumberFormat("en-US").format(num);

 //table columns
  const columns: ColumnDef<RecentCertificate>[] = [
    { header: "Resident Name", accessorKey: "name" },
    { header: "Certificate Type", accessorKey: "type" },
    { 
      header: "Date Issued", 
      render: (row) => new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium"
      }).format(new Date(row.dateIssued))
    },
{
    header: "Status",
    render: () => (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
        Issued
      </span>
    ),
  },  ];


  //fetching api
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        const [stats, certs] = await Promise.all([
          fetchClearanceStats(),
          fetchRecentCertificates()
        ]);

        setKpiData(stats);
        setRecentCerts(certs);
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  //loading
  if (loading) {
    return (
      <div className="p-4 w-full min-h-screen relative">
        <LoadingModal
          isOpen={loading}
          message="Loading dashboard data..."
        />

        <div className="max-w-[1600px] mx-auto w-full"></div>
      </div>
    );
  }

  return (
    <div className="p-4 w-full min-h-screen">
      <div className="max-w-[1600px] mx-auto w-full">
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
                    value: `${kpiData?.RevenueGrowth}%`,
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
      </div>

        <div className="max-w-[1600px] mx-auto w-full mt-6">
            <ResponsiveTable 
          title="Recent Issued Certificates"
          data={recentCerts}
          columns={columns}
          onViewAll={() => console.log("Go to full list")}
          onRowClick={(item) => alert(`Viewing ${item.name}`)}
        />
        </div>

        

    </div>
  );
};

export default ClearanceDashboard;
