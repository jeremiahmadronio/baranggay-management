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
  return apiFetch<AdminStats>(ENDPOINTS.ADMIN_STATS);
}

export async function getAdminTable(
  params: AdminTableParams = {},
): Promise<PageResponse<AdminTable>> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 0));
  query.set("size", String(params.size ?? 5));
  if (params.search) query.set("search", params.search);
  if (params.role) query.set("role", params.role);
  if (params.status) query.set("status", params.status);

  return apiFetch<PageResponse<AdminTable>>(
    `${ENDPOINTS.ADMIN_TABLE}?${query.toString()}`,
  );
}

export async function getDepartmentOptions(): Promise<DepartmentOptions[]> {
  return apiFetch<DepartmentOptions[]>("/options", {}, DEPT_URL);
}

export async function updateAdmin(
  userId: string,
  actorId: string,
  body: UpdateAdmin,
): Promise<string> {
  const query = new URLSearchParams({ userId, actorId });
  return apiFetch<string>(`${ENDPOINTS.UPDATE_ADMIN}?${query.toString()}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function toggleUserLock(
  userId: string,
  lock: boolean,
  actionRequest: UserActionRequest,
): Promise<string> {
  const query = new URLSearchParams({ lock: String(lock) });
  return apiFetch<string>(`/${userId}/lock?${query.toString()}`, {
    method: "PATCH",
    body: JSON.stringify(actionRequest),
  });
}

export async function updateUserStatus(
  userId: string,
  status: Status,
  actionRequest: UserActionRequest,
): Promise<string> {
  const query = new URLSearchParams({ userId, status });
  return apiFetch<string>(`${ENDPOINTS.UPDATE_STATUS}?${query.toString()}`, {
    method: "PATCH",
    body: JSON.stringify(actionRequest),
  });
}

export async function getAdminRoleOptions(): Promise<RoleOptions[]> {
  return apiFetch<RoleOptions[]>("/admin-options", {}, ROLE_URL);
}

export async function createAdminAccount(body: CreateAdmin): Promise<string> {
  return apiFetch<string>(ENDPOINTS.CREATE_ADMIN, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getSettingsPreview(): Promise<SettingsPreview> {
  return apiFetch<SettingsPreview>(ENDPOINTS.SETTINGS_PREVIEW);
}

export async function updateSettings(body: UpdateSettings): Promise<string> {
  return apiFetch<string>(ENDPOINTS.UPDATE_SETTINGS, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
