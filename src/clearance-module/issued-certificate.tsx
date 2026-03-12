import { useEffect } from "react";
import {
  KPICard,
  KPIGrid,
  KPIIcons
  
} from "../reusable";

import { LoadingModal } from "../reusable";

import {
  type IssuedStats,
  FetchIssuedCertificates,
  type IssuedCertificate,
  FetchIssuedCertificatesTable,
} from "../clearance-api/issued-certificate-api";
import React from "react";

export const IssuedCertificatePage = () => {
  const [KPIData, setKPIData] = React.useState<IssuedStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [issuedTableData, setIssuedTableData] = React.useState<
    IssuedCertificate[]
  >([]);

  //revenue formatter
  const revenueFormatted = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(KPIData?.totalRevenue || 0);

  //number formatter
  const numberFormatted = (num: number) =>
    new Intl.NumberFormat("en-US").format(num);

  // TODO: Add table rendering for issuedTableData
  console.log("Issued certificates:", issuedTableData.length);

  //fetching data
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        const [stats, certs] = await Promise.all([
          FetchIssuedCertificates(),
          FetchIssuedCertificatesTable(),
        ]);

        setKPIData(stats);
        setIssuedTableData(certs);
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
            title="Total Issued"
            value={numberFormatted(KPIData?.totalIssued || 0)}
            icon={KPIIcons.total}
            color="amber"
            subtitle="Certificates issued"
          />
          <KPICard
            title="Total Paid Certificates"
            value={numberFormatted(KPIData?.totalPaidCertificates || 0)}
            icon={KPIIcons.card}
            color="emerald"
            subtitle="Paid certificates"
          />
          <KPICard
            title="Total Free Certificates"
            value={numberFormatted(KPIData?.totalFreeCertificates || 0)}
            icon={KPIIcons.gift}
            color="rose"
            subtitle="Free certificates "
          />
          <KPICard
            title="Total Revenue"
            value={revenueFormatted}
            icon={KPIIcons.revenue}
            color="blue"
            trend={
              KPIData
                ? {
                    value: `${KPIData.revenueGrowth}%`,
                    direction: KPIData.revenueDirection,
                    label: "vs last month",
                  }
                : undefined
            }
          />
        </KPIGrid>
      </div>
    </div>
  );
};

export default IssuedCertificatePage;
