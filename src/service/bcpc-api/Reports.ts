const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const BCPC_REPORTS_URL = `${BASE}/api/v1/bcpc-reports`;

export interface BcpcReportStatsDTO {
  totalCases: number;
  totalCasesTrend: number;
  resolvedCases: number;
  resolvedCasesTrend: number;
  closedCases: number;
  closedCasesTrend: number;
  activeIntervention: number;
  activeInterventionTrend: number;
}

export interface ChartDataDTO {
  label: string;
  count: number;
}

export interface NatureStatDTO {
  natureName: string;
  count: number;
}

export interface StatusStatDTO {
  statusName: string;
  count: number;
}

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

export async function getStats(startDate?: string, endDate?: string): Promise<BcpcReportStatsDTO> {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<BcpcReportStatsDTO>(`${BCPC_REPORTS_URL}/stats${query}`);
}

export async function getCasesTrend(startDate?: string, endDate?: string): Promise<ChartDataDTO[]> {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<ChartDataDTO[]>(`${BCPC_REPORTS_URL}/cases-trend${query}`);
}

export async function getNatureStats(startDate?: string, endDate?: string): Promise<NatureStatDTO[]> {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<NatureStatDTO[]>(`${BCPC_REPORTS_URL}/nature${query}`);
}

export async function getStatusStats(startDate?: string, endDate?: string): Promise<StatusStatDTO[]> {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<StatusStatDTO[]>(`${BCPC_REPORTS_URL}/status${query}`);
}
