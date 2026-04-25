import type {
  LuponCaseStatsDTO,
  LuponSummaryDTO,
  LuponSummaryParams,
  PageResponse,
} from "../../../service/lupon-api/LuponCaseManagement-api";
import type { LuponViewDTO } from "../../../service/lupon-api/Lupong-tagapamayapa-view-api";
import type {
  MediationProcessDTO,
  HearingViewDTO,
  CaseNoteViewDTO,
} from "../../../service/lupon-api/LuponCaseManagement-view-api-v2";
import type { CFAResponse } from "../../../service/lupon-api/CFA";
import type { RecordMinutesViewDTO } from "../../../service/lupon-api/Hearing";
import type {
  ChartDataDTO,
  NatureReportDTO,
  ReportStatsDTO,
  StatusStatDTO,
  LuponMonthlyReportDTO,
} from "../../../service/lupon-api/LuponReport";
import type { HearingMinutesViewingRequestDTO } from "../../../service/lupon-api/LuponCaseManagement-view-api-v2";
import { MOCK_KAPITANA_DOCKET_ROWS, mockCaseNotes, mockHearingsView, mockMediationProcess } from "./blotter-kapitana-mock";

function springPageLupon<T>(
  all: T[],
  page: number,
  size: number,
): PageResponse<T> {
  const totalElements = all.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size) || 1);
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * size;
  const content = all.slice(start, start + size);
  return {
    content,
    totalElements,
    totalPages,
    number: safePage,
    size,
    first: safePage === 0,
    last: safePage >= totalPages - 1,
    empty: content.length === 0,
  };
}

export function mockLuponDashboardStats(): LuponCaseStatsDTO {
  return {
    totalReferred: 14,
    activeConciliation: 5,
    successfullySettled: 6,
    cfaIssued: 2,
  };
}

function buildLuponSummaryRows(): LuponSummaryDTO[] {
  const filtered = MOCK_KAPITANA_DOCKET_ROWS.filter((r) =>
    ["REFERRED_TO_LUPON", "UNDER_CONCILIATION", "SETTLED", "CERTIFIED_TO_FILE_ACTION"].includes(
      r.status,
    ),
  );
  const source = filtered.length ? filtered : MOCK_KAPITANA_DOCKET_ROWS.slice(0, 6);
  return source.map((r) => ({
    id: r.id,
    blotterNumber: r.blotterNumber,
    complainantName: r.complainantName,
    respondentName: r.respondentName,
    natureOfComplaint: r.natureOfComplaint,
    dateFiled: r.dateFiled,
    status:
      r.status === "REFERRED_TO_LUPON" ? "UNDER_CONCILIATION" : r.status,
  }));
}

const MOCK_LUPON_SUMMARY = buildLuponSummaryRows();

export function mockLuponSummaryPage(
  params: LuponSummaryParams,
): PageResponse<LuponSummaryDTO> {
  const q = (params.search || "").trim().toLowerCase();
  let rows = [...MOCK_LUPON_SUMMARY];
  if (q) {
    rows = rows.filter((r) => {
      const blob = `${r.blotterNumber} ${r.complainantName} ${r.respondentName}`.toLowerCase();
      return blob.includes(q);
    });
  }
  if (params.startDate || params.endDate) {
    rows = rows.filter((r) => {
      const t = new Date(r.dateFiled).getTime();
      if (params.startDate) {
        const s = new Date(`${params.startDate}T00:00:00`).getTime();
        if (!Number.isNaN(s) && t < s) return false;
      }
      if (params.endDate) {
        const e = new Date(`${params.endDate}T23:59:59`).getTime();
        if (!Number.isNaN(e) && t > e) return false;
      }
      return true;
    });
  }
  const size = params.size ?? 10;
  const page = params.page ?? 0;
  return springPageLupon(rows, page, size);
}

function baseLuponView(blotterNumber: string): LuponViewDTO {
  const row = MOCK_KAPITANA_DOCKET_ROWS.find((r) => r.blotterNumber === blotterNumber);
  const nature = row?.natureOfComplaint ?? "Noise Disturbance";
  const status =
    row?.status === "CERTIFIED_TO_FILE_ACTION"
      ? "CERTIFIED_TO_FILE_ACTION"
      : "UNDER_CONCILIATION";

  return {
    id: row?.id ?? 7001,
    blotterNumber,
    caseType: "FORMAL_COMPLAINT",
    caseStatus: status,
    caseStatusRemarks: null,
    dateFiled: row?.dateFiled ?? new Date().toISOString(),
    referredToLuponAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    blotterReceivingOfficer: "Brgy. Secretary (mock)",
    mediationInfo: {
      luponDeadline: new Date(Date.now() + 86400000 * 12).toISOString(),
      daysRemaining: 12,
      extensionCount: 0,
      extensionDate: null,
      extensionReason: null,
      settlementTerms: null,
    },
    complainant: {
      firstName: row?.complainantName.split(" ")[0] ?? "Maria",
      lastName: row?.complainantName.split(" ").slice(1).join(" ") ?? "Santos",
      middleName: null,
      contactNumber: "09171234567",
      age: 45,
      gender: "Female",
      civilStatus: "Married",
      email: null,
      completeAddress: "Purok 3, Barangay Ugong (mock)",
    },
    respondent: {
      firstName: row?.respondentName.split(" ")[0] ?? "Rosa",
      lastName: row?.respondentName.split(" ").slice(1).join(" ") ?? "Lim",
      middleName: null,
      alias: null,
      contactNumber: "09189876543",
      age: 40,
      gender: "Female",
      dateOfBirth: null,
      civilStatus: "Single",
      occupation: "Vendor",
      relationshipToComplainant: "Kapitbahay",
      address: "Purok 3 (mock)",
      livingWithComplainant: false,
    },
    incidentDetail: {
      natureOfComplaint: nature,
      incidentDate: new Date(Date.now() - 86400000 * 7).toISOString().slice(0, 10),
      incidentTime: "20:00",
      incidentLocation: "Barangay Ugong — residential area",
      frequencyOfIncident: "Linggu-linggo",
      descriptionOfInjuries: null,
    },
    narrative:
      "Mock lupon narrative: Ang kaso ay naisumite sa Lupon Tagapamayapa para sa conciliation.",
    evidenceTypeIds: ["1"],
    witnesses: [
      {
        personId: 1,
        fullName: "Pedro Reyes",
        contactNumber: "09151112233",
        address: "Purok 3",
        testimony: "Nakita ang insidente (mock).",
      },
    ],
    memberHandlers: [
      { id: 1, firstName: "Antonio", lastName: "Mercado", position: "Pangkat Chairman" },
      { id: 2, firstName: "Liza", lastName: "Navarro", position: "Pangkat Member" },
    ],
  };
}

export function mockLuponCaseView(blotterNumber: string): LuponViewDTO {
  return baseLuponView(blotterNumber);
}

export function mockLuponMediationProcess(): MediationProcessDTO {
  return {
    ...mockMediationProcess(),
    stepMediationOngoing: true,
    hearingsConducted: 2,
    stepResolved: false,
  };
}

export function mockLuponHearingView(): HearingViewDTO[] {
  return mockHearingsView();
}

export function mockLuponCaseNotes(): CaseNoteViewDTO[] {
  return mockCaseNotes();
}

export function mockLuponReportStats(): ReportStatsDTO {
  return {
    escalate: 4,
    totalSettled: 9,
    totalClosed: 3,
    totalCFA: 2,
  };
}

export function mockLuponStatusStats(): StatusStatDTO[] {
  return [
    { status: "UNDER_CONCILIATION", count: 5 },
    { status: "SETTLED", count: 6 },
    { status: "CERTIFIED_TO_FILE_ACTION", count: 2 },
    { status: "WITHDRAWN", count: 1 },
  ];
}

export function mockLuponTopNature(): NatureReportDTO[] {
  return [
    { natureName: "Noise Disturbance", count: 4 },
    { natureName: "Street Altercation", count: 3 },
    { natureName: "Debt / Non-payment", count: 2 },
  ];
}

export function mockLuponCasesTrend(): ChartDataDTO[] {
  const out: ChartDataDTO[] = [];
  const now = new Date();
  for (let i = 10; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push({
      label: d.toLocaleString("en-US", { month: "short", day: "numeric" }),
      count: (i % 3) + 1,
    });
  }
  return out;
}

export function mockLuponMonthlyDilg(
  month: number,
  year: number,
): LuponMonthlyReportDTO[] {
  return [
    {
      dateFiled: `${year}-${String(month).padStart(2, "0")}-05`,
      caseNo: "BRT-2026-0100",
      parties: "Santos vs Lim",
      complaint: "Noise Disturbance",
      isCriminal: 0,
      isCivil: 1,
      isOthers: 0,
      mediation: 1,
      conciliation: 0,
      arbitration: 0,
      ongoing: 1,
      dismissed: 0,
      issueCFA: 0,
      withdrawn: 0,
    },
    {
      dateFiled: `${year}-${String(month).padStart(2, "0")}-18`,
      caseNo: "BRT-2026-0101",
      parties: "Reyes vs Tan",
      complaint: "Utang",
      isCriminal: 0,
      isCivil: 1,
      isOthers: 0,
      mediation: 0,
      conciliation: 1,
      arbitration: 0,
      ongoing: 0,
      dismissed: 0,
      issueCFA: 1,
      withdrawn: 0,
    },
  ];
}

export function mockCfaDetails(blotterNumber: string): CFAResponse {
  const v = mockLuponCaseView(blotterNumber);
  const c = v.complainant;
  const r = v.respondent;
  return {
    blotterNumber,
    matterFiled: v.incidentDetail.natureOfComplaint,
    complinantName: `${c.firstName} ${c.lastName}`,
    complinantAddress: c.completeAddress,
    respondentName: `${r.firstName} ${r.lastName}`,
    respondentAddress: r.address || "—",
    grounds: "Mock: Hindi naisakatuparan ang amicable settlement.",
    controlNumber: `CFA-MOCK-${blotterNumber.replace(/\W/g, "")}`,
    issuedAt: new Date().toISOString(),
    issueByName: "Lupon Secretary (mock)",
    luponChairman: "Antonio Mercado",
    chairmanPosition: "Pangkat Chairman",
    luponSecretary: "Liza Navarro",
    secretaryPosition: "Secretary",
    luponMember: "Pedro Ramos",
    memberPosition: "Member",
  };
}

export function mockRecordMinutesDetails(
  hearingId: number,
): RecordMinutesViewDTO {
  return {
    hearingId,
    hearingNumber: 1,
    status: "COMPLETED",
    date: new Date().toISOString(),
    venue: "Barangay Hall — Lupon room",
    endTime: "11:00",
    complinantPresent: true,
    respondentPresent: true,
    chairmanPresent: true,
    secretaryPresent: true,
    memberPresent: true,
    isInLupon: true,
    narrative: "Mock: pinag-usapan ang terms ng settlement.",
    outcome: "NOT_SETTLED",
    recordedBy: "Lupon Secretary (mock)",
    followUpNotes: [
      {
        id: 1,
        remarks: "Mock follow-up note.",
        recordedBy: "Chairman",
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

export function mockMediationHearingView(
  hearingId: number,
): HearingMinutesViewingRequestDTO {
  return {
    hearingId,
    hearingNumber: 1,
    status: "SCHEDULED",
    date: new Date().toISOString().slice(0, 10),
    startTime: "09:00",
    endTime: "11:00",
    venue: "Barangay Hall — Lupon room",
    caseNumber: MOCK_LUPON_SUMMARY[0]?.blotterNumber ?? "BRT-2026-0100",
    caseTitle: "Conciliation — mock",
    assignedPangkat: [
      { memberId: 1, fullName: "Antonio Mercado", position: "Chairman" },
      { memberId: 2, fullName: "Liza Navarro", position: "Member" },
    ],
  };
}
