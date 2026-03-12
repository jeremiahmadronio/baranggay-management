const BLOTTER_FORM_URL = "http://localhost:8080/api/v1/blotter-form";
const BLOTTER_OPTIONS_URL = "http://localhost:8080/api/v1/blotter";

// ─── Option DTOs ────────────────────────────────────────────────────────────

export interface NatureOptionDTO {
  id: number;
  natureName: string;
}

export interface EvidenceOptionDTO {
  id: number;
  typName: string;
}

// ─── For-The-Record DTO ─────────────────────────────────────────────────────

export interface RecordBlotterEntry {
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
  respondentContact?: string;
  relationshipToComplainant?: string;
  respondentAddress?: string;

  natureOfComplaintId: number;
  dateOfIncident: string; // LocalDate → "YYYY-MM-DD"
  timeOfIncident?: string; // LocalTime → "HH:mm:ss"
  placeOfIncident: string;

  narrativeStatement: string;

  evidenceTypeIds?: (string | number)[];
}

// ─── Formal Complaint DTO ────────────────────────────────────────────────────

export interface WitnessEntry {
  firstName: string;
  lastName: string;
  contactNumber?: string;
  address?: string;
}

export interface FormalComplaintEntry {
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
  respondentDob?: string; // "YYYY-MM-DD"
  respondentGender?: string;
  respondentCivilStatus?: string;
  respondentOccupation?: string;
  respondentContact?: string;
  respondentAddress?: string;
  relationshipTypeName?: string;
  livingWithComplainant?: boolean;

  natureOfComplaintId: number;
  dateOfIncident: string; // "YYYY-MM-DD"
  timeOfIncident?: string; // "HH:mm:ss"
  placeOfIncident: string;
  frequencyOfIncident?: string;
  descriptionOfInjuries?: string;

  narrativeStatement: string;

  evidenceTypeIds?: (string | number)[];
  witnesses?: WitnessEntry[];

  certifiedTrue?: boolean;
}

// ─── Shared apiFetch helper ──────────────────────────────────────────────────

async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
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

// ─── Option Fetchers ─────────────────────────────────────────────────────────

export async function getNatureOfComplaintOptions(): Promise<NatureOptionDTO[]> {
  return apiFetch<NatureOptionDTO[]>(
    `${BLOTTER_OPTIONS_URL}/nature-of-complaint-options`
  );
}

export async function getEvidenceTypeOptions(): Promise<EvidenceOptionDTO[]> {
  return apiFetch<EvidenceOptionDTO[]>(
    `${BLOTTER_OPTIONS_URL}/evidence-type-options`
  );
}

// ─── Form Submitters ─────────────────────────────────────────────────────────

export async function submitForTheRecord(
  body: RecordBlotterEntry
): Promise<string> {
  return apiFetch<string>(`${BLOTTER_FORM_URL}/for-the-record`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function submitFormalComplaint(
  body: FormalComplaintEntry
): Promise<string> {
  return apiFetch<string>(`${BLOTTER_FORM_URL}/formal-complaint`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}