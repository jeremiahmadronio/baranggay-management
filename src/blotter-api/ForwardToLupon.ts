const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const LUPON_URL = `${BASE}/api/v1/lupon`;

export interface PangkatMemberDTO {
  firstName: string;
  lastName: string;
  position: string;
}

export interface ReferToLuponRequest {
  members: PangkatMemberDTO[];
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

export async function referToLupon(
  caseId: number, 
  body: ReferToLuponRequest
): Promise<string> {
  return apiFetch<string>(`${LUPON_URL}/refer-to-lupon/${caseId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}