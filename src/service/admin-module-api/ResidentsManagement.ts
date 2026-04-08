const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const PEOPLE_URL = `${BASE}/api/v1/resident`;

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

export interface ResidentStatsDTO {
  totalResidents: number;
  totalVoters: number;
  totalSeniorCitizen: number;
  headsOfTheFamily: number;
}

export interface ArchiveStatsDTO {
  totalArchived: number;
  totalDeceased: number;
  totalInactive: number;
  totalMoveOut: number;
}

export interface ResidentSummary {
  residentId: number;
  // Base64 or URL
  barangayIdNumber: string;
  photo?: string; // Base64 or URL
  fullName: string;
  contactNumber: string;
  householdNumber: string;
  isVoter: boolean;
  status: string;
  statusRemarks?: string;
}

export interface ResidentCaseHistoryDTO {
  blotterNumber: string;
  incidentNature: string;
  role: string;
  status: string;
  dateFiled: string;
}

export interface ResidentProfileViewDTO {
 peopleId: number;
  photo?: string; 
  firstName: string;
  lastName: string;
  middleName: string;
  suffix?: string;
  fullName: string;
  gender: string;
  birthDate: string;
  age: number;
  civilStatus: string;
  contactNumber: string;
  email: string;
  completeAddress: string;
  
  occupation: string;      
  barangayIdNumber: string; 
  householdNumber: string;  
  precinctNumber: string;   
  
  citizenship: string;
  religion: string;
  bloodType: string;
  isVoter: boolean;
  isHeadOfFamily: boolean;
  dateOfResidency: string;
  is4ps?: boolean;
  isPwd?: boolean;
  pwdIdNumber?: string;
  isIndigent?: boolean;
  educationalAttainment?: string;
  status?: string;
  cases: ResidentCaseHistoryDTO[];
  documents?: ResidentDocumentViewDTO[];
}

export interface ResidentDocumentViewDTO {
  id?: number;
  documentName?: string;
  documentType?: string;
  fileData?: string;
  uploadedAt?: string; // ISO Format: YYYY-MM-DD
}

export interface UpdateStatusRequest {
    status? : string
    reason? : string
}

export interface ResidentDocumentRequest {
  documentName: string;
  documentType: string;
  fileData: string;
}

export interface UpdateDocumentRequest {
  id?: number;
  documentName?: string;
  documentType?: string;
  fileData?: string;
  isRemoved?: boolean;
}

export interface ResidentTableParams {
  search?: string;
  gender?: string;
  isVoter?: boolean;
  household?: string;
}

export interface AddResidentRequest {
 firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  contactNumber?: string;
  completeAddress: string;
  age?: number;
  birthDate: string;
  gender: string;
  civilStatus: string;
  email?: string;
  photo?: string; 
  
  householdNumber: string; 
  precinctNumber: string;  
  isVoter: boolean;
  isHeadOfFamily: boolean;
  occupation?: string;   
  
  citizenship: string;
  religion?: string;
  bloodType?: string;
  barangayIdNumber: string;
  dateOfResidency: string;
  is4ps: boolean;
  isPwd: boolean;
  pwdIdNumber?: string;
  isIndigent: boolean;
  educationalAttainment: string;
  documents?: ResidentDocumentRequest[];
}

export interface UpdateResidentRequest {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  suffix?: string;
  contactNumber?: string;
  completeAddress?: string;
  age?: number;
  birthDate?: string;
  gender?: string;
  civilStatus?: string;
  email?: string;
  photo?: string;
  householdNumber?: string;
  precinctNumber?: string;
  isVoter?: boolean;
  isHeadOfFamily?: boolean;
  occupation?: string;
  citizenship?: string;
  religion?: string;
  bloodType?: string;
  barangayIdNumber?: string;
  dateOfResidency?: string;
  is4ps: boolean;
  isPwd: boolean;
  pwdIdNumber?: string;
  isIndigent: boolean;
  educationalAttainment: string;
  documents?: UpdateDocumentRequest[];
}

export interface SuggestionsDTO {
  suggestedBarangayId: string;
  suggestedPrecinct: string;
  suggestedHouseholdNumber: string;
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json, text/plain, */*",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  const contentType = response.headers.get("content-type") || "";
  const rawBody = response.status === 204 ? "" : await response.text();

  const parseJsonSafely = (text: string) => {
    if (!text) return null;
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return null;
    }
  };

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      throw new Error("Session expired. Please login again.");
    }
    let errMsg = "";

    if (contentType.includes("application/json")) {
      const body = parseJsonSafely(rawBody);
      if (body && typeof body === "object") {
        errMsg =
          (body as { message?: string; error?: string }).message ||
          (body as { message?: string; error?: string }).error ||
          "";
      }
    } else {
      errMsg = rawBody;
    }

    if (!errMsg && rawBody) {
      const fallbackBody = parseJsonSafely(rawBody);
      if (fallbackBody && typeof fallbackBody === "object") {
        errMsg =
          (fallbackBody as { message?: string; error?: string }).message ||
          (fallbackBody as { message?: string; error?: string }).error ||
          "";
      }
    }

    if (!errMsg && rawBody) {
      errMsg = rawBody;
    }

    throw new Error(errMsg || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (contentType.includes("application/json")) {
    const parsed = parseJsonSafely(rawBody);
    if (parsed !== null) return parsed as T;
  }

  return rawBody as T;
}

//search residents
export async function searchPeople(
  query: string,
): Promise<PersonSearchResponseDTO[]> {
  if (!query || query.trim().length < 2) return [];

  const queryParams = new URLSearchParams({ query: query.trim() });
  return apiFetch<PersonSearchResponseDTO[]>(
    `${PEOPLE_URL}/search?${queryParams.toString()}`,
  );
}

//residents table
export async function getResidentTable(
  params: ResidentTableParams = {},
): Promise<ResidentSummary[]> {
  const queryParams = new URLSearchParams();

  if (params.search) queryParams.append("search", params.search);
  if (params.gender) queryParams.append("gender", params.gender);
  if (params.isVoter !== undefined)
    queryParams.append("isVoter", params.isVoter.toString());
  if (params.household) queryParams.append("household", params.household);

  const queryString = queryParams.toString();
  const endpoint = queryString
    ? `${PEOPLE_URL}/table?${queryString}`
    : `${PEOPLE_URL}/table`;

  return apiFetch<ResidentSummary[]>(endpoint);
}

//residents full profile
export async function getResidentProfile(
  residentId: number,
): Promise<ResidentProfileViewDTO> {
  return apiFetch<ResidentProfileViewDTO>(
    `${PEOPLE_URL}/resident-full-profile/${residentId}`,
  );
}

//residents stats
export async function getResidentStats(): Promise<ResidentStatsDTO> {
  return apiFetch<ResidentStatsDTO>(`${PEOPLE_URL}/stats`);
}



export async function updateResidentStatus(residentId: number, data: UpdateStatusRequest): Promise<string> {
  return apiFetch<string>(`${PEOPLE_URL}/update-status/${residentId}`, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });
}


//add resident
export async function addResident(data: AddResidentRequest): Promise<string> {
  return apiFetch<string>(`${PEOPLE_URL}/register`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

//edit resident
export async function updateResident(
  residentId: number,
  data: UpdateResidentRequest,
): Promise<string> {
  return apiFetch<string>(`${PEOPLE_URL}/update-resident/${residentId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

//search for next available barangay ID number
export async function getResidentSuggestions(): Promise<SuggestionsDTO> {
  return apiFetch<SuggestionsDTO>(`${PEOPLE_URL}/suggestions`);
}
