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