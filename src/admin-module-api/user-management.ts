const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const BASE_URL = `${BASE}/api/v1/user-management`;
const USERS_URL = `${BASE}/api/v1/users`;
const PER_URL = `${BASE}/api/v1/permission`;
const DEPT_URL = `${BASE}/api/v1/departments`;
const ROLE_URL = `${BASE}/api/v1/roles`;

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
  id: string;
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
  page?: number;
  size?: number;
  search?: string;
  roleName?: string;
  departmentName?: string;
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

export const userManagementApi = {
  getStats: (): Promise<UserStats> => apiFetch<UserStats>(ENDPOINTS.USER_STATS),

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

  getPermissionOptions: (
    departmentId?: string | number,
  ): Promise<Permission[]> => {
    const endpoint =
      departmentId !== undefined && departmentId !== null
        ? `/options?departmentId=${encodeURIComponent(String(departmentId))}`
        : "/options";
    return apiFetch<Permission[]>(endpoint, {}, PER_URL);
  },

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
