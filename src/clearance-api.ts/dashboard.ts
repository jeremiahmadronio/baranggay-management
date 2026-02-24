
//stats
export interface ClearanceStats {
    IssuedToday: number;
    IssuedThisMonth: number;
    TotalRevenue: number;
    PendingRequests: number;
    RevenueGrowth : number;
    RevenueDirection: 'up' | 'down' | 'neutral';
}

//mock stats data
const sampleStats: ClearanceStats = {
    IssuedToday: 5,
    IssuedThisMonth: 120,
    TotalRevenue: 6000,
    PendingRequests: 15,
    RevenueGrowth: 10,
    RevenueDirection: 'down'
};
//recent certificates
export interface RecentCertificate {
    name: string;
    type: string;
    dateIssued: string;
}

//mock recent certificates data
const sampleRecentCertificates: RecentCertificate[] = [
    { name: 'Jeremiah Madronio', type: 'Barangay Clearance', dateIssued: '2024-06-01' },
    { name: 'Jere Madronio', type: 'First Time Job Seeker', dateIssued: '2024-06-02' },
    { name: 'Jer Madronio', type: 'Business Clearance', dateIssued: '2024-06-03' },
    { name: 'Jerem Madronio', type: 'Barangay Clearance', dateIssued: '2024-06-04' },
]














//stats
export const fetchClearanceStats = async (): Promise<ClearanceStats> => {
    try{
        const response = await fetch('/api/clearance/stats');

        if (!response.ok) {
            throw new Error('Failed to fetch clearance stats');
        }

        return await response.json();
        
    }catch(error){
        return sampleStats;
    }
};

//recent certificates
export const fetchRecentCertificates = async (): Promise<RecentCertificate[]> => {
    try{
        const response = await fetch('/api/clearance/recent-certificates');
        if (!response.ok) {
            throw new Error('Failed to fetch recent certificates');
        }
        return await response.json();
    }catch(error){
        return sampleRecentCertificates;
    }
}