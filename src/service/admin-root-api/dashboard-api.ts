const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const BASE_URL = `${BASE}/api/v1/dashboard`;

export interface DashboardStats {
  totalUser: number;
  totalActiveResident: number;
  totalActiveEmployee: number;
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
  const data = await apiFetch<DashboardStats>(ENDPOINTS.DASHBOARD_STATS);
  if (!data) throw new Error("No dashboard data received from server.");
  return data;
}

export async function getActivityOverview(): Promise<ActivityOverview> {
  return apiFetch<ActivityOverview>(ENDPOINTS.OVERVIEW);
}

export async function getRecentActions(): Promise<RecentActions[]> {
  return apiFetch<RecentActions[]>(ENDPOINTS.RECENT_ACTIONS);
}
