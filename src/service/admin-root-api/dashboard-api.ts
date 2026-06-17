const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const BASE_URL = `${BASE}/api/v1/dashboard`;
const SYSTEM_HEALTH_URL = `${BASE}/api/v1/admin/system`;

export interface DashboardStats {
  totalUser: number;
  totalResidents: number;
  totalOfficer: number;
  totalAuditEntry: number;

}

const ENDPOINTS = {
  DASHBOARD_STATS: "/stats",
  OVERVIEW: "/activity-overview",
  RECENT_ACTIONS: "/recent-actions",
  LAST_SIX_MONTHS: "/last-six-months",
  AUDIT_SEVERITY_DISTRIBUTION: "/audit-severity-distribution",
  AUDIT_SEVERITY_YEARS: "/audit-severity-years",
};

const SYSTEM_ENDPOINTS = {
  HEALTH: "/health",
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
  year?: number;
}

export interface AuditSeverityDistribution {
  name: string;
  value: number;
  year?: number;
}

export interface AuditSeverityYear {
  year: number;
  distribution: AuditSeverityDistribution[];
}

export interface LastSixMonthsResidents {
  labels: string[];
  counts: number[];
}

export interface SystemHealth {
  cpuUsage: number;
  memoryUsedMB: number;
  memoryMaxMB: number;
  memoryPercent: number;
  diskFreeGB: number;
  diskTotalGB: number;
  diskPercent: number;
  status: string;
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  baseUrl = BASE_URL,
): Promise<T> {
  const token = localStorage.getItem("token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${baseUrl}${endpoint}`, {
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

export async function getAuditSeverityDistribution(): Promise<AuditSeverityDistribution[]> {
  return apiFetch<AuditSeverityDistribution[]>(ENDPOINTS.AUDIT_SEVERITY_DISTRIBUTION);
}

export async function getAuditSeverityYears(): Promise<AuditSeverityYear[]> {
  return apiFetch<AuditSeverityYear[]>(ENDPOINTS.AUDIT_SEVERITY_YEARS);
}

export async function getLastSixMonthsResidents(): Promise<LastSixMonthsResidents> {
  return apiFetch<LastSixMonthsResidents>(ENDPOINTS.LAST_SIX_MONTHS);
}

export async function getSystemHealth(): Promise<SystemHealth> {
  return apiFetch<SystemHealth>(SYSTEM_ENDPOINTS.HEALTH, {}, SYSTEM_HEALTH_URL);
}
