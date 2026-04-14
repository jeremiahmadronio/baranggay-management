const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const CLEARANCE_DASHBOARD_URL = `${BASE}/api/v1/clearance/dashboard`;


export interface DashboardStatsResponseDTO {
  totalIssuedToday: number;
  revenueToday: number;
  totalArchiveToday: number;
  totalFreeCertsReleaseToday: number;
}

export interface WeeklyIssuedTrendDTO {
  date: string;
  count: number;
}

export interface TopTemplateResponseDTO {
  certificateTitle: string;
  issuanceCount: number;
}

export interface RecentRequestResponseDTO {
  requestorName: string;
  certificateType: string;
  date: string;
  status: string;
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

// =====================================================================
// CLEARANCE DASHBOARD API
// =====================================================================

export const clearanceDashboardApi = {
  // GET /stats
  getStats: (): Promise<DashboardStatsResponseDTO> =>
    apiFetch<DashboardStatsResponseDTO>(`${CLEARANCE_DASHBOARD_URL}/stats`),

  // GET /issuance-trend
  getWeeklyTrend: (): Promise<WeeklyIssuedTrendDTO[]> =>
    apiFetch<WeeklyIssuedTrendDTO[]>(`${CLEARANCE_DASHBOARD_URL}/issuance-trend`),

  // GET /top-templates
  getTopTemplates: (): Promise<TopTemplateResponseDTO[]> =>
    apiFetch<TopTemplateResponseDTO[]>(`${CLEARANCE_DASHBOARD_URL}/top-templates`),

  // GET /recent-issued
  getRecentIssued: (): Promise<RecentRequestResponseDTO[]> =>
    apiFetch<RecentRequestResponseDTO[]>(`${CLEARANCE_DASHBOARD_URL}/recent-issued`),
};