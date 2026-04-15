const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const FTJS_DASHBOARD_URL = `${BASE}/api/v1/ftjs-dashboard`;

// =====================================================================
// RESPONSE DTOs
// =====================================================================

export interface DashboardStatsResponseDTO {
  totalIssueToday: number;
  totalIssueLastWeek: number;
  totalArchiveThisWeek: number;
  totalNonResidentIssueThisWeek: number;
}

export interface TrendResponseDTO {
  label: string;
  total: number;
}

export interface StatusCountDTO {
  status: string;
  total: number;
}

export interface FtjsRecentIssueDTO {
  ftjsNumber: string;
  fullName: string;
  status: string;
  createdAt: string;
}

// =====================================================================
// API FETCH HELPER
// =====================================================================

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      throw new Error("Session expired. Please login again.");
    }
    const contentType = response.headers.get("content-type");
    const errMsg = contentType?.includes("application/json")
      ? (await response.json().catch(() => ({}))).message
      : await response.text();
    throw new Error(errMsg || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) return {} as T;

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) return response.json();
  return response.text() as unknown as T;
}


export const ftjsDashboardApi = {

  // display ftjs stats for dashboard
  getStats: (): Promise<DashboardStatsResponseDTO> =>
    apiFetch<DashboardStatsResponseDTO>(`${FTJS_DASHBOARD_URL}/stats`),

  // display last 6 months trend
  getLastSixMonthsTrend: (): Promise<TrendResponseDTO[]> =>
    apiFetch<TrendResponseDTO[]>(`${FTJS_DASHBOARD_URL}/last-6-months`),

  // display last week trend
  getLastWeekTrend: (): Promise<TrendResponseDTO[]> =>
    apiFetch<TrendResponseDTO[]>(`${FTJS_DASHBOARD_URL}/last-week`),

  // display status distribution
  getStatusDistribution: (): Promise<StatusCountDTO[]> =>
    apiFetch<StatusCountDTO[]>(`${FTJS_DASHBOARD_URL}/distribution-status`),

  // display recent issues
  getRecentIssues: (): Promise<FtjsRecentIssueDTO[]> =>
    apiFetch<FtjsRecentIssueDTO[]>(`${FTJS_DASHBOARD_URL}/recent-issues`),
};