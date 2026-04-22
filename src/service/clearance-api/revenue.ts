const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const REVENUE_URL = `${BASE}/api/v1/revenue`;

// =====================================================================
// DTOs
// =====================================================================

export interface RevenueStatsResponseDTO {
  totalRevenue: number;
  totalRevenueThisWeek: number;
  totalRevenueThisMonth: number;
  totalRevenueThisYear: number;
}

export interface RevenueResponseByCertificate {
  certificateTitle: string;
  count: number;
  fee: number;
  totalRevenue: number;
}

export interface RevenueTrendDTO {
  label: string;
  revenue: number;
}

export interface DailyCollectionResponseDTO {
  date: string;
  totalCertIssue: number;
  totalCollections: number;
  oRNumberStartToEnd: string;
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



export const revenueApi = {
  // GET /stats
  getRevenueStats: (): Promise<RevenueStatsResponseDTO> =>
    apiFetch<RevenueStatsResponseDTO>(`${REVENUE_URL}/stats`),

  // GET /revenue-by-template?startDate=&endDate=
  getRevenueByCertificateType: (
    startDate: string,
    endDate: string
  ): Promise<RevenueResponseByCertificate[]> =>
    apiFetch<RevenueResponseByCertificate[]>(
      `${REVENUE_URL}/revenue-by-template?startDate=${startDate}&endDate=${endDate}`
    ),

  // GET /revenue-trend?startDate=&endDate=
  getRevenueTrend: (
    startDate: string,
    endDate: string
  ): Promise<RevenueTrendDTO[]> =>
    apiFetch<RevenueTrendDTO[]>(
      `${REVENUE_URL}/revenue-trend?startDate=${startDate}&endDate=${endDate}`
    ),

  // GET /top5-revenue?startDate=&endDate=
  getTop5Revenue: (
    startDate: string,
    endDate: string
  ): Promise<RevenueResponseByCertificate[]> =>
    apiFetch<RevenueResponseByCertificate[]>(
      `${REVENUE_URL}/top5-revenue?startDate=${startDate}&endDate=${endDate}`
    ),

  // GET /daily-collections?startDate=&endDate=
  getDailyCollections: (
    startDate: string,
    endDate: string
  ): Promise<DailyCollectionResponseDTO[]> =>
    apiFetch<DailyCollectionResponseDTO[]>(
      `${REVENUE_URL}/daily-collections?startDate=${startDate}&endDate=${endDate}`
    ),
};