const BASE_URL = "https://barangay-backend-9ep2d.ondigitalocean.app/api/v1/audit";

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
  query.append("size", String(params.size ?? 10));

  const requestedSize = params.size ?? 10;

  const response = await apiFetch<any>(
    `${ENDPOINTS.AUDIT_TABLE}?${query.toString()}`,
  );

  // Debug: Log raw response to check structure
  console.log(
    "RAW API Response from /audit/table:",
    JSON.stringify(response, null, 2),
  );

  let pageData: PagedResponse<AuditTable>;

  if (Array.isArray(response)) {
    // If backend returns plain array, wrap it
    const totalElements = response.length;
    pageData = {
      content: response,
      totalElements: totalElements,
      totalPages: Math.ceil(totalElements / requestedSize) || 1,
      size: requestedSize,
      number: params.page ?? 0,
      first: (params.page ?? 0) === 0,
      last: true,
      empty: response.length === 0,
    };
  } else if (response.content && response.page) {
    // NEW: Handle { content: [...], page: { totalElements, totalPages, ... } } format
    const contentArray = response.content || [];
    const pageInfo = response.page;
    const totalElements = pageInfo.totalElements ?? contentArray.length;
    const totalPages =
      (pageInfo.totalPages ?? Math.ceil(totalElements / requestedSize)) || 1;

    pageData = {
      content: contentArray,
      totalElements: totalElements,
      totalPages: totalPages,
      size: pageInfo.size ?? requestedSize,
      number: pageInfo.number ?? params.page ?? 0,
      first: pageInfo.number === 0,
      last: pageInfo.number >= totalPages - 1,
      empty: contentArray.length === 0,
    };
  } else if (response.data && Array.isArray(response.data.content)) {
    // If wrapped in "data" field
    const totalElements =
      response.data.totalElements ?? response.data.content.length;
    pageData = {
      ...response.data,
      totalPages: Math.ceil(totalElements / requestedSize) || 1,
    };
  } else if (response.data && Array.isArray(response.data)) {
    // If data field contains array directly
    const totalElements = response.totalElements ?? response.data.length;
    pageData = {
      content: response.data,
      totalElements: totalElements,
      totalPages: Math.ceil(totalElements / requestedSize) || 1,
      size: requestedSize,
      number: response.number ?? params.page ?? 0,
      first: response.first ?? (params.page ?? 0) === 0,
      last: response.last ?? true,
      empty: response.data.length === 0,
    };
  } else {
    // Standard Spring Page response (flat structure)
    const contentArray = response.content || [];
    let totalElements =
      response.totalElements ?? response.total ?? response.total_elements ?? 0;
    if (totalElements === 0 && contentArray.length > 0) {
      totalElements = contentArray.length;
    }
    const calculatedTotalPages = Math.ceil(totalElements / requestedSize) || 1;

    pageData = {
      content: contentArray,
      totalElements: totalElements,
      totalPages: calculatedTotalPages,
      size: requestedSize,
      number: response.number ?? response.pageNumber ?? params.page ?? 0,
      first: response.first ?? (params.page ?? 0) === 0,
      last: response.last ?? (params.page ?? 0) >= calculatedTotalPages - 1,
      empty: contentArray.length === 0,
    };
  }

  console.log("Normalized pageData:", pageData);
  return pageData;
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
