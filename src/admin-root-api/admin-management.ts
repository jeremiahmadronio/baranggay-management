const BASE_URL = "https://barangay-backend-9ep2d.ondigitalocean.app/api/v1/users";
const DEPT_URL = "https://barangay-backend-9ep2d.ondigitalocean.app/api/v1/departments";
const ROLE_URL = "https://barangay-backend-9ep2d.ondigitalocean.app/api/v1/roles";

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
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      throw new Error("Session expired. Please login again.");
    }
    // Don't redirect on 403 - user is authenticated but not authorized
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
  if (params.status) query.set("status", params.status);

  const response = await apiFetch<any>(
    `${ENDPOINTS.ADMIN_TABLE}?${query.toString()}`,
  );

  // Debug: Log raw response
  console.log(
    "RAW API Response from /admin-table:",
    JSON.stringify(response, null, 2),
  );

  // Normalize response to handle different backend structures
  let pageData: PageResponse<AdminTable>;

  if (Array.isArray(response)) {
    pageData = {
      content: response,
      totalElements: response.length,
      totalPages: 1,
      size: response.length,
      number: 0,
    };
  } else if (response.data && Array.isArray(response.data.content)) {
    pageData = response.data;
  } else if (response.data && Array.isArray(response.data)) {
    pageData = {
      content: response.data,
      totalElements: response.totalElements ?? response.data.length,
      totalPages: response.totalPages ?? 1,
      size: response.size ?? response.data.length,
      number: response.number ?? 0,
    };
  } else {
    pageData = {
      content: response.content || [],
      totalElements:
        response.totalElements ??
        response.total ??
        response.total_elements ??
        0,
      totalPages: response.totalPages ?? response.total_pages ?? 1,
      size: response.size ?? 5,
      number: response.number ?? response.pageNumber ?? 0,
    };
  }

  console.log("Normalized pageData:", pageData);
  return pageData;
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
