const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const BCPC_CASE_URL = `${BASE}/api/v1/bcpc-case`;

export interface BcpcCaseDetailDTO {
  id: number;
  caseNumber: string;
  childFirstName: string;
  childMiddleName?: string;
  childLastName: string;
  childGender: string;
  childAge: number;
  childContact?: string;
  childAddress?: string;
  childRelationship?: string;

  respondentFirstName: string;
  respondentMiddleName?: string;
  respondentLastName: string;
  respondentGender: string;
  respondentAge: number;
  respondentContact?: string;
  respondentAddress?: string;
  relationshipToChild: string;
  /** Alias kept for legacy compatibility — same as relationshipToChild */
  respondentRelationship?: string;

  caseStatus: string;
  natureOfComplaint: string;
  violenceType?: string;
  narrative?: string;

  incidentDate?: string;
  incidentTime?: string;
  incidentLocation?: string;
  dateFiled: string;
  assignedOfficer?: string;
  bpoDeadline?: string;
  remainingTime?: string;
}

export interface BcpcInterventionDTO {
  id?: number;
  sessionNumber?: number;
  scheduledDate: string; // ISO String
  sessionType: string;
  status?: string;
  remarks?: string;
  conductedBy?: string;
}

export interface BcpcReferralDTO {
  id?: number;
  referredTo: string;
  grounds: string;
  status?: string;
  referredBy?: string;
  referralDate?: string;
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

export async function getCaseDetail(id: number): Promise<BcpcCaseDetailDTO> {
  return apiFetch<BcpcCaseDetailDTO>(`${BCPC_CASE_URL}/${id}`);
}

export async function getInterventions(caseId: number): Promise<BcpcInterventionDTO[]> {
  return apiFetch<BcpcInterventionDTO[]>(`${BCPC_CASE_URL}/${caseId}/interventions`);
}

export async function scheduleIntervention(caseId: number, data: BcpcInterventionDTO): Promise<void> {
  return apiFetch<void>(`${BCPC_CASE_URL}/${caseId}/interventions`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function recordIntervention(sessionId: number, data: BcpcInterventionDTO): Promise<void> {
  return apiFetch<void>(`${BCPC_CASE_URL}/interventions/${sessionId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getReferrals(caseId: number): Promise<BcpcReferralDTO[]> {
  return apiFetch<BcpcReferralDTO[]>(`${BCPC_CASE_URL}/${caseId}/referrals`);
}

export async function issueReferral(caseId: number, data: BcpcReferralDTO): Promise<void> {
  return apiFetch<void>(`${BCPC_CASE_URL}/${caseId}/referrals`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function activateBpo(caseId: number, bpoNumber: string): Promise<void> {
  return apiFetch<void>(`${BCPC_CASE_URL}/${caseId}/bpo/activate`, {
    method: "POST",
    body: JSON.stringify({ bpoNumber }),
  });
}

// BCPC-specific status update endpoint
export async function updateCaseStatus(id: number, status: string, reason: string): Promise<void> {
  return apiFetch<void>(`${BCPC_CASE_URL}/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status, reason }),
  });
}

// Archive case
export async function archiveCase(id: number, reason: string): Promise<void> {
  return apiFetch<void>(`${BCPC_CASE_URL}/${id}/archive`, {
    method: "PUT",
    body: JSON.stringify({ reason }),
  });
}

// Restore case
export async function restoreCase(id: number, reason: string): Promise<void> {
  return apiFetch<void>(`${BCPC_CASE_URL}/${id}/restore`, {
    method: "PUT",
    body: JSON.stringify({ reason }),
  });
}
