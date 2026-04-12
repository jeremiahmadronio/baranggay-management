const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const FTJS_REPORT_URL = `${BASE}/api/v1/ftjs-report`;

// =====================================================================
// RESPONSE DTOs
// =====================================================================

interface RawReportStatsResponseDTO {
  totalArchive: number;
  totalArchiveThisMonth: number;
  totalArchiveResident: number;
  totalArchiveNonResident: number;
}

export interface ReportStatsResponseDTO {
  totalRecords: number;
  residentRecords: number;
  nonResidentRecords: number;
  duplicateTotalFromDto: number;
}

export interface StatusDistributionDTO {
  status: string;
  total: number;
}

export interface TrendResponseDTO {
  label: string;
  total: number;
}

export interface FtjsReportTableDTO {
  id: number;
  ftjsNumber: string;
  fullName: string;
  status: string;
  dateSubmitted: string; // "YYYY-MM-DD"
  contactNumber: string;
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
// QUERY PARAM BUILDER
// =====================================================================

function buildDateParams(startDate?: string, endDate?: string): string {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const ftjsReportApi = {
  // GET /api/v1/ftjs-report/reports/summary?startDate=&endDate=
  getReportSummary: async (
    startDate?: string,
    endDate?: string,
  ): Promise<ReportStatsResponseDTO> => {
    const raw = await apiFetch<RawReportStatsResponseDTO>(
      `${FTJS_REPORT_URL}/reports/summary${buildDateParams(startDate, endDate)}`,
    );

    return {
      totalRecords: raw.totalArchive,
      duplicateTotalFromDto: raw.totalArchiveThisMonth,
      residentRecords: raw.totalArchiveResident,
      nonResidentRecords: raw.totalArchiveNonResident,
    };
  },

  // GET /api/v1/ftjs-report/distribution?startDate=&endDate=
  getStatusDistribution: (
    startDate?: string,
    endDate?: string,
  ): Promise<StatusDistributionDTO[]> =>
    apiFetch<StatusDistributionDTO[]>(
      `${FTJS_REPORT_URL}/distribution${buildDateParams(startDate, endDate)}`,
    ),

  // GET /api/v1/ftjs-report/trend?startDate=&endDate=
  getTrend: (
    startDate?: string,
    endDate?: string,
  ): Promise<TrendResponseDTO[]> =>
    apiFetch<TrendResponseDTO[]>(
      `${FTJS_REPORT_URL}/trend${buildDateParams(startDate, endDate)}`,
    ),

  // GET /api/v1/ftjs-report/cases?startDate=&endDate=
  getReportCases: (
    startDate?: string,
    endDate?: string,
  ): Promise<FtjsReportTableDTO[]> =>
    apiFetch<FtjsReportTableDTO[]>(
      `${FTJS_REPORT_URL}/cases${buildDateParams(startDate, endDate)}`,
    ),
};
