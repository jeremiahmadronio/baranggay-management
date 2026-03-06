const BASE_URL = "http://localhost:8080/api/v1/dashboard";

export interface DashboardStats {
  totalUser: number;
  totalActiveUser: number;
  totalCritical: number;
  totalAuditEntry: number;
  auditGrowth: number;
  auditDirection: "up" | "down" | "neutral";
}

const ENDPOINTS = {
  DASHBOARD_STATS: "/stats",
  OVERVIEW: "/activity-overview",
  RECENT_ACTIONS: "/recent-actions",
};

export interface DeptActivity {
  departmentName: string;
  count: number;
  percentage: number;
}

export interface ActivityOverview {
  totalActivity: number;
  departments: DeptActivity[];
}

export interface RecentActions {
  firstName: string;
  lastName: string;
  severity: string;
  actionTaken: string;
  module: string;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA - Used when backend is unavailable
// ═══════════════════════════════════════════════════════════════════════════

const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalUser: 156,
  totalActiveUser: 42,
  totalCritical: 3,
  totalAuditEntry: 1847,
  auditGrowth: 12.5,
  auditDirection: "up",
};

const MOCK_ACTIVITY_OVERVIEW: ActivityOverview = {
  totalActivity: 2450,
  departments: [
    { departmentName: "Clearance", count: 842, percentage: 34.4 },
    { departmentName: "Blotter", count: 521, percentage: 21.3 },
    { departmentName: "VAWC", count: 398, percentage: 16.2 },
    { departmentName: "BCPC", count: 312, percentage: 12.7 },
    { departmentName: "Lupon", count: 245, percentage: 10.0 },
    { departmentName: "FTJS", count: 132, percentage: 5.4 },
  ],
};

const MOCK_RECENT_ACTIONS: RecentActions[] = [
  {
    firstName: "Juan",
    lastName: "Dela Cruz",
    severity: "low",
    actionTaken: "Issued Barangay Clearance",
    module: "Clearance",
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    firstName: "Maria",
    lastName: "Santos",
    severity: "medium",
    actionTaken: "Updated resident record",
    module: "Records",
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    firstName: "Pedro",
    lastName: "Reyes",
    severity: "high",
    actionTaken: "Filed new blotter case",
    module: "Blotter",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    firstName: "Ana",
    lastName: "Garcia",
    severity: "critical",
    actionTaken: "Reported VAWC incident",
    module: "VAWC",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    firstName: "Jose",
    lastName: "Mendoza",
    severity: "low",
    actionTaken: "Scheduled mediation",
    module: "Lupon",
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
];

// ═══════════════════════════════════════════════════════════════════════════

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message || `HTTP error! status: ${response.status}`,
    );
  }
  if (response.status === 204) return {} as T;
  return response.json();
}

//stats
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const data = await apiFetch<DashboardStats>(ENDPOINTS.DASHBOARD_STATS);
    if (!data) throw new Error("No dashboard data received from server.");
    return data;
  } catch (error) {
    console.warn(
      "[Dashboard API] Failed to fetch stats, using mock data:",
      error,
    );
    return MOCK_DASHBOARD_STATS;
  }
}

export async function getActivityOverview(): Promise<ActivityOverview> {
  try {
    return await apiFetch<ActivityOverview>(ENDPOINTS.OVERVIEW);
  } catch (error) {
    console.warn(
      "[Dashboard API] Failed to fetch activity overview, using mock data:",
      error,
    );
    return MOCK_ACTIVITY_OVERVIEW;
  }
}

export async function getRecentActions(): Promise<RecentActions[]> {
  try {
    return await apiFetch<RecentActions[]>(ENDPOINTS.RECENT_ACTIONS);
  } catch (error) {
    console.warn(
      "[Dashboard API] Failed to fetch recent actions, using mock data:",
      error,
    );
    return MOCK_RECENT_ACTIONS;
  }
}
