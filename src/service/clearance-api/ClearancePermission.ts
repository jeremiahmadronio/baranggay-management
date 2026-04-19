const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const PERMISSION_URL = `${BASE}/api/v1/permission`;

export interface PermissionOptions {
  id: number;
  permissionName: string;
}

export interface UserAccessPermission {
  userId: string;
  username: string;
  role: string;
  department: string;
  permissions: string[];
}

export const CLEARANCE_PERMISSIONS = {
  ISSUE_CLEARANCE: "Issue Clearance",
  VIEW_REVENUE_REPORTS: "View Revenue Reports",
  EDIT_TEMPLATE: "Edit Template",
} as const;

function normalizePermissionName(value?: string | null): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9& ]/g, "");
}

export function hasClearancePermission(
  user: Pick<UserAccessPermission, "permissions"> | null | undefined,
  permission: string,
): boolean {
  if (!user?.permissions?.length) return false;

  const normalizedOwnedList = user.permissions.map((entry) =>
    normalizePermissionName(entry),
  );
  const normalizedOwned = new Set(normalizedOwnedList);
  const normalizedTarget = normalizePermissionName(permission);

  if (normalizedOwned.has(normalizedTarget)) return true;

  const targetWords = normalizedTarget.split(" ").filter(Boolean);
  return normalizedOwnedList.some((owned) => {
    if (owned.includes(normalizedTarget) || normalizedTarget.includes(owned)) {
      return true;
    }
    return targetWords.every((word) => owned.includes(word));
  });
}

export function hasAnyClearancePermission(
  user: Pick<UserAccessPermission, "permissions"> | null | undefined,
  permissions: string[],
): boolean {
  return permissions.some((permission) =>
    hasClearancePermission(user, permission),
  );
}

export async function getPermissionOptions(): Promise<PermissionOptions[]> {
  return apiFetch<PermissionOptions[]>(`${PERMISSION_URL}/options`);
}

export async function getMyAccess(): Promise<UserAccessPermission> {
  return apiFetch<UserAccessPermission>(`${PERMISSION_URL}/my-access`);
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      throw new Error("Session expired. Please login again.");
    }
    const contentType = response.headers.get("content-type");
    const errMsg = contentType?.includes("application/json")
      ? (await response.json().catch(() => ({}))).message
      : await response.text();
    throw new Error(errMsg || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) return {} as T;

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) return response.json();
  return response.text() as unknown as T;
}
