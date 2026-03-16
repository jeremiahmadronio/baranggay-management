const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const BLOTTER_URL = `${BASE}/api/v1/blotter`;
const HEARING_URL = `${BASE}/api/v1/hearing`;

//docket paginations
export interface SpringPage<T> {
  content: T[];
  pageable: any;
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

//follow up note for hearing minutes
export interface FollowUpHearingDTO {
  notes: string;
}



// --- Hearing Full Details (Master View) ---

export interface MinutesSummaryDTO {
  complainantPresent: boolean;
  respondentPresent: boolean;
  hearingNotes: string;
  outcome: string;
  recordedBy: string;
}

export interface FollowUpSummaryDTO {
  id: number;
  remarks: string;
  recordedBy: string;
  createdAt: string;
}

//hearing details for master view
export interface HearingFullDetailsDTO {
  hearingId: number;
  summonNumber: number;
  status: string;
  scheduledStart: string;
  venue: string;
  initialNotes: string;
  minutes: MinutesSummaryDTO | null; 
  followUps: FollowUpSummaryDTO[];
}

//docket table
export interface BlotterSummaryDTO {
  id: number;
  blotterNumber: string;
  complainantName: string;
  respondentName: string;
  natureOfComplaint: string;
  dateFiled: string;
  status: string;
}

//witness for docket view
export interface WitnessDTO {
  firstName: string;
  lastName: string;
  contactNumber?: string;
  address?: string;
}

//docket view all info
export interface BlotterDocketViewDTO {
  mediationDeadline: string;
  daysRemaining: number;
  caseNumber: string;
  caseStatus: string;
  caseStatusRemarks?: string;
  dateFiled: string;

  firstName: string;
  lastName: string;
  middleName?: string;
  contactNumber: string;
  age: number;
  gender: string;
  civilStatus: string;
  email?: string;
  completeAddress: string;

  respondentFirstName: string;
  respondentLastName: string;
  respondentMiddleName?: string;
  respondentAlias?: string;
  respondentContact?: string;
  respondentAge?: number;
  respondentGender?: string;
  respondentDateOfBirth?: string;
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

  evidenceTypeIds: string[];
  witnesses: WitnessDTO[];
}

//mediation process
export interface MediationProcessDTO {
  stepCaseReceived: boolean;
  caseReceivedDate?: string;

  stepSummonIssued: boolean;
  summonStatus?: string;

  stepMediationOngoing: boolean;
  hearingsConducted: number;

  stepResolved: boolean;
  resolutionStatus?: string;
}

//docket filtering
export interface DocketTableParams {
  search?: string;
  status?: string;
  natureId?: number;
  start?: string;
  end?: string;
  page?: number;
  size?: number;
  sort?: string;
}

//view  hearing
export interface HearingViewDTO {
  hearingId: number;
  hearingNumber: number;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
}

//hearing participants for hearing view
export interface HearingParticipantDTO {
  id?: number;
  name?: string;
  role?: string;
  [key: string]: any;
}

//hearing minutes view after clicking update hearing
export interface MediationHearingViewDTO {
  hearingTitle: string;
  status: string;
  date: string;
  timeRange: string;
  venue: string;
  caseReference: string;
  caseSubject: string;
  summonTitle: string;
  participants: HearingParticipantDTO[];
}

//calendar markers for scheule hearing
export interface CalendarMarkerDTO {
  date: string;
  totalHearings: number;
}

//hearing busy slots for scheduling hearing
export interface BusySlotDTO {
  startTime: string;
  endTime: string;
  caseNumber: string;
  natureOfComplaint: string;
}

//case notes display
export interface CaseNoteViewDTO {
  id: number;
  note: string;
  createdBy: string;
  createdAt: string;
}

//add case notes
export interface AddCaseNoteRequest {
  blotterNumber: string;
  note: string;
}

//schedule hearing
export interface ScheduleHearingRequest {
  blotterNumber: string;
  scheduledStart: string;
  scheduledEnd: string;
  venue: string;
  notes?: string;
}

//record hearing minutes
export interface RecordMinutesRequest {
  hearingId: number;
  complainantPresent: boolean;
  respondentPresent: boolean;
  hearingNotes?: string;
  outcome: string;
}

// stats for dashboard
export interface BlotterStatsDTO {
  totalEntries: number;
  activeCases: number;
  resolved: number;
  pendingMediation: number;
}

// update case status request
export interface UpdateCaseStatusRequest {
  blotterNumber: string;
  newStatus: string;
  reason: string;
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

export async function getDocketTable(params: DocketTableParams = {}): Promise<SpringPage<BlotterSummaryDTO>> {
  const queryParams = new URLSearchParams();

  if (params.search) queryParams.append("search", params.search);
  if (params.status) queryParams.append("status", params.status);
  if (params.natureId !== undefined) queryParams.append("natureId", params.natureId.toString());
  if (params.start) queryParams.append("start", params.start);
  if (params.end) queryParams.append("end", params.end);
  if (params.page !== undefined) queryParams.append("page", params.page.toString());
  if (params.size !== undefined) queryParams.append("size", params.size.toString());
  if (params.sort) queryParams.append("sort", params.sort);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `${BLOTTER_URL}/docket-table?${queryString}` : `${BLOTTER_URL}/docket-table`;

  return apiFetch<SpringPage<BlotterSummaryDTO>>(endpoint);
}

export async function getRecordTable(params: DocketTableParams = {}): Promise<SpringPage<BlotterSummaryDTO>> {
  const queryParams = new URLSearchParams();

  if (params.search) queryParams.append("search", params.search);
  if (params.status) queryParams.append("status", params.status);
  if (params.natureId !== undefined) queryParams.append("natureId", params.natureId.toString());
  if (params.start) queryParams.append("start", params.start);
  if (params.end) queryParams.append("end", params.end);
  if (params.page !== undefined) queryParams.append("page", params.page.toString());
  if (params.size !== undefined) queryParams.append("size", params.size.toString());
  if (params.sort) queryParams.append("sort", params.sort);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `${BLOTTER_URL}/record-table?${queryString}` : `${BLOTTER_URL}/record-table`;

  return apiFetch<SpringPage<BlotterSummaryDTO>>(endpoint);
}

export async function getFullBlotterDocket(blotterNumber: string): Promise<BlotterDocketViewDTO> {
  if (!blotterNumber) throw new Error("Blotter number is required");
  return apiFetch<BlotterDocketViewDTO>(`${BLOTTER_URL}/view-all-docket/${encodeURIComponent(blotterNumber)}`);
}

export async function getMediationProcess(blotterNumber: string): Promise<MediationProcessDTO> {
  if (!blotterNumber) throw new Error("Blotter number is required");
  return apiFetch<MediationProcessDTO>(`${BLOTTER_URL}/mediation-process/${encodeURIComponent(blotterNumber)}`);
}

export async function getHearingView(blotterNumber: string): Promise<HearingViewDTO[]> {
  if (!blotterNumber) throw new Error("Blotter number is required");
  return apiFetch<HearingViewDTO[]>(`${BLOTTER_URL}/hearing-view/${encodeURIComponent(blotterNumber)}`);
}

export async function getMarkers(year: number, month: number): Promise<CalendarMarkerDTO[]> {
  return apiFetch<CalendarMarkerDTO[]>(`${BLOTTER_URL}/markers?year=${year}&month=${month}`);
}

export async function getBusySlots(date: string): Promise<BusySlotDTO[]> {
  if (!date) throw new Error("Date is required");
  return apiFetch<BusySlotDTO[]>(`${BLOTTER_URL}/busy-slots?date=${encodeURIComponent(date)}`);
}

export async function getMediationHearingView(hearingId: number): Promise<MediationHearingViewDTO> {
  if (!hearingId) throw new Error("Hearing ID is required");
  return apiFetch<MediationHearingViewDTO>(`${BLOTTER_URL}/hearing-minutes-view/${hearingId}`);
}

export async function getCaseNotes(blotterNumber: string): Promise<CaseNoteViewDTO[]> {
  if (!blotterNumber) throw new Error("Blotter number is required");
  return apiFetch<CaseNoteViewDTO[]>(`${BLOTTER_URL}/${encodeURIComponent(blotterNumber)}/notes`);
}

export async function addCaseNote(body: AddCaseNoteRequest): Promise<string> {
  return apiFetch<string>(`${BLOTTER_URL}/add-note`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function scheduleHearing(body: ScheduleHearingRequest): Promise<string> {
  return apiFetch<string>(`${HEARING_URL}/schedule-hearing`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function recordHearingMinutes(body: RecordMinutesRequest): Promise<string> {
  return apiFetch<string>(`${HEARING_URL}/record-minutes`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}


export async function getDocketStats(): Promise<BlotterStatsDTO> {
  return apiFetch<BlotterStatsDTO>(`${BLOTTER_URL}/docket-stats`);
}

export async function updateCaseStatus(body: UpdateCaseStatusRequest): Promise<string> {
  return apiFetch<string>(`${BLOTTER_URL}/update-case-status`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}



export async function recordHearingFollowUp(hearingId: number, body: FollowUpHearingDTO): Promise<string> {
  if (!hearingId) throw new Error("Hearing ID is required");
  return apiFetch<string>(`${HEARING_URL}/follow-up/${hearingId}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getHearingFullDetails(hearingId: number): Promise<HearingFullDetailsDTO> {
  if (!hearingId) throw new Error("Hearing ID is required");
  return apiFetch<HearingFullDetailsDTO>(`${HEARING_URL}/hearing-details/${hearingId}`);
}