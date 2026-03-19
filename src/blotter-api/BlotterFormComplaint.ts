const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const BLOTTER_FORM_URL    = `${BASE}/api/v1/blotter-form`;
const BLOTTER_OPTIONS_URL = `${BASE}/api/v1/blotter`;

export interface NatureOptionDTO {
  id: number;
  natureName: string;
}

export interface EvidenceOptionDTO {
  id: number;
  typName: string;
}

export interface RecordBlotterEntry {
  complainantId ?: number; 
    respondentId ?: number;
  firstName: string;
  lastName: string;
  middleName?: string;
  contactNumber: string;
  age: number;
  gender?: string;
  civilStatus?: string;
  email?: string;
  completeAddress: string;

  respondentFirstName: string;
  respondentLastName: string;
  respondentMiddleName?: string;
  respondentContact?: string;
  relationshipToComplainant?: string;
  respondentAddress?: string;

  natureOfComplaintId: number;
  dateOfIncident: string;
  timeOfIncident?: string;
  placeOfIncident: string;

  narrativeStatement: string;

  evidenceTypeIds?: (string | number)[];
}

export interface WitnessEntry {
  personId: number;
  fullName: string;
  contactNumber?: string;
  address?: string;
}

export interface FormalComplaintEntry {

  complainantId ?: number;
  respondentId ?: number;

  complainantLastName: string;
  complainantFirstName: string;
  complainantMiddleName?: string;
  complainantContact: string;
  complainantAge?: number;
  complainantGender?: string;
  complainantCivilStatus?: string;
  complainantEmail?: string;
  complainantAddress: string;

  respondentLastName: string;
  respondentFirstName: string;
  respondentMiddleName?: string;
  respondentAlias?: string;
  respondentAge?: number;
  respondentDob?: string;
  respondentGender?: string;
  respondentCivilStatus?: string;
  respondentOccupation?: string;
  respondentContact?: string;
  respondentAddress?: string;
  relationshipTypeName?: string;
  livingWithComplainant?: boolean;

  natureOfComplaintId: number;
  dateOfIncident: string;
  timeOfIncident?: string;
  placeOfIncident: string;
  frequencyOfIncident?: number;
  descriptionOfInjuries?: string;

  narrativeStatement: string;

  evidenceTypeIds?: (string | number)[];
  
  witnesses?: WitnessEntry[];
  certifiedTrue?: boolean;
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

export async function getNatureOfComplaintOptions(): Promise<NatureOptionDTO[]> {
  return apiFetch<NatureOptionDTO[]>(`${BLOTTER_OPTIONS_URL}/nature-of-complaint-options`);
}

export async function getEvidenceTypeOptions(): Promise<EvidenceOptionDTO[]> {
  return apiFetch<EvidenceOptionDTO[]>(`${BLOTTER_OPTIONS_URL}/evidence-type-options`);
}

export async function submitForTheRecord(body: RecordBlotterEntry): Promise<string> {
  return apiFetch<string>(`${BLOTTER_FORM_URL}/for-the-record`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function submitFormalComplaint(body: FormalComplaintEntry): Promise<string> {
  return apiFetch<string>(`${BLOTTER_FORM_URL}/formal-complaint`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function escalateToFormalComplaint(
  blotterNumber: string, 
  body: FormalComplaintEntry
): Promise<string> {
  return apiFetch<string>(`${BLOTTER_FORM_URL}/escalate/${encodeURIComponent(blotterNumber)}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}