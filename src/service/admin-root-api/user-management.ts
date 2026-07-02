const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const BASE_URL = `${BASE}/api/v1/user-management`;
const USERS_URL = `${BASE}/api/v1/users`;
const PEOPLE_URL = `${BASE}/api/v1/resident`;
const DEPT_URL = `${BASE}/api/v1/departments`;
const ROLE_URL = `${BASE}/api/v1/roles`;
const PERMISSION_URL = `${BASE}/api/v1/permission`;
import {
  searchOfflineResidents,
  cacheOnlineResidents,
} from "../offline/residentDb";

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

type BackendPageEnvelope<T> = {
  content?: T[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
  page?: {
    totalElements?: number;
    totalPages?: number;
    number?: number;
    size?: number;
    first?: boolean;
    last?: boolean;
    empty?: boolean;
  };
};

function normalizePageResponse<T>(raw: BackendPageEnvelope<T>): Page<T> {
  const nested = raw.page ?? {};
  const content = Array.isArray(raw.content) ? raw.content : [];
  const size = Number(raw.size ?? nested.size ?? content.length ?? 0) || 0;
  const totalElements =
    Number(raw.totalElements ?? nested.totalElements ?? content.length ?? 0) ||
    0;
  const totalPages =
    Number(
      raw.totalPages ??
        nested.totalPages ??
        (size > 0 ? Math.ceil(totalElements / size) : 0),
    ) || 0;
  const number = Number(raw.number ?? nested.number ?? 0) || 0;

  return {
    content,
    totalElements,
    totalPages,
    number,
    size,
    first: Boolean(raw.first ?? nested.first ?? number === 0),
    last: Boolean(
      raw.last ??
      nested.last ??
      (totalPages > 0 ? number >= totalPages - 1 : true),
    ),
    empty: Boolean(raw.empty ?? nested.empty ?? content.length === 0),
  };
}

export interface UserStats {
  id?: string;
  totalUser: number;
  totalActiveUser: number;
  totalInactive: number;
  totalLock: number;
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
  photo: string | null;
  username: string;
  firstName: string;
  lastName: string;
  email?: string;
  contactNumber?: string;
  roleName: string;
  departmentName: string;
  accountType?: string;
  permissions: string[];
  isLocked: boolean;
  status: string;
  statusRemarks: string | null;
  createdAt?: string;
  lockUntil?: string | null;
  lastLoginAt: string | null;
}

export const Statuses = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  ARCHIVED: "ARCHIVED",
} as const;

export type Status = (typeof Statuses)[keyof typeof Statuses];

export interface UserActionRequest {
  reason: string;
  lockUntil: string | null;
}

export interface UserViewDTO {
  fullName: string;
  username: string;
  contactNumber: string;
  systemEmail: string;
  age: number;
  gender: string;
  civilStatus: string;
  completeAddress: string;
  roleName: string;
  departments: string;
  permissions: string[];
  status: string;
  createdAt: string;
  updatedAt: string | null;
  lastLoginAt: string | null;
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
  barangayIdNumber: string | null;
}

export interface StaffTableParams {
  page?: number;
  size?: number;
  search?: string;
  roleName?: string;
  departmentName?: string;
}

export interface CreateUserPayload {
  personId: number;
  accountType: "SYSTEM_USER";
  username: string;
  systemEmail: string;
  roleId: number;
  departmentIds: number[];
  permissionIds: number[];
  activateImmediately: boolean;
}

export interface EditUserPayload {
  username?: string;
  systemEmail?: string;
  roleId?: number;
  departmentIds?: number[];
  permissionIds?: number[];
  status?: string;
}

export interface UpdateStatusPayload {
  newStatus: string;
  remarks: string;
}

export interface LockAccountPayload {
  lockUntil: string;
  reason: string;
}

export interface ResetPasswordPayload {
  reason: string;
}

export const userManagementApi = {
  //stats
  getStats: async (): Promise<UserStats> => {
    try {
      return await apiFetch<UserStats>("/stats");
    } catch (err) {
      console.warn("/stats failed, falling back to /stats/global", err);
      return apiFetch<UserStats>("/stats/global");
    }
  },

  getStaffTable: (params: StaffTableParams = {}): Promise<Page<UserTable>> => {
    const qs = new URLSearchParams();
    qs.set("page", String(params.page ?? 0));
    qs.set("size", String(params.size ?? 10));
    if (params.search) qs.set("search", params.search);
    if (params.roleName) qs.set("roleName", params.roleName);
    if (params.departmentName) qs.set("departmentName", params.departmentName);
    return apiFetch<BackendPageEnvelope<UserTable>>(
      `/staff-table/global?${qs.toString()}`,
    ).then(normalizePageResponse);
  },

  getUserDetails: (userId: string): Promise<UserViewDTO> =>
    apiFetch<UserViewDTO>(`/user-details/${userId}`),

  getDepartmentOptions: async (): Promise<Department[]> => {
    const endpoints = ["/admin-options", "/staff-options", "/options"];
    let lastErr: unknown = null;
    for (const ep of endpoints) {
      try {
        const res = await apiFetch<Department[]>(ep, {}, DEPT_URL);
        if (Array.isArray(res)) return res;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr instanceof Error
      ? lastErr
      : new Error("Failed to fetch departments options.");
  },

  getRoleOptions: (): Promise<Role[]> =>
    apiFetch<Role[]>("/staff-options", {}, ROLE_URL),

  getPermissionOptions: (): Promise<Permission[]> =>
    apiFetch<Permission[]>("/options", {}, PERMISSION_URL),

  createUser: (payload: CreateUserPayload): Promise<string> =>
    apiFetch<string>("/create-user", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Duplicate checks — uses api/v1/users (separate controller)
  checkUsernameExists: (username: string): Promise<boolean> => {
    const qs = new URLSearchParams({ username });
    return apiFetch<boolean>(`/check-username?${qs.toString()}`, {}, USERS_URL);
  },

  checkEmailExists: (email: string): Promise<boolean> => {
    const qs = new URLSearchParams({ email });
    return apiFetch<boolean>(`/check-email?${qs.toString()}`, {}, USERS_URL);
  },

  updateUser: (userId: string, payload: EditUserPayload): Promise<string> =>
    apiFetch<string>(`/update-user/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  resetPassword: (id: string, payload: ResetPasswordPayload): Promise<string> =>
    apiFetch<string>(`/reset-password/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  updateStatus: (id: string, payload: UpdateStatusPayload): Promise<string> =>
    apiFetch<string>(`/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  lockAccount: (id: string, payload: LockAccountPayload): Promise<string> =>
    apiFetch<string>(`/${id}/lock`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  unlockAccount: (id: string): Promise<string> =>
    apiFetch<string>(`/${id}/unlock`, {
      method: "PUT",
    }),

  searchPeople: async (query: string): Promise<PersonSearchResponseDTO[]> => {
    if (!query || query.trim().length < 2) return Promise.resolve([]);
    if (!navigator.onLine) {
      return searchOfflineResidents(query.trim());
    }
    const qs = new URLSearchParams({ query: query.trim() });
    const results = await apiFetch<PersonSearchResponseDTO[]>(
      `/search?${qs.toString()}`,
      {},
      PEOPLE_URL,
    );
    cacheOnlineResidents(results).catch(() => {});
    return results;
  },
};

export async function updateUserStatus(
  userId: string,
  status: Status,
  actionRequest: UserActionRequest,
): Promise<string> {
  if (actionRequest.lockUntil) {
    await userManagementApi.lockAccount(userId, {
      lockUntil: actionRequest.lockUntil,
      reason: actionRequest.reason,
    });
  } else if (status === Statuses.ACTIVE) {
    try {
      await userManagementApi.unlockAccount(userId);
    } catch {
      // unlock endpoint may not always be required by some flows
    }
  }

  return userManagementApi.updateStatus(userId, {
    newStatus: status,
    remarks: actionRequest.reason,
  });
}
