
//stats
export interface IssuedStats {
    totalIssued: number;
    totalRevenue: number;
    totalFreeCertificates: number;
    totalPaidCertificates: number;
    revenueGrowth: number; 
    revenueDirection: 'up' | 'down' | 'neutral';
} 

//mock stats data
const sampleIssuedStats: IssuedStats = {
    totalIssued: 150,
    totalRevenue: 7500,
    totalFreeCertificates: 50,  
    totalPaidCertificates: 100, 
    revenueGrowth: 5, 
    revenueDirection: 'up'
}

//issued certificates table 
export interface IssuedTable {
    id: String;
    CertificateType: String;
    RequesterName: String;
    Fee: number;
    DateIssued: String;
    Status : String;
    IssuedBy: String;
}

const sampleIssuedTable: IssuedTable[] = [
    { id: '1', CertificateType: 'Barangay Clearance', RequesterName: 'Jeremiah Madronio', Fee: 50, DateIssued: '2024-06-01', Status: 'Completed', IssuedBy: 'Admin' },
    { id: '2', CertificateType: 'First Time Job Seeker', RequesterName: 'Jere Madronio', Fee: 0, DateIssued: '2024-06-02', Status: 'Completed', IssuedBy: 'Admin' },
    { id: '3', CertificateType: 'Business Clearance', RequesterName: 'Jer Madronio', Fee: 100, DateIssued: '2024-06-03', Status: 'Pending', IssuedBy: '' },
    { id: '4', CertificateType: 'Barangay Clearance', RequesterName: 'Jerem Madronio', Fee: 50, DateIssued: '2024-06-04', Status: 'Completed', IssuedBy: 'Admin' },
    { id: '5', CertificateType: 'Indigency Certificate', RequesterName: 'Jane Doe', Fee: 0, DateIssued: '2024-06-05', Status: 'Completed', IssuedBy: 'Admin' },
    { id: '6', CertificateType: 'Job Seeker Certificate', RequesterName: 'John Smith', Fee: 0, DateIssued: '2024-06-06', Status: 'Pending', IssuedBy: '' },
    { id: '7', CertificateType: 'Tricycle Clearance', RequesterName: 'Alice Johnson', Fee: 75, DateIssued: '2024-06-07', Status: 'Completed', IssuedBy: 'Admin' },
    { id: '8', CertificateType: 'Tricycle Registration', RequesterName: 'Bob Brown', Fee: 150, DateIssued: '2024-06-08', Status: 'Completed', IssuedBy: 'Admin' },
    { id: '9', CertificateType: 'Working Clearance', RequesterName: 'Charlie Davis', Fee: 50, DateIssued: '2024-06-09', Status: 'Pending', IssuedBy: '' },
    { id: '10', CertificateType: 'Improvement Permit', RequesterName: 'Diana Evans', Fee: 200, DateIssued: '2024-06-10', Status: 'Completed', IssuedBy: 'Admin' },
]


//stats
export const FetchIssuedCertificates = async (): Promise<IssuedStats> => {
    try {
        const response = await fetch('/api/issued-certificates');
        if (!response.ok) {
            throw new Error('Failed to fetch issued certificates');
        }
        return await response.json();
    } catch (error) {
        return sampleIssuedStats;
    }
}

//table data
export const FetchIssuedCertificatesTable = async (): Promise<IssuedTable[]> => {
    try {
        const response = await fetch('/api/issued-certificates/table');
        if (!response.ok) {
            throw new Error('Failed to fetch issued certificates table data');
        }
        return await response.json();
    } catch (error) {
        return sampleIssuedTable;
    }
}