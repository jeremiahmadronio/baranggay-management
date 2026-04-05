const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const CFA_URL = `${BASE}/api/v1/lupon`;

export interface CreateCFARequest {
  blotterNumber: string;
  grounds: string;
  matterFiled: string;
}

export interface CFAResponse {
  blotterNumber: string;
  matterFiled: string;
  complinantName: string;
  complinantAddress: string;
  respondentName: string;
  respondentAddress: string;
  grounds: string;
  controlNumber: string;
  issuedAt: string;
  issueByName: string;

  luponChairman: string;
  chairmanPosition : string;

  luponSecretary: string;
  secretaryPosition: string;
  
  luponMember: string;
  memberPosition: string;
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

export async function issueCFA(data: CreateCFARequest): Promise<string> {
  return apiFetch<string>(`${CFA_URL}/issue`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getCfaDetails(
  blotterNumber: string,
): Promise<CFAResponse> {
  return apiFetch<CFAResponse>(`${CFA_URL}/cfa-display/${blotterNumber}`, {
    method: "GET",
  });
}
