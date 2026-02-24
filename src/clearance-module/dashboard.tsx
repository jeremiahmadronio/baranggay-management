import React, { useEffect } from "react";
import { KPICard, KPIGrid, KPIIcons } from "../reusable";
import { LoadingModal } from "../reusable";
import {
  type ClearanceStats,
  fetchClearanceStats,
} from "../clearance-api.ts/dashboard";

export const ClearanceDashboard = () => {
  const [kpiData, setKpiData] = React.useState<ClearanceStats | null>(null);
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

  //fetching api
  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      const stats = await fetchClearanceStats();
      setKpiData(stats);
      setLoading(false);
    };
    loadStats();
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


      
    </div>
  );
};

export default ClearanceDashboard;
