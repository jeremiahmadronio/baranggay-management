const BASE_URL = "http://localhost:8080/api/v1/users";

const ENDPOINTS = {
  ADMIN_STATS: "/stats",
  ADMIN_TABLE: "/admin-table",
  CREATE_ADMIN: "/create-admin",
  UPDATE_ADMIN: "/update-admin",
  UPDATE_STATUS: "/update-status",
};

export const Statuses = {
  PENDING:  "PENDING",
  ACTIVE:   "ACTIVE",
  INACTIVE: "INACTIVE",
  LOCKED:   "LOCKED",
} as const;

export type Status = (typeof Statuses)[keyof typeof Statuses];

export interface AdminStats {
  totalAdmin:    number;
  totalActive:   number;
  totalLock:     number;
  totalInactive: number;
}

export interface AdminTable {
  id:            string;
  username:      string;
  firstName:     string;
  lastName:      string;
  email:         string;
  contactNumber: string;
  roleName:      string;
  departments:   string[];
  isLocked:      boolean;
  status:        string;
  createdAt:     string;
  lastLoginAt:   string;
  lockUntil:     string | null;
  updatedAt:     string;
}

export interface PageResponse<T> {
  content:       T[];
  totalElements: number;
  totalPages:    number;
  number:        number;
  size:          number;
}

export interface UpdateAdmin {
  firstName:      string;
  lastName:       string;
  email:          string;
  username:       string;
  contactNumber:  string;
  allDepartments: boolean;
  departmentIds:  number[];
}

export interface UserActionRequest {
  reason:    string;
  lockUntil: string | null;
}

export interface AdminTableParams {
  page?:   number;
  size?:   number;
  search?: string;
  role?:   string;
  status?: string;
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) return {} as T;
  return response.json();
}

export async function getAdminStats(): Promise<AdminStats> {
  return apiFetch<AdminStats>(ENDPOINTS.ADMIN_STATS);
}

export async function getAdminTable(
  params: AdminTableParams = {}
): Promise<PageResponse<AdminTable>> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 0));
  query.set("size", String(params.size ?? 5));
  if (params.search) query.set("search", params.search);
  if (params.role)   query.set("role",   params.role);
  if (params.status) query.set("status", params.status);

  return apiFetch<PageResponse<AdminTable>>(`${ENDPOINTS.ADMIN_TABLE}?${query.toString()}`);
}

export async function updateAdmin(
  userId:  string,
  actorId: string,
  body:    UpdateAdmin
): Promise<string> {
  const query = new URLSearchParams({ userId, actorId });

  return apiFetch<string>(`${ENDPOINTS.UPDATE_ADMIN}?${query.toString()}`, {
    method: "PUT",
    body:   JSON.stringify(body),
  });
}

export async function toggleUserLock(
  userId:        string,
  lock:          boolean,
  actionRequest: UserActionRequest
): Promise<string> {
  const query = new URLSearchParams({ lock: String(lock) });

  return apiFetch<string>(`/${userId}/lock?${query.toString()}`, {
    method: "PATCH",
    body:   JSON.stringify(actionRequest),
  });
}

export async function updateUserStatus(
  userId:        string,
  status:        Status,
  actionRequest: UserActionRequest
): Promise<string> {
  const query = new URLSearchParams({ userId, status });

  return apiFetch<string>(`${ENDPOINTS.UPDATE_STATUS}?${query.toString()}`, {
    method: "PATCH",
    body:   JSON.stringify(actionRequest),
  });
}