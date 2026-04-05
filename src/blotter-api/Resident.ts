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

export interface ResidentSummary {
  residentId: number;
  barangayIdNumber: string;
  photo?: string; // Base64 or URL
  fullName: string;
  contactNumber: string;
  householdNumber: string;
  isVoter: boolean;
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
  photo?: string; // Base64 or URL
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
  barangayIdNumber: string;
  householdNumber: string;
  precinctNumber: string;
  occupation: string;
  citizenship: string;
  religion: string;
  bloodType: string;
  isVoter: boolean;
  isHeadOfFamily: boolean;
  dateOfResidency: string;
  is4ps: boolean;
  isPwd: boolean;
  pwdIdNumber: string | null;
  isIndigent: boolean;
  educationalAttainment: string;
  status: string;

  cases: ResidentCaseHistoryDTO[];
}

export interface ResidentTableParams {
  search?: string;
  gender?: string;
  isVoter?: boolean;
  household?: string;
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

  return response.json();
}

export async function searchPeople(
  query: string,
): Promise<PersonSearchResponseDTO[]> {
  if (!query || query.trim().length < 2) return [];

  const queryParams = new URLSearchParams({ query: query.trim() });
  return apiFetch<PersonSearchResponseDTO[]>(
    `${PEOPLE_URL}/search?${queryParams.toString()}`,
  );
}

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

export async function getResidentProfile(
  residentId: number,
): Promise<ResidentProfileViewDTO> {
  return apiFetch<ResidentProfileViewDTO>(
    `${PEOPLE_URL}/resident-full-profile/${residentId}`,
  );
}

export async function getResidentStats(): Promise<ResidentStatsDTO> {
  return apiFetch<ResidentStatsDTO>(`${PEOPLE_URL}/stats`);
}
