const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const LUPON_URL = `${BASE}/api/v1/lupon`;

export interface LuponCaseStatsDTO {
  totalReferred: number;
  activeConciliation: number;
  successfullySettled: number;
  cfaIssued: number;
}

export interface LuponSummaryDTO {
  id: number;
  blotterNumber: string;
  complainantName: string;
  respondentName: string;
  natureOfComplaint: string;
  dateFiled: string;
  status: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface LuponSummaryParams {
  search?: string;
  natureId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export interface ExtendLuponRequest {
  reason: string;
}

export interface ArchiveCaseDTO {
  reason: string;
}

export interface ArchiveLuponStatsDTO {
  totalArchived: number;
  archivedThisMonth: number;
  totalArchiveSettled: number;
  totalArchiveCFA: number;
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

export interface ArchiveTableResponse {
  content: ArchiveTableDTO[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
  page?: {
    number?: number;
    size?: number;
    totalElements?: number;
    totalPages?: number;
  };
}

export interface ArchiveTableParams {
  search?: string;
  caseType?: string;
  dateFrom?: string;
  dateTo?: string;
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

// ─── Lupon / Pangkat API calls ────────────────────────────────────────────────

export async function getLuponDashboardStats(): Promise<LuponCaseStatsDTO> {
  return apiFetch<LuponCaseStatsDTO>(`${LUPON_URL}/stats`);
}

export async function getLuponSummary(
  params: LuponSummaryParams = {},
): Promise<PageResponse<LuponSummaryDTO>> {
  const { search, natureId, startDate, endDate, page = 0, size = 10 } = params;

  const query = new URLSearchParams();

  if (search) query.set("search", search);
  if (natureId) query.set("natureId", String(natureId));
  if (startDate) query.set("startDate", startDate);
  if (endDate) query.set("endDate", endDate);
  query.set("page", String(page));
  query.set("size", String(size));

  return apiFetch<PageResponse<LuponSummaryDTO>>(
    `${LUPON_URL}/summary?${query.toString()}`,
  );
}

export async function extendCasePeriod(
  caseId: number,
  body: ExtendLuponRequest,
): Promise<string> {
  return apiFetch<string>(`${LUPON_URL}/extend/${caseId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function archiveLuponCase(
  caseId: number,
  body: ArchiveCaseDTO,
): Promise<string> {
  return apiFetch<string>(`${LUPON_URL}/archived/${caseId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function restoreLuponCase(
  caseId: number,
  body: ArchiveCaseDTO,
): Promise<string> {
  return apiFetch<string>(`${LUPON_URL}/restore/${caseId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function getLuponArchiveTable(
  params: ArchiveTableParams = {},
): Promise<ArchiveTableResponse> {
  const {
    search,
    caseType,
    dateFrom,
    dateTo,
    page = 0,
    size = 10,
    sort = "dateFiled,desc",
  } = params;

  const query = new URLSearchParams();
  if (search) query.set("search", search);
  if (caseType) query.set("caseType", caseType);
  if (dateFrom) query.set("dateFrom", dateFrom);
  if (dateTo) query.set("dateTo", dateTo);
  query.set("page", String(page));
  query.set("size", String(size));
  query.set("sort", sort);

  return apiFetch<ArchiveTableResponse>(
    `${LUPON_URL}/archive-table?${query.toString()}`,
  );
}

export async function getLuponArchiveStats(): Promise<ArchiveLuponStatsDTO> {
  return apiFetch<ArchiveLuponStatsDTO>(`${LUPON_URL}/archive-stats`);
}
