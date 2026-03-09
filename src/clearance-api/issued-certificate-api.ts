import type { IssuedStats, IssuedCertificate, PagedResponse } from "./types";

// Re-export types for convenience
export type { IssuedStats, IssuedCertificate, PagedResponse };

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE_URL = "/api/clearance";

const MOCK_STATS: IssuedStats = {
  totalIssued: 150,
  totalRevenue: 7500,
  totalFreeCertificates: 50,
  totalPaidCertificates: 100,
  revenueGrowth: 5,
  revenueDirection: "up",
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA - Table (matches DB schema: issued_certificates + JOINs)
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_ISSUED_CERTIFICATES: IssuedCertificate[] = [
  {
    id: "a1b2c3d4-1111-1111-1111-111111111111",
    templateId: 1,
    certificateType: "Barangay Clearance",
    requesterName: "Jeremiah Madronio",
    isFree: false,
    dateIssued: "2024-06-01",
    status: "Released",
    issuedBy: "Admin",
    fee: 50,
    orNumber: "OR-2024-0001",
  },
  {
    id: "a1b2c3d4-2222-2222-2222-222222222222",
    templateId: 4,
    certificateType: "First Time Job Seeker",
    requesterName: "Jere Madronio",
    isFree: true,
    dateIssued: "2024-06-02",
    status: "Released",
    issuedBy: "Admin",
  },
  {
    id: "a1b2c3d4-3333-3333-3333-333333333333",
    templateId: 1,
    certificateType: "Barangay Clearance",
    requesterName: "Jer Madronio",
    isFree: false,
    dateIssued: "2024-06-03",
    status: "Pending",
    issuedBy: "",
  },
  {
    id: "a1b2c3d4-4444-4444-4444-444444444444",
    templateId: 1,
    certificateType: "Barangay Clearance",
    requesterName: "Jerem Madronio",
    isFree: false,
    dateIssued: "2024-06-04",
    status: "Released",
    issuedBy: "Admin",
    fee: 50,
    orNumber: "OR-2024-0004",
  },
  {
    id: "a1b2c3d4-5555-5555-5555-555555555555",
    templateId: 2,
    certificateType: "Certificate of Indigency",
    requesterName: "Jane Doe",
    isFree: true,
    dateIssued: "2024-06-05",
    status: "Released",
    issuedBy: "Admin",
  },
  {
    id: "a1b2c3d4-6666-6666-6666-666666666666",
    templateId: 4,
    certificateType: "First Time Job Seeker",
    requesterName: "John Smith",
    isFree: true,
    dateIssued: "2024-06-06",
    status: "Pending",
    issuedBy: "",
  },
  {
    id: "a1b2c3d4-7777-7777-7777-777777777777",
    templateId: 5,
    certificateType: "Tricycle Registration",
    requesterName: "Alice Johnson",
    isFree: false,
    dateIssued: "2024-06-07",
    status: "Released",
    issuedBy: "Admin",
    fee: 100,
    orNumber: "OR-2024-0007",
  },
  {
    id: "a1b2c3d4-8888-8888-8888-888888888888",
    templateId: 6,
    certificateType: "Tricycle Registration Unit",
    requesterName: "Bob Brown",
    isFree: false,
    dateIssued: "2024-06-08",
    status: "Released",
    issuedBy: "Admin",
    fee: 150,
    orNumber: "OR-2024-0008",
  },
  {
    id: "a1b2c3d4-9999-9999-9999-999999999999",
    templateId: 9,
    certificateType: "Working Clearance",
    requesterName: "Charlie Davis",
    isFree: true,
    dateIssued: "2024-06-09",
    status: "Pending",
    issuedBy: "",
  },
  {
    id: "a1b2c3d4-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    templateId: 7,
    certificateType: "Certificate of Improvement",
    requesterName: "Diana Evans",
    isFree: false,
    dateIssued: "2024-06-10",
    status: "Released",
    issuedBy: "Admin",
    fee: 100,
    orNumber: "OR-2024-0010",
  },
  {
    id: "a1b2c3d4-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    templateId: 3,
    certificateType: "Certificate of Residency",
    requesterName: "Eduardo Franco",
    isFree: false,
    dateIssued: "2024-06-11",
    status: "Released",
    issuedBy: "Admin",
    fee: 30,
    orNumber: "OR-2024-0011",
  },
  {
    id: "a1b2c3d4-cccc-cccc-cccc-cccccccccccc",
    templateId: 8,
    certificateType: "Technical Permit",
    requesterName: "Fiona Garcia",
    isFree: false,
    dateIssued: "2024-06-12",
    status: "Released",
    issuedBy: "Admin",
    fee: 100,
    orNumber: "OR-2024-0012",
  },
];

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
    return MOCK_STATS;
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
    let filtered = [...MOCK_ISSUED_CERTIFICATES];
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
    return MOCK_ISSUED_CERTIFICATES.find((c) => c.id === id) || null;
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
