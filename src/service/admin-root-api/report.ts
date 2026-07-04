const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface ReportStatsDTO {
  totalUsers: number;
  totalResidents: number;
  totalOfficers: number;
  totalAuditLogsThisMonth: number;
}

export interface GrowthTrendDTO {
  labels: string[];
  userCounts: number[];
  residentCounts: number[];
  officerCounts: number[];
}

export interface ModuleRecordsDTO {
  users: number;
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
}

export interface GrowthPointDTO {
  label: string;
  fullLabel: string;
  residents: number;
  officers: number;
  events: number;
}

export interface EventStatusCountDTO {
  name: string;
  value: number;
  color: string;
}

export interface ArchiveCountDTO {
  category: string;
  value: number;
}

export interface AdminReportSummaryDTO {
  totalResidents: number;
  totalOfficers: number;
  totalEvents: number;
  totalUsers: number;
  growthTrend: GrowthPointDTO[];
  eventStatusDistribution: EventStatusCountDTO[];
  archiveSummary: ArchiveCountDTO[];
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
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

// ─── API ─────────────────────────────────────────────────────────────────────

const ADMIN_BASE = `${BASE}/api/v1/system-admin`;

export const adminReportsApi = {

  getStats(start?: Date, end?: Date): Promise<ReportStatsDTO> {
    const params = new URLSearchParams();
    if (start) params.append("start", toISOParam(start));
    if (end) params.append("end", toISOParam(end));

    const queryString = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<ReportStatsDTO>(`${ADMIN_BASE}/stats${queryString}`);
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


  getArchiveSummary(): Promise<ArchiveSummaryDTO> {
    return apiFetch<ArchiveSummaryDTO>(`${ADMIN_BASE}/archive-summary`);
  },

  getAdminSummary(start: Date, end: Date): Promise<AdminReportSummaryDTO> {
    const params = new URLSearchParams({
      start: toISOParam(start),
      end: toISOParam(end),
    });
    return apiFetch<AdminReportSummaryDTO>(`${BASE}/api/v1/reports/admin-summary?${params}`);
  },
};