const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const BASE_URL = `${BASE}/api/v1/users`;
const DEPT_URL = `${BASE}/api/v1/departments`;
const ROLE_URL = `${BASE}/api/v1/roles`;
const PERSON_URL = `${BASE}/api/v1/resident`;
const PERMISSION_URL = `${BASE}/api/v1/permission`;
import { searchOfflineResidents, cacheOnlineResidents } from "../offline/residentDb";

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
  photo: string | null;
  username: string;
  firstName: string;
  lastName: string;
  systemEmail: string;
  contactNumber: string | null;
  roleName: string;
  systemBackupEmail: string | null;
  mfaType: string | null;
  totpEnabled: boolean;
  createdAt: string; // ISO-8601 string (LocalDateTime)
  lastLoginAt: string | null;
}

export interface UserAccessPermission {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  permissions: string[];
  roleName: string;
  departments: string[];
}

export interface PermissionOptions {
  id: number;
  permissionName: string;
}

export interface UserSettingsPayload {
  firstName: string;
  lastName: string;
  contactNumber: string;
  photo?: string | null;
  username: string;
  systemEmail: string;
  systemBackupEmail?: string | null;
  currentPassword?: string;
  newPassword?: string;
}

export interface AdminStats {
  totalAdmin: number;
  totalActive: number;
  totalLock: number;
  totalInactive: number;
}

export interface ArchiveReason {
  remarks: string;
}

export interface AdminTable {
  id: string;
  photo: string | null;
  username: string;
  firstName: string;
  lastName: string;
  email?: string;
  systemEmail: string;
  contactNumber: string;
  roleName: string;
  departments: string[];
  permissions: string[];
  status: string;
  isLocked: boolean;
  age: number;
  gender: string;
  completeAddress: string;
  createdAt: string;
  lastLoginAt: string;
  lockUntil: string | null;
  updatedAt: string;
}

export interface PersonSearchResponseDTO {
  id: number;
  firstName: string;
  lastName: string;
  middleName: string;
  contactNumber: string;
  age: number;
  birthDate: string;
  gender: string;
  civilStatus: string;
  email: string;
  completeAddress: string;
  isResident: boolean;
  barangayIdNumber: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface UpdateAdmin {
  systemEmail: string;
  username: string;
  allDepartments: boolean;
  departmentIds: number[];
  permissionIds?: number[];
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

export interface PermissionOptions {
  id: number;
  permissionName: string;
}

export interface CreateAdmin {
  personId?: number;
  systemEmail: string;
  departmentIds: number[];
  permissionsIds?: number[];
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

export async function checkUsernameAvailability(
  username: string,
): Promise<boolean> {
  const query = new URLSearchParams({ username: username.trim() });
  return apiFetch<boolean>(`/check-username?${query.toString()}`, {}, BASE_URL);
}

export async function archiveAdmin(
  userId: string,
  body: ArchiveReason,
): Promise<string> {
  const query = new URLSearchParams({ userId });
  return apiFetch<string>(`/archive-admin?${query.toString()}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function getPermissionOptions(): Promise<PermissionOptions[]> {
  return apiFetch<PermissionOptions[]>("/options", {}, PERMISSION_URL);
}

export async function getUserAccessPermission(): Promise<UserAccessPermission> {
  try {
    const data = await apiFetch<UserAccessPermission>("/my-access", {}, PERMISSION_URL);
    try { localStorage.setItem('cached_permissions_admin', JSON.stringify(data)); } catch {}
    return data;
  } catch (err: any) {
    if (err.message?.includes('Failed to fetch') || err.message?.includes('unreachable')) {
      const cached = localStorage.getItem('cached_permissions_admin');
      if (cached) return JSON.parse(cached);
    }
    throw err;
  }
}

export async function restoreArchive(
  userId: string,
  body: ArchiveReason,
): Promise<string> {
  const query = new URLSearchParams({ userId });
  return apiFetch<string>(`/unarchive-admin?${query.toString()}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
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

export async function searchPeople(
  query: string,
): Promise<PersonSearchResponseDTO[]> {
  if (!query || query.trim().length < 2) return [];
  if (!navigator.onLine) {
    return searchOfflineResidents(query.trim()) as unknown as Promise<PersonSearchResponseDTO[]>;
  }
  const searchParams = new URLSearchParams({ query });
  const results = await apiFetch<PersonSearchResponseDTO[]>(
    `/search?${searchParams.toString()}`,
    {},
    PERSON_URL,
  );
  cacheOnlineResidents(results).catch(() => {});
  return results;
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

export async function updateSettings(
  body: UserSettingsPayload,
): Promise<string> {
  return apiFetch<string>(ENDPOINTS.UPDATE_SETTINGS, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function checkEmailAvailability(email: string): Promise<boolean> {
  const query = new URLSearchParams({ email });
  return apiFetch<boolean>(`/check-email?${query.toString()}`, {}, BASE_URL);
}

export async function checkBackupEmailAvailability(
  email: string,
): Promise<boolean> {
  const query = new URLSearchParams({ email: email.trim() });
  return apiFetch<boolean>(`/check-backup?${query.toString()}`, {}, BASE_URL);
}
