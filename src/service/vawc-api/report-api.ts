// src/api/vawc-reports.api.ts

const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const VAWC_REPORTS_URL = `${BASE}/api/v1/vawc/report`;

export interface ReportStatsDTO {
  totalCases: number;
  totalExpired: number;
  resolvedCases: number;
  avgResolutionTime: number;
}

export interface NatureStatsDTO {
  nature: string;
  count: number;
}

export interface TrendStatsDTO {
  label: string;
  count: number;
}

export interface CategorySummaryDTO {
  category: string;
  totalCases: number;
  active: number;
  resolved: number;
  pending: number;
  percentage: number;
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

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `Error: ${response.status}`,
      );
    }

    const plainText = await response.text().catch(() => "");
    throw new Error(plainText || `Error: ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return (await response.text()) as T;
}

function buildDateParams(startDate?: string, endDate?: string): string {
  const query = new URLSearchParams();
  if (startDate) query.set("startDate", startDate);
  if (endDate) query.set("endDate", endDate);
  return query.toString();
}

export async function getVawcReportStats(
  startDate?: string,
  endDate?: string,
): Promise<ReportStatsDTO> {
  const params = buildDateParams(startDate, endDate);
  return apiFetch(`${VAWC_REPORTS_URL}/stats${params ? `?${params}` : ""}`);
}

export async function getVawcNatureStats(
  startDate?: string,
  endDate?: string,
): Promise<NatureStatsDTO[]> {
  const params = buildDateParams(startDate, endDate);
  return apiFetch(
    `${VAWC_REPORTS_URL}/nature-stats${params ? `?${params}` : ""}`,
  );
}

export async function getVawcTrend(
  startDate?: string,
  endDate?: string,
): Promise<TrendStatsDTO[]> {
  const params = buildDateParams(startDate, endDate);
  return apiFetch(`${VAWC_REPORTS_URL}/trend${params ? `?${params}` : ""}`);
}

export async function getVawcCategorySummary(
  startDate?: string,
  endDate?: string,
): Promise<CategorySummaryDTO[]> {
  const params = buildDateParams(startDate, endDate);
  return apiFetch(
    `${VAWC_REPORTS_URL}/category-summary${params ? `?${params}` : ""}`,
  );
}
