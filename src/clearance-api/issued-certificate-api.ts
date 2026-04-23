import type { IssuedStats, IssuedCertificate, PagedResponse } from "./types";

// Re-export types for convenience
export type { IssuedStats, IssuedCertificate, PagedResponse };

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE_URL = "/api/clearance";

// ═══════════════════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch issued certificates stats
 */
export const fetchIssuedStats = async (): Promise<IssuedStats> => {
  const response = await fetch(`${API_BASE_URL}/issued/stats`);
  if (!response.ok) throw new Error("Failed to fetch stats");
  return await response.json();
};

/**
 * Fetch paginated issued certificates
 */
export const fetchIssuedCertificates = async (
  page: number = 0,
  size: number = 10,
  search?: string,
  status?: string,
  certificateType?: string,
): Promise<PagedResponse<IssuedCertificate>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  if (search) params.append("search", search);
  if (status) params.append("status", status);
  if (certificateType) params.append("type", certificateType);

  const response = await fetch(`${API_BASE_URL}/issued?${params}`);
  if (!response.ok) throw new Error("Failed to fetch issued certificates");

  const data = await response.json();
  // Handle Spring Boot nested page format
  if (data.content && data.page) {
    return {
      content: data.content,
      totalElements: data.page.totalElements,
      totalPages: data.page.totalPages,
      number: data.page.number,
      size: data.page.size,
    };
  }
  return data;
};

/**
 * Fetch single issued certificate by ID
 */
export const fetchIssuedCertificateById = async (
  id: string,
): Promise<IssuedCertificate | null> => {
  const response = await fetch(`${API_BASE_URL}/issued/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch certificate: ${id}`);
  return await response.json();
};

/**
 * Void an issued certificate (mark as Voided with reason)
 */
export const voidCertificate = async (
  id: string,
  reason: string,
): Promise<IssuedCertificate> => {
  const response = await fetch(`${API_BASE_URL}/issued/${id}/void`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) throw new Error("Failed to void certificate");
  return await response.json();
};

// ═══════════════════════════════════════════════════════════════════════════════
// ARCHIVE / RESTORE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Archive an issued certificate
 */
export const archiveIssuedCertificate = async (
  id: string,
  reason: string,
): Promise<IssuedCertificate> => {
  const response = await fetch(`${API_BASE_URL}/issued/${id}/archive`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) throw new Error("Failed to archive certificate");
  return await response.json();
};

/**
 * Restore an archived certificate
 */
export const restoreIssuedCertificate = async (
  id: string,
): Promise<IssuedCertificate> => {
  const response = await fetch(`${API_BASE_URL}/issued/${id}/restore`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error("Failed to restore certificate");
  return await response.json();
};

/**
 * Fetch revenue report data with date range filtering
 */
export interface RevenueReportEntry {
  certificateType: string;
  totalIssued: number;
  totalPaid: number;
  totalFree: number;
  totalRevenue: number;
}

export interface RevenueReport {
  entries: RevenueReportEntry[];
  grandTotalIssued: number;
  grandTotalRevenue: number;
  grandTotalPaid: number;
  grandTotalFree: number;
  dateFrom?: string;
  dateTo?: string;
}

export const fetchRevenueReport = async (
  dateFrom?: string,
  dateTo?: string,
): Promise<RevenueReport> => {
  const params = new URLSearchParams();
  if (dateFrom) params.append("dateFrom", dateFrom);
  if (dateTo) params.append("dateTo", dateTo);
  const response = await fetch(
    `${API_BASE_URL}/issued/revenue-report?${params}`,
  );
  if (!response.ok) throw new Error("Failed to fetch revenue report");
  return await response.json();
};

// ═══════════════════════════════════════════════════════════════════════════════
// LEGACY EXPORTS (for backward compatibility)
// ═══════════════════════════════════════════════════════════════════════════════

/** @deprecated Use fetchIssuedStats instead */
export const FetchIssuedCertificates = fetchIssuedStats;

/** @deprecated Use fetchIssuedCertificates instead */
export const FetchIssuedCertificatesTable = async (): Promise<
  IssuedCertificate[]
> => {
  const result = await fetchIssuedCertificates(0, 100);
  return result.content;
};

// Legacy interface exports for backward compatibility
export interface IssuedTable {
  id: string;
  CertificateType: string;
  RequesterName: string;
  Fee: number;
  DateIssued: string;
  Status: string;
  IssuedBy: string;
}
