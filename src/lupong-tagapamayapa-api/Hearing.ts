  const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

  const LUPON_URL = `${BASE}/api/v1/lupon`;


  //pagination
  export interface PageResponse<T> {
    content: T[];
    page: {
      size: number;
      number: number;
      totalElements: number;
      totalPages: number;
    };
  }

  //hearing view 
  export interface HearingScheduleDTO {
    hearingId: number;
    blotterNumber: string;
    createdAt: string;
    complainantName: string;
    respondentName: string;
    summonNumber: number;
    scheduledStart: string;
    scheduledEnd: string;
    status: string;
    notes: string | null;
    createdBy: string | null;
    venue: string;
    casePhase: string;
    complainantPresent: boolean | null;
    respondentPresent: boolean | null;
    hearingNotes: string | null;
    outcome: string | null;
    recordedByMinutes: string | null;
  }

  export interface HearingScheduleParams {
    search?: string;
    tab?: string;
    page?: number;
    size?: number;
  }

  export interface UpdateHearingStatusRequest {
    newStatus: string;
    remarks: string;
  }


  export interface PangkatAttendanceDTO {
    pangkatMemberId: number;
    isPresent: boolean;
  }

  export interface RecordHearingMinutesRequest {
    hearingNotes: string;
    outcome: string; 
    complainantPresent: boolean;
    respondentPresent: boolean;
    settlementTerms?: string; 
    pangkatAttendance: PangkatAttendanceDTO[];
  }


  export interface AssignedPangkatDTO {
    memberId: number;
    fullName: string;
    position: string;
  }

  export interface HearingDetailViewDTO {
    hearingId: number;
    hearingNumber: number; 
    status: string;
    date: string;
    startTime: string;
    endTime: string;
    venue: string;
    caseNumber: string;
    caseTitle: string;
    assignedPangkat: AssignedPangkatDTO[];
  }






  export interface RecordMinutesViewDTO {
    hearingId: number;
    hearingNumber: number;
    status: string;
    date: string;
    venue: string;
    endTime: string;
    complinantPresent: boolean;
    respondentPresent: boolean;
    chairmanPresent: boolean;
    secretaryPresent: boolean;
    memberPresent: boolean;
    narrative: string | null;
    outcome: string | null;
    recordedBy: string | null;
    followUpNotes: FollowUpSummaryDTO[];

  }

  export interface FollowUpSummaryDTO {
    id : number;
    remarks: string;
    recordedBy: string;
    createdAt: string;

  }






  //shared fetch helper
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


  //get hearing schedules with pagination and search
  export async function getHearingSchedules(
    params: HearingScheduleParams = {}
  ): Promise<PageResponse<HearingScheduleDTO>> {
    const { search, tab = "ALL", page = 1, size = 10 } = params;

    const query = new URLSearchParams();

    if (search) query.set("search", search);
    if (tab) query.set("tab", tab);
    
    query.set("page", String(page));
    query.set("size", String(size));

    return apiFetch<PageResponse<HearingScheduleDTO>>(
      `${LUPON_URL}/hearing-view?${query.toString()}`
    );
  }

  //update hearing status
  export async function updateHearingStatus(
    hearingId: number,
    body: UpdateHearingStatusRequest
  ): Promise<string> {
    return apiFetch<string>(`${LUPON_URL}/new-status/${hearingId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }


  export async function recordHearingMinutes(
    hearingId: number,
    body: RecordHearingMinutesRequest
  ): Promise<string> {
    return apiFetch<string>(`${LUPON_URL}/${hearingId}/record-minutes`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }


  export async function getHearingFullDetails(
    hearingId: number
  ): Promise<HearingDetailViewDTO> {
  
    return apiFetch<HearingDetailViewDTO>(`${LUPON_URL}/details/${hearingId}`);
  }


  export async function getRecordMinutesDetails(
     hearingId: number
  ): Promise<RecordMinutesViewDTO> {
    return apiFetch<RecordMinutesViewDTO>(`${LUPON_URL}/hearing-minutes-view/${hearingId}`);

  }