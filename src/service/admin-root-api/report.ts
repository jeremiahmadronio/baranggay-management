const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface ReportStatsDTO {
  totalAdminUsers: number;
  totalResidents: number;
  totalOfficers: number;
  totalAuditLogsThisMonth: number;
}

export interface GrowthTrendDTO {
  labels: string[];
  adminCounts: number[];
  residentCounts: number[];
  officerCounts: number[];
  userCounts: number[];
}

export interface ModuleRecordsDTO {
  admin: number;
  resident: number;
  officer: number;
  auditLogs: number;
}

export interface SeverityReportDTO {
  severity: string;
  count: number;
}

export interface ArchiveSummaryDTO {
  archivedResidents: number;
  archivedUsers: number;
  archivedOfficers: number;
  archivedAdmins: number;
}

// ─── apiFetch ────────────────────────────────────────────────────────────────

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

    if (!errMsg && rawBody) {
      errMsg = rawBody;
    }

    throw new Error(errMsg || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (contentType.includes("application/json")) {
    const parsed = parseJsonSafely(rawBody);
    if (parsed !== null) return parsed as T;
  }

  return rawBody as T;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toISOParam(date: Date): string {
  // Use LOCAL time — NOT toISOString() which converts to UTC.
  // UTC+8: midnight local = 4pm previous day UTC, shifting the entire range wrong.
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

// ─── API ─────────────────────────────────────────────────────────────────────

const ADMIN_BASE = `${BASE}/api/v1/system-admin`;

export const adminReportsApi = {
  getStats(): Promise<ReportStatsDTO> {
    return apiFetch<ReportStatsDTO>(`${ADMIN_BASE}/stats`);
  },

  getGrowthTrend(start: Date, end: Date): Promise<GrowthTrendDTO> {
    const params = new URLSearchParams({
      start: toISOParam(start),
      end: toISOParam(end),
    });
    return apiFetch<GrowthTrendDTO>(`${ADMIN_BASE}/growth-trend?${params}`);
  },

  getModuleRecords(start: Date, end: Date): Promise<ModuleRecordsDTO> {
    const params = new URLSearchParams({
      start: toISOParam(start),
      end: toISOParam(end),
    });
    return apiFetch<ModuleRecordsDTO>(`${ADMIN_BASE}/module-records?${params}`);
  },

  getSeverityReport(start: Date, end: Date): Promise<SeverityReportDTO[]> {
    const params = new URLSearchParams({
      start: toISOParam(start),
      end: toISOParam(end),
    });
    return apiFetch<SeverityReportDTO[]>(`${ADMIN_BASE}/audit-severity?${params}`);
  },

  getArchiveSummary(start: Date, end: Date): Promise<ArchiveSummaryDTO> {
    const params = new URLSearchParams({
      start: toISOParam(start),
      end: toISOParam(end),
    });
    return apiFetch<ArchiveSummaryDTO>(`${ADMIN_BASE}/archive-summary?${params}`);
  },
};