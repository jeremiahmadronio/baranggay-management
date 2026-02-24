export interface ClearanceStats {
    IssuedToday: number;
    IssuedThisMonth: number;
    TotalRevenue: number;
    PendingRequests: number;
    RevenueGrowth : number;
    RevenueDirection: 'up' | 'down' | 'neutral';
}

const sampleStats: ClearanceStats = {
    IssuedToday: 5,
    IssuedThisMonth: 120,
    TotalRevenue: 6000,
    PendingRequests: 15,
    RevenueGrowth: 10,
    RevenueDirection: 'down'
};

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