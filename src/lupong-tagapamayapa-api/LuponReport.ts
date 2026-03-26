  const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";


const REPORTS_URL = `${BASE}/api/v1/lupon-reports`;

export interface ReportStatsDTO {
  escalate: number;
  totalSettled: number;
  totalClosed: number;
  totalCFA: number;
}

export interface StatusStatDTO {
  status: string;
  count: number;
}

export interface NatureReportDTO {
  natureName: string;
  count: number;
}


export interface ChartDataDTO {
  label: string;
  count: number;
}

export interface LuponMonthlyReportDTO {
  dateFiled: string; // ISO Date String
  caseNo: string;
  parties: string;
  complaint: string;
  isCriminal: number;
  isCivil: number;
  isOthers: number;
  mediation: number;
  conciliation: number;
  arbitration: number;
  ongoing: number;
  dismissed: number;
  issueCFA: number;
  withdrawn: number;
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


export async function getReportStats(start?: string, end?: string): Promise<ReportStatsDTO> {
  const query = new URLSearchParams();
  if (start) query.set("start", start);
  if (end) query.set("end", end);

  return apiFetch<ReportStatsDTO>(`${REPORTS_URL}/stats?${query.toString()}`);
}

export async function getStatusStats(startDate?: string, endDate?: string): Promise<StatusStatDTO[]> {
  const query = new URLSearchParams();
  if (startDate) query.set("startDate", startDate);
  if (endDate) query.set("endDate", endDate);

  return apiFetch<StatusStatDTO[]>(`${REPORTS_URL}/status?${query.toString()}`);
}

export async function getTopNature(startDate?: string, endDate?: string): Promise<NatureReportDTO[]> {
  const query = new URLSearchParams();
  if (startDate) query.set("startDate", startDate);
  if (endDate) query.set("endDate", endDate);

  return apiFetch<NatureReportDTO[]>(`${REPORTS_URL}/top-nature?${query.toString()}`);
}

export async function getCasesTrend(start: string, end: string): Promise<ChartDataDTO[]> {
  const query = new URLSearchParams();
  query.set("start", start);
  query.set("end", end);

  return apiFetch<ChartDataDTO[]>(`${REPORTS_URL}/cases-trend?${query.toString()}`);
}

export async function getMonthlyDilgReport(month: number, year: number): Promise<LuponMonthlyReportDTO[]> {
  const query = new URLSearchParams();
  query.set("month", String(month));
  query.set("year", String(year));

  return apiFetch<LuponMonthlyReportDTO[]>(`${REPORTS_URL}/monthly-dilg?${query.toString()}`);
}