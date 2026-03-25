const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const LUPON_VIEW_URL = `${BASE}/api/v1/lupon-view`;

export interface MediationInfoDTO {
  luponDeadline: string;
  daysRemaining: number;
  extensionCount: number;
  extensionDate: string | null;
  extensionReason: string | null;
  settlementTerms: string | null;
}

export interface PersonDTO {
  firstName: string;
  lastName: string;
  middleName: string | null;
  contactNumber: string;
  age: number;
  gender: string;
  civilStatus: string;
  email: string | null;
  completeAddress: string;
}

export interface RespondentDTO {
  firstName: string;
  lastName: string;
  middleName: string | null;
  alias: string | null;
  contactNumber: string | null;
  age: number | null;
  gender: string | null;
  dateOfBirth: string | null;
  civilStatus: string | null;
  occupation: string | null;
  relationshipToComplainant: string | null;
  address: string | null;
  livingWithComplainant: boolean;
}

export interface IncidentDetailDTO {
  natureOfComplaint: string;
  incidentDate: string;
  incidentTime: string | null;
  incidentLocation: string;
  frequencyOfIncident: string | null;
  descriptionOfInjuries: string | null;
}

export interface WitnessDTO {
  personId: number;
  fullName: string;
  contactNumber: string | null;
  address: string | null;
  testimony: string | null;
}

export interface LuponCaseMemberHandlerDTO {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
}

export interface LuponViewDTO {
  id: number;
  blotterNumber: string;
  caseType: string;
  caseStatus: string;
  caseStatusRemarks: string | null;
  dateFiled: string;
  referredToLuponAt: string;
  blotterReceivingOfficer: string;
  mediationInfo: MediationInfoDTO;
  complainant: PersonDTO;
  respondent: RespondentDTO;
  incidentDetail: IncidentDetailDTO;
  narrative: string | null;
  evidenceTypeIds: string[];
  witnesses: WitnessDTO[];
  memberHandlers: LuponCaseMemberHandlerDTO[];
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

export async function getLuponCaseView(blotterNumber: string): Promise<LuponViewDTO> {
  return apiFetch<LuponViewDTO>(
    `${LUPON_VIEW_URL}/cases/${encodeURIComponent(blotterNumber)}`
  );
}