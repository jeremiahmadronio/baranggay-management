const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const BASE_URL = `${BASE}/api/v1/employee`;
const DEPT_URL = `${BASE}/api/v1/departments`;
const RESIDENT_URL = `${BASE}/api/v1/resident`;

const ENDPOINTS = {
  HIRE: "/hire",
  STATS: "/stats",
  PAGED_TABLE: "/paged-table/global",
  VIEW: "/view",
  UPDATE_STATUS: "/update-status",
  EDIT_EMPLOYEE: "/edit-employee",
};

export const EmployeeStatuses = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  ARCHIVED: "ARCHIVED",
} as const;

export type EmployeeStatus =
  (typeof EmployeeStatuses)[keyof typeof EmployeeStatuses];

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  baseUrl = BASE_URL,
): Promise<T> {
  const token = localStorage.getItem("token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    const errMsg = contentType?.includes("application/json")
      ? (await response.json().catch(() => ({}))).message
      : await response.text();
    throw new Error(errMsg || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) return {} as T;

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return response.text() as unknown as T;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}

export interface EmployeeStats {
  totalEmployees: number;
  activeOfficers: number;
  inactiveStaff: number;
  totalDepartments: number;
}

export interface EmployeeTable {
  id: number;
  fullName: string;
  email: string;
  departmentName: string;
  position: string;
  status: string;
  statusRemarks: string
  activeCases: number;
}

export interface EmployeeAssignCase {
  id: number;
  caseNumber: string;
  natureOfComplaint: string;
  status: string;
  caseFiledAt: string;
  complainantFullName: string;
}

export interface EmployeeView {
  id: number;
  full_name: string;
  photo: string | null;
  status: EmployeeStatus;
  statusRemarks: string | null;
  email: string;
  contactNumber: string;
  birthDate: string;
  age: number;
  gender: string;
  civilStatus: string;
  completeAddress: string;
  assignDepartment: string;
  position: string;
  assignCase: EmployeeAssignCase[];
}

export interface DepartmentOption {
  id: number;
  name: string;
}

export interface PersonSearchResult {
  id: number;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  fullName: string;
  birthDate?: string;
  address: string;
  completeAddress?: string;
  contactNumber?: string;
  barangayIdNumber?: string | null;
}

export interface AddEmployeePayload {
  personId: number;
  isGlobal: boolean;
  departmentId: number;
  position: string;
  status: EmployeeStatus;
}

export interface EditEmployeePayload {
  personId?: number;
  departmentId?: number;
  position?: string;
  status?: EmployeeStatus;
}

export interface UpdateEmployeeStatusPayload {
  reason: string;
  newStatus: EmployeeStatus;
}

export interface PagedTableParams {
  page?: number;
  size?: number;
  search?: string;
  deptId?: number;
  status?: string;
}

function normalizeStatus(raw: unknown): string {
  const value = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (value === "1") return EmployeeStatuses.ACTIVE;
  if (value === "0") return EmployeeStatuses.INACTIVE;
  if (value === "ACTIVE" || value === "INACTIVE" || value === "ARCHIVED") {
    return value;
  }
  return value || "INACTIVE";
}

function normalizePagedTableResponse(raw: any): Page<EmployeeTable> {
  const payload = raw?.data ?? raw;
  const pageMeta = payload?.page ?? payload?.pagination ?? {};

  const contentRaw: any[] = Array.isArray(payload?.content)
    ? payload.content
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload)
        ? payload
        : [];

  const content: EmployeeTable[] = contentRaw.map((item) => ({
    id: Number(item?.id),
    fullName: String(item?.fullName ?? "").trim(),
    email: item?.email ? String(item.email) : "",
    departmentName: String(item?.departmentName ?? "").trim(),
    position: String(item?.position ?? "").trim(),
    status: normalizeStatus(item?.status),
    statusRemarks: String(item?.statusRemarks ?? "").trim(),
    activeCases: Number(item?.activeCases ?? 0),
  }));

  const toSafeNumber = (value: unknown, fallback: number) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const number = toSafeNumber(
    payload?.number ?? pageMeta?.number ?? pageMeta?.pageNumber,
    0,
  );
  const size = Math.max(
    1,
    toSafeNumber(
      payload?.size ?? pageMeta?.size ?? pageMeta?.pageSize,
      content.length || 10,
    ),
  );
  const totalElements = Math.max(
    0,
    toSafeNumber(
      payload?.totalElements ??
        pageMeta?.totalElements ??
        pageMeta?.total_elements,
      content.length,
    ),
  );
  const totalPagesFromPayload = toSafeNumber(
    payload?.totalPages ?? pageMeta?.totalPages ?? pageMeta?.total_pages,
    0,
  );
  const totalPages = Math.max(
    totalPagesFromPayload,
    Math.ceil(totalElements / size) || 1,
  );

  return {
    content,
    number,
    size,
    totalElements,
    totalPages,
    first: payload?.first ?? number <= 0,
    last: payload?.last ?? number >= Math.max(totalPages - 1, 0),
    empty: payload?.empty ?? content.length === 0,
  };
}

export const employeeApi = {
  getStats: (): Promise<EmployeeStats> =>
    apiFetch<EmployeeStats>(ENDPOINTS.STATS),

  getPagedTable: (
    params: PagedTableParams = {},
  ): Promise<Page<EmployeeTable>> => {
    const qs = new URLSearchParams();
    qs.set("page", String(params.page ?? 0));
    qs.set("size", String(params.size ?? 10));
    if (params.search) qs.set("search", params.search);
    if (params.deptId !== undefined) qs.set("deptId", String(params.deptId));
    if (params.status !== undefined) qs.set("status", String(params.status));
    return apiFetch<any>(`${ENDPOINTS.PAGED_TABLE}?${qs.toString()}`).then(
      normalizePagedTableResponse,
    );
  },

  getEmployeeView: (id: number): Promise<EmployeeView> =>
    apiFetch<EmployeeView>(`${ENDPOINTS.VIEW}/${id}`),

  hireEmployee: (payload: AddEmployeePayload): Promise<EmployeeView> =>
    apiFetch<EmployeeView>(ENDPOINTS.HIRE, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  editEmployee: (
    id: number,
    payload: EditEmployeePayload,
  ): Promise<EmployeeView> =>
    apiFetch<EmployeeView>(`${ENDPOINTS.EDIT_EMPLOYEE}/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  updateStatus: (
    id: number,
    payload: UpdateEmployeeStatusPayload,
  ): Promise<string> =>
    apiFetch<string>(`${ENDPOINTS.UPDATE_STATUS}/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  getDepartmentOptions: (): Promise<DepartmentOption[]> =>
    apiFetch<DepartmentOption[]>("/admin-options", {}, DEPT_URL),

  searchPersons: async (query: string): Promise<PersonSearchResult[]> => {
    const raw = await apiFetch<any[]>(
      `/search?query=${encodeURIComponent(query)}`,
      {},
      RESIDENT_URL,
    );

    return (raw || []).map((item) => {
      const firstName = String(item.firstName ?? "").trim();
      const middleName = String(item.middleName ?? "").trim();
      const lastName = String(item.lastName ?? "").trim();
      const fullNameFromFields = [firstName, middleName, lastName]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      const fullName =
        String(item.fullName ?? "").trim() ||
        fullNameFromFields ||
        "Unnamed Resident";

      const completeAddress = String(item.completeAddress ?? "").trim();
      const address = String(item.address ?? "").trim() || completeAddress;

      return {
        id: Number(item.id),
        firstName,
        middleName,
        lastName,
        fullName,
        birthDate: item.birthDate,
        address,
        completeAddress,
        contactNumber: item.contactNumber,
        barangayIdNumber: item.barangayIdNumber ?? null,
      } satisfies PersonSearchResult;
    });
  },
};
