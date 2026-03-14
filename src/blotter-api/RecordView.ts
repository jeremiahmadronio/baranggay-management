const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const BLOTTER_URL = `${BASE}/api/v1/blotter`;

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

export interface BlotterSummaryDTO {
  id: number;
  blotterNumber: string;
  complainantName: string;
  respondentName: string;
  natureOfComplaint: string;
  dateFiled: string; 
  status: string;
}

export interface BlotterRecordViewDTO {
  id: number;
  blotterNumber: string;
  dateFiled: string;
  status: string;
  encodedBy: string;

  complainantFullName: string;
  complainantContact: string;
  complainantAddress: string;
  civilStatus: string;
  complainantAge: number;
  complainantGender: string;
  complainantEmail: string;

  respondentFullName: string;
  respondentContact: string;
  relationshipToComplainant: string;
  respondentAddress: string;

  natureOfComplaint: string;
  dateOfIncident: string;
  timeOfIncident: string;
  placeOfIncident: string;
  narrativeStatement: string;

  evidenceNames: string[];
}

export interface FtrSummaryStatsDTO {
  totalFtr: number;
  ftrTrend: number;
  totalEscalated: number;
  escalatedTrend: number;
  escalationRate: number;
  peakIncidentTime: string;
  peakTimeCount: number;
}

export interface RecordTableParams {
  search?: string;
  status?: string;
  natureId?: number;
  start?: string; 
  end?: string;   
  page?: number;  
  size?: number;
  sort?: string;  
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


export async function getPagedBlotters(params: RecordTableParams = {}): Promise<SpringPage<BlotterSummaryDTO>> {
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

export async function getFullBlotterRecord(blotterNumber: string): Promise<BlotterRecordViewDTO> {
  if (!blotterNumber) throw new Error("Blotter number is required");
  
  return apiFetch<BlotterRecordViewDTO>(`${BLOTTER_URL}/view-all/${encodeURIComponent(blotterNumber)}`);

  
}

export async function getRecordStats(): Promise<FtrSummaryStatsDTO> {
  return apiFetch<FtrSummaryStatsDTO>(`${BLOTTER_URL}/records-stats`);
}

