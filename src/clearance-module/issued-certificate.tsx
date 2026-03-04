
import React,{useEffect} from "react";
import { useNavigate } from "react-router-dom";
import {
  KPICard,
  KPIGrid,
  KPIIcons,
  Table,		
  type ColumnDef,
  StatusBadge,
  getStatusFromValue,
  
} from "../reusable";

import { LoadingModal } from "../reusable";

 
import { 
	type IssuedStats,FetchIssuedCertificates,
	type IssuedTable,FetchIssuedCertificatesTable, 

} from "../clearance-api/issued-certificate-api";




export const IssuedCertificatePage = () => {


     const [KPIData, setKPIData] = React.useState<IssuedStats | null>(null);
	 const [loading, setLoading] = React.useState(true);
	 const [issuedTableData, setIssuedTableData] = React.useState<IssuedTable[]>([]);

   
	 //revenue formatter
	 const revenueFormatted = new Intl.NumberFormat("en-PH", {
	   style: "currency",
	   currency: "PHP",
	   minimumFractionDigits: 2,
	 }).format(KPIData?.totalRevenue || 0);
   
	 //number formatter
	 const numberFormatted = (num: number) =>
	   new Intl.NumberFormat("en-US").format(num);
   
	 //navigation
	 const navigate = useNavigate();
 


	  const columns: TableColumn<IssuedTable>[] = [
		 { key: 'id', header: 'ID', width: '60px', align: 'center' },
		 { key: 'name', header: 'Name' },
		 { key: 'age', header: 'Age', width: '80px', align: 'center' },
		 { key: 'purok', header: 'Purok' },
		 { key: 'contact', header: 'Contact' },
		 { 
		   key: 'status', 
		   header: 'Status', 
		   align: 'center',
		   render: (item) => (
			 <StatusBadge 
			   status={getStatusFromValue(item.status)} 
			   label={item.status.charAt(0).toUpperCase() + item.status.slice(1)} 
			 />
		   )
		 },
		 {
		   key: 'actions',
		   header: 'Actions',
		   align: 'center',
		   
		 }
	   ];

	

	 
    //fetching data
	 useEffect(() => {
		 const loadAllData = async () => {
		   setLoading(true);
		   try {
			 const [stats, certs, ] = await Promise.all([
			   FetchIssuedCertificates(),
			   FetchIssuedCertificatesTable(),]);
	 
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



	
					


}

export default IssuedCertificatePage;