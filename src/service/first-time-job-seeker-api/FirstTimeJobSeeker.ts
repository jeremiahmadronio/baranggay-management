const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const FTJS_URL = `${BASE}/api/v1/ftjs`;
const RESIDENT_URL = `${BASE}/api/v1/resident`;
const PERMISSION_URL = `${BASE}/api/v1/permission`;

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// =====================================================================
// REQUEST DTOs
// =====================================================================

export interface FtjsRequestDTO {
  resident_id?: number | null;

  firstName?: string;
  lastName?: string;
  gender?: string;
  address?: string;
  contactNumber?: string;
  email?: string;

  schoolAddress?: string;
  educationalAttainment: string;
  course?: string;
  institution?: string;

  validIdType?: string;
  idNumber?: string;
  oathFiles: number[]; // byte[]
  purpose: string;
}

export interface NotesRequestDTO {
  ftjsId: number;
  notes: string;
}

export interface RequestNewFtjsDTO {
  ftjsId: number;
  reason: string;
  affidavitFiles: number[]; // byte[] as number array
  dateOfLoss: string; // "YYYY-MM-DD"
  orNumber?: string;
  amountPaid?: number;
}

export interface FtjsEditRequestDTO {
  firstName?: string;
  lastName?: string;
  gender?: string;
  address?: string;
  contactNumber?: string;
  email?: string;
  schoolAddress?: string;
  educationalAttainment?: string;
  course?: string;
  institution?: string;
  validIdType?: string;
  idNumber?: string;
  oathFiles?: number[];
  purpose?: string;
}

export interface StatusUpdateDTO {
  isArchived: boolean;
  remarks: string;
}

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

export interface UserAccessPermission {
  userId: string;
  username: string;
  role: string;
  department: string;
  permissions: string[];
}

export const FTJS_PERMISSIONS = {
  REGISTER_APPLICANT: "Register New Applicant",
  ISSUE_CERTIFICATE: "Issue FTJS Certificate",
  VIEW_RECORDS: "View FTJS Records",
  UPDATE_APPLICANT_INFO: "Update Applicant Info",
} as const;

const FTJS_PERMISSION_ALIASES: Record<string, string[]> = {
  [FTJS_PERMISSIONS.REGISTER_APPLICANT]: ["Register new Applicant"],
  [FTJS_PERMISSIONS.ISSUE_CERTIFICATE]: ["Issue ftjs Certificate"],
  [FTJS_PERMISSIONS.VIEW_RECORDS]: ["View ftjs Records"],
  [FTJS_PERMISSIONS.UPDATE_APPLICANT_INFO]: ["Update Applicant Info"],
};

function normalizePermissionName(value?: string | null): string {
  return String(value ?? "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/[&/]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "");
}

export function hasFtjsPermission(
  user: Pick<UserAccessPermission, "permissions"> | null | undefined,
  permission: string,
): boolean {
  if (!user?.permissions?.length) return false;

  const normalizedOwnedPermissions = user.permissions.map((entry) =>
    normalizePermissionName(entry),
  );

  const candidates = [
    permission,
    ...(FTJS_PERMISSION_ALIASES[permission] || []),
  ].map((entry) => normalizePermissionName(entry));

  return candidates.some((candidate) =>
    normalizedOwnedPermissions.includes(candidate),
  );
}

export function hasAnyFtjsPermission(
  user: Pick<UserAccessPermission, "permissions"> | null | undefined,
  permissions: string[],
): boolean {
  return permissions.some((permission) => hasFtjsPermission(user, permission));
}

// =====================================================================
// RESPONSE DTOs
// =====================================================================

export interface FtjsTableDTO {
  id: number;
  trackingNumber: string;
  fullName: string;
  issuanceCount: number;
  status: string;
  dateSubmitted: string;
  isResident: boolean;
}

export interface FtjsFullResponseDTO {
  id: number;
  trackingNumber: string;
  status: string;
  issuanceCount: number;

  residentId: number | null;
  fullName: string;
  gender: string;
  contactNumber: string;
  email: string;
  fullAddress: string;
  isRegisteredResident: boolean;
  schoolAddress: string;
  educationalAttainment: string;
  course: string;
  institution: string;
  validIdType: string;
  idNumber: string;
  purpose: string;
  dateSubmitted: string;

  hasOathFile: boolean;
  oathFile: number[];
  verifiedBy: string;

  createdAt: string;
  updatedAt: string;
}

export interface NotesResponseDTO {
  id: number;
  note: string;
  createdBy: string;
  createdAt: string;
}

export interface TimelineResponseDTO {
  id: number;
  title: string;
  description: string;
  type: string;
  eventDate: string;
  createdBy: string;
}

export interface ResponseNewFtjsFullDetailsDTO {
  id: number;
  residentFullName: string;
  reason: string;
  dateOfLoss: string;
  issuanceNumber: number;
  amountPaid: number | null;
  orNumber: string | null;
  createdBy: string;
  createdAt: string;
  fileAttach: number[] | null;
}

export interface ResponseNewFtjsSummaryDTO {
  id: number;
  dateSubmitted: string;
  issuanceCount: number;
  reason: string;
}

export interface FtjsStatsResponseDTO {
  totalCertificatesIssued: number;
  totalCertificatedThisMonth: number;
  originalIssuances: number;
  reIssuances: number;
}

export interface ArchiveResponseDTO {
  totalArchive: number;
  totalArchiveThisMonth: number;
  totalArchiveResident: number;
  totalArchiveNonResident: number;
}

export interface ArchiveTableResponseDTO {
  id: number;
  trackingNumber: string;
  fullName: string;
  issuanceCount: number;
  status: string;
  dateSubmitted: string;
  archiveRemarks: string;
}

// =====================================================================
// API FETCH HELPER
// =====================================================================

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
      throw new ApiError("Session expired. Please login again.", 401);
    }
    const contentType = response.headers.get("content-type");
    const errMsg = contentType?.includes("application/json")
      ? (await response.json().catch(() => ({}))).message
      : await response.text();
    throw new ApiError(
      errMsg || `HTTP error! status: ${response.status}`,
      response.status,
    );
  }

  if (response.status === 204) return {} as T;

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) return response.json();
  return response.text() as unknown as T;
}

export const ftjsApi = {
  getMyAccess: async (): Promise<UserAccessPermission> => {
    try {
      const data = await apiFetch<UserAccessPermission>(`${PERMISSION_URL}/my-access`);
      try { localStorage.setItem('cached_permissions_ftjs', JSON.stringify(data)); } catch {}
      return data;
    } catch (err: any) {
      if (err.message?.includes('Failed to fetch') || err.message?.includes('unreachable')) {
        const cached = localStorage.getItem('cached_permissions_ftjs');
        if (cached) return JSON.parse(cached);
      }
      throw err;
    }
  },

  // resident search for FTJS entry
  searchResidents: (query: string): Promise<PersonSearchResponseDTO[]> => {
    if (!query || query.trim().length < 2) {
      return Promise.resolve([]);
    }

    const queryParams = new URLSearchParams({ query: query.trim() });
    return apiFetch<PersonSearchResponseDTO[]>(
      `${RESIDENT_URL}/search?${queryParams.toString()}`,
    );
  },

  // create new requestt
  createRequest: (dto: FtjsRequestDTO): Promise<string> =>
    apiFetch<string>(`${FTJS_URL}/entry`, {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  // add notes
  addNotes: (dto: NotesRequestDTO): Promise<string> =>
    apiFetch<string>(`${FTJS_URL}/add-notes`, {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  // request new certificate new certificate (replacement or reissuance)
  requestNewCertificate: (dto: RequestNewFtjsDTO): Promise<string> =>
    apiFetch<string>(`${FTJS_URL}/request-new`, {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  // display notes(need  ftjs id)
  getNotes: (ftjsId: number): Promise<NotesResponseDTO[]> =>
    apiFetch<NotesResponseDTO[]>(`${FTJS_URL}/view-notes/${ftjsId}`),

  // display timeline (need ftjs id)
  getTimeline: (ftjsId: number): Promise<TimelineResponseDTO[]> =>
    apiFetch<TimelineResponseDTO[]>(`${FTJS_URL}/view-timeline/${ftjsId}`),

  // display replacement full details (need replacement id)
  getReplacementFullDetails: (
    replacementId: number,
  ): Promise<ResponseNewFtjsFullDetailsDTO> =>
    apiFetch<ResponseNewFtjsFullDetailsDTO>(
      `${FTJS_URL}/view-full-replacement/${replacementId}`,
    ),

  // display all replacement summary of a ftjs request (need ftjs id)
  getReplacementSummary: (
    ftjsId: number,
  ): Promise<ResponseNewFtjsSummaryDTO[]> =>
    apiFetch<ResponseNewFtjsSummaryDTO[]>(`${FTJS_URL}/view-sumarry/${ftjsId}`),

  // display full details of a ftjs request (need ftjs id)
  getFullDetails: (ftjsId: number): Promise<FtjsFullResponseDTO> =>
    apiFetch<FtjsFullResponseDTO>(`${FTJS_URL}/view-full/${ftjsId}`),

  // ftjs table
  getTableSummary: (): Promise<FtjsTableDTO[]> =>
    apiFetch<FtjsTableDTO[]>(`${FTJS_URL}/summary`),

  // display ftjs stats
  getStats: (): Promise<FtjsStatsResponseDTO> =>
    apiFetch<FtjsStatsResponseDTO>(`${FTJS_URL}/stats`),

  // display ftjs archive stats
  getArchiveStats: (): Promise<ArchiveResponseDTO> =>
    apiFetch<ArchiveResponseDTO>(`${FTJS_URL}/archive-stats`),

  // edit ftjs request (only allowed when status is "ISSUED" and "RE_ISSUANCE")
  updateRequest: (id: number, dto: FtjsEditRequestDTO): Promise<string> =>
    apiFetch<string>(`${FTJS_URL}/edit/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),

  // archive and restore ftjs request
  updateStatus: (id: number, dto: StatusUpdateDTO): Promise<string> =>
    apiFetch<string>(`${FTJS_URL}/update-status/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),

  getArchiveTable: (): Promise<ArchiveTableResponseDTO[]> =>
    apiFetch<ArchiveTableResponseDTO[]>(`${FTJS_URL}/archive-table`),
};