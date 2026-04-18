const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const CLEARANCE_TEMPLATE_URL = `${BASE}/api/v1/clearance/template`;
const REQUEST_TIMEOUT_MS = 10000;



export interface SignatoryDTO {
  signatoryName: string;
  signatoryTitle: string;
}

export interface TemplateRequestDTO {
  certTitle: string;
  layoutStyle: string;
  certTagline: string;
  bodySections: unknown;
  issueFields: unknown;
  requiresPhoto: boolean;
  requiresThumbmark: boolean;
  hasFee: boolean;
  hasCtn: boolean;
  certFee: number;
  validityMonths: number;
  footerText: string;
  signatories: SignatoryDTO[];
}

export interface TemplateResponseDTO {
  id: number;
  certTitle: string;
  layoutStyle: string;
  certTagline: string;
  bodySections: unknown;
  issueFields: unknown;
  requiresPhoto?: boolean;
  requiresThumbmark?: boolean;
  hasFee: boolean;
  certFee: number;
  hascTn: boolean;
  validityMonths: number;
  signatories: SignatoryDTO[];
  isArchived?: boolean;
  archived?: boolean;
  archiveStatus?: string;
  status?: string;
}

export interface IssuanceRequestDTO {
  templateId: number;
  personId: number;
  requestorName: string;
  fieldValues: unknown;
  orNumber: string;
  ctnNumber: string;
  isFree: boolean;
  remarks: string;
}

export type ClearanceStatus = "ACTIVE" | "VOID" | "EXPIRED";

export interface SummaryResponseDTO {
  id: number;
  certNumber: string;
  requestor: string;
  certificateTitle: string;
  fee: number;
  status: ClearanceStatus;
  requestedAt: string;
}

export interface CertStatsResponseDTO {
  totalCertificate: number;
  totalPaidCertificate: number;
  totalFreeCertificate: number;
  totalTemplate: number;
}

export interface VoidRequestDTO {
  remarks: string;
}

export interface ArchiveTemplateRequestDTO {
  remarks: string;
}

export interface ArchiveSummaryResponseDTO {
  id: number;
  certNumber: string;
  requestor: string;
  certTitle: string;
  fee: number;
  status: string;
  archiveRemarks: string;
}

export interface ArchiveStatsResponseDTO {
  totalArchiveIssued: number;
  lostRevenue: number;
  totalArchiveTemplate: number;
  mostArchiveTemplate: string;
}



async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal ?? controller.signal,
    });

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
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out while loading clearance templates.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}


export const clearanceTemplateApi = {
  // POST /create-template
  createTemplate: (dto: TemplateRequestDTO): Promise<string> =>
    apiFetch<string>(`${CLEARANCE_TEMPLATE_URL}/create-template`, {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  // GET /view-template
  getAllTemplates: (): Promise<TemplateResponseDTO[]> =>
    apiFetch<TemplateResponseDTO[]>(`${CLEARANCE_TEMPLATE_URL}/view-template`),

  // POST /issue-clearance
  issueClearance: (dto: IssuanceRequestDTO): Promise<string> =>
    apiFetch<string>(`${CLEARANCE_TEMPLATE_URL}/issue-clearance`, {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  // GET /summary-table
  getSummaryTable: (): Promise<SummaryResponseDTO[]> =>
    apiFetch<SummaryResponseDTO[]>(`${CLEARANCE_TEMPLATE_URL}/summary-table`),

  // GET /stats
  getStats: (): Promise<CertStatsResponseDTO> =>
    apiFetch<CertStatsResponseDTO>(`${CLEARANCE_TEMPLATE_URL}/stats`),

  // PUT /archive-issued/{issuedId}
  archiveIssued: (issuedId: number, dto: VoidRequestDTO): Promise<string> =>
    apiFetch<string>(`${CLEARANCE_TEMPLATE_URL}/archive-issued/${issuedId}`, {
      method: "PUT",
      body: JSON.stringify(dto),
    }),

  // PATCH /toggle-archive/{id}
  toggleArchiveTemplate: (id: number, dto: ArchiveTemplateRequestDTO): Promise<void> =>
    apiFetch<void>(`${CLEARANCE_TEMPLATE_URL}/toggle-archive/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),

  // PATCH /restore/{id}
  restoreVoid: (id: number, dto: ArchiveTemplateRequestDTO): Promise<void> =>
    apiFetch<void>(`${CLEARANCE_TEMPLATE_URL}/restore/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),

  // GET /archive-table
  getAllArchives: (): Promise<ArchiveSummaryResponseDTO[]> =>
    apiFetch<ArchiveSummaryResponseDTO[]>(`${CLEARANCE_TEMPLATE_URL}/archive-table`),

  // GET /archive-stats
  getArchiveStats: (): Promise<ArchiveStatsResponseDTO> =>
    apiFetch<ArchiveStatsResponseDTO>(`${CLEARANCE_TEMPLATE_URL}/archive-stats`),
};                                    