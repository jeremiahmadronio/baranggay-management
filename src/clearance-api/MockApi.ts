import {
  type TemplateData,
  type TemplateOption,
  type Signatory,
  type BodySection,
  type CertificateSettings,
} from "../clearance-module/clearance-template/template";

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_VALIDITY_MONTHS = 6;

const DEFAULT_VARIABLES = [
  "FULL_NAME",
  "AGE",
  "CIVIL_STATUS",
  "ADDRESS",
  "RESIDENCY_SINCE",
  "PURPOSE",
  "OR_NUMBER",
  "DATE_ISSUED",
  "AMOUNT_PAID",
] as const;

// ═══════════════════════════════════════════════════════════════════════════════
// SIGNATORIES
// ═══════════════════════════════════════════════════════════════════════════════

const SIGNATORIES = {
  punongBarangay: {
    name: "MARICEL PINEDA - EMPERADOR",
    position: "Punong Barangay",
  },
  secretary: {
    name: "MS. JOYCES KRISHA TAN",
    position: "Barangay Secretary",
  },
  recipient: {
    name: "JUAN P. DELA CRUZ",
    position: "Recipient of Assistance",
  },
} as const satisfies Record<string, Signatory>;

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE OPTIONS (for dropdown/selector)
// ═══════════════════════════════════════════════════════════════════════════════

const TEMPLATE_OPTIONS: TemplateOption[] = [
  { id: "barangay-clearance", name: "Barangay Clearance", isFree: false },
  { id: "indigency", name: "Certificate of Indigency", isFree: true },
  { id: "residency", name: "Certificate of Residency", isFree: false },
  { id: "job-seeker", name: "First Time Job Seeker", isFree: true },
  { id: "tricycle", name: "Tricycle Registration", isFree: false },
  {
    id: "tricycle-registration",
    name: "Tricycle Registration Unit",
    isFree: false,
  },
  {
    id: "certificate-improvement",
    name: "Certificate of Improvement",
    isFree: false,
  },
  { id: "technical-permits", name: "Technical Permit", isFree: false },
  { id: "working-clearance", name: "Working Clearance", isFree: true },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const createSettings = (
  fee: number,
  options?: Partial<Omit<CertificateSettings, "fee" | "hasFee">>,
): CertificateSettings => ({
  fee,
  validityMonths: options?.validityMonths ?? DEFAULT_VALIDITY_MONTHS,
  requiresPhoto: options?.requiresPhoto ?? false,
  requiresThumbmark: options?.requiresThumbmark ?? false,
  hasFee: fee > 0,
});

const createBodySection = (
  id: string,
  text: string,
  isEditable = true,
): BodySection => ({
  id,
  text,
  isEditable,
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

const TEMPLATES: Record<string, TemplateData> = {
  // ─────────────────────────────────────────────────────────────────────────────
  // BARANGAY CLEARANCE
  // ─────────────────────────────────────────────────────────────────────────────
  "barangay-clearance": {
    id: "barangay-clearance",
    title: "BARANGAY CLEARANCE",
    bodySections: [
      createBodySection(
        "body-1",
        "This is to CERTIFY that the person whose name and signature, right thumbmark and picture appeared herein is a bonafide resident of this barangay, requesting for a record and clearance from this office to wit:",
      ),
      createBodySection(
        "body-2",
        "This is to further certify that upon verification of the records filed in this office, subject individual have: **NO DEROGATORY RECORD**",
      ),
    ],
    footerText: "Not valid without dry seal.",
    signatories: [SIGNATORIES.punongBarangay],
    settings: createSettings(50, {
      requiresPhoto: true,
      requiresThumbmark: true,
    }),
    variables: [
      ...DEFAULT_VARIABLES,
      "DATE_OF_BIRTH",
      "PLACE_OF_BIRTH",
      "COM_TAX_NO",
      "ISSUED_AT",
      "OR_DATE",
      "VALID_UNTIL",
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CERTIFICATE OF INDIGENCY
  // ─────────────────────────────────────────────────────────────────────────────
  indigency: {
    id: "indigency",
    title: "CERTIFICATE OF INDIGENCY",
    bodySections: [
      createBodySection(
        "body-1",
        "This is to CERTIFY that {{FULL_NAME}}, {{AGE}} years old, of legal age, residing at {{ADDRESS}}, UGONG, VALENZUELA CITY since {{RESIDENCY_SINCE}}, is known to belong to the indigent families/sector of Barangay as of this date.",
      ),
      createBodySection(
        "body-2",
        "This CERTIFICATION is being issued upon the request of the said individual for {{PURPOSE}} purpose or for whatever legal purpose this may serve best.",
      ),
    ],
    footerText: "Valid for educational/medical assistance only.",
    signatories: [SIGNATORIES.punongBarangay, SIGNATORIES.recipient],
    settings: createSettings(0, { requiresPhoto: true }),
    variables: [...DEFAULT_VARIABLES],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CERTIFICATE OF RESIDENCY
  // ─────────────────────────────────────────────────────────────────────────────
  residency: {
    id: "residency",
    title: "CERTIFICATE OF RESIDENCY",
    bodySections: [
      createBodySection(
        "body-1",
        "This is to CERTIFY that {{FULL_NAME}}, {{AGE}} years old, {{CIVIL_STATUS}}, Filipino citizen, is a bonafide resident of this Barangay with address at {{ADDRESS}}, UGONG, VALENZUELA CITY since {{RESIDENCY_SINCE}}.",
      ),
      createBodySection(
        "body-2",
        "This CERTIFICATION is being issued upon the request of the above-named individual for {{PURPOSE}} purpose and for whatever legal purpose this may serve.",
      ),
    ],
    footerText: "Una ang KAPakanan ng Mamamayan...",
    signatories: [SIGNATORIES.punongBarangay, SIGNATORIES.secretary],
    settings: createSettings(30),
    variables: [...DEFAULT_VARIABLES],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // FIRST TIME JOB SEEKER
  // ─────────────────────────────────────────────────────────────────────────────
  "job-seeker": {
    id: "job-seeker",
    title: "CERTIFICATION",
    bodySections: [
      createBodySection(
        "body-1",
        "This is to certify that {{FULL_NAME}}, {{AGE}} years old is a bonafide resident at {{ADDRESS}} BARANGAY UGONG CITY OF VALENZUELA and is a qualified availee of RA 11261 or the First Time Jobseekers Act of 2019.",
      ),
      createBodySection(
        "body-2",
        "I further certify that the holder/bearer has been informed of his/her rights, including the duties and responsibilities accorded by RA 11261 through the Oath of Undertaking he/she signed and executed in the presence of our Barangay Official.",
      ),
      createBodySection(
        "body-3",
        "This certification was issued upon the request of the above mentioned name for whatever purposes it may serve.",
      ),
      createBodySection(
        "body-4",
        "Signed and issued this {{DAY}} Day of {{MONTH}} {{YEAR}} at 3S Center Barangay Ugong Valenzuela City.",
      ),
    ],
    footerText: "Exempt from fees and charges per RA 11261.",
    signatories: [
      { name: "Hon. MARICEL PINEDA-EMPERADOR", position: "Punong Barangay" },
      SIGNATORIES.secretary,
    ],
    settings: createSettings(0),
    variables: [...DEFAULT_VARIABLES, "DAY", "MONTH", "YEAR"],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // TRICYCLE REGISTRATION (Garage)
  // ─────────────────────────────────────────────────────────────────────────────
  tricycle: {
    id: "tricycle",
    title: "CERTIFICATION",
    bodySections: [
      createBodySection(
        "body-1",
        `To whom it may concern;

This is to CERTIFY that {{FULL_NAME}} is the owner of vehicle with the following descriptions:

MODEL OF VEHICLE : {{MAKE}}
VEHICLE NO : {{VEHICLE_NO}}
MOTOR NO. : {{MOTOR_NO}}
BATTERY NO. : {{BATTERY_NO}}
CHARGER NO. : {{CHARGER_NO}}
COLOR : {{BODY_COLOR}}
PLATE NO. : {{PLATE_NO}}`,
      ),
      createBodySection(
        "body-2",
        "This further CERTIFIES that the said vehicle owner uses a portion of lot of with address.",
      ),
      createBodySection(
        "body-3",
        "Issued upon the request of said individual on this {{DAY}} of {{MONTH}} {{YEAR}} for **TRICYCLE REGISTRATION UNIT - GARAGE** only.",
      ),
    ],
    footerText: "Una ang KAPakanan ng Mamamayan...",
    signatories: [SIGNATORIES.punongBarangay],
    settings: createSettings(100, { requiresPhoto: true }),
    variables: [
      ...DEFAULT_VARIABLES,
      "MAKE",
      "VEHICLE_NO",
      "PLATE_NO",
      "MOTOR_NO",
      "BATTERY_NO",
      "CHARGER_NO",
      "BODY_COLOR",
      "DAY",
      "MONTH",
      "YEAR",
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // TRICYCLE REGISTRATION UNIT
  // ─────────────────────────────────────────────────────────────────────────────
  "tricycle-registration": {
    id: "tricycle-registration",
    title: "TRICYCLE REGISTRATION",
    bodySections: [
      createBodySection(
        "body-1",
        `To whom it may concern;

This is to CERTIFY that {{FULL_NAME}} is the owner of vehicle with the following descriptions:

Make : {{MAKE}}
Plate NO : {{PLATE_NO}}
MOTOR NO. : {{MOTOR_NO}}
Chasis No: {{CHASSIS_NO}}
BODY NO. : {{BODY_NO}}
BODY COLOR : {{BODY_COLOR}}
CR NO. : {{CR_NO}}
OR NO. : {{OR_NO_VEHICLE}}
MTOP NO. : {{MTOP_NO}}`,
      ),
      createBodySection(
        "body-2",
        "This Certification is being issued upon the request of the above individual for the purpose of TRICYCLE REGULATION UNIT REGISTRATION only.",
      ),
    ],
    footerText: "Una ang KAPakanan ng Mamamayan...",
    signatories: [SIGNATORIES.punongBarangay],
    settings: createSettings(100),
    variables: [
      "FULL_NAME",
      "MAKE",
      "PLATE_NO",
      "MOTOR_NO",
      "CHASSIS_NO",
      "BODY_NO",
      "BODY_COLOR",
      "CR_NO",
      "OR_NO_VEHICLE",
      "MTOP_NO",
      "DAY",
      "MONTH",
      "YEAR",
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CERTIFICATE OF IMPROVEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  "certificate-improvement": {
    id: "certificate-improvement",
    title: "CERTIFICATE OF IMPROVEMENT",
    bodySections: [
      createBodySection(
        "body-1",
        "This is to certify that the IMPROVEMENT was built in the year {{YEAR}} on the lot owned by {{FULL_NAME}}. The building was constructed with a total floor area of {{FLOOR_AREA}} square meters and is covered by the said property.",
      ),
      createBodySection(
        "body-2",
        "The residential house and lot are located at Barangay Ugong, Valenzuela City. This certification is issued this {{DAY}} day of {{MONTH}} {{YEAR}} upon the request of the interested party for assessment purposes by the Assessor's Office of Valenzuela City.",
      ),
    ],
    footerText: "Una ang KAPakanan ng Mamamayan...",
    signatories: [SIGNATORIES.punongBarangay],
    settings: createSettings(100),
    variables: ["FULL_NAME", "YEAR", "FLOOR_AREA", "DAY", "MONTH"],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // TECHNICAL PERMIT
  // ─────────────────────────────────────────────────────────────────────────────
  "technical-permits": {
    id: "technical-permits",
    title: "TECHNICAL PERMIT",
    bodySections: [
      createBodySection(
        "body-1",
        "is hereby granted to {{FULL_NAME}}.\n\nTo apply for {{CERT_NATURE}} located at {{ADDRESS}} UGONG VALENZUELA CITY.\n\nHas been found to be fully complying with and not violative of the existing rules and regulations / building code being enforced and is located within the limits of this barangay. This is to further certify that upon verification of the records filed in this office, applicant owner was found to have NO DEROGATORY RECORD.",
      ),
      createBodySection(
        "body-2",
        "IMPORTANT REMINDERS:\n\nThis clearance is subject for {{PURPOSE}} for any violation of Building Codes, DENR Guidelines and existing laws.\nThis Barangay Clearance for {{CERT_NATURE}} application cannot be used as PERMIT for the subject/s to directly commence their project, unless filed with the City Engineer's Office and approved by the Mayor, City of Valenzuela.",
      ),
      createBodySection(
        "body-3",
        "This certification is issued this {{DAY}} day of {{MONTH}} {{YEAR}} upon the request of the individual for {{CERT_NATURE}} purpose only.",
      ),
    ],
    footerText: "Una ang KAPakanan ng Mamamayan...",
    signatories: [SIGNATORIES.punongBarangay],
    settings: createSettings(100),
    variables: [
      "FULL_NAME",
      "ADDRESS",
      "CERT_NATURE",
      "PURPOSE",
      "DAY",
      "MONTH",
      "YEAR",
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // WORKING CLEARANCE
  // ─────────────────────────────────────────────────────────────────────────────
  "working-clearance": {
    id: "working-clearance",
    title: "WORKING CLEARANCE",
    bodySections: [
      createBodySection(
        "body-1",
        "TO WHOM IT MAY CONCERN:\n\nTHIS IS TO CERTIFY that {{FULL_NAME}}, of legal age, Filipino, and a resident of {{ADDRESS}}, is hereby granted permission to conduct work or activity as requested.",
      ),
      createBodySection(
        "body-2",
        "ACTIVITY DETAILS:\nNature of Work: {{NATURE_OF_WORK}}\nLocation: {{ADDRESS}}\nActivity {{TIME}}\n\nFURTHER CERTIFICATION:\nThis office further certifies that the above-named individual has no derogatory records based on the available files of this Barangay as of this date, and is known to be of good moral character.",
      ),
      createBodySection(
        "body-3",
        "This certification is issued this {{DAY}} day of {{MONTH}} {{YEAR}} upon the request of {{FULL_NAME}} for whatever legal purpose it may serve.",
      ),
    ],
    footerText: "Una ang KAPakanan ng Mamamayan...",
    signatories: [SIGNATORIES.punongBarangay],
    settings: createSettings(0),
    variables: [
      "FULL_NAME",
      "ADDRESS",
      "NATURE_OF_WORK",
      "TIME",
      "DAY",
      "MONTH",
      "YEAR",
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT TEMPLATE (fallback)
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_TEMPLATE: TemplateData = {
  id: "default",
  title: "CERTIFICATE TEMPLATE",
  bodySections: [
    createBodySection(
      "body-1",
      "This is to CERTIFY that {{FULL_NAME}} is a resident of this Barangay.",
    ),
  ],
  footerText: "Official Document",
  signatories: [SIGNATORIES.punongBarangay],
  settings: createSettings(0),
  variables: [...DEFAULT_VARIABLES],
};

// ═══════════════════════════════════════════════════════════════════════════════
// SAMPLE DATA (for preview)
// ═══════════════════════════════════════════════════════════════════════════════

export const SAMPLE_DATA: Record<string, string> = {
  // Personal Info
  FULL_NAME: "JUAN P. DELA CRUZ",
  AGE: "35",
  CIVIL_STATUS: "Married",
  ADDRESS: "123 Rizal St., Purok 3",
  RESIDENCY_SINCE: "2015",
  DATE_OF_BIRTH: "March 15, 1991",
  PLACE_OF_BIRTH: "Valenzuela City",
  BIRTHDATE: "January 1, 1960",

  // Payment/OR Info
  PURPOSE: "EMPLOYMENT",
  OR_NUMBER: "2026-0147",
  DATE_ISSUED: "February 17, 2026",
  AMOUNT_PAID: "P50.00",
  COM_TAX_NO: "CTN-2026-001",
  ISSUED_AT: "Valenzuela City",
  OR_DATE: "February 17, 2026",
  VALID_UNTIL: "August 17, 2028",

  // Vehicle Info
  MAKE: "HONDA",
  VEHICLE_NO: "V-12345",
  PLATE_NO: "123-XYZ",
  MOTOR_NO: "M123456",
  BATTERY_NO: "BAT-789",
  CHARGER_NO: "CHG-456",
  CHASSIS_NO: "C987654",
  BODY_NO: "B-999",
  BODY_COLOR: "RED",
  CR_NO: "CR-12345",
  OR_NO_VEHICLE: "OR-67890",
  MTOP_NO: "MTOP-2026-001",

  // Property/Business Info
  LOT_OWNER: "MARIA CLARA",
  BUSINESS_NAME: "JUAN DELA CRUZ SARI-SARI STORE",
  BUSINESS_ADDRESS: "123 Rizal St., Purok 3",
  BUSINESS_NATURE: "SARI-SARI STORE",
  FLOOR_AREA: "120",

  // Technical/Work Info
  CERT_NATURE: "Electrical Clearance (MERALCO)",
  NATURE_OF_WORK: "Electrical Installation",
  TIME: "12:00 PM - 5:00 PM",

  // Date Components
  DAY: "7th",
  MONTH: "OCTOBER",
  YEAR: "2025",
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK API
// ═══════════════════════════════════════════════════════════════════════════════

export const mockApi = {
  /**
   * Get all available template options for selector/dropdown
   */
  getTemplateOptions: async (): Promise<TemplateOption[]> => {
    await delay(300);
    return TEMPLATE_OPTIONS;
  },

  /**
   * Fetch a specific template by ID
   */
  fetchTemplate: async (templateId: string): Promise<TemplateData> => {
    await delay(500);

    const template = TEMPLATES[templateId];
    if (template) {
      // Return deep copy to prevent mutations
      return JSON.parse(JSON.stringify(template));
    }

    // Return default template with provided ID
    return {
      ...DEFAULT_TEMPLATE,
      id: templateId,
      title: templateId.replace(/-/g, " ").toUpperCase(),
    };
  },

  /**
   * Save/update a template
   */
  saveTemplate: async (
    templateId: string,
    data: TemplateData,
  ): Promise<boolean> => {
    await delay(800);
    console.log(`[MockApi] Saved template "${templateId}":`, data);

    if (TEMPLATES[templateId]) {
      TEMPLATES[templateId] = data;
    }
    return true;
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
