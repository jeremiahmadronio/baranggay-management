const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const BCPC_DASHBOARD_URL = `${BASE}/api/v1/bcpc-dashboard`;

export interface DashboardStatsDTO {
  totalCases: number;
  onGoingCases: number;
  settledCases: number;
  mostNatureCases: string;
}

export interface MonthlyCaseChartDTO {
  month: string;
  count: number;
}

export interface CaseStatusDistributionDTO {
  status: string;
  count: number;
}

export interface RecentCaseDTO {
  id: number;
  blotterNumber: string;
  caseType: string;
  complainantName: string;
  respondentName: string;
  status: string;
  dateFiled: string;
}

export interface UpcomingHearingDTO {
  hearingId: number;
  caseTitle: string;
  blotterNumber: string;
  scheduledStart: string;
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

export async function getMainStats(): Promise<DashboardStatsDTO> {
  return apiFetch<DashboardStatsDTO>(`${BCPC_DASHBOARD_URL}/stats`);
}

export async function getMonthlyChart(): Promise<MonthlyCaseChartDTO[]> {
  return apiFetch<MonthlyCaseChartDTO[]>(`${BCPC_DASHBOARD_URL}/monthly-chart`);
}

export async function getCaseDistribution(): Promise<CaseStatusDistributionDTO[]> {
  return apiFetch<CaseStatusDistributionDTO[]>(`${BCPC_DASHBOARD_URL}/distribution`);
}

export async function getRecentCases(): Promise<RecentCaseDTO[]> {
  return apiFetch<RecentCaseDTO[]>(`${BCPC_DASHBOARD_URL}/recent`);
}

export async function getUpcomingHearings(): Promise<UpcomingHearingDTO[]> {
  return apiFetch<UpcomingHearingDTO[]>(`${BCPC_DASHBOARD_URL}/hearings`);
}
