const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const REPORTS_URL = `${BASE}/api/v1/blotter-reports`;

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

export interface NatureStatDTO {
  natureName: string;
  count: number;
}

export interface ChartDataDTO {
  label: string;
  count: number;
}

export interface StatusStatDTO {
  statusName: string;
  count: number;
}

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
      throw new Error("Session expired.");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error: ${response.status}`);
  }

  return response.status === 204 ? ({} as T) : response.json();
}

const getParams = (start: string, end: string) => 
  new URLSearchParams({ startDate: start, endDate: end }).toString();

export async function getReportsStats(start: string, end: string): Promise<ReportsStatsDTO> {
  return apiFetch<ReportsStatsDTO>(`${REPORTS_URL}/stats?${getParams(start, end)}`);
}

export async function getCasesTrend(start: string, end: string): Promise<ChartDataDTO[]> {
  return apiFetch<ChartDataDTO[]>(`${REPORTS_URL}/cases-trend?${getParams(start, end)}`);
}

export async function getCasesByNature(start: string, end: string): Promise<NatureStatDTO[]> {
  return apiFetch<NatureStatDTO[]>(`${REPORTS_URL}/nature?${getParams(start, end)}`);
}

export async function getCasesByStatus(start: string, end: string): Promise<StatusStatDTO[]> {
  return apiFetch<StatusStatDTO[]>(`${REPORTS_URL}/status?${getParams(start, end)}`);
}

export async function getSettlementEfficiency(start: string, end: string): Promise<SettlementEfficiencyDTO> {
  return apiFetch<SettlementEfficiencyDTO>(`${REPORTS_URL}/efficiency?${getParams(start, end)}`);
}