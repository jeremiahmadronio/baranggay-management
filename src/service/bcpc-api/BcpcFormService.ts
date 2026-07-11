const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const BCPC_FORM_URL = `${BASE}/api/v1/bcpc-form`;

// ── Types ────────────────────────────────────────────────────────────────────

export interface BcpcOfficerOptionDTO {
  id: number;
  name: string;
  position: string;
}

export interface BcpcCaseEntryPayload {
  // Child / Complainant
  childPersonId?: number;
  childFirstName: string;
  childLastName: string;
  childMiddleName?: string;
  childAge?: number;
  childBirthday?: string;       // "YYYY-MM-DD"
  childGender?: string;
  childGradeSchool?: string;
  childGuardian?: string;
  childContact?: string;
  childAddress: string;
  childRelationship: string;

  // Respondent / Guardian
  respondentPersonId?: number;
  respondentFirstName: string;
  respondentLastName: string;
  respondentMiddleName?: string;
  respondentAge?: number;
  respondentBirthday?: string;  // "YYYY-MM-DD"
  respondentGender?: string;
  respondentGradeSchool?: string;
  respondentGuardian?: string;
  respondentContact?: string;
  respondentAddress?: string;
  relationshipToChild: string;

  // Incident
  natureOfCase: string;
  violenceType?: string;
  incidentDate: string;       // "YYYY-MM-DD"
  incidentTime?: string;      // "HH:MM:SS"
  incidentPlace: string;
  frequency: string;
  injuryDescription?: string;

  // Narrative (base64 string decoded to byte[] on backend)
  narrativeStatement: string;

  // Assignment & certification
  assignToId?: number;
  certifiedTrue: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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
    let errMsg = "";
    if (contentType?.includes("application/json")) {
      const errJson = await response.json().catch(() => ({}));
      console.error("Backend Error JSON:", errJson);
      errMsg = errJson.message || JSON.stringify(errJson);
    } else {
      errMsg = await response.text();
      console.error("Backend Error Text:", errMsg);
    }
    throw new Error(errMsg || `HTTP error! status: ${response.status}`);
  }
  if (response.status === 204) return {} as T;
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) return response.json();
  return response.text() as unknown as T;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result ?? "");
      // Strip "data:...;base64," prefix
      const base64 = raw.includes(",") ? raw.split(",")[1] : raw;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// ── API Calls ─────────────────────────────────────────────────────────────────

/**
 * Submit a new BCPC child protection case.
 * Returns the generated case number string.
 */
export async function submitBcpcCase(
  payload: BcpcCaseEntryPayload
): Promise<string> {
  return apiFetch<string>(`${BCPC_FORM_URL}/submit`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch active BCPC / Administration officers for the dropdown.
 */
export async function getBcpcOfficerOptions(): Promise<BcpcOfficerOptionDTO[]> {
  return apiFetch<BcpcOfficerOptionDTO[]>(`${BCPC_FORM_URL}/assign-officer`);
}

// ── Management Table ──────────────────────────────────────────────────────────

export interface BcpcCaseSummaryDTO {
  id: number;
  caseNumber: string;
  victimFullName: string;
  respondentFullName: string;
  natureOfCase: string;
  dateFiled: string;
  status: string;
  assignedOfficer: string;
}

export interface BcpcStatsDTO {
  totalCases: number;
  totalOngoing: number;
  totalReferred: number;
  totalSettled: number;
}

export interface BcpcArchiveStatsDTO {
  totalArchived: number;
  totalWithdrawn: number;
  totalSettled: number;
  totalReferred: number;
}

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface BcpcTableParams {
  search?: string;
  status?: string;
  start?: string; // "YYYY-MM-DD"
  end?: string;   // "YYYY-MM-DD"
  page?: number;
  size?: number;
}

/**
 * Fetch paged, filterable BCPC case list.
 */
export async function getBcpcCaseTable(
  params: BcpcTableParams = {}
): Promise<SpringPage<BcpcCaseSummaryDTO>> {
  const q = new URLSearchParams();
  if (params.search) q.append("search", params.search);
  if (params.status) q.append("status", params.status);
  if (params.start)  q.append("start", params.start);
  if (params.end)    q.append("end", params.end);
  if (params.page !== undefined) q.append("page", String(params.page));
  if (params.size !== undefined) q.append("size", String(params.size));
  const qs = q.toString();
  return apiFetch<SpringPage<BcpcCaseSummaryDTO>>(
    qs ? `${BCPC_FORM_URL}/case-table?${qs}` : `${BCPC_FORM_URL}/case-table`
  );
}

/**
 * Fetch KPI stats for the BCPC case management dashboard.
 */
export async function getBcpcStats(): Promise<BcpcStatsDTO> {
  return apiFetch<BcpcStatsDTO>(`${BCPC_FORM_URL}/stats`);
}

/**
 * Fetch paged, filterable list of ARCHIVED BCPC cases.
 */
export async function getBcpcArchivedCaseTable(
  params: Omit<BcpcTableParams, 'status'> = {}
): Promise<SpringPage<BcpcCaseSummaryDTO>> {
  const q = new URLSearchParams();
  if (params.search) q.append('search', params.search);
  if (params.start)  q.append('start', params.start);
  if (params.end)    q.append('end', params.end);
  if (params.page !== undefined) q.append('page', String(params.page));
  if (params.size !== undefined) q.append('size', String(params.size));
  const qs = q.toString();
  return apiFetch<SpringPage<BcpcCaseSummaryDTO>>(
    qs ? `${BCPC_FORM_URL}/archive-table?${qs}` : `${BCPC_FORM_URL}/archive-table`
  );
}

/**
 * Fetch KPI stats for the BCPC archived cases.
 */
export async function getBcpcArchiveStats(): Promise<BcpcArchiveStatsDTO> {
  return apiFetch<BcpcArchiveStatsDTO>(`${BCPC_FORM_URL}/archive-stats`);
}
