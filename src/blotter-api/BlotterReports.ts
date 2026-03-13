const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const REPORTS_URL = `${BASE}/api/v1/blotter-reports`;

//reports stats
export interface ReportsStatsDTO {
  totalEntries: number;
  totalTrend: number;
  formalComplaints: number;
  formalTrend: number;
  forTheRecord: number;
  recordTrend: number;
  referredToLupon: number;
  luponTrend: number;
}

//cases by nature
export interface NatureStatDTO {
  natureName: string;
  count: number;
}

//monthly trends
export interface MonthlyTrendDTO {
  month: string;
  count: number;
}

//cases by status
export interface StatusStatDTO {
  statusName: string;
  count: number;
}

//settlement efficiency
export interface SettlementEfficiencyDTO {
  totalFormalComplaints: number;
  settledCases: number;
  efficiencyPercentage: number;
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

export async function getReportsStats(): Promise<ReportsStatsDTO> {
  return apiFetch<ReportsStatsDTO>(`${REPORTS_URL}/stats`);
}

export async function getCasesByNature(): Promise<NatureStatDTO[]> {
  return apiFetch<NatureStatDTO[]>(`${REPORTS_URL}/cases-by-nature`);
}

export async function getMonthlyTrends(): Promise<MonthlyTrendDTO[]> {
  return apiFetch<MonthlyTrendDTO[]>(`${REPORTS_URL}/monthly-trends`);
}

export async function getCasesByStatus(): Promise<StatusStatDTO[]> {
  return apiFetch<StatusStatDTO[]>(`${REPORTS_URL}/cases-by-status`);
}

export async function getSettlementEfficiency(): Promise<SettlementEfficiencyDTO> {
  return apiFetch<SettlementEfficiencyDTO>(`${REPORTS_URL}/settlement-efficiency`);
}