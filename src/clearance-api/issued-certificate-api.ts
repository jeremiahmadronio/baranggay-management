import type { IssuedStats, IssuedCertificate, PagedResponse } from "./types";

// Re-export types for convenience
export type { IssuedStats, IssuedCertificate, PagedResponse };

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE_URL = "/api/clearance";
const MOCK_ISSUED_STORAGE_KEY = "clearance.mockIssuedCertificates";

const toLocalDateTimeString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
};

const readStoredMockIssuedCertificates = (): IssuedCertificate[] => {
  try {
    const raw = localStorage.getItem(MOCK_ISSUED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as IssuedCertificate[]) : [];
  } catch {
    return [];
  }
};

const writeStoredMockIssuedCertificates = (rows: IssuedCertificate[]) => {
  try {
    localStorage.setItem(MOCK_ISSUED_STORAGE_KEY, JSON.stringify(rows));
  } catch {
    // ignore local storage errors in fallback mode
  }
};

const getMockIssuedCertificates = (): IssuedCertificate[] => {
  const stored = readStoredMockIssuedCertificates();
  if (stored.length > 0) return stored;
  return [...MOCK_ISSUED_CERTIFICATES];
};

const MOCK_STATS: IssuedStats = {
  totalIssued: 0,
  totalRevenue: 0,
  totalFreeCertificates: 0,
  totalPaidCertificates: 0,
  revenueGrowth: 0,
  revenueDirection: "up",
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA - Table (matches DB schema: issued_certificates + JOINs)
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_ISSUED_CERTIFICATES: IssuedCertificate[] = [];

// ═══════════════════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch issued certificates stats
 */
export const fetchIssuedStats = async (): Promise<IssuedStats> => {
  try {
    const response = await fetch(`${API_BASE_URL}/issued/stats`);
    if (!response.ok) throw new Error("Failed to fetch stats");
    return await response.json();
  } catch (error) {
    console.warn("API unavailable, using mock data:", error);
    const rows = getMockIssuedCertificates().filter((c) => !c.isArchived);
    const paidRows = rows.filter((c) => !c.isFree);
    const freeRows = rows.filter((c) => c.isFree);
    const totalRevenue = paidRows.reduce((sum, c) => sum + (c.fee || 0), 0);

    return {
      ...MOCK_STATS,
      totalIssued: rows.length,
      totalRevenue,
      totalFreeCertificates: freeRows.length,
      totalPaidCertificates: paidRows.length,
    };
  }
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
  try {
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
  } catch (error) {
    console.warn("API unavailable, using mock data:", error);

    // Filter mock data
    let filtered = getMockIssuedCertificates();
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.requesterName.toLowerCase().includes(searchLower) ||
          c.certificateType.toLowerCase().includes(searchLower) ||
          (c.orNumber && c.orNumber.toLowerCase().includes(searchLower)),
      );
    }
    if (status) {
      filtered = filtered.filter((c) => c.status === status);
    }
    if (certificateType) {
      filtered = filtered.filter((c) => c.certificateType === certificateType);
    }

    // Paginate
    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = filtered.slice(start, start + size);

    return {
      content,
      totalElements,
      totalPages,
      number: page,
      size,
    };
  }
};

/**
 * Fetch single issued certificate by ID
 */
export const fetchIssuedCertificateById = async (
  id: string,
): Promise<IssuedCertificate | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/issued/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch certificate: ${id}`);
    return await response.json();
  } catch (error) {
    console.warn("API unavailable, using mock data:", error);
    return getMockIssuedCertificates().find((c) => c.id === id) || null;
  }
};

/**
 * Void an issued certificate (mark as Voided with reason)
 */
export const voidCertificate = async (
  id: string,
  reason: string,
): Promise<IssuedCertificate> => {
  try {
    const response = await fetch(`${API_BASE_URL}/issued/${id}/void`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error("Failed to void certificate");
    return await response.json();
  } catch (error) {
    console.warn("API unavailable, using mock void:", error);
    const rows = getMockIssuedCertificates();
    const cert = rows.find((c) => c.id === id);
    if (!cert) throw new Error("Certificate not found");
    const voided: IssuedCertificate = {
      ...cert,
      status: "Voided",
      voidReason: reason,
      voidedAt: toLocalDateTimeString(new Date()),
      voidedBy: "Admin",
    };
    const updatedRows = rows.map((item) => (item.id === id ? voided : item));
    writeStoredMockIssuedCertificates(updatedRows);
    return voided;
  }
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
  try {
    const response = await fetch(`${API_BASE_URL}/issued/${id}/archive`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error("Failed to archive certificate");
    return await response.json();
  } catch (error) {
    console.warn("API unavailable, using mock archive:", error);
    const rows = getMockIssuedCertificates();
    const cert = rows.find((c) => c.id === id);
    if (!cert) throw new Error("Certificate not found");
    const archived: IssuedCertificate = {
      ...cert,
      isArchived: true,
      archiveReason: reason,
      archivedAt: toLocalDateTimeString(new Date()),
      archivedBy: "Admin",
    };
    const updatedRows = rows.map((item) => (item.id === id ? archived : item));
    writeStoredMockIssuedCertificates(updatedRows);
    return archived;
  }
};

/**
 * Restore an archived certificate
 */
export const restoreIssuedCertificate = async (
  id: string,
): Promise<IssuedCertificate> => {
  try {
    const response = await fetch(`${API_BASE_URL}/issued/${id}/restore`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to restore certificate");
    return await response.json();
  } catch (error) {
    console.warn("API unavailable, using mock restore:", error);
    const rows = getMockIssuedCertificates();
    const cert = rows.find((c) => c.id === id);
    if (!cert) throw new Error("Certificate not found");
    const restored: IssuedCertificate = {
      ...cert,
      isArchived: false,
      archiveReason: undefined,
      archivedAt: undefined,
      archivedBy: undefined,
    };
    const updatedRows = rows.map((item) => (item.id === id ? restored : item));
    writeStoredMockIssuedCertificates(updatedRows);
    return restored;
  }
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
  try {
    const params = new URLSearchParams();
    if (dateFrom) params.append("dateFrom", dateFrom);
    if (dateTo) params.append("dateTo", dateTo);
    const response = await fetch(
      `${API_BASE_URL}/issued/revenue-report?${params}`,
    );
    if (!response.ok) throw new Error("Failed to fetch revenue report");
    return await response.json();
  } catch (error) {
    console.warn("API unavailable, building mock revenue report:", error);

    let filtered = MOCK_ISSUED_CERTIFICATES.filter(
      (c) => !c.isArchived && c.status !== "Voided",
    );
    if (dateFrom) filtered = filtered.filter((c) => c.dateIssued >= dateFrom);
    if (dateTo) filtered = filtered.filter((c) => c.dateIssued <= dateTo);

    const typeMap = new Map<string, RevenueReportEntry>();
    for (const cert of filtered) {
      const existing = typeMap.get(cert.certificateType) || {
        certificateType: cert.certificateType,
        totalIssued: 0,
        totalPaid: 0,
        totalFree: 0,
        totalRevenue: 0,
      };
      existing.totalIssued++;
      if (cert.isFree) existing.totalFree++;
      else {
        existing.totalPaid++;
        existing.totalRevenue += cert.fee || 0;
      }
      typeMap.set(cert.certificateType, existing);
    }

    const entries = [...typeMap.values()].sort(
      (a, b) => b.totalRevenue - a.totalRevenue,
    );
    return {
      entries,
      grandTotalIssued: entries.reduce((s, e) => s + e.totalIssued, 0),
      grandTotalRevenue: entries.reduce((s, e) => s + e.totalRevenue, 0),
      grandTotalPaid: entries.reduce((s, e) => s + e.totalPaid, 0),
      grandTotalFree: entries.reduce((s, e) => s + e.totalFree, 0),
      dateFrom,
      dateTo,
    };
  }
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
