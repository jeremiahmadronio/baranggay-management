const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const DASHBOARD_URL = `${BASE}/api/v1/admin`;

// ─── DTOs ───────────────────────────────────────────────────────────────────

export interface AdminDashboardStats {
  totalResident: number;
  totalUsers: number;
  totalOfficer: number;
  totalSystemActionsToday: number;
}

export interface AdminDashboardOfficerByDepartmentDTO {
  label: string;
  count: number;
}

export interface AdminDashboaradResidentByStatusDTO {
  statusLabel: string;
  count: number;
}

export interface AdminDashboardRecentAddedResidentDTO {
  barangayIdNumber: string;
  fullName: string;
  isVoter: boolean;
  status: string;
}

export interface AdminDashboardRecentActivityDTO {
  action: string;
  time: string;
}

export interface AdminDashboardActivityByDepartment {
  departmentName: string;
  count: number;
  percentage: number;
}

export interface AdminDashboardDepartmentActivityResponse {
  totalOverall: number;
  breakdown: AdminDashboardActivityByDepartment[];
}

// ─── Fetch Helper ────────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json, text/plain, */*",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  const contentType = response.headers.get("content-type") || "";
  const rawBody = response.status === 204 ? "" : await response.text();

  const parseJsonSafely = (text: string) => {
    if (!text) return null;
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return null;
    }
  };

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      throw new Error("Session expired. Please login again.");
    }

    let errMsg = "";

    if (contentType.includes("application/json")) {
      const body = parseJsonSafely(rawBody);
      if (body && typeof body === "object") {
        errMsg =
          (body as { message?: string; error?: string }).message ||
          (body as { message?: string; error?: string }).error ||
          "";
      }
    } else {
      errMsg = rawBody;
    }

    if (!errMsg && rawBody) {
      const fallbackBody = parseJsonSafely(rawBody);
      if (fallbackBody && typeof fallbackBody === "object") {
        errMsg =
          (fallbackBody as { message?: string; error?: string }).message ||
          (fallbackBody as { message?: string; error?: string }).error ||
          "";
      }
    }

    if (!errMsg && rawBody) errMsg = rawBody;

    throw new Error(errMsg || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) return undefined as T;

  if (contentType.includes("application/json")) {
    const parsed = parseJsonSafely(rawBody);
    if (parsed !== null) return parsed as T;
  }

  return rawBody as T;
}



export const adminDashboardApi = {
  //stats
  getStats: () =>
    apiFetch<AdminDashboardStats>(`${DASHBOARD_URL}/stats`),

  //officer by department
  getOfficerByDepartment: () =>
    apiFetch<AdminDashboardOfficerByDepartmentDTO[]>(
      `${DASHBOARD_URL}/officer-by-department`
    ),

    //resident by status
  getResidentByStatus: () =>
    apiFetch<AdminDashboaradResidentByStatusDTO[]>(
      `${DASHBOARD_URL}/resident-by-status`
    ),

    //recent added resident
  getRecentAdded: () =>
    apiFetch<AdminDashboardRecentAddedResidentDTO[]>(
      `${DASHBOARD_URL}/recent-added`
    ),

    //recent activity
  getRecentActivity: () =>
    apiFetch<AdminDashboardRecentActivityDTO[]>(
      `${DASHBOARD_URL}/recent-activity`
    ),

    //department activity
  getDepartmentActivity: () =>
    apiFetch<AdminDashboardDepartmentActivityResponse>(
      `${DASHBOARD_URL}/department-activity`
    ),
};