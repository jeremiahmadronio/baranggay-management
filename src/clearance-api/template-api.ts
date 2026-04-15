import type {
  TemplateData,
  TemplateOption,
  BodySection,
  Signatory,
} from "./types";
import {
  clearanceTemplateApi,
  type TemplateResponseDTO,
  type SignatoryDTO,
} from "../service/clearance-api/Template";

// Re-export types for convenience
export type { TemplateData, TemplateOption, BodySection, Signatory };

// ═══════════════════════════════════════════════════════════════════════════════
// DTO → INTERNAL TYPE MAPPERS
// ═══════════════════════════════════════════════════════════════════════════════

/** API body section shape: { text, order } */
interface ApiBodySection {
  text: string;
  order: number;
}

const mapDtoToTemplateOption = (dto: TemplateResponseDTO): TemplateOption => ({
  id: dto.id,
  name: dto.certTitle,
  isFree: !dto.hasFee || dto.certFee === 0,
});

const mapDtoToTemplateData = (dto: TemplateResponseDTO): TemplateData => ({
  id: dto.id,
  title: dto.certTitle,
  layoutStyle: dto.layoutStyle || "clearance",
  bodySections: Array.isArray(dto.bodySections)
    ? (dto.bodySections as ApiBodySection[])
        .sort((a, b) => a.order - b.order)
        .map((s, i) => ({
          id: `body-${i + 1}`,
          text: s.text,
          isEditable: true,
        }))
    : [],
  footerText: dto.certTagline || "",
  signatories: Array.isArray(dto.signatories)
    ? dto.signatories.map((s: SignatoryDTO) => ({
        name: s.signatoryName,
        position: s.signatoryTitle,
      }))
    : [],
  settings: {
    fee: dto.certFee ?? 0,
    validityMonths: dto.validityMonths ?? 6,
    requiresPhoto: dto.requiresPhoto ?? false,
    requiresThumbmark: dto.requiresThumbmark ?? false,
    hasFee: dto.hasFee ?? false,
    hasCtn: dto.hascTn ?? false,
    ctnFee: 0,
  },
  variables: Array.isArray(dto.issueFields)
    ? (dto.issueFields as string[])
    : [],
});

// Module-level cache to avoid repeated API calls in the same session
let _apiCache: TemplateResponseDTO[] | null = null;
let _apiCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchApiTemplates(): Promise<TemplateResponseDTO[]> {
  if (_apiCache && Date.now() - _apiCacheTime < CACHE_TTL) return _apiCache;
  const dtos = await clearanceTemplateApi.getAllTemplates();
  _apiCache = dtos;
  _apiCacheTime = Date.now();
  return dtos;
}

/** Call after creating/archiving/restoring to invalidate the cache */
export const invalidateTemplateCache = () => {
  _apiCache = null;
  _apiCacheTime = 0;
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE_URL = "/api/clearance";
const STORAGE_KEY = "barangay_templates";

const DEFAULT_SIGNATORIES = {
  PUNONG_BARANGAY: {
    name: "MARICEL PINEDA - EMPERADOR",
    position: "Punong Barangay",
  },
  BARANGAY_SECRETARY: {
    name: "MS. JOYCES KRISHA TAN",
    position: "Barangay Secretary",
  },
  RECIPIENT: {
    name: "",
    position: "Recipient of Assistance",
  },
} as const;

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
];

const MOCK_TEMPLATE_OPTIONS: TemplateOption[] = [
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
// MOCK DATA - Templates (for editing)
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_TEMPLATES: Record<string, TemplateData> = {
  "barangay-clearance": {
    id: "barangay-clearance",
    title: "BARANGAY CLEARANCE",
    bodySections: [
      {
        id: "body-1",
        isEditable: true,
        text: "This is to CERTIFY that the person whose name and signature, right thumbmark and picture appeared herein is a bonafide resident of this barangay, requesting for a record and clearance from this office to wit:",
      },
      {
        id: "body-2",
        isEditable: true,
        text: "This is to further certify that upon verification of the records filed in this office, subject individual have: **NO DEROGATORY RECORD**",
      },
    ],
    footerText: "Not valid without dry seal.",
    signatories: [DEFAULT_SIGNATORIES.PUNONG_BARANGAY],
    settings: {
      fee: 50,
      validityMonths: 6,
      requiresPhoto: true,
      requiresThumbmark: true,
      hasFee: true,
      hasCtn: true,
      ctnFee: 0,
    },
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

  indigency: {
    id: "indigency",
    title: "CERTIFICATE OF INDIGENCY",
    bodySections: [
      {
        id: "body-1",
        isEditable: true,
        text: "This is to CERTIFY that {{FULL_NAME}}, {{AGE}} years old, of legal age, residing at {{ADDRESS}}, UGONG, VALENZUELA CITY since {{RESIDENCY_SINCE}}, is known to belong to the indigent families/sector of Barangay as of this date.",
      },
      {
        id: "body-2",
        isEditable: true,
        text: "This CERTIFICATION is being issued upon the request of the said individual for {{PURPOSE}} purpose or for whatever legal purpose this may serve best.",
      },
    ],
    footerText: "Valid for educational/medical assistance only.",
    signatories: [
      DEFAULT_SIGNATORIES.PUNONG_BARANGAY,
      DEFAULT_SIGNATORIES.RECIPIENT,
    ],
    settings: {
      fee: 0,
      validityMonths: 6,
      requiresPhoto: true,
      requiresThumbmark: false,
      hasFee: false,
      hasCtn: false,
      ctnFee: 0,
    },
    variables: DEFAULT_VARIABLES,
  },

  residency: {
    id: "residency",
    title: "CERTIFICATE OF RESIDENCY",
    bodySections: [
      {
        id: "body-1",
        isEditable: true,
        text: "This is to CERTIFY that {{FULL_NAME}}, {{AGE}} years old, {{CIVIL_STATUS}}, Filipino citizen, is a bonafide resident of this Barangay with address at {{ADDRESS}}, UGONG, VALENZUELA CITY since {{RESIDENCY_SINCE}}.",
      },
      {
        id: "body-2",
        isEditable: true,
        text: "This CERTIFICATION is being issued upon the request of the above-named individual for {{PURPOSE}} purpose and for whatever legal purpose this may serve.",
      },
    ],
    footerText: "Una ang KAPakanan ng Mamamayan...",
    signatories: [
      DEFAULT_SIGNATORIES.PUNONG_BARANGAY,
      DEFAULT_SIGNATORIES.BARANGAY_SECRETARY,
    ],
    settings: {
      fee: 30,
      validityMonths: 6,
      requiresPhoto: false,
      requiresThumbmark: false,
      hasFee: true,
      hasCtn: false,
      ctnFee: 0,
    },
    variables: DEFAULT_VARIABLES,
  },

  "job-seeker": {
    id: "job-seeker",
    title: "CERTIFICATION",
    bodySections: [
      {
        id: "body-1",
        isEditable: true,
        text: "This is to certify that {{FULL_NAME}}, {{AGE}} years old is a bonafide resident at {{ADDRESS}} BARANGAY UGONG CITY OF VALENZUELA and is a qualified availee of RA 11261 or the First Time Jobseekers Act of 2019.",
      },
      {
        id: "body-2",
        isEditable: true,
        text: "I further certify that the holder/bearer has been informed of his/her rights, including the duties and responsibilities accorded by RA 11261 through the Oath of Undertaking he/she signed and executed in the presence of our Barangay Official.",
      },
      {
        id: "body-3",
        isEditable: true,
        text: "This certification was issued upon the request of the above mentioned name for whatever purposes it may serve.",
      },
      {
        id: "body-4",
        isEditable: true,
        text: "Signed and issued this {{DAY}} Day of {{MONTH}} {{YEAR}} at 3S Center Barangay Ugong Valenzuela City.",
      },
    ],
    footerText: "Exempt from fees and charges per RA 11261.",
    signatories: [
      { name: "Hon. MARICEL PINEDA-EMPERADOR", position: "Punong Barangay" },
      DEFAULT_SIGNATORIES.BARANGAY_SECRETARY,
    ],
    settings: {
      fee: 0,
      validityMonths: 6,
      requiresPhoto: false,
      requiresThumbmark: false,
      hasFee: false,
      hasCtn: false,
      ctnFee: 0,
    },
    variables: [...DEFAULT_VARIABLES, "DAY", "MONTH", "YEAR"],
  },

  tricycle: {
    id: "tricycle",
    title: "CERTIFICATION",
    bodySections: [
      {
        id: "body-1",
        isEditable: true,
        text: "To whom it may concern;\n\nThis is to CERTIFY that {{FULL_NAME}} is the owner of vehicle with the following descriptions:\n\nMODEL OF VEHICLE : {{MAKE}}\nVEHICLE NO : {{VEHICLE_NO}}\nMOTOR NO. : {{MOTOR_NO}}\nBATTERY NO. : {{BATTERY_NO}}\nCHARGER NO. : {{CHARGER_NO}}\nCOLOR : {{BODY_COLOR}}\nPLATE NO. : {{PLATE_NO}}",
      },
      {
        id: "body-2",
        isEditable: true,
        text: "This further CERTIFIES that the said vehicle owner uses a portion of lot of with address.",
      },
      {
        id: "body-3",
        isEditable: true,
        text: "Issued upon the request of said individual on this {{DAY}} of {{MONTH}} {{YEAR}} for **TRICYCLE REGISTRATION UNIT - GARAGE** only.",
      },
    ],
    footerText: "Una ang KAPakanan ng Mamamayan...",
    signatories: [DEFAULT_SIGNATORIES.PUNONG_BARANGAY],
    settings: {
      fee: 100,
      validityMonths: 6,
      requiresPhoto: true,
      requiresThumbmark: false,
      hasFee: true,
      hasCtn: false,
      ctnFee: 0,
    },
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

  "tricycle-registration": {
    id: "tricycle-registration",
    title: "TRICYCLE REGISTRATION",
    bodySections: [
      {
        id: "body-1",
        isEditable: true,
        text: "To whom it may concern;\n\nThis is to CERTIFY that {{FULL_NAME}} is the owner of vehicle with the following descriptions:\n\nMake : {{MAKE}}\nPlate NO : {{PLATE_NO}}\nMOTOR NO. : {{MOTOR_NO}}\nChasis No: {{CHASSIS_NO}}\nBODY NO. : {{BODY_NO}}\nBODY COLOR : {{BODY_COLOR}}\nCR NO. : {{CR_NO}}\nOR NO. : {{OR_NO_VEHICLE}}\nMTOP NO. : {{MTOP_NO}}",
      },
      {
        id: "body-2",
        isEditable: true,
        text: "This Certification is being issued upon the request of the above individual for the purpose of TRICYCLE REGULATION UNIT REGISTRATION only.",
      },
    ],
    footerText: "Una ang KAPakanan ng Mamamayan...",
    signatories: [DEFAULT_SIGNATORIES.PUNONG_BARANGAY],
    settings: {
      fee: 100,
      validityMonths: 6,
      requiresPhoto: false,
      requiresThumbmark: false,
      hasFee: true,
      hasCtn: false,
      ctnFee: 0,
    },
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

  "certificate-improvement": {
    id: "certificate-improvement",
    title: "CERTIFICATE OF IMPROVEMENT",
    bodySections: [
      {
        id: "body-1",
        isEditable: true,
        text: "This is to certify that the IMPROVEMENT was built in the year {{YEAR}} on the lot owned by {{FULL_NAME}}. The building was constructed with a total floor area of {{FLOOR_AREA}} square meters and is covered by the said property.",
      },
      {
        id: "body-2",
        isEditable: true,
        text: "The residential house and lot are located at Barangay Ugong, Valenzuela City. This certification is issued this {{DAY}} day of {{MONTH}} {{YEAR}} upon the request of the interested party for assessment purposes by the Assessor's Office of Valenzuela City.",
      },
    ],
    footerText: "Una ang KAPakanan ng Mamamayan...",
    signatories: [DEFAULT_SIGNATORIES.PUNONG_BARANGAY],
    settings: {
      fee: 100,
      validityMonths: 6,
      requiresPhoto: false,
      requiresThumbmark: false,
      hasFee: true,
      hasCtn: false,
      ctnFee: 0,
    },
    variables: ["FULL_NAME", "YEAR", "FLOOR_AREA", "DAY", "MONTH"],
  },

  "technical-permits": {
    id: "technical-permits",
    title: "TECHNICAL PERMIT",
    bodySections: [
      {
        id: "body-1",
        isEditable: true,
        text: "is hereby granted to {{FULL_NAME}}.\n\nTo apply for {{CERT_NATURE}} located at {{ADDRESS}} UGONG VALENZUELA CITY.\n\nHas been found to be fully complying with and not violative of the existing rules and regulations / building code being enforced and is located within the limits of this barangay. This is to further certify that upon verification of the records filed in this office, applicant owner was found to have NO DEROGATORY RECORD.",
      },
      {
        id: "body-2",
        isEditable: true,
        text: "IMPORTANT REMINDERS:\n\nThis clearance is subject for {{PURPOSE}} for any violation of Building Codes, DENR Guidelines and existing laws.\nThis Barangay Clearance for {{CERT_NATURE}} application cannot be used as PERMIT for the subject/s to directly commence their project, unless filed with the City Engineer's Office and approved by the Mayor, City of Valenzuela.",
      },
      {
        id: "body-3",
        isEditable: true,
        text: "This certification is issued this {{DAY}} day of {{MONTH}} {{YEAR}} upon the request of the individual for {{CERT_NATURE}} purpose only.",
      },
    ],
    footerText: "Una ang KAPakanan ng Mamamayan...",
    signatories: [DEFAULT_SIGNATORIES.PUNONG_BARANGAY],
    settings: {
      fee: 100,
      validityMonths: 6,
      requiresPhoto: false,
      requiresThumbmark: false,
      hasFee: true,
      hasCtn: false,
      ctnFee: 0,
    },
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

  "working-clearance": {
    id: "working-clearance",
    title: "WORKING CLEARANCE",
    bodySections: [
      {
        id: "body-1",
        isEditable: true,
        text: "TO WHOM IT MAY CONCERN:\n\nTHIS IS TO CERTIFY that {{FULL_NAME}}, of legal age, Filipino, and a resident of {{ADDRESS}}, is hereby granted permission to conduct work or activity as requested.",
      },
      {
        id: "body-2",
        isEditable: true,
        text: "\nACTIVITY DETAILS:\nNature of Work: {{NATURE_OF_WORK}}\nLocation: {{ADDRESS}}\nActivity {{TIME}}\n\nFURTHER CERTIFICATION:\nThis office further certifies that the above-named individual has no derogatory records based on the available files of this Barangay as of this date, and is known to be of good moral character.",
      },
      {
        id: "body-3",
        isEditable: true,
        text: "This certification is issued this {{DAY}} day of {{MONTH}} {{YEAR}} upon the request of {{FULL_NAME}} for whatever legal purpose it may serve.",
      },
    ],
    footerText: "Una ang KAPakanan ng Mamamayan...",
    signatories: [DEFAULT_SIGNATORIES.PUNONG_BARANGAY],
    settings: {
      fee: 0,
      validityMonths: 6,
      requiresPhoto: false,
      requiresThumbmark: false,
      hasFee: false,
      hasCtn: false,
      ctnFee: 0,
    },
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

const DEFAULT_TEMPLATE: TemplateData = {
  id: "default",
  title: "CERTIFICATE TEMPLATE",
  bodySections: [
    {
      id: "body-1",
      isEditable: true,
      text: "This is to CERTIFY that {{FULL_NAME}} is a resident of this Barangay.",
    },
  ],
  footerText: "Official Document",
  signatories: [DEFAULT_SIGNATORIES.PUNONG_BARANGAY],
  settings: {
    fee: 0,
    validityMonths: 6,
    requiresPhoto: false,
    requiresThumbmark: false,
    hasFee: false,
    hasCtn: false,
    ctnFee: 0,
  },
  variables: DEFAULT_VARIABLES,
};

// ═══════════════════════════════════════════════════════════════════════════════
// LOCAL STORAGE HELPERS (for mock data sync)
// ═══════════════════════════════════════════════════════════════════════════════

const getStoredTemplate = (templateId: string): TemplateData | null => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${templateId}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const storeTemplate = (templateId: string, data: TemplateData): void => {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${templateId}`, JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to save to localStorage:", error);
  }
};

/**
 * Get effective template (localStorage > mock > default)
 * Exported for use by issue-certificate-api.ts
 */
export const getEffectiveTemplate = (
  templateId: string | number,
): TemplateData => {
  const id = String(templateId);
  // Priority 1: localStorage
  const storedTemplate = getStoredTemplate(id);
  if (storedTemplate) return storedTemplate;

  // Priority 2: Mock template
  const mockTemplate = MOCK_TEMPLATES[id];
  if (mockTemplate) return JSON.parse(JSON.stringify(mockTemplate));

  // Priority 3: Default
  return {
    ...DEFAULT_TEMPLATE,
    id: id,
    title: id.replace(/-/g, " ").toUpperCase(),
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch all template options (for dropdown/selector)
 * Tries real API first, falls back to mock data
 */
export const fetchTemplateOptions = async (): Promise<TemplateOption[]> => {
  try {
    const dtos = await fetchApiTemplates();
    return dtos.map(mapDtoToTemplateOption);
  } catch (error) {
    console.warn("Real API unavailable, using mock data:", error);
    return MOCK_TEMPLATE_OPTIONS;
  }
};

/**
 * Fetch a single template by ID (for editing)
 * Tries real API first, falls back to localStorage/mock
 */
export const fetchTemplate = async (
  templateId: string | number,
): Promise<TemplateData> => {
  const id = String(templateId);
  try {
    const dtos = await fetchApiTemplates();
    const dto = dtos.find((d) => String(d.id) === id);
    if (dto) return mapDtoToTemplateData(dto);
    throw new Error(`Template ${id} not found in API`);
  } catch (error) {
    console.warn("API unavailable, using mock/stored data:", error);
    return getEffectiveTemplate(id);
  }
};

/**
 * Save a template (for editing)
 */
export const saveTemplate = async (
  templateId: string | number,
  data: TemplateData,
): Promise<boolean> => {
  const id = String(templateId);
  try {
    const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to save template: ${id}`);
    storeTemplate(id, data);
    return true;
  } catch (error) {
    console.warn("API unavailable, saving to localStorage:", error);
    storeTemplate(id, data);
    if (MOCK_TEMPLATES[id]) {
      MOCK_TEMPLATES[id] = data;
    }
    return true;
  }
};

/**
 * Reset template to default
 */
export const resetTemplate = async (
  templateId: string | number,
): Promise<TemplateData> => {
  const id = String(templateId);
  try {
    const response = await fetch(`${API_BASE_URL}/templates/${id}/reset`, {
      method: "POST",
    });
    if (!response.ok) throw new Error(`Failed to reset template: ${id}`);
    localStorage.removeItem(`${STORAGE_KEY}_${id}`);
    return await response.json();
  } catch (error) {
    console.warn("API unavailable, resetting to mock:", error);
    localStorage.removeItem(`${STORAGE_KEY}_${id}`);
    const mockTemplate = MOCK_TEMPLATES[id];
    if (mockTemplate) return JSON.parse(JSON.stringify(mockTemplate));
    return {
      ...DEFAULT_TEMPLATE,
      id: id,
      title: id.replace(/-/g, " ").toUpperCase(),
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ARCHIVE / RESTORE
// ═══════════════════════════════════════════════════════════════════════════════

const ARCHIVED_STORAGE_KEY = "barangay_archived_templates";

const getArchivedIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(ARCHIVED_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const saveArchivedIds = (ids: Set<string>) => {
  localStorage.setItem(ARCHIVED_STORAGE_KEY, JSON.stringify([...ids]));
};

/**
 * Archive a template (soft-delete)
 */
export const archiveTemplate = async (
  templateId: string | number,
  _reason?: string,
): Promise<boolean> => {
  const id = String(templateId);
  try {
    const response = await fetch(`${API_BASE_URL}/templates/${id}/archive`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: _reason }),
    });
    if (!response.ok) throw new Error(`Failed to archive template: ${id}`);
    return true;
  } catch (error) {
    console.warn("API unavailable, archiving locally:", error);
    const ids = getArchivedIds();
    ids.add(id);
    saveArchivedIds(ids);
    return true;
  }
};

/**
 * Restore an archived template
 */
export const restoreTemplate = async (
  templateId: string | number,
): Promise<boolean> => {
  const id = String(templateId);
  try {
    const response = await fetch(`${API_BASE_URL}/templates/${id}/restore`, {
      method: "PATCH",
    });
    if (!response.ok) throw new Error(`Failed to restore template: ${id}`);
    return true;
  } catch (error) {
    console.warn("API unavailable, restoring locally:", error);
    const ids = getArchivedIds();
    ids.delete(id);
    saveArchivedIds(ids);
    return true;
  }
};

/**
 * Fetch template options with archive status
 * Tries real API first, falls back to mock + localStorage archive tracking
 */
export const fetchTemplateOptionsWithStatus = async (): Promise<
  (TemplateOption & { isArchived: boolean })[]
> => {
  try {
    const dtos = await fetchApiTemplates();
    const archivedIds = getArchivedIds();
    return dtos.map((dto) => ({
      ...mapDtoToTemplateOption(dto),
      isArchived: archivedIds.has(String(dto.id)),
    }));
  } catch (error) {
    console.warn("API unavailable, using mock data:", error);
    const archivedIds = getArchivedIds();
    return MOCK_TEMPLATE_OPTIONS.map((t) => ({
      ...t,
      isArchived: archivedIds.has(String(t.id)),
    }));
  }
};

export const extractVariables = (text: string): string[] => {
  const matches = text.match(/\{\{[^}]+\}\}/g);
  return matches ? matches.map((m) => m.replace(/[{}]/g, "")) : [];
};

export const replaceVariables = (
  text: string,
  data: Record<string, string>,
): string => {
  return text.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
    return data[variable] || match;
  });
};

export const SAMPLE_DATA: Record<string, string> = {
  // Personal Info
  FULL_NAME: "JUAN P. DELA CRUZ",
  AGE: "35",
  CIVIL_STATUS: "Married",
  ADDRESS: "123 Rizal St., Purok 3",
  RESIDENCY_SINCE: "2015",
  DATE_OF_BIRTH: "March 15, 1991",
  PLACE_OF_BIRTH: "Valenzuela City",
  GENDER: "Male",
  NATIONALITY: "Filipino",
  CONTACT_NO: "0917-123-4567",
  EMAIL: "juan.delacruz@email.com",
  VOTER_STATUS: "Yes",
  TIN_NO: "123-456-789-000",

  // Residency
  YEARS_OF_RESIDENCY: "9",
  HOUSE_NO: "Blk 5, Lot 10",
  ZONE_PUROK: "Purok 3",
  PRECINCT_NO: "0012-A",

  // Purpose / Employment
  PURPOSE: "EMPLOYMENT",
  NATURE_OF_WORK: "Electrical Installation",
  OCCUPATION: "Electrician",
  EMPLOYER: "MERALCO",
  EMPLOYER_ADDRESS: "Ortigas Ave., Pasig City",
  MONTHLY_INCOME: "₱25,000.00",
  CERT_NATURE: "Electrical Clearance (MERALCO)",

  // Payment/OR Info
  OR_NUMBER: "2026-0147",
  DATE_ISSUED: "March 9, 2026",
  AMOUNT_PAID: "₱50.00",
  COM_TAX_NO: "CTN-2026-001",
  ISSUED_AT: "Valenzuela City",
  OR_DATE: "March 9, 2026",
  VALID_UNTIL: "September 9, 2026",

  // Property / Business Info
  FLOOR_AREA: "120",
  LOT_AREA: "200",
  BUILDING_TYPE: "Residential",
  BUSINESS_NAME: "JDC Trading",
  BUSINESS_TYPE: "General Merchandise",
  BUSINESS_ADDRESS: "456 Sampaguita St., Ugong",
  TIME: "12:00 PM - 5:00 PM",

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

  // Date Components
  DAY: "9th",
  MONTH: "MARCH",
  YEAR: "2026",
};

/**
 * Get preview data merged with form data
 */
export const getPreviewData = (
  formData: Record<string, string>,
): Record<string, string> => {
  return { ...SAMPLE_DATA, ...formData };
};
