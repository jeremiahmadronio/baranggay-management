import type {
  CaseSummaryDTO,
  CaseStatsDTO,
  CaseViewDTO,
  BpoDetails,
  CaseNoteViewDTO,
  CaseTimeLineDTO,
  InterventionViewDTO,
  FollowUpViewDTO,
  ViolenceOptionDTO,
} from "../../../service/vawc-api/vawc-api";
import type {
  ReportStatsDTO,
  NatureStatsDTO,
  TrendStatsDTO,
  CategorySummaryDTO,
} from "../../../service/vawc-api/report-api";

// ─── Mock Stats ────────────────────────────────────────────────────────────
export const MOCK_VAWC_STATS: CaseStatsDTO = {
  totalCases: 24,
  totalPending: 6,
  totalClose: 10,
  totalExpiringSoon: 4,
};

export const MOCK_RESOLVED_CASES = 10;

// ─── Mock Violence Options ─────────────────────────────────────────────────
export const MOCK_VIOLENCE_OPTIONS: ViolenceOptionDTO[] = [
  { id: 1, type: "Physical Violence" },
  { id: 2, type: "Sexual Violence" },
  { id: 3, type: "Psychological Violence" },
  { id: 4, type: "Economic Abuse" },
];

// ─── Mock Cases Summary ────────────────────────────────────────────────────
export const MOCK_CASES: CaseSummaryDTO[] = [
  {
    id: 1,
    caseNumber: "VAWC-2026-0001",
    victimFullName: "Maria Santos Cruz",
    violenceTypes: "Physical Violence, Psychological Violence",
    status: "UNDER_INTERVENTION",
    dateFiled: "2026-03-15",
    assignedOfficer: "Officer Reyes",
  },
  {
    id: 2,
    caseNumber: "VAWC-2026-0002",
    victimFullName: "Ana Lopez Dela Cruz",
    violenceTypes: "Economic Abuse",
    status: "PENDING",
    dateFiled: "2026-03-20",
    assignedOfficer: "Officer Garcia",
  },
  {
    id: 3,
    caseNumber: "VAWC-2026-0003",
    victimFullName: "Rosa Bautista Mendoza",
    violenceTypes: "Physical Violence",
    status: "RESOLVED",
    dateFiled: "2026-02-10",
    assignedOfficer: "Officer Reyes",
  },
  {
    id: 4,
    caseNumber: "VAWC-2026-0004",
    victimFullName: "Carmen Villanueva Tan",
    violenceTypes: "Sexual Violence, Physical Violence",
    status: "UNDER_INTERVENTION",
    dateFiled: "2026-04-01",
    assignedOfficer: "Officer Santos",
  },
  {
    id: 5,
    caseNumber: "VAWC-2026-0005",
    victimFullName: "Elena Ramos Pascual",
    violenceTypes: "Psychological Violence",
    status: "PENDING",
    dateFiled: "2026-01-28",
    assignedOfficer: "Officer Garcia",
  },
  {
    id: 6,
    caseNumber: "VAWC-2026-0006",
    victimFullName: "Josefa Aquino Rivera",
    violenceTypes: "Physical Violence, Economic Abuse",
    status: "CERTIFIED_TO_FILE_ACTION",
    dateFiled: "2026-02-14",
    assignedOfficer: "Officer Reyes",
  },
  {
    id: 7,
    caseNumber: "VAWC-2026-0007",
    victimFullName: "Lourdes Navarro Ignacio",
    violenceTypes: "Psychological Violence",
    status: "RESOLVED",
    dateFiled: "2026-03-05",
    assignedOfficer: "Officer Santos",
  },
  {
    id: 8,
    caseNumber: "VAWC-2026-0008",
    victimFullName: "Patricia Gonzales Morales",
    violenceTypes: "Physical Violence",
    status: "WITHDRAWN",
    dateFiled: "2026-01-10",
    assignedOfficer: "Officer Garcia",
  },
];

// ─── Mock Case Detail View ─────────────────────────────────────────────────
export const MOCK_CASE_DETAILS: Record<number, CaseViewDTO> = {
  1: {
    caseNumber: "VAWC-2026-0001",
    caseStatus: "UNDER_INTERVENTION",
    dateFiled: "2026-03-15",
    assignOfficer: "Officer Reyes",
    caseFiledBy: "Maria Santos Cruz",
    firstName: "Maria",
    lastName: "Cruz",
    middleName: "Santos",
    contactNumber: "09171234567",
    age: 32,
    gender: "Female",
    civilStatus: "Married",
    email: "maria.cruz@email.com",
    completeAddress: "123 Sampaguita St., Brgy. Maligaya",
    respondentFirstName: "Juan",
    respondentLastName: "Cruz",
    respondentMiddleName: "Dela",
    respondentAlias: "Totoy",
    respondentContact: "09181234567",
    respondentAge: 35,
    respondentGender: "Male",
    respondentCivilStatus: "Married",
    respondentOccupation: "Driver",
    relationshipToComplainant: "Husband",
    respondentAddress: "123 Sampaguita St., Brgy. Maligaya",
    livingWithComplainant: true,
    natureOfComplaint: "Domestic Violence",
    incidentDate: "2026-03-14",
    incidentTime: "22:30",
    incidentLocation: "Residence, 123 Sampaguita St.",
    frequencyOfIncident: "Repeated",
    descriptionOfInjuries: "Bruises on arms and face",
    narrative: "The complainant reported that on March 14, 2026, at approximately 10:30 PM, the respondent physically assaulted her after arriving home intoxicated. The respondent grabbed the complainant by the arms and slapped her on the face multiple times. This is the third time the incident has occurred in the past two months.",
    evidenceNames: ["Medical Certificate", "Photographs"],
    witnesses: [
      { firstName: "Pedro", lastName: "Santos", contactNumber: "09191234567", address: "125 Sampaguita St." },
    ],
    violenceTypes: [
      { id: 1, type: "Physical Violence" },
      { id: 3, type: "Psychological Violence" },
    ],
    bpoDeadline: "2026-04-14",
    remainingTime: "5 days",
  },
  2: {
    caseNumber: "VAWC-2026-0002",
    caseStatus: "PENDING",
    dateFiled: "2026-03-20",
    assignOfficer: "Officer Garcia",
    caseFiledBy: "Ana Lopez Dela Cruz",
    firstName: "Ana",
    lastName: "Dela Cruz",
    middleName: "Lopez",
    contactNumber: "09172345678",
    age: 28,
    gender: "Female",
    civilStatus: "Single",
    email: "ana.delacruz@email.com",
    completeAddress: "456 Rosas St., Brgy. Maligaya",
    respondentFirstName: "Roberto",
    respondentLastName: "Fernandez",
    respondentAge: 30,
    respondentGender: "Male",
    respondentCivilStatus: "Single",
    relationshipToComplainant: "Live-in Partner",
    respondentAddress: "456 Rosas St., Brgy. Maligaya",
    livingWithComplainant: true,
    natureOfComplaint: "Economic Abuse",
    incidentDate: "2026-03-18",
    incidentLocation: "Shared residence, Rosas St.",
    narrative: "The complainant reported that the respondent has been withholding financial support and controlling access to household funds for the past three months, preventing the complainant from purchasing basic necessities.",
    evidenceNames: ["Bank Statements"],
    witnesses: [],
    violenceTypes: [{ id: 4, type: "Economic Abuse" }],
  },
};

// ─── Mock BPO Details ──────────────────────────────────────────────────────
export const MOCK_BPO_DETAILS: Record<number, BpoDetails> = {
  1: {
    id: 101,
    caseNumber: "VAWC-2026-0001",
    complainant: "Maria Santos Cruz",
    respondent: "Juan Dela Cruz",
    assignOfficer: "Officer Reyes",
    bpoNumber: "BPO-2026-0001",
    bpoIssuedAt: "2026-03-16T10:00:00",
    bpoExpiredAt: "2026-04-14T10:00:00",
  },
};

// ─── Mock Notes ────────────────────────────────────────────────────────────
export const MOCK_NOTES: Record<number, CaseNoteViewDTO[]> = {
  1: [
    {
      id: 1,
      note: "Initial assessment completed. Victim shows signs of physical trauma. Referred to medical examination.",
      createdBy: "Officer Reyes",
      createdAt: "2026-03-15T14:30:00",
    },
    {
      id: 2,
      note: "Medical certificate received. Documenting injuries for case file.",
      createdBy: "Officer Reyes",
      createdAt: "2026-03-16T09:15:00",
    },
    {
      id: 3,
      note: "BPO issued and served to respondent. Respondent acknowledged receipt.",
      createdBy: "Officer Santos",
      createdAt: "2026-03-16T11:00:00",
    },
  ],
  2: [
    {
      id: 4,
      note: "Case filed. Complainant provided initial statement regarding economic abuse.",
      createdBy: "Officer Garcia",
      createdAt: "2026-03-20T10:00:00",
    },
  ],
};

// ─── Mock Timeline ─────────────────────────────────────────────────────────
export const MOCK_TIMELINE: Record<number, CaseTimeLineDTO[]> = {
  1: [
    {
      id: 1,
      eventType: "CASE_FILED",
      title: "Case Filed",
      description: "VAWC complaint filed by Maria Santos Cruz.",
      performedBy: "Officer Reyes",
      eventDate: "2026-03-15T08:00:00",
    },
    {
      id: 2,
      eventType: "BPO_ISSUED",
      title: "BPO Issued",
      description: "Barangay Protection Order BPO-2026-0001 issued.",
      performedBy: "Officer Reyes",
      eventDate: "2026-03-16T10:00:00",
    },
    {
      id: 3,
      eventType: "INTERVENTION_LOG",
      title: "Assessment intervention logged",
      description: "Initial psychosocial assessment conducted with the victim.",
      performedBy: "Officer Santos",
      eventDate: "2026-03-18T14:00:00",
    },
    {
      id: 4,
      eventType: "NOTE_ADDED",
      title: "Case note added",
      description: "Medical certificate received and documented.",
      performedBy: "Officer Reyes",
      eventDate: "2026-03-16T09:15:00",
    },
  ],
  2: [
    {
      id: 5,
      eventType: "CASE_FILED",
      title: "Case Filed",
      description: "VAWC complaint filed for economic abuse.",
      performedBy: "Officer Garcia",
      eventDate: "2026-03-20T10:00:00",
    },
  ],
};

// ─── Mock Intervention Logs ────────────────────────────────────────────────
export const MOCK_INTERVENTION_LOGS: Record<number, (InterventionViewDTO & { followUps: FollowUpViewDTO[] })[]> = {
  101: [
    {
      id: 1001,
      activityType: "Assessment",
      details: "Conducted initial psychosocial assessment with the victim. Victim expressed fear of returning home. Recommended temporary shelter placement.",
      interventionDate: "2026-03-18T14:00:00",
      duration: 60,
      createdBy: "Officer Santos",
      performedBy: ["Officer Santos", "Social Worker Diaz"],
      followUps: [
        {
          id: 2001,
          notes: "Follow-up visit conducted. Victim has been placed in temporary shelter. Emotional state improving.",
          createdBy: "Officer Santos",
          createdAt: "2026-03-22T10:00:00",
        },
      ],
    },
    {
      id: 1002,
      activityType: "Counseling",
      details: "Trauma-informed counseling session with the victim. Discussed safety planning and legal options available.",
      interventionDate: "2026-03-25T10:00:00",
      duration: 90,
      createdBy: "Social Worker Diaz",
      performedBy: ["Social Worker Diaz"],
      followUps: [],
    },
  ],
};

// ─── Helper to get mock case by ID ─────────────────────────────────────────
export function getMockCaseDetail(id: number): CaseViewDTO | null {
  return MOCK_CASE_DETAILS[id] ?? MOCK_CASE_DETAILS[1] ?? null;
}

export function getMockBpoDetails(caseId: number): BpoDetails | null {
  return MOCK_BPO_DETAILS[caseId] ?? null;
}

export function getMockNotes(caseId: number): CaseNoteViewDTO[] {
  return MOCK_NOTES[caseId] ?? [];
}

export function getMockTimeline(caseId: number): CaseTimeLineDTO[] {
  return MOCK_TIMELINE[caseId] ?? [];
}

export function getMockInterventionLogs(bpoId: number): (InterventionViewDTO & { followUps: FollowUpViewDTO[] })[] {
  return MOCK_INTERVENTION_LOGS[bpoId] ?? [];
}

// ─── Kapitana VAWC Reports (trend + KPI) — araw-araw na `YYYY-MM-DD` para sa daily chart ───

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function buildVawcMockTrendDaily(
  startInput: string,
  endInput: string,
): TrendStatsDTO[] {
  const start = new Date(`${startInput}T00:00:00`);
  const end = new Date(`${endInput}T23:59:59`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
  const out: TrendStatsDTO[] = [];
  const cursor = new Date(start);
  let i = 0;
  while (cursor <= end) {
    const label = `${cursor.getFullYear()}-${pad2(cursor.getMonth() + 1)}-${pad2(cursor.getDate())}`;
    out.push({ label, count: 1 + (i % 3) });
    i += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

export function getKapitanaVawcMockReportPayload(
  startInput: string,
  endInput: string,
): {
  stats: ReportStatsDTO;
  trend: TrendStatsDTO[];
  nature: NatureStatsDTO[];
  category: CategorySummaryDTO[];
} {
  const trend = buildVawcMockTrendDaily(startInput, endInput);
  const trendSum = trend.reduce((s, p) => s + (p.count || 0), 0);
  const stats: ReportStatsDTO = {
    totalCases: Math.max(24, trendSum),
    totalExpired: 3,
    resolvedCases: 10,
    avgResolutionTime: 168,
  };
  const nature: NatureStatsDTO[] = [
    { nature: "Physical Violence", count: 10 },
    { nature: "Psychological Violence", count: 6 },
    { nature: "Economic Abuse", count: 5 },
    { nature: "Sexual Violence", count: 3 },
  ];
  const category: CategorySummaryDTO[] = [
    {
      category: "Physical Violence",
      totalCases: 10,
      active: 4,
      resolved: 4,
      pending: 2,
      percentage: 41.7,
    },
    {
      category: "Psychological Violence",
      totalCases: 6,
      active: 2,
      resolved: 3,
      pending: 1,
      percentage: 25.0,
    },
    {
      category: "Economic Abuse",
      totalCases: 5,
      active: 2,
      resolved: 2,
      pending: 1,
      percentage: 20.8,
    },
    {
      category: "Sexual Violence",
      totalCases: 3,
      active: 1,
      resolved: 1,
      pending: 1,
      percentage: 12.5,
    },
  ];
  return { stats, trend, nature, category };
}
