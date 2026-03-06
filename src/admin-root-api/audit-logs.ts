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

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA - Used when backend is unavailable
// ═══════════════════════════════════════════════════════════════════════════

const MOCK_AUDIT_STATS: AuditLogStats = {
  todayEntry: 47,
  totalEntries: 2845,
  totalWarning: 23,
  totalCritical: 5,
};

const MOCK_AUDIT_TABLE: AuditTable[] = [
  {
    id: 1,
    firstName: "Juan",
    lastName: "Dela Cruz",
    roleName: "Admin",
    actionTaken: "Created new resident record",
    module: "Records",
    reason: "New resident registration",
    ipAddress: "192.168.1.100",
    severity: "low",
  },
  {
    id: 2,
    firstName: "Maria",
    lastName: "Santos",
    roleName: "Admin",
    actionTaken: "Issued barangay clearance",
    module: "Clearance",
    reason: "Employment requirement",
    ipAddress: "192.168.1.101",
    severity: "low",
  },
  {
    id: 3,
    firstName: "Pedro",
    lastName: "Reyes",
    roleName: "Admin",
    actionTaken: "Filed blotter case",
    module: "Blotter",
    reason: "Noise complaint",
    ipAddress: "192.168.1.102",
    severity: "medium",
  },
  {
    id: 4,
    firstName: "Ana",
    lastName: "Garcia",
    roleName: "SuperAdmin",
    actionTaken: "Modified user permissions",
    module: "Admin",
    reason: "Role update request",
    ipAddress: "192.168.1.103",
    severity: "high",
  },
  {
    id: 5,
    firstName: "Jose",
    lastName: "Mendoza",
    roleName: "Admin",
    actionTaken: "Reported VAWC incident",
    module: "VAWC",
    reason: "Emergency case",
    ipAddress: "192.168.1.104",
    severity: "critical",
  },
];

const MOCK_FILTER_OPTIONS: AuditFilterOptions = {
  modules: [
    "Records",
    "Clearance",
    "Blotter",
    "VAWC",
    "BCPC",
    "Lupon",
    "Admin",
    "FTJS",
  ],
  actions: ["Create", "Update", "Delete", "View", "Login", "Logout", "Export"],
  severities: ["low", "medium", "high", "critical"],
};

const MOCK_AUDIT_VIEW: AuditTableView = {
  id: 1,
  firstName: "Juan",
  lastName: "Dela Cruz",
  role: "Admin",
  ipAddress: "192.168.1.100",
  module: "Records",
  severity: "low",
  actionTaken: "Created new resident record",
  reason: "New resident registration",
  oldValue: "",
  newValue: JSON.stringify({ name: "Test Resident", address: "123 Main St" }),
  createdAt: new Date().toISOString(),
  lastLoginAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
};

// ═══════════════════════════════════════════════════════════════════════════

export async function getAuditStats(): Promise<AuditLogStats> {
  try {
    return await apiFetch<AuditLogStats>(ENDPOINTS.AUDIT_STATS);
  } catch (error) {
    console.warn("[Audit API] Failed to fetch stats, using mock data:", error);
    return MOCK_AUDIT_STATS;
  }
}

export async function getAuditTable(
  params: AuditTableParams = {},
): Promise<PagedResponse<AuditTable>> {
  try {
    const query = new URLSearchParams();

    if (params.search) query.append("search", params.search);
    if (params.severity) query.append("severity", params.severity);
    if (params.module) query.append("module", params.module);
    if (params.action) query.append("action", params.action);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);

    query.append("page", String(params.page ?? 0));
    query.append("size", String(params.size ?? 5));

    return await apiFetch<PagedResponse<AuditTable>>(
      `${ENDPOINTS.AUDIT_TABLE}?${query.toString()}`,
    );
  } catch (error) {
    console.warn(
      "[Audit API] Failed to fetch audit table, using mock data:",
      error,
    );
    // Filter and paginate mock data
    let filtered = [...MOCK_AUDIT_TABLE];
    if (params.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.firstName.toLowerCase().includes(s) ||
          a.lastName.toLowerCase().includes(s) ||
          a.actionTaken.toLowerCase().includes(s),
      );
    }
    if (params.severity) {
      filtered = filtered.filter(
        (a) => a.severity.toLowerCase() === params.severity?.toLowerCase(),
      );
    }
    if (params.module) {
      filtered = filtered.filter(
        (a) => a.module.toLowerCase() === params.module?.toLowerCase(),
      );
    }
    const page = params.page ?? 0;
    const size = params.size ?? 5;
    const start = page * size;
    const content = filtered.slice(start, start + size);
    return {
      content,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
      number: page,
      size,
      first: page === 0,
      last: page >= Math.ceil(filtered.length / size) - 1,
      empty: content.length === 0,
    };
  }
}

export async function getFilterOptions(): Promise<AuditFilterOptions> {
  try {
    return await apiFetch<AuditFilterOptions>(ENDPOINTS.FILTER_OPTIONS);
  } catch (error) {
    console.warn(
      "[Audit API] Failed to fetch filter options, using mock data:",
      error,
    );
    return MOCK_FILTER_OPTIONS;
  }
}

export async function getAuditLog(id: number): Promise<AuditTableView> {
  try {
    return await apiFetch<AuditTableView>(`${ENDPOINTS.VIEW_ALL}?id=${id}`);
  } catch (error) {
    console.warn(
      "[Audit API] Failed to fetch audit log, using mock data:",
      error,
    );
    return { ...MOCK_AUDIT_VIEW, id };
  }
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
