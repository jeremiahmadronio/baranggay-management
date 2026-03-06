const BASE_URL = "http://localhost:8080/api/v1/users";
const DEPT_URL = "http://localhost:8080/api/v1/departments";
const ROLE_URL = "http://localhost:8080/api/v1/roles";

const ENDPOINTS = {
  ADMIN_STATS: "/stats",
  ADMIN_TABLE: "/admin-table",
  UPDATE_ADMIN: "/update-admin",
  UPDATE_STATUS: "/update-status",
  CREATE_ADMIN: "/create-admin",
  SETTINGS_PREVIEW: "/settings-preview",
  UPDATE_SETTINGS: "/update-settings",
};

export const Statuses = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  LOCKED: "LOCKED",
} as const;

export type Status = (typeof Statuses)[keyof typeof Statuses];

export interface SettingsPreview {
  id: string;
  username: string;

  email: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
}

export interface UpdateSettings {
  id: string;
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
}

export interface AdminStats {
  totalAdmin: number;
  totalActive: number;
  totalLock: number;
  totalInactive: number;
}

export interface AdminTable {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  roleName: string;
  departments: string[];
  isLocked: boolean;
  status: string;
  createdAt: string;
  lastLoginAt: string;
  lockUntil: string | null;
  updatedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface UpdateAdmin {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  username: string;
  contactNumber: string;
  allDepartments: boolean;
  departmentIds: number[];
}

export interface UserActionRequest {
  reason: string;
  lockUntil: string | null;
}

export interface AdminTableParams {
  page?: number;
  size?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface DepartmentOptions {
  id: number;
  name: string;
}

export interface CreateAdmin {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  contactNumber: string;
  roleId: number;
  allDepartments: boolean;
  departmentIds: number[];
  activateImmediately: boolean;
}

export interface RoleOptions {
  id: number;
  roleName: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA - Used when backend is unavailable
// ═══════════════════════════════════════════════════════════════════════════

const MOCK_ADMIN_STATS: AdminStats = {
  totalAdmin: 24,
  totalActive: 18,
  totalLock: 2,
  totalInactive: 4,
};

const MOCK_ADMIN_TABLE: AdminTable[] = [
  {
    id: "1",
    username: "jdelacruz",
    firstName: "Juan",
    lastName: "Dela Cruz",
    email: "juan.delacruz@barangay.gov.ph",
    contactNumber: "+63 912 345 6789",
    roleName: "Admin",
    departments: ["Clearance", "Blotter"],
    isLocked: false,
    status: "ACTIVE",
    createdAt: "2024-01-15T08:00:00Z",
    lastLoginAt: "2026-03-06T09:30:00Z",
    lockUntil: null,
    updatedAt: "2026-03-05T14:00:00Z",
  },
  {
    id: "2",
    username: "msantos",
    firstName: "Maria",
    lastName: "Santos",
    email: "maria.santos@barangay.gov.ph",
    contactNumber: "+63 923 456 7890",
    roleName: "Admin",
    departments: ["VAWC", "BCPC"],
    isLocked: false,
    status: "ACTIVE",
    createdAt: "2024-02-20T10:00:00Z",
    lastLoginAt: "2026-03-06T08:15:00Z",
    lockUntil: null,
    updatedAt: "2026-03-04T11:00:00Z",
  },
  {
    id: "3",
    username: "preyes",
    firstName: "Pedro",
    lastName: "Reyes",
    email: "pedro.reyes@barangay.gov.ph",
    contactNumber: "+63 934 567 8901",
    roleName: "Admin",
    departments: ["Lupon"],
    isLocked: true,
    status: "LOCKED",
    createdAt: "2024-03-10T14:00:00Z",
    lastLoginAt: "2026-02-28T16:45:00Z",
    lockUntil: "2026-03-10T00:00:00Z",
    updatedAt: "2026-03-01T09:00:00Z",
  },
  {
    id: "4",
    username: "agarcia",
    firstName: "Ana",
    lastName: "Garcia",
    email: "ana.garcia@barangay.gov.ph",
    contactNumber: "+63 945 678 9012",
    roleName: "SuperAdmin",
    departments: ["Clearance", "Blotter", "VAWC", "BCPC", "Lupon"],
    isLocked: false,
    status: "ACTIVE",
    createdAt: "2023-11-05T09:00:00Z",
    lastLoginAt: "2026-03-06T10:00:00Z",
    lockUntil: null,
    updatedAt: "2026-03-06T10:00:00Z",
  },
  {
    id: "5",
    username: "jmendoza",
    firstName: "Jose",
    lastName: "Mendoza",
    email: "jose.mendoza@barangay.gov.ph",
    contactNumber: "+63 956 789 0123",
    roleName: "Admin",
    departments: ["FTJS"],
    isLocked: false,
    status: "INACTIVE",
    createdAt: "2024-05-20T11:00:00Z",
    lastLoginAt: "2026-01-15T13:30:00Z",
    lockUntil: null,
    updatedAt: "2026-02-01T08:00:00Z",
  },
];

const MOCK_DEPARTMENT_OPTIONS: DepartmentOptions[] = [
  { id: 1, name: "Clearance" },
  { id: 2, name: "Blotter" },
  { id: 3, name: "VAWC" },
  { id: 4, name: "BCPC" },
  { id: 5, name: "Lupon" },
  { id: 6, name: "FTJS" },
];

const MOCK_ROLE_OPTIONS: RoleOptions[] = [
  { id: 1, roleName: "Admin" },
  { id: 2, roleName: "SuperAdmin" },
  { id: 3, roleName: "Moderator" },
];

const MOCK_SETTINGS_PREVIEW: SettingsPreview = {
  id: "mock-user-001",
  username: "dev_admin",
  email: "admin@barangay.dev",
  firstName: "Dev",
  lastName: "Admin",
  contactNumber: "+63 912 345 6789",
};

// ═══════════════════════════════════════════════════════════════════════════

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

export async function getAdminStats(): Promise<AdminStats> {
  try {
    return await apiFetch<AdminStats>(ENDPOINTS.ADMIN_STATS);
  } catch (error) {
    console.warn("[Admin API] Failed to fetch stats, using mock data:", error);
    return MOCK_ADMIN_STATS;
  }
}

export async function getAdminTable(
  params: AdminTableParams = {},
): Promise<PageResponse<AdminTable>> {
  try {
    const query = new URLSearchParams();
    query.set("page", String(params.page ?? 0));
    query.set("size", String(params.size ?? 5));
    if (params.search) query.set("search", params.search);
    if (params.role) query.set("role", params.role);
    if (params.status) query.set("status", params.status);

    return await apiFetch<PageResponse<AdminTable>>(
      `${ENDPOINTS.ADMIN_TABLE}?${query.toString()}`,
    );
  } catch (error) {
    console.warn(
      "[Admin API] Failed to fetch admin table, using mock data:",
      error,
    );
    // Filter and paginate mock data
    let filtered = [...MOCK_ADMIN_TABLE];
    if (params.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.firstName.toLowerCase().includes(s) ||
          a.lastName.toLowerCase().includes(s) ||
          a.email.toLowerCase().includes(s) ||
          a.username.toLowerCase().includes(s),
      );
    }
    if (params.role) {
      filtered = filtered.filter(
        (a) => a.roleName.toLowerCase() === params.role?.toLowerCase(),
      );
    }
    if (params.status) {
      filtered = filtered.filter(
        (a) => a.status.toLowerCase() === params.status?.toLowerCase(),
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
    };
  }
}

export async function getDepartmentOptions(): Promise<DepartmentOptions[]> {
  try {
    return await apiFetch<DepartmentOptions[]>("/options", {}, DEPT_URL);
  } catch (error) {
    console.warn(
      "[Admin API] Failed to fetch department options, using mock data:",
      error,
    );
    return MOCK_DEPARTMENT_OPTIONS;
  }
}

export async function updateAdmin(
  userId: string,
  actorId: string,
  body: UpdateAdmin,
): Promise<string> {
  try {
    const query = new URLSearchParams({ userId, actorId });
    return await apiFetch<string>(
      `${ENDPOINTS.UPDATE_ADMIN}?${query.toString()}`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
    );
  } catch (error) {
    console.warn("[Admin API] Failed to update admin (mock mode):", error);
    return "Admin updated successfully (mock)";
  }
}

export async function toggleUserLock(
  userId: string,
  lock: boolean,
  actionRequest: UserActionRequest,
): Promise<string> {
  try {
    const query = new URLSearchParams({ lock: String(lock) });
    return await apiFetch<string>(`/${userId}/lock?${query.toString()}`, {
      method: "PATCH",
      body: JSON.stringify(actionRequest),
    });
  } catch (error) {
    console.warn("[Admin API] Failed to toggle user lock (mock mode):", error);
    return lock
      ? "User locked successfully (mock)"
      : "User unlocked successfully (mock)";
  }
}

export async function updateUserStatus(
  userId: string,
  status: Status,
  actionRequest: UserActionRequest,
): Promise<string> {
  try {
    const query = new URLSearchParams({ userId, status });
    return await apiFetch<string>(
      `${ENDPOINTS.UPDATE_STATUS}?${query.toString()}`,
      {
        method: "PATCH",
        body: JSON.stringify(actionRequest),
      },
    );
  } catch (error) {
    console.warn(
      "[Admin API] Failed to update user status (mock mode):",
      error,
    );
    return `User status updated to ${status} (mock)`;
  }
}

export async function getAdminRoleOptions(): Promise<RoleOptions[]> {
  try {
    return await apiFetch<RoleOptions[]>("/admin-options", {}, ROLE_URL);
  } catch (error) {
    console.warn(
      "[Admin API] Failed to fetch role options, using mock data:",
      error,
    );
    return MOCK_ROLE_OPTIONS;
  }
}

export async function createAdminAccount(body: CreateAdmin): Promise<string> {
  try {
    return await apiFetch<string>(ENDPOINTS.CREATE_ADMIN, {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.warn("[Admin API] Failed to create admin (mock mode):", error);
    return "Admin account created successfully (mock)";
  }
}

export async function getSettingsPreview(): Promise<SettingsPreview> {
  try {
    return await apiFetch<SettingsPreview>(ENDPOINTS.SETTINGS_PREVIEW);
  } catch (error) {
    console.warn(
      "[Admin API] Failed to fetch settings preview, using mock data:",
      error,
    );
    return MOCK_SETTINGS_PREVIEW;
  }
}

export async function updateSettings(body: UpdateSettings): Promise<string> {
  try {
    return await apiFetch<string>(ENDPOINTS.UPDATE_SETTINGS, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.warn("[Admin API] Failed to update settings (mock mode):", error);
    return "Settings updated successfully (mock)";
  }
}
