// ─── Base URLs ────────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:8080/api/v1/user-management";
const USERS_URL = "http://localhost:8080/api/v1/users";
const PER_URL = "http://localhost:8080/api/v1/permission";
const DEPT_URL = "http://localhost:8080/api/v1/departments";
const ROLE_URL = "http://localhost:8080/api/v1/roles";

// ─── Endpoints ────────────────────────────────────────────────────────────────

const ENDPOINTS = {
  USER_STATS: "/stats",
  STAFF_TABLE: "/staff-table",
  CREATE_USER: "/create-user",
  UPDATE_STATUS: "/update-status",
  UPDATE_USER: "/update-user",
};

export const Statuses = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  LOCKED: "LOCKED",
} as const;

export type Status = (typeof Statuses)[keyof typeof Statuses];

// ─── Generic Fetch ────────────────────────────────────────────────────────────

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

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface UserStats {
  totalUser: number;
  totalActiveUser: number;
  totalInactive: number;
  totalLock: number;
}

export interface UserActionRequest {
  reason: string;
  lockUntil: string | null;
}

export interface Department {
  id: number;
  name: string;
}

export interface Role {
  id: number;
  roleName: string;
}

export interface Permission {
  id: number;
  permissionName: string;
}

export interface UserTable {
  id: string; // UUID → string
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  roleName: string;
  departmentName: string;
  permissions: string[];
  isLocked: boolean;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  lockUntil: string | null;
  updatedAt: string | null;
}

export interface StaffTableParams {
  page?: number; // 0-indexed, default 0
  size?: number; // default 5
  search?: string; // prefix-matches firstName, lastName, username
  roleName?: string; // exact match (case-insensitive)
  departmentName?: string; // exact match (case-insensitive)
}

export interface CreateUserPayload {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  contactNumber: string;
  roleId: number;
  departmentIds: number[];
  permissionIds: number[];
  activateImmediately: boolean;
}

export interface EditUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  contactNumber?: string;
  roleId?: number;
  departmentIds?: number[];
  permissionIds?: number[];
  password?: string;
}

// ─── Exported API ─────────────────────────────────────────────────────────────

export const userManagementApi = {
  getStats: (): Promise<UserStats> => apiFetch<UserStats>(ENDPOINTS.USER_STATS),

  // ── Staff Table (paginated + filtered) ────────────────────────────────────
  getStaffTable: (params: StaffTableParams = {}): Promise<Page<UserTable>> => {
    const qs = new URLSearchParams();
    qs.set("page", String(params.page ?? 0));
    qs.set("size", String(params.size ?? 5));
    if (params.search) qs.set("search", params.search);
    if (params.roleName) qs.set("roleName", params.roleName);
    if (params.departmentName) qs.set("departmentName", params.departmentName);
    return apiFetch<Page<UserTable>>(
      `${ENDPOINTS.STAFF_TABLE}?${qs.toString()}`,
    );
  },

  getDepartmentOptions: (): Promise<Department[]> =>
    apiFetch<Department[]>("/admin-options", {}, DEPT_URL),

  getRoleOptions: (): Promise<Role[]> =>
    apiFetch<Role[]>("/staff-options", {}, ROLE_URL),

  getPermissionOptions: (): Promise<Permission[]> =>
    apiFetch<Permission[]>("/options", {}, PER_URL),

  // ── Actions ────────────────────────────────────────────────────────────────
  createUser: (payload: CreateUserPayload): Promise<string> =>
    apiFetch<string>(ENDPOINTS.CREATE_USER, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateUser: (userId: string, payload: EditUserPayload): Promise<string> =>
    apiFetch<string>(`${ENDPOINTS.UPDATE_USER}/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};

export const getUserStats = (): Promise<UserStats> =>
  apiFetch<UserStats>(ENDPOINTS.USER_STATS);

export async function updateUserStatus(
  userId: string,
  status: Status,
  actionRequest: UserActionRequest,
): Promise<string> {
  const query = new URLSearchParams({ userId, status });
  return apiFetch<string>(
    `${ENDPOINTS.UPDATE_STATUS}?${query.toString()}`,
    {
      method: "PATCH",
      body: JSON.stringify(actionRequest),
    },
    USERS_URL,
  );
}
