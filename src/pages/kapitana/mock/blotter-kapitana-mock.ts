import type {
  NatureOptionDTO,
  LuponOptionDTO,
} from "../../../service/blotter-api/BlotterFormComplaint";
import type {
  ArchiveStatsDTO,
  ArchiveTableDTO,
  ArchiveTableParams,
  ArchiveTableResponse,
  BlotterDocketViewDTO,
  BlotterStatsDTO,
  BlotterSummaryDTO,
  BusySlotDTO,
  CalendarMarkerDTO,
  CaseNoteViewDTO,
  CaseTimelineDTO,
  DocketTableParams,
  HearingFullDetailsDTO,
  HearingViewDTO,
  MediationProcessDTO,
  SpringPage,
} from "../../../service/blotter-api/DocketView";
import type {
  BlotterRecordViewDTO,
  FtrSummaryStatsDTO,
  RecordTableParams,
} from "../../../service/blotter-api/RecordView";
import type {
  ChartDataDTO,
  NatureStatDTO,
  ReportsStatsDTO,
  SettlementEfficiencyDTO,
  StatusStatDTO,
} from "../../../service/blotter-api/BlotterReports";
import type { UserSecurityProfile } from "../../../service/blotter-api/BlotterPermission";
import { BLOTTER_PERMISSIONS } from "../../../service/blotter-api/BlotterPermission";
import type {
  DashboardStatsDTO,
  MonthlyCaseChartDTO,
  CaseStatusDistributionDTO,
  RecentCaseDTO,
  UpcomingHearingDTO,
} from "../../../service/blotter-api/Dashboard";

const iso = (d: Date) => d.toISOString();

function springPage<T>(
  all: T[],
  page: number,
  size: number,
): SpringPage<T> {
  const totalElements = all.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size) || 1);
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * size;
  const content = all.slice(start, start + size);
  return {
    content,
    pageable: {},
    last: safePage >= totalPages - 1,
    totalElements,
    totalPages,
    size,
    number: safePage,
    first: safePage === 0,
    numberOfElements: content.length,
    empty: content.length === 0,
  };
}

function matchesDateRange(
  dateFiled: string,
  start?: string,
  end?: string,
): boolean {
  if (!start && !end) return true;
  const t = new Date(dateFiled).getTime();
  if (Number.isNaN(t)) return true;
  if (start) {
    const s = new Date(`${start}T00:00:00`).getTime();
    if (!Number.isNaN(s) && t < s) return false;
  }
  if (end) {
    const e = new Date(`${end}T23:59:59`).getTime();
    if (!Number.isNaN(e) && t > e) return false;
  }
  return true;
}

/** Refer-to-Lupon modal dropdowns */
export const mockLuponEmployeeOptions: LuponOptionDTO[] = [
  { id: 101, name: "Antonio Mercado", position: "Lupon Chairman" },
  { id: 102, name: "Liza Navarro", position: "Lupon Secretary" },
  { id: 103, name: "Pedro Ramos", position: "Lupon Member" },
  { id: 104, name: "Elena Cruz", position: "Lupon Member" },
];

export const mockKapitanaNatureOptions: NatureOptionDTO[] = [
  { id: 1, natureName: "Noise Disturbance" },
  { id: 2, natureName: "Street Altercation" },
  { id: 3, natureName: "Debt / Non-payment" },
  { id: 4, natureName: "Land Boundary Dispute" },
  { id: 5, natureName: "Animal-related Conflict" },
];

const NATURE_BY_ID = new Map(
  mockKapitanaNatureOptions.map((n) => [n.id, n.natureName]),
);

/** Docket book / mediation — walang `RECORDED` (nasa FTR module lang). */
const DOCKET_MANAGEMENT_STATUSES: readonly string[] = [
  "PENDING",
  "PENDING",
  "UNDER_MEDIATION",
  "UNDER_MEDIATION",
  "UNDER_CONCILIATION",
  "UNDER_CONCILIATION",
  "REFERRED_TO_LUPON",
  "REFERRED_TO_LUPON",
  "SETTLED",
  "DISMISSED",
  "CLOSED",
  "WITHDRAWN",
];

function buildMockDocketRows(): BlotterSummaryDTO[] {
  const now = new Date();
  return DOCKET_MANAGEMENT_STATUSES.map((status, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 3 - 5);
    const nature = mockKapitanaNatureOptions[i % mockKapitanaNatureOptions.length]
      .natureName;
    return {
      id: 9000 + i,
      blotterNumber: `BRT-2026-${String(100 + i).padStart(4, "0")}`,
      complainantName: ["Maria Santos", "Juan dela Cruz", "Ana Reyes", "Pedro Gomez"][
        i % 4
      ],
      respondentName: ["Rosa Lim", "Carlos Tan", "Lito Ramos", "Nena Cruz"][i % 4],
      natureOfComplaint: nature,
      dateFiled: iso(d),
      status,
    };
  });
}

export const MOCK_KAPITANA_DOCKET_ROWS = buildMockDocketRows();

/** For-the-record list lang — hiwalay na blotter numbers (`FTR-`). */
function buildMockFtrRecordedRows(): BlotterSummaryDTO[] {
  const now = new Date();
  return Array.from({ length: 10 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 2 - 1);
    const nature = mockKapitanaNatureOptions[i % mockKapitanaNatureOptions.length]
      .natureName;
    return {
      id: 9600 + i,
      blotterNumber: `FTR-2026-${String(300 + i).padStart(4, "0")}`,
      complainantName: ["Liza Ramos", "Nina Cruz", "Ben Torres", "Amy Diaz"][i % 4],
      respondentName: ["Carlos Mendoza", "Roberto Tan", "Edgar Santos", "Mario Reyes"][i % 4],
      natureOfComplaint: nature,
      dateFiled: iso(d),
      status: "RECORDED",
    };
  });
}

export const MOCK_KAPITANA_FTR_ROWS = buildMockFtrRecordedRows();

function allBlotterRowsForReports(): BlotterSummaryDTO[] {
  return [...MOCK_KAPITANA_DOCKET_ROWS, ...MOCK_KAPITANA_FTR_ROWS];
}

export function mockFilterDocketRows(
  params: DocketTableParams,
): BlotterSummaryDTO[] {
  const q = (params.search || "").trim().toLowerCase();
  const status = (params.status || "").toUpperCase();
  const natureName = params.natureId
    ? NATURE_BY_ID.get(params.natureId)
    : undefined;

  return MOCK_KAPITANA_DOCKET_ROWS.filter((row) => {
    if (q) {
      const blob = `${row.blotterNumber} ${row.complainantName} ${row.respondentName}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
    if (status && row.status.toUpperCase() !== status) return false;
    if (natureName && row.natureOfComplaint !== natureName) return false;
    if (!matchesDateRange(row.dateFiled, params.start, params.end))
      return false;
    return true;
  });
}

export function mockDocketTablePage(
  params: DocketTableParams,
): SpringPage<BlotterSummaryDTO> {
  const filtered = mockFilterDocketRows(params);
  const size = params.size ?? 10;
  const page = params.page ?? 0;
  return springPage(filtered, page, size);
}

/** Blotter Records module — hiwalay na dataset (`MOCK_KAPITANA_FTR_ROWS`). */
export function mockRecordTablePage(
  params: RecordTableParams,
): SpringPage<BlotterSummaryDTO> {
  const q = (params.search || "").trim().toLowerCase();
  let rows = [...MOCK_KAPITANA_FTR_ROWS];
  if (params.status) {
    const st = params.status.toUpperCase();
    rows = rows.filter((r) => r.status.toUpperCase() === st);
  }
  if (q) {
    rows = rows.filter((row) => {
      const blob = `${row.blotterNumber} ${row.complainantName} ${row.respondentName}`.toLowerCase();
      return blob.includes(q);
    });
  }
  rows = rows.filter((row) =>
    matchesDateRange(row.dateFiled, params.start, params.end),
  );
  const size = params.size ?? 10;
  const page = params.page ?? 0;
  return springPage(rows, page, size);
}

export function mockDocketStats(): BlotterStatsDTO {
  const rows = MOCK_KAPITANA_DOCKET_ROWS;
  const active = rows.filter((r) =>
    ["PENDING", "UNDER_MEDIATION", "UNDER_CONCILIATION"].includes(r.status),
  ).length;
  const resolved = rows.filter((r) =>
    ["SETTLED", "DISMISSED", "CLOSED", "WITHDRAWN"].includes(r.status),
  ).length;
  return {
    totalEntries: rows.length,
    activeCases: active,
    resolved,
    pendingMediation: rows.filter((r) => r.status === "UNDER_MEDIATION").length,
  };
}

export function mockDashboardStats(): DashboardStatsDTO {
  const rows = MOCK_KAPITANA_DOCKET_ROWS;
  const pendingNew = rows.filter((r) => r.status.toUpperCase() === "PENDING").length;
  const settled = rows.filter((r) => r.status.toUpperCase() === "SETTLED").length;
  return {
    hearingsToday: 2,
    pendingNewCases: pendingNew,
    nearingDeadline: rows.filter((r) =>
      ["PENDING", "UNDER_MEDIATION"].includes(r.status.toUpperCase()),
    ).length,
    settledThisMonth: settled,
  };
}

export function mockMonthlyChart(): MonthlyCaseChartDTO[] {
  const out: MonthlyCaseChartDTO[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      month: d.toLocaleString("en-US", { month: "short" }),
      count: 3 + ((i + now.getMonth()) % 5),
    });
  }
  return out;
}

function countByStatus(rows: BlotterSummaryDTO[]): CaseStatusDistributionDTO[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = String(r.status || "UNKNOWN").toUpperCase();
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
}

/** Dashboard pie — docket management lang (walang FTR). */
export function mockCaseDistribution(): CaseStatusDistributionDTO[] {
  return countByStatus(MOCK_KAPITANA_DOCKET_ROWS);
}

export function mockRecentCases(): RecentCaseDTO[] {
  return MOCK_KAPITANA_DOCKET_ROWS.slice(0, 5).map((r) => ({
    id: r.id,
    blotterNumber: r.blotterNumber,
    caseType: r.natureOfComplaint,
    complainantName: r.complainantName,
    respondentName: r.respondentName,
    status: r.status,
    dateFiled: r.dateFiled,
  }));
}

export function mockUpcomingHearings(): UpcomingHearingDTO[] {
  const t = new Date();
  t.setHours(14, 0, 0, 0);
  return [
    {
      hearingId: 501,
      caseTitle: mockKapitanaNatureOptions[0].natureName,
      blotterNumber: MOCK_KAPITANA_DOCKET_ROWS[0].blotterNumber,
      scheduledStart: iso(t),
    },
    {
      hearingId: 502,
      caseTitle: mockKapitanaNatureOptions[1].natureName,
      blotterNumber: MOCK_KAPITANA_DOCKET_ROWS[1].blotterNumber,
      scheduledStart: iso(new Date(t.getTime() + 86400000)),
    },
  ];
}

function mockRecordedRows(): BlotterSummaryDTO[] {
  return MOCK_KAPITANA_FTR_ROWS;
}

/** Record KPIs — tugma sa bilang ng RECORDED rows. */
export function mockRecordStats(): FtrSummaryStatsDTO {
  const rec = mockRecordedRows();
  const natureFreq = new Map<string, number>();
  for (const r of rec) {
    natureFreq.set(
      r.natureOfComplaint,
      (natureFreq.get(r.natureOfComplaint) ?? 0) + 1,
    );
  }
  let topNature = "—";
  let topCount = 0;
  natureFreq.forEach((c, n) => {
    if (c > topCount) {
      topCount = c;
      topNature = n;
    }
  });
  return {
    totalFtr: rec.length,
    ftrTrend: Math.min(6, rec.length),
    frequentSubjectsCount: Math.min(rec.length, natureFreq.size || 1),
    mostReportedIssue: topNature,
    peakIncidentTime: "7:00 PM – 9:00 PM",
    peakTimeCount: Math.min(rec.length, 11),
  };
}

export function mockArchiveStats(): ArchiveStatsDTO {
  return {
    totalArchive: 18,
    totalArchiveThisMonth: 2,
    totalArchiveFormalComplaint: 7,
    totalArchiveForTheRecord: 11,
  };
}

export function mockArchiveRows(): ArchiveTableDTO[] {
  return MOCK_KAPITANA_DOCKET_ROWS.slice(0, 6).map((r, i) => ({
    caseId: r.id,
    blotterNumber: r.blotterNumber,
    caseType: i % 2 === 0 ? "FORMAL_COMPLAINT" : "FOR_THE_RECORD",
    complainant: r.complainantName,
    respondent: r.respondentName,
    status: "ARCHIVED",
    archivedRemarks: "Na-archive matapos ang settlement period.",
    dateFiled: r.dateFiled,
  }));
}

export function mockArchiveTableResponse(
  params: ArchiveTableParams,
): ArchiveTableResponse {
  let rows = [...mockArchiveRows()];
  const q = (params.search || "").trim().toLowerCase();
  if (q) {
    rows = rows.filter(
      (x) =>
        x.blotterNumber.toLowerCase().includes(q) ||
        x.complainant.toLowerCase().includes(q),
    );
  }
  if (params.caseType) {
    const ct = params.caseType.toUpperCase();
    rows = rows.filter((x) => x.caseType.toUpperCase() === ct);
  }
  rows = rows.filter((x) =>
    matchesDateRange(x.dateFiled, params.dateFrom, params.dateTo),
  );
  const size = params.size ?? 10;
  const page = params.page ?? 0;
  const sp = springPage(rows, page, size);
  return {
    content: sp.content,
    totalElements: sp.totalElements,
    totalPages: sp.totalPages,
    number: sp.number,
    size: sp.size,
  };
}

/**
 * Reports KPI cards — `totalEntries` = docket rows;
 * `forTheRecord` = RECORDED; formal track = lahat ng hindi RECORDED; `referredToLupon` = status count.
 */
export function mockReportsStats(): ReportsStatsDTO {
  const rows = allBlotterRowsForReports();
  const total = rows.length;
  const recorded = rows.filter((r) => r.status.toUpperCase() === "RECORDED").length;
  const referred = rows.filter((r) => r.status.toUpperCase() === "REFERRED_TO_LUPON").length;
  /** Hindi kasama ang FTR (RECORDED) at hiwalay ang referred — formal + FTR + referred = total */
  const formal = Math.max(0, total - recorded - referred);
  return {
    totalEntries: total,
    totalTrend: 0,
    formalComplaints: formal,
    formalTrend: 0,
    forTheRecord: recorded,
    recordTrend: 0,
    referredToLupon: referred,
    luponTrend: 0,
  };
}

/**
 * Trend data na **buwan-buwan** sa loob ng piniling range.
 * Label `YYYY-MM-DD` (unang araw ng buwan) para `monthlyTrend` sa BlotterReport.tsx
 * ma-map nang tama sa `toMonthKey` (pareho ng backend-style buckets).
 */
export function mockCasesTrendForRange(
  startInput: string,
  endInput: string,
): ChartDataDTO[] {
  const start = new Date(`${startInput}T00:00:00`);
  const end = new Date(`${endInput}T23:59:59`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return [];
  }
  const out: ChartDataDTO[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  let idx = 0;
  while (cursor <= endMonth) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const label = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const count = 1 + (idx % 4);
    out.push({ label, count });
    idx += 1;
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return out;
}

/** @deprecated Gamitin ang mockCasesTrendForRange(start, end) para sa reports. */
export function mockCasesTrend(): ChartDataDTO[] {
  const end = new Date();
  const start = new Date(end);
  start.setMonth(start.getMonth() - 6);
  const pad = (n: number) => String(n).padStart(2, "0");
  return mockCasesTrendForRange(
    `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`,
  );
}

export function mockCasesByNature(): NatureStatDTO[] {
  const map = new Map<string, number>();
  for (const r of allBlotterRowsForReports()) {
    const n = r.natureOfComplaint || "—";
    map.set(n, (map.get(n) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([natureName, count]) => ({ natureName, count }))
    .sort((a, b) => b.count - a.count);
}

const STATUS_REPORT_LABEL: Record<string, string> = {
  RECORDED: "Recorded",
  PENDING: "Pending",
  UNDER_MEDIATION: "Under Mediation",
  UNDER_CONCILIATION: "Under Conciliation",
  REFERRED_TO_LUPON: "Referred to Lupon",
  SETTLED: "Settled",
  DISMISSED: "Dismissed",
  CLOSED: "Closed",
  WITHDRAWN: "Withdrawn",
  CERTIFIED_TO_FILE_ACTION: "Certified to File Action",
  ELEVATED_TO_FORMAL: "Elevated to Formal",
};

export function mockCasesByStatus(): StatusStatDTO[] {
  const map = new Map<string, number>();
  for (const r of allBlotterRowsForReports()) {
    const k = String(r.status || "UNKNOWN").toUpperCase();
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([status, count]) => ({
      statusName: STATUS_REPORT_LABEL[status] ?? status.replace(/_/g, " "),
      count,
    }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function mockSettlementEfficiency(): SettlementEfficiencyDTO {
  const rows = MOCK_KAPITANA_DOCKET_ROWS;
  const recorded = rows.filter((r) => r.status.toUpperCase() === "RECORDED").length;
  /** Mediation / docket track lang */
  const totalNonFtr = Math.max(0, rows.length - recorded);
  const settled = rows.filter((r) => r.status.toUpperCase() === "SETTLED").length;
  const pct =
    totalNonFtr > 0 ? Math.min(100, Math.round((settled / totalNonFtr) * 100)) : 0;
  return {
    totalFormalComplaints: totalNonFtr,
    settledCases: settled,
    efficiencyPercentage: pct,
  };
}

export function mockCaseTimeline(_blotterNumber: string): CaseTimelineDTO[] {
  const t0 = new Date();
  return [
    {
      id: 1,
      eventType: "CASE_FILED",
      title: "Case filed",
      description: "Complaint received at barangay hall.",
      performedBy: "Brgy. Secretary",
      eventDate: iso(new Date(t0.getTime() - 86400000 * 10)),
    },
    {
      id: 2,
      eventType: "HEARING",
      title: "First mediation hearing",
      description: "Initial hearing conducted; both parties present.",
      performedBy: "Lupon Chairman",
      eventDate: iso(new Date(t0.getTime() - 86400000 * 6)),
    },
    {
      id: 3,
      eventType: "NOTE",
      title: "Follow-up logged",
      description: "Parties agreed to cooling-off period.",
      performedBy: "Duty Officer",
      eventDate: iso(new Date(t0.getTime() - 86400000 * 2)),
    },
  ];
}

export function mockCaseNotes(): CaseNoteViewDTO[] {
  const t = new Date();
  return [
    {
      id: 101,
      note: "Mock: Hinihintay ang sagot ng respondent sa summons.",
      createdBy: "Kapitana (demo)",
      createdAt: iso(new Date(t.getTime() - 86400000 * 2)),
    },
    {
      id: 102,
      note: "Mock: Follow-up tawag — papunta na ang complainant sa hearing.",
      createdBy: "Brgy. Secretary",
      createdAt: iso(new Date(t.getTime() - 86400000)),
    },
  ];
}

export function mockHearingsView(): HearingViewDTO[] {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return [
    {
      hearingId: 9001,
      hearingNumber: 1,
      status: "SCHEDULED",
      date: iso(d).slice(0, 10),
      startTime: "09:00",
      endTime: "11:00",
      venue: "Barangay Hall — Conference Room A",
    },
    {
      hearingId: 9002,
      hearingNumber: 2,
      status: "COMPLETED",
      date: iso(new Date(d.getTime() - 86400000 * 5)).slice(0, 10),
      startTime: "14:00",
      endTime: "15:30",
      venue: "Barangay Hall",
    },
  ];
}

export function mockMediationProcess(): MediationProcessDTO {
  return {
    stepCaseReceived: true,
    caseReceivedDate: iso(new Date(Date.now() - 86400000 * 12)),
    stepSummonIssued: true,
    summonStatus: "SERVED",
    stepMediationOngoing: true,
    hearingsConducted: 2,
    stepResolved: false,
    resolutionStatus: undefined,
  };
}

export function mockHearingFullDetails(hearingId: number): HearingFullDetailsDTO {
  const t = new Date();
  return {
    hearingId,
    summonNumber: 1,
    status: "COMPLETED",
    scheduledStart: iso(t),
    venue: "Barangay Hall",
    initialNotes: "Mock hearing — parties heard on main issue.",
    minutes: {
      complainantPresent: true,
      respondentPresent: true,
      hearingNotes: "Mock minutes: discussion on boundary; next steps agreed.",
      outcome: "CONTINUED",
      recordedBy: "Punong Barangay",
    },
    followUps: [
      {
        id: 1,
        remarks: "Mock follow-up: text confirmation sent to both parties.",
        recordedBy: "Secretary",
        createdAt: iso(new Date(t.getTime() - 3600000)),
      },
    ],
  };
}

export function mockCalendarMarkers(year: number, month: number): CalendarMarkerDTO[] {
  return [
    { date: `${year}-${String(month).padStart(2, "0")}-05`, totalHearings: 1 },
    { date: `${year}-${String(month).padStart(2, "0")}-12`, totalHearings: 2 },
  ];
}

export function mockBusySlots(_date: string): BusySlotDTO[] {
  return [
    {
      startTime: "09:00",
      endTime: "10:00",
      caseNumber: MOCK_KAPITANA_DOCKET_ROWS[0].blotterNumber,
      natureOfComplaint: mockKapitanaNatureOptions[0].natureName,
    },
  ];
}

function baseDocketDto(blotterNumber: string): BlotterDocketViewDTO {
  return {
    caseId: 8001,
    id: 8001,
    mediationDeadline: iso(new Date(Date.now() + 86400000 * 10)),
    daysRemaining: 10,
    caseNumber: blotterNumber,
    caseStatus: "UNDER_MEDIATION",
    caseStatusRemarks: undefined,
    dateFiled: iso(new Date(Date.now() - 86400000 * 8)),
    firstName: "Maria",
    lastName: "Santos",
    middleName: "R.",
    contactNumber: "09171234567",
    age: 42,
    gender: "Female",
    civilStatus: "Married",
    email: "maria.santos@example.com",
    completeAddress: "Purok 3, Barangay Ugong, Sample City",

    respondentFirstName: "Rosa",
    respondentLastName: "Lim",
    respondentMiddleName: "T.",
    respondentAlias: undefined,
    respondentContact: "09189876543",
    respondentAge: 39,
    respondentGender: "Female",
    respondentDateOfBirth: "1986-03-15",
    respondentCivilStatus: "Single",
    respondentOccupation: "Vendor",
    relationshipToComplainant: "Kapitbahay",
    respondentAddress: "Purok 3, Barangay Ugong",
    livingWithComplainant: false,

    natureOfComplaint: mockKapitanaNatureOptions[0].natureName,
    incidentDate: iso(new Date(Date.now() - 86400000 * 9)).slice(0, 10),
    incidentTime: "20:30",
    incidentLocation: "Harapan ng bahay, Purok 3",
    frequencyOfIncident: "Once a week",
    descriptionOfInjuries: undefined,
    narrative:
      "Mock narrative: There has been an ongoing noise disturbance nightly. The complainant is requesting mediation.",

    evidenceTypeIds: ["1", "3"],
    witnesses: [
      {
        fullName: "Pedro Reyes",
        contactNumber: "09151112233",
        address: "Purok 3",
        testimony: "Heard the noise disturbance that evening.",
      },
    ],
    agreementsTerm: undefined,
    agreementDate: undefined,
    luponManagement: [
      { firstName: "Antonio", lastName: "Mercado", position: "Chairman" },
    ],
    assignOfficer: "Brgy. Captain",
  };
}

export function mockFullBlotterDocket(blotterNumber: string): BlotterDocketViewDTO {
  const row =
    MOCK_KAPITANA_DOCKET_ROWS.find((r) => r.blotterNumber === blotterNumber) ??
    MOCK_KAPITANA_FTR_ROWS.find((r) => r.blotterNumber === blotterNumber);
  const base = baseDocketDto(blotterNumber);
  if (!row) return base;
  return {
    ...base,
    caseStatus: row.status,
    natureOfComplaint: row.natureOfComplaint,
    firstName: row.complainantName.split(" ")[0] || base.firstName,
    lastName: row.complainantName.split(" ").slice(1).join(" ") || base.lastName,
    respondentFirstName: row.respondentName.split(" ")[0] || base.respondentFirstName,
    respondentLastName: row.respondentName.split(" ").slice(1).join(" ") || base.respondentLastName,
  };
}

export function mockBlotterRecordView(blotterNumber: string): BlotterRecordViewDTO {
  const d = mockFullBlotterDocket(blotterNumber);
  const isFtr = blotterNumber.toUpperCase().startsWith("FTR-");
  return {
    id: d.caseId ?? 1,
    blotterNumber: d.caseNumber,
    dateFiled: d.dateFiled,
    status: isFtr ? "RECORDED" : d.caseStatus,
    encodedBy: "Brgy. Encoder (mock)",

    complainantFullName: `${d.firstName} ${d.middleName ?? ""} ${d.lastName}`.replace(/\s+/g, " ").trim(),
    complainantContact: d.contactNumber,
    complainantAddress: d.completeAddress,
    civilStatus: d.civilStatus,
    complainantAge: d.age,
    complainantGender: d.gender,
    complainantEmail: d.email || "",

    respondentFullName: `${d.respondentFirstName} ${d.respondentLastName}`,
    respondentContact: d.respondentContact || "",
    relationshipToComplainant: d.relationshipToComplainant || "",
    respondentAddress: d.respondentAddress || "",

    natureOfComplaint: d.natureOfComplaint,
    dateOfIncident: d.incidentDate,
    timeOfIncident: d.incidentTime || "",
    placeOfIncident: d.incidentLocation,
    narrativeStatement: d.narrative,

    evidenceNames: ["Photographs", "Text messages (screenshot)"],
  };
}

const ALL_BLOTTER_PERMS = [
  ...Object.values(BLOTTER_PERMISSIONS),
  "View Blotter Records",
  "Manage Hearings & Mediation",
  "Update Case Status",
];

export const mockKapitanaBlotterAccess: UserSecurityProfile = {
  userId: "00000000-0000-0000-0000-000000000001",
  username: "kapitana-demo",
  role: "KAPITANA",
  department: "Barangay Hall",
  permissions: ALL_BLOTTER_PERMS,
};
