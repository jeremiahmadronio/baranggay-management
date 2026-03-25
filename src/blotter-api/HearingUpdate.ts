const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const HEARING_URL = `${BASE}/api/v1/lupon`;


export async function updateHearingStatus(
  hearingId: number,
  newStatus: string,
  remarks: string
): Promise<string> {
  if (!remarks.trim()) {
    throw new Error("Remarks/Reason is required for status updates.");
  }

  return apiFetch<string>(`${HEARING_URL}/new-status/${hearingId}`, {
    method: "PUT",
    body: JSON.stringify({
      newStatus,
      remarks,
    }),
  });
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