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

export interface archivedDTO {
  reason: string;
}

export interface CaseTimelineDTO {
  id: number;
  eventType: string;
  title: string;
  description: string;
  performedBy: string;
  eventDate: string;
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

export interface ArchiveTableDTO {
  caseId: number;
  blotterNumber: string;
  caseType: string;
  complainant: string;
  respondent: string;
  status: string;
  archivedRemarks: string;
  dateFiled: string;
}

export interface ArchiveTablePage {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface ArchiveTableResponse {
  content: ArchiveTableDTO[];
  page?: ArchiveTablePage;
  totalElements?: number;
  totalPages?: number;
  size?: number;
  number?: number;
}

//witness for docket view
export interface WitnessDTO {
  personId?: number;
  fullName: string;
  contactNumber?: string;
  address?: string;
  testimony?: string;
}

//docket view all info
export interface BlotterDocketViewDTO {
  caseId?: number;
  id?: number;
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
  agreementsTerm?: string;
  agreementDate?: string;
  luponManagement: CaseHandleByDTO[];
  assignOfficer: string;
  _offline?: boolean;
}

export interface CaseHandleByDTO {
  firstName: string;
  lastName: string;
  position: string;
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

export interface ArchiveTableParams {
  search?: string;
  caseType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
  sort?: string;
}

type ArchiveTableRawItem = Partial<ArchiveTableDTO> & {
  id?: number;
  caseNumber?: string;
  complaintType?: string;
  complainantName?: string;
  respondentName?: string;
  caseStatus?: string;
  archiveRemarks?: string;
  reason?: string;
  filedAt?: string;
};

type ArchiveTableRawResponse = Partial<ArchiveTableResponse> & {
  content?: ArchiveTableRawItem[];
  items?: ArchiveTableRawItem[];
  data?: ArchiveTableRawItem[];
};

function mapArchiveRow(row: ArchiveTableRawItem): ArchiveTableDTO {
  return {
    caseId: Number(row.caseId ?? row.id ?? 0),
    blotterNumber: String(row.blotterNumber ?? row.caseNumber ?? ""),
    caseType: String(row.caseType ?? row.complaintType ?? ""),
    complainant: String(row.complainant ?? row.complainantName ?? ""),
    respondent: String(row.respondent ?? row.respondentName ?? ""),
    status: String(row.status ?? row.caseStatus ?? "ARCHIVED"),
    archivedRemarks: String(
      row.archivedRemarks ?? row.archiveRemarks ?? row.reason ?? "",
    ),
    dateFiled: String(row.dateFiled ?? row.filedAt ?? ""),
  };
}

function normalizeArchiveTableResponse(
  raw: ArchiveTableRawResponse,
): ArchiveTableResponse {
  const rawContent = raw.content ?? raw.items ?? raw.data ?? [];

  return {
    content: rawContent.map(mapArchiveRow),
    page: raw.page,
    totalElements: raw.totalElements,
    totalPages: raw.totalPages,
    size: raw.size,
    number: raw.number,
  };
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

export interface IncidentOptionDTO {
  id: number;
  label: string;
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
  settlementTerms: string;
}

// stats for dashboard
export interface BlotterStatsDTO {
  totalEntries: number;
  activeCases: number;
  resolved: number;
  pendingMediation: number;
}

export interface ArchiveStatsDTO {
  totalArchive: number;
  totalArchiveThisMonth: number;
  totalArchiveFormalComplaint: number;
  totalArchiveForTheRecord: number;
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

  // Debug log the full request
  console.log("[DEBUG][apiFetch] URL:", url);
  console.log("[DEBUG][apiFetch] Method:", options.method || "GET");
  console.log("[DEBUG][apiFetch] Headers:", headers);
  if (options.body) {
    try {
      console.log(
        "[DEBUG][apiFetch] Body:",
        JSON.parse(options.body as string),
      );
    } catch {
      console.log("[DEBUG][apiFetch] Body (raw):", options.body);
    }
  }

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (fetchErr) {
    console.error("[DEBUG][apiFetch] FETCH ERROR:", fetchErr);
    throw fetchErr;
  }

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
    console.error("[DEBUG][apiFetch] BAD RESPONSE:", response.status, errMsg);
    throw new Error(errMsg || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) return {} as T;

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) return response.json();
  return response.text() as unknown as T;
}

export async function getDocketTable(
  params: DocketTableParams = {},
): Promise<SpringPage<BlotterSummaryDTO>> {
  const queryParams = new URLSearchParams();

  if (params.search) queryParams.append("search", params.search);
  if (params.status) queryParams.append("status", params.status);
  if (params.natureId !== undefined)
    queryParams.append("natureId", params.natureId.toString());
  if (params.start) queryParams.append("start", params.start);
  if (params.end) queryParams.append("end", params.end);
  if (params.page !== undefined)
    queryParams.append("page", params.page.toString());
  if (params.size !== undefined)
    queryParams.append("size", params.size.toString());
  if (params.sort) queryParams.append("sort", params.sort);

  const queryString = queryParams.toString();
  const endpoint = queryString
    ? `${BLOTTER_URL}/docket-table?${queryString}`
    : `${BLOTTER_URL}/docket-table`;

  return apiFetch<SpringPage<BlotterSummaryDTO>>(endpoint);
}

export async function getRecordTable(
  params: DocketTableParams = {},
): Promise<SpringPage<BlotterSummaryDTO>> {
  const queryParams = new URLSearchParams();

  if (params.search) queryParams.append("search", params.search);
  if (params.status) queryParams.append("status", params.status);
  if (params.natureId !== undefined)
    queryParams.append("natureId", params.natureId.toString());
  if (params.start) queryParams.append("start", params.start);
  if (params.end) queryParams.append("end", params.end);
  if (params.page !== undefined)
    queryParams.append("page", params.page.toString());
  if (params.size !== undefined)
    queryParams.append("size", params.size.toString());
  if (params.sort) queryParams.append("sort", params.sort);

  const queryString = queryParams.toString();
  const endpoint = queryString
    ? `${BLOTTER_URL}/record-table?${queryString}`
    : `${BLOTTER_URL}/record-table`;

  return apiFetch<SpringPage<BlotterSummaryDTO>>(endpoint);
}

export async function getArchiveTable(
  params: ArchiveTableParams = {},
): Promise<ArchiveTableResponse> {
  const buildEndpoint = (statusOverride?: string) => {
    const queryParams = new URLSearchParams();

    if (params.search) queryParams.append("search", params.search);
    if (params.caseType) queryParams.append("caseType", params.caseType);

    const statusToUse = statusOverride ?? params.status;
    if (statusToUse) queryParams.append("status", statusToUse);

    if (params.dateFrom) queryParams.append("dateFrom", params.dateFrom);
    if (params.dateTo) queryParams.append("dateTo", params.dateTo);
    if (params.page !== undefined)
      queryParams.append("page", params.page.toString());
    if (params.size !== undefined)
      queryParams.append("size", params.size.toString());
    if (params.sort) queryParams.append("sort", params.sort);

    const queryString = queryParams.toString();
    return queryString
      ? `${BLOTTER_URL}/archive-table?${queryString}`
      : `${BLOTTER_URL}/archive-table`;
  };

  const raw = await apiFetch<ArchiveTableRawResponse>(buildEndpoint());
  const normalized = normalizeArchiveTableResponse(raw);

  if (params.status && normalized.content.length === 0) {
    const altStatus =
      params.status === params.status.toUpperCase()
        ? params.status.toLowerCase()
        : params.status.toUpperCase();

    if (altStatus !== params.status) {
      const rawFallback = await apiFetch<ArchiveTableRawResponse>(
        buildEndpoint(altStatus),
      );
      const fallbackNormalized = normalizeArchiveTableResponse(rawFallback);
      if (fallbackNormalized.content.length > 0) return fallbackNormalized;
    }
  }

  return normalized;
}

export async function getFullBlotterDocket(
  blotterNumber: string,
): Promise<BlotterDocketViewDTO> {
  if (!blotterNumber) throw new Error("Blotter number is required");
  return apiFetch<BlotterDocketViewDTO>(
    `${BLOTTER_URL}/view-all-docket/${encodeURIComponent(blotterNumber)}`,
  );
}

export async function getMediationProcess(
  blotterNumber: string,
): Promise<MediationProcessDTO> {
  if (!blotterNumber) throw new Error("Blotter number is required");
  return apiFetch<MediationProcessDTO>(
    `${BLOTTER_URL}/mediation-process/${encodeURIComponent(blotterNumber)}`,
  );
}

export async function getHearingView(
  blotterNumber: string,
): Promise<HearingViewDTO[]> {
  if (!blotterNumber) throw new Error("Blotter number is required");
  return apiFetch<HearingViewDTO[]>(
    `${BLOTTER_URL}/hearing-view/${encodeURIComponent(blotterNumber)}`,
  );
}

export async function getMarkers(
  year: number,
  month: number,
): Promise<CalendarMarkerDTO[]> {
  return apiFetch<CalendarMarkerDTO[]>(
    `${BLOTTER_URL}/markers?year=${year}&month=${month}`,
  );
}

export async function getBusySlots(date: string): Promise<BusySlotDTO[]> {
  if (!date) throw new Error("Date is required");
  return apiFetch<BusySlotDTO[]>(
    `${BLOTTER_URL}/busy-slots?date=${encodeURIComponent(date)}`,
  );
}

export async function getMediationHearingView(
  hearingId: number,
): Promise<MediationHearingViewDTO> {
  if (!hearingId) throw new Error("Hearing ID is required");
  return apiFetch<MediationHearingViewDTO>(
    `${BLOTTER_URL}/hearing-minutes-view/${hearingId}`,
  );
}

export async function getCaseNotes(
  blotterNumber: string,
): Promise<CaseNoteViewDTO[]> {
  if (!blotterNumber) throw new Error("Blotter number is required");
  return apiFetch<CaseNoteViewDTO[]>(
    `${BLOTTER_URL}/${encodeURIComponent(blotterNumber)}/notes`,
  );
}

export async function addCaseNote(body: AddCaseNoteRequest): Promise<string> {
  return apiFetch<string>(`${BLOTTER_URL}/add-note`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function scheduleHearing(
  body: ScheduleHearingRequest,
): Promise<string> {
  return apiFetch<string>(`${HEARING_URL}/schedule-hearing`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function recordHearingMinutes(
  body: RecordMinutesRequest,
): Promise<string> {
  return apiFetch<string>(`${HEARING_URL}/record-minutes`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getDocketStats(): Promise<BlotterStatsDTO> {
  return apiFetch<BlotterStatsDTO>(`${BLOTTER_URL}/docket-stats`);
}

export async function getArchiveStats(): Promise<ArchiveStatsDTO> {
  return apiFetch<ArchiveStatsDTO>(`${BLOTTER_URL}/archive/stats`);
}

export async function updateCaseStatus(
  body: UpdateCaseStatusRequest,
): Promise<string> {
  console.log("[DEBUG] updateCaseStatus request:", body);
  return apiFetch<string>(`${BLOTTER_URL}/update-case-status`, {
    method: "PUT",
    body: JSON.stringify(body),
  })
    .then((res) => {
      console.log("[DEBUG] updateCaseStatus response:", res);
      return res;
    })
    .catch((err) => {
      console.error("[DEBUG] updateCaseStatus error:", err);
      throw err;
    });
}
export async function recordHearingFollowUp(
  hearingId: number,
  body: FollowUpHearingDTO,
): Promise<string> {
  if (!hearingId) throw new Error("Hearing ID is required");
  return apiFetch<string>(`${HEARING_URL}/follow-up/${hearingId}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export interface UpdateHearingStatusRequest {
  newStatus: string;
  remarks: string;
}

export async function updateHearingStatus(
  hearingId: number,
  body: UpdateHearingStatusRequest
): Promise<string> {
  if (!hearingId) throw new Error("Hearing ID is required");
  return apiFetch<string>(`${HEARING_URL}/new-status/${hearingId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function getHearingFullDetails(
  hearingId: number,
): Promise<HearingFullDetailsDTO> {
  if (!hearingId) throw new Error("Hearing ID is required");
  return apiFetch<HearingFullDetailsDTO>(
    `${HEARING_URL}/hearing-details/${hearingId}`,
  );
}

export async function getFrequencyOptions(): Promise<IncidentOptionDTO[]> {
  return apiFetch<IncidentOptionDTO[]>(`${BLOTTER_URL}/frequencies`);
}

export async function getCaseTimeline(
  blotterNumber: string,
): Promise<CaseTimelineDTO[]> {
  if (!blotterNumber) throw new Error("Blotter number is required");
  return apiFetch<CaseTimelineDTO[]>(
    `${BLOTTER_URL}/timeline/${encodeURIComponent(blotterNumber)}`,
  );
}

export async function archiveCase(
  caseId: number,
  body: archivedDTO,
): Promise<string> {
  if (!caseId) throw new Error("Case ID is required");
  return apiFetch<string>(`${BLOTTER_URL}/archived/${caseId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function restoreCase(
  caseId: number,
  body: archivedDTO,
): Promise<string> {
  if (!caseId) throw new Error("Case ID is required");
  return apiFetch<string>(`${BLOTTER_URL}/restore/${caseId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function reopenCaseApi(
  blotterNumber: string,
  reason: string,
): Promise<string> {
  if (!blotterNumber) throw new Error("Blotter number is required");
  return apiFetch<string>(`${BASE}/api/v1/blotter-form/reopen/${encodeURIComponent(blotterNumber)}`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}


