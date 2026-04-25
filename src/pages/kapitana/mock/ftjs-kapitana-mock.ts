import type {
  FtjsStatsResponseDTO,
  FtjsTableDTO,
  ArchiveTableResponseDTO,
} from "../../../service/first-time-job-seeker-api/FirstTimeJobSeeker";
import type {
  FtjsReportTableDTO,
  ReportStatsResponseDTO,
  StatusDistributionDTO,
  TrendResponseDTO,
} from "../../../service/first-time-job-seeker-api/FirstTimeJobSeekerReport";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export const mockKapitanaFtjsStats: FtjsStatsResponseDTO = {
  totalCertificatesIssued: 36,
  totalCertificatedThisMonth: 8,
  originalIssuances: 28,
  reIssuances: 8,
};

export const mockKapitanaFtjsTable: FtjsTableDTO[] = Array.from(
  { length: 12 },
  (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i * 5);
    return {
      id: 5000 + i,
      trackingNumber: `FTJS-2026-${String(500 + i).padStart(4, "0")}`,
      fullName: ["Juan dela Cruz", "Maria Santos", "Pedro Reyes", "Ana Lim"][
        i % 4
      ],
      issuanceCount: 1 + (i % 3),
      status: i % 3 === 0 ? "RE_ISSUANCE" : "RELEASED",
      dateSubmitted: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      isResident: i % 2 === 0,
    };
  },
);

export const mockKapitanaFtjsArchiveTable: ArchiveTableResponseDTO[] = [];

export function mockKapitanaFtjsReportStats(): ReportStatsResponseDTO {
  return {
    totalRecords: 36,
    residentRecords: 22,
    nonResidentRecords: 14,
    duplicateTotalFromDto: 8,
  };
}

export function mockKapitanaFtjsDistribution(): StatusDistributionDTO[] {
  return [
    { status: "RELEASED", total: 28 },
    { status: "RE_ISSUANCE", total: 8 },
  ];
}

/** Monthly labels na `YYYY-MM-01` para month buckets sa report UI */
export function mockKapitanaFtjsTrend(
  startInput: string,
  endInput: string,
): TrendResponseDTO[] {
  const start = new Date(`${startInput}T00:00:00`);
  const end = new Date(`${endInput}T23:59:59`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
  const out: TrendResponseDTO[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  let i = 0;
  while (cursor <= endMonth) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    out.push({
      label: `${y}-${pad(m + 1)}-01`,
      total: 2 + (i % 4),
    });
    i += 1;
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return out;
}

export function mockKapitanaFtjsReportCases(): FtjsReportTableDTO[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (i % 5));
    d.setDate(5 + (i % 20));
    return {
      id: 7000 + i,
      ftjsNumber: `FTJS-2026-${String(600 + i).padStart(4, "0")}`,
      fullName: ["Rico Bautista", "Nina Cruz", "Leo Ramos", "Kim Tan"][i % 4],
      status: i % 4 === 0 ? "RE_ISSUANCE" : "RELEASED",
      dateSubmitted: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      contactNumber: "0917" + String(1000000 + i),
    };
  });
}

/** Full detail record for the kapitana FTJS detail view */
export function mockKapitanaFtjsFullDetails(id: number) {
  const row = mockKapitanaFtjsTable.find((r) => r.id === id);
  const d = new Date();
  d.setDate(d.getDate() - 10);
  return {
    id: row?.id ?? id,
    trackingNumber: row?.trackingNumber ?? `FTJS-2026-${String(id).padStart(4, "0")}`,
    fullName: row?.fullName ?? "Juan dela Cruz",
    firstName: (row?.fullName ?? "Juan dela Cruz").split(" ")[0],
    middleName: "",
    lastName: (row?.fullName ?? "Juan dela Cruz").split(" ").slice(1).join(" "),
    dateOfBirth: "2000-05-15",
    age: 26,
    gender: "Male",
    fullAddress: "123 Main St., Barangay Ugong, Valenzuela City",
    contactNumber: "09171234567",
    email: "applicant@email.com",
    educationalAttainment: "College Graduate",
    course: "BS Information Technology",
    institution: "Polytechnic University of the Philippines",
    schoolAddress: "Sta. Mesa, Manila",
    validIdType: "NATIONAL_ID",
    idNumber: "PSN-0012-3456-7890",
    purpose: "Employment requirement",
    isResident: row?.isResident ?? true,
    status: row?.status ?? "RELEASED",
    issuanceCount: row?.issuanceCount ?? 1,
    dateSubmitted: row?.dateSubmitted ?? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    oathFiles: null,
  };
}

export function mockKapitanaFtjsNotes(id: number) {
  return [
    {
      id: 1,
      ftjsId: id,
      notes: "Application reviewed and verified. All documents complete.",
      createdBy: "Brgy. Secretary",
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 2,
      ftjsId: id,
      notes: "Certificate printed and released to applicant.",
      createdBy: "Brgy. Encoder",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];
}

export function mockKapitanaFtjsTimeline(id: number) {
  return [
    {
      id: 1,
      ftjsId: id,
      action: "Application submitted",
      performedBy: "Applicant",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 2,
      ftjsId: id,
      action: "Documents verified",
      performedBy: "Brgy. Secretary",
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 3,
      ftjsId: id,
      action: "Certificate released",
      performedBy: "Brgy. Encoder",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];
}
