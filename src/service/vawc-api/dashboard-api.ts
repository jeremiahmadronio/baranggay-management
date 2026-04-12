const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const VAWC_DASHBOARD_URL = `${BASE}/api/v1/vawc-dashboard`;


export interface DashboardStatsDTO {
  totalCases: number;
  casesTrend: number;
  activeBpos: number;
  totalSettled: number;
  settledTrend: number;
  bposIssued: number;
  bposTrend: number;
}

export interface DashboardCaseDistributionDTO {
  label: string;
  value: number;
}

export interface DashboardRecentCaseDTO {
  caseNumber: string;
  complainantName: string;
  natureOfComplaint: string;
  status: string;
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

// ─── API Functions ─────────────────────────────────────────────────────────

export async function getVawcDashboardStats(): Promise<DashboardStatsDTO> {
  return apiFetch(`${VAWC_DASHBOARD_URL}/stats`);
}

export async function getVawcCaseDistribution(): Promise<
  DashboardCaseDistributionDTO[]
> {
  return apiFetch(`${VAWC_DASHBOARD_URL}/distribution`);
}

export async function getVawcRecentCases(): Promise<DashboardRecentCaseDTO[]> {
  return apiFetch(`${VAWC_DASHBOARD_URL}/recent`);
}
