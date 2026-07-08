const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const PERMISSION_URL = `${BASE}/api/v1/permission`;

// --- DTOs ---

export interface PermissionOptions {
  id: number;
  name: string;
  description?: string;
  module?: string;
}

export interface UserAccessPermission {
  userId: string;
  username: string;
  role: string;
  department: string;
  permissions: string[];
}

export interface UserSecurityProfile {
  userId: string;
  username: string;
  role: string;
  department: string;
  permissions: string[];
}

// --- VAWC Permission Constants ---
// These match exactly what is stored in the DB via role-department-map.ts

export const VAWC_PERMISSIONS = {
  VIEW_CASES:              "View Cases",
  CREATE_CASE_ENTRY:       "Create Case Entry",
  ARCHIVE_CASES:           "Archive Cases",
  RESOLVE_FINALIZE_CASE:   "Resolve & Finalize Case",
  MANAGE_CASE_NOTES:       "Manage Case notes",
  MANAGE_REPORTS:          "Manage Reports",
  ISSUE_REFERRAL:          "Issue Referral",
  UPDATE_CASE_INFORMATION: "Update Case information",
  ISSUE_BPO:               "Issue BPO",
  MANAGE_INTERVENTION:     "Manage Intervention",
} as const;

// Aliases for flexible matching
const PERMISSION_ALIASES: Record<string, string[]> = {
  [VAWC_PERMISSIONS.VIEW_CASES]:              ["View Cases"],
  [VAWC_PERMISSIONS.CREATE_CASE_ENTRY]:       ["Create Case Entry"],
  [VAWC_PERMISSIONS.ARCHIVE_CASES]:           ["Archive Cases"],
  [VAWC_PERMISSIONS.RESOLVE_FINALIZE_CASE]:   ["Update Case Status"],
};

function normalizePermissionName(value?: string | null): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9& ]/g, "");
}

export function hasVawcPermission(
  user: Pick<UserAccessPermission, "permissions"> | null | undefined,
  permission: string,
): boolean {
  if (!user?.permissions?.length) return false;

  const normalizedOwnedList = user.permissions.map((p) =>
    normalizePermissionName(p),
  );
  const normalizedOwned = new Set(normalizedOwnedList);

  const candidates = [
    permission,
    ...(PERMISSION_ALIASES[permission] || []),
  ].map((p) => normalizePermissionName(p));

  return candidates.some((candidate) => {
    if (normalizedOwned.has(candidate)) return true;

    const candidateWords = candidate.split(" ").filter(Boolean);

    return normalizedOwnedList.some((owned) => {
      if (owned.includes(candidate) || candidate.includes(owned)) return true;
      return candidateWords.every((word) => owned.includes(word));
    });
  });
}

export function hasAnyVawcPermission(
  user: Pick<UserAccessPermission, "permissions"> | null | undefined,
  permissions: string[],
): boolean {
  return permissions.some((permission) =>
    hasVawcPermission(user, permission),
  );
}

export async function getMyAccess(): Promise<UserAccessPermission> {
  try {
    const data = await apiFetch<UserAccessPermission>(`${PERMISSION_URL}/my-access`);
    // Cache for offline use
    try { localStorage.setItem("cached_permissions_vawc", JSON.stringify(data)); } catch {}
    return data;
  } catch (err: any) {
    // Offline fallback
    if (err.message?.includes("Failed to fetch") || err.message?.includes("unreachable")) {
      const cached = localStorage.getItem("cached_permissions_vawc");
      if (cached) return JSON.parse(cached);
    }
    throw err;
  }
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
