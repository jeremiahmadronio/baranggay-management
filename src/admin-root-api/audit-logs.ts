const BASE_URL = "http://localhost:8080/api/v1/audit";

const ENDPOINTS = {
  AUDIT_STATS: "/stats",
  AUDIT_TABLE: "/table",
  FILTER_OPTIONS: "/filter-options",
  VIEW_ALL: "/viewAll",
};

export interface AuditLogStats {
  todayEntry: number;
  totalEntries: number;
  totalWarning: number;
  totalCritical: number;
}

export interface AuditTable {
  id: number;
  firstName: string;
  lastName: string;
  roleName: string;
  actionTaken: string;
  module: string;
  reason: string;
  ipAddress: string;
  severity: string;
}

export interface AuditFilterOptions {
  modules: string[];
  actions: string[];
  severities: string[];
}

export interface AuditTableView {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
  ipAddress: string;
  module: string;
  severity: string;
  actionTaken: string;
  reason: string;
  oldValue: string;
  newValue: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface AuditTableParams {
  page?: number;
  size?: number;
  search?: string;
  severity?: string;
  module?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

export async function getAuditStats(): Promise<AuditLogStats> {
  return apiFetch<AuditLogStats>(ENDPOINTS.AUDIT_STATS);
}

export async function getAuditTable(
  params: AuditTableParams = {},
): Promise<PagedResponse<AuditTable>> {
  const query = new URLSearchParams();

  if (params.search) query.append("search", params.search);
  if (params.severity) query.append("severity", params.severity);
  if (params.module) query.append("module", params.module);
  if (params.action) query.append("action", params.action);
  if (params.startDate) query.append("startDate", params.startDate);
  if (params.endDate) query.append("endDate", params.endDate);

  query.append("page", String(params.page ?? 0));
  query.append("size", String(params.size ?? 5));

  return apiFetch<PagedResponse<AuditTable>>(
    `${ENDPOINTS.AUDIT_TABLE}?${query.toString()}`,
  );
}

export async function getFilterOptions(): Promise<AuditFilterOptions> {
  return apiFetch<AuditFilterOptions>(ENDPOINTS.FILTER_OPTIONS);
}

export async function getAuditLog(id: number): Promise<AuditTableView> {
  return apiFetch<AuditTableView>(`${ENDPOINTS.VIEW_ALL}?id=${id}`);
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  baseUrl = BASE_URL,
): Promise<T> {
  const token = localStorage.getItem("token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    const contentType = response.headers.get("content-type");
    const errMsg = contentType?.includes("application/json")
      ? (await response.json().catch(() => ({}))).message
      : await response.text();
    throw new Error(errMsg || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) return {} as T;

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return response.text() as unknown as T;
}
