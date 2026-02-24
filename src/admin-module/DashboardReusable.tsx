import { Eye } from 'lucide-react';
import { ResponsiveTable, type ColumnDef } from '../reusable/RecentSystemActions';


// 1. I-DEFINE ANG ITSURA NG DATA MO
interface ClearanceApplication {
  id: string;
  applicantName: string;
  contactNumber: string;
  type: string;
  status: 'Pending' | 'For Release' | 'Claimed';
}

const recentApplications: ClearanceApplication[] = [
  { id: 'REQ-0015', applicantName: 'Rachel Domingo', contactNumber: '0965-555-6677', type: 'First Time Job Seeker', status: 'For Release' },
  { id: 'REQ-0014', applicantName: 'Sophia Cruz', contactNumber: '0921-111-2233', type: 'First Time Job Seeker', status: 'For Release' },
  { id: 'REQ-0013', applicantName: 'Jennifer Santos', contactNumber: '0967-777-8899', type: 'Barangay Clearance', status: 'Claimed' },
  { id: 'REQ-0012', applicantName: 'Carlo Mendoza', contactNumber: '0912-222-3344', type: 'Business Clearance', status: 'Pending' },
];


export default function AdminPage() {
  const tableColumns: ColumnDef<ClearanceApplication>[] = [
    { 
      header: 'ID', 
      accessorKey: 'id',
      render: (row) => <span className="text-xs font-mono text-gray-500">{row.id}</span>
    },
    { 
      header: 'Applicant', 
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-900">{row.applicantName}</span>
          <span className="text-xs text-gray-500">{row.contactNumber}</span>
        </div>
      )
    },
    { 
      header: 'Nature / Type', 
      accessorKey: 'type' 
    },
    { 
      header: 'Status',
      render: (row) => {
        let badgeColor = '';
        
        if (row.status === 'Claimed') badgeColor = 'bg-green-100 text-green-700';
        else if (row.status === 'For Release') badgeColor = 'bg-blue-100 text-blue-700'; 
        else badgeColor = 'bg-amber-100 text-amber-700'; 

        return (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeColor}`}>
            {row.status}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      render: () => (
        <div className="text-gray-400 group-hover:text-blue-600 transition-colors">
          <Eye className="w-5 h-5" />
        </div>
      )
    }
  ];
  return (
   <div className="p-4 w-full min-h-screen">
      <div className="max-w-[1600px] mx-auto w-full space-y-6">
        

        <ResponsiveTable 
          title="Recent Applications" 
          data={recentApplications} 
          columns={tableColumns} 
          
          onViewAll={() => console.log("Nag-click sa View All. I-redirect sa /clearance/list")}
          
          onRowClick={(row) => {
            alert(`Binuksan ang record ni: ${row.applicantName}`);          }}
        />

      </div>
    </div>
  );
}