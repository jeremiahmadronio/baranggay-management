// display all intervention logs for a BPO (assumed endpoint)
export async function getInterventionLogs(
  bpoId: number,
): Promise<InterventionViewDTO[]> {
  return apiFetch(`${VAWC_URL}/bpo-interventions/${bpoId}`);
}

const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const VAWC_URL = `${BASE}/api/v1/vawc`;
const PEOPLE_URL = `${BASE}/api/v1/resident`;
const PERMISSION_URL = `${BASE}/api/v1/permission`;
import { searchOfflineResidents, cacheOnlineResidents } from "../offline/residentDb";

// ─── Shared ────────────────────────────────────────────────────────────────

export interface PersonSearchResponseDTO {
  id: number;
  firstName: string;
  lastName: string;
  middleName: string;
  contactNumber: string;
  age: number;
  birthDate: string;
  gender: string;
  civilStatus: string;
  email: string;
  completeAddress: string;
  isResident: boolean;
  barangayIdNumber: string | null;
}

export interface WitnessDTO {
  firstName: string;
  lastName: string;
  contactNumber?: string;
  address?: string;
}

export interface ComplaintWitnessDTO {
  personId?: number | null;
  fullName: string;
  contactNumber?: string;
  address?: string;
  testimony?: string;
}

export interface FollowUpViewDTO {
  id: number;
  notes: string;
  createdBy: string;
  createdAt: string;
}

export interface ViolenceTypeDTO {
  id: number;
  type: string;
}

export interface PermissionOptions {
  id: number;
  permissionName: string;
}



export interface PageResponse<T> {
  content: T[];
  page: {
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
}

// ─── Request DTOs ──────────────────────────────────────────────────────────

//complaint
export interface ComplaintDTO {
  complainantId?: number;
  respondentId?: number;
  complainantLastName?: string;
  complainantFirstName?: string;
  complainantMiddleName?: string;
  complainantContact?: string;
  complainantAge?: number;
  complainantGender?: string;
  complainantCivilStatus?: string;
  complainantEmail?: string;
  complainantAddress?: string;
  respondentLastName?: string;
  respondentFirstName?: string;
  respondentMiddleName?: string;
  respondentAlias?: string;
  respondentAge?: number;
  respondentDob?: string;
  respondentGender?: string;
  respondentCivilStatus?: string;
  respondentContact?: string;
  respondentAddress?: string;
  relationshipTypeName?: string;
  livingWithComplainant: boolean;
  natureOfComplaintId: string;
  dateOfIncident: string;
  timeOfIncident?: string;
  placeOfIncident: string;
  frequencyOfIncident?: string;
  descriptionOfInjuries?: string;
  narrativeStatement: string;
  assignToId?: number;
  evidenceTypeIds?: string[];
  violenceTypeIds?: number[];
  witnesses?: ComplaintWitnessDTO[];
}

export interface InterventionRequestDTO {
  bpoId: number;
  activityType: string;
  interventionDetails: string;
  interventionDate: string;
  interventionDuration: number;
  performedByEmployeeIds: number[];
}

export interface FollowUpDTO {
  interventionId: number;
  notes: string;
}

export interface AddCaseNoteRequest {
  blotterNumber: string;
  note: string;
}

export interface UpdateCaseStatusDTO {
  reason: string;
}

export interface CreateReferralDTO {
  caseId: number;
  blotterNumber: string;
  grounds: string;
  subjectOfLitigation: string;
  matterFiled: string;
}

// ─── Response DTOs ─────────────────────────────────────────────────────────

export interface EvidenceOptionDTO {
  id: number;
  typName: string;
}

export interface ViolenceOptionDTO {
  id: number;
  type: string;
}

export interface CaseSummaryDTO {
  id: number;
  caseNumber: string;
  victimFullName: string;
  violenceTypes: string;
  status: string;
  dateFiled: string;
  assignedOfficer: string;
}

export interface CaseStatsDTO {
  totalCases: number;
  totalClose: number;
  totalExpiringSoon: number;
  totalPending: number;
}

export interface CaseViewDTO {
  bpoDeadline?: string;
  remainingTime?: string;
  caseNumber: string;
  caseStatus: string;
  caseStatusRemarks?: string;
  dateFiled: string;
  assignOfficer: string;
  caseFiledBy: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  contactNumber?: string;
  age?: number;
  gender?: string;
  civilStatus?: string;
  email?: string;
  completeAddress?: string;
  respondentFirstName?: string;
  respondentLastName?: string;
  respondentMiddleName?: string;
  respondentAlias?: string;
  respondentContact?: string;
  respondentAge?: number;
  respondentGender?: string;
  respondentCivilStatus?: string;
  respondentOccupation?: string;
  relationshipToComplainant?: string;
  respondentAddress?: string;
  livingWithComplainant: boolean;
  natureOfComplaint: string;
  incidentDate: string;
  incidentTime?: string;
  incidentLocation: string;
  frequencyOfIncident?: string;
  descriptionOfInjuries?: string;
  narrative: string;
  evidenceNames: string[];
  witnesses: WitnessDTO[];
  violenceTypes: ViolenceTypeDTO[];
}

export interface BpoDetails {
  id: number; // Add id for compatibility with CaseDetailsPage
  caseNumber: string;
  complainant: string;
  respondent: string;
  assignOfficer: string;
  bpoNumber: string;
  bpoIssuedAt: string;
  bpoExpiredAt: string;
}

export interface InterventionViewDTO {
  id: number;
  activityType: string;
  details: string;
  interventionDate: string;
  duration: number;
  createdBy: string;
  performedBy: string[];
  followUps: FollowUpViewDTO[];
}

export interface AssignOfficerOptionDTO {
  id: number;
  name: string;
  position: string;
}

export interface CaseNoteViewDTO {
  id: number;
  note: string;
  createdBy: string;
  createdAt: string;
}

export interface CaseTimeLineDTO {
  id: number;
  eventType: string;
  title: string;
  description: string;
  performedBy: string;
  eventDate: string;
}

export interface DisplayCFADTO {
  blotterNumber: string;
  matterFiled: string;
  complainantName: string;
  complainantAddress: string;
  respondentName: string;
  respondentAddress: string;
  grounds: string;
  controlNumber: string;
  issuedAt: string;
  assignOfficerName: string;
  assignOfficerPosition: string;
}

export interface CaseSummaryParams {
  search?: string;
  status?: string;
  violenceType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
  sort?: string;
}

// ─── Core fetch ────────────────────────────────────────────────────────────

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
      throw new Error("Session expired.");
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `Error: ${response.status}`,
      );
    }

    const plainText = await response.text().catch(() => "");
    throw new Error(plainText || `Error: ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return (await response.text()) as T;
}

// ─── API Functions ─────────────────────────────────────────────────────────

// complaint form submission
export async function fileVawcComplaint(dto: ComplaintDTO): Promise<unknown> {
  return apiFetch(`${VAWC_URL}/complaint-entry`, {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

//evidence options for complaint form
export async function getEvidenceOptions(): Promise<EvidenceOptionDTO[]> {
  return apiFetch(`${VAWC_URL}/evidence-options`);
}

//violence options for complaint form
export async function getViolenceOptions(): Promise<ViolenceOptionDTO[]> {
  return apiFetch(`${VAWC_URL}/violence-options`);
}

//vawc case table with search and filter
export async function getVawcCaseSummary(
  params: CaseSummaryParams = {},
): Promise<PageResponse<CaseSummaryDTO>> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.violenceType) query.set("violenceType", params.violenceType);
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo) query.set("dateTo", params.dateTo);
  if (params.page != null) query.set("page", String(params.page));
  if (params.size != null) query.set("size", String(params.size));
  if (params.sort) query.set("sort", params.sort);

  return apiFetch(`${VAWC_URL}/case-summary?${query.toString()}`);
}

//vawc stats or KPI
export async function getVawcStats(): Promise<CaseStatsDTO> {
  return apiFetch(`${VAWC_URL}/vawc-stats`);
}

//vawc full details view
export async function getVawcCaseDetails(id: number): Promise<CaseViewDTO> {
  return apiFetch(`${VAWC_URL}/details/${id}`);
}

// activate BPO for a case
export async function activateBpo(caseId: number): Promise<string> {
  return apiFetch(`${VAWC_URL}/activate-bpo/${caseId}`, { method: "PUT" });
}

// display bpo case details
export async function getBpoDetails(caseId: number): Promise<BpoDetails> {
  return apiFetch(`${VAWC_URL}/bpo-details/${caseId}`);
}

// add intervention for a bpo
export async function addIntervention(
  dto: InterventionRequestDTO,
): Promise<unknown> {
  return apiFetch(`${VAWC_URL}/add-intervention`, {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

// add follow-up for an intervention
export async function addFollowUp(dto: FollowUpDTO): Promise<string> {
  return apiFetch(`${VAWC_URL}/follow-up`, {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

// display intervention details along with follow-ups
export async function getInterventionDetails(
  interventionId: number,
): Promise<InterventionViewDTO> {
  return apiFetch(`${VAWC_URL}/intervention-details/${interventionId}`);
}

// options for assign officer dropdown in intervention form
export async function getAssignOfficerOptions(): Promise<
  AssignOfficerOptionDTO[]
> {
  return apiFetch(`${VAWC_URL}/assign-officer-option`);
}

//options for assign officer dropdown in complaint form
export async function getAssignOfficerComplaintOptions(): Promise<
  AssignOfficerOptionDTO[]
> {
  return apiFetch(`${VAWC_URL}/assign-officer-complaint`);
}

export async function getPermissionOptions(): Promise<PermissionOptions[]> {
  return apiFetch(`${PERMISSION_URL}/options`);
}



//add case note for a vawc case
export async function addCaseNote(dto: AddCaseNoteRequest): Promise<string> {
  return apiFetch(`${VAWC_URL}/add-note`, {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

//display case notes for a vawc case
export async function getCaseNotes(caseId: number): Promise<CaseNoteViewDTO[]> {
  return apiFetch(`${VAWC_URL}/${caseId}/notes`);
}

//display case timeline for a vawc case
export async function getCaseTimeline(
  caseId: string,
): Promise<CaseTimeLineDTO[]> {
  return apiFetch(`${VAWC_URL}/timeline/${caseId}`);
}

//update case status to withdrawn with reason
export async function withdrawVawcCase(
  id: number,
  dto: UpdateCaseStatusDTO,
): Promise<string> {
  return apiFetch(`${VAWC_URL}/cases/${id}/withdraw`, {
    method: "PUT",
    body: JSON.stringify(dto),
  });
}

// update case status to referral
export async function createReferral(dto: CreateReferralDTO): Promise<string> {
  return apiFetch(`${VAWC_URL}/create-referral`, {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

// display CFA details for a vawc case
export async function getVawcCfa(caseId: number): Promise<DisplayCFADTO> {
  return apiFetch(`${VAWC_URL}/cfa/${caseId}`);
}

//search people for complainant, respondent and witness selection in complaint form
export async function searchPeople(
  query: string,
): Promise<PersonSearchResponseDTO[]> {
  if (!query || query.trim().length < 2) return [];

  if (!navigator.onLine) {
    return searchOfflineResidents(query.trim());
  }

  const queryParams = new URLSearchParams({ query: query.trim() });
  const results = await apiFetch<PersonSearchResponseDTO[]>(
    `${PEOPLE_URL}/search?${queryParams.toString()}`,
  );
  
  // Cache results on the fly
  cacheOnlineResidents(results).catch(() => {});
  
  return results;
}

// get narrative document (base64) for a VAWC case by case number
export async function getVawcCaseNarrative(
  caseNumber: string,
): Promise<string> {
  const data = await apiFetch<{ narrative: string }>(
    `${VAWC_URL}/${encodeURIComponent(caseNumber)}/narrative`,
  );
  return data?.narrative ?? "";
}
