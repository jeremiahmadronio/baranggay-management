import {
  type TemplateData,
  type TemplateOption,
} from "../clearance-module/clearance-template/template";

const TEMPLATE_OPTIONS: TemplateOption[] = [
  { id: "barangay-clearance", name: "Barangay Clearance", isFree: false },
  { id: "indigency", name: "Certificate of Indigency", isFree: true },
  { id: "residency", name: "Certificate of Residency", isFree: false },
  { id: "job-seeker", name: "First Time Job Seeker", isFree: true },
  { id: "tricycle", name: "Tricycle Registration", isFree: false },
];

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

const PUNONG_BARANGAY = {
  name: "MARICEL PINEDA - EMPERADOR",
  position: "Punong Barangay",
};

const BARANGAY_SECRETARY = {
  name: "MS. JOYCES KRISHA TAN",
  position: "Barangay Secretary",
};

const RECIPIENT = {
  name: "JUAN P. DELA CRUZ",
  position: "Recipient of Assistance",
};

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
    signatories: [PUNONG_BARANGAY],
    settings: {
      fee: 50,
      validityDate: "2026-08-17",
      requiresPhoto: true,
      requiresThumbmark: true,
      hasFee: true,
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
        text: "This is to CERTIFY that {{FULL_NAME}} of legal age, residing at {{ADDRESS}}, UGONG, VALENZUELA CITY since {{RESIDENCY_SINCE}}, is known to belong to the indigent families/sector of Barangay as of this date.",
      },
      {
        id: "body-2",
        isEditable: true,
        text: "This CERTIFICATION is being issued upon the request of the said individual for {{PURPOSE}} purpose or for whatever legal purpose this may serve best.",
      },
    ],
    footerText: "Valid for educational/medical assistance only.",
    signatories: [PUNONG_BARANGAY, RECIPIENT],
    settings: {
      fee: 0,
      validityDate: "2026-08-17",
      requiresPhoto: true,
      requiresThumbmark: false,
      hasFee: false,
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
    signatories: [PUNONG_BARANGAY, BARANGAY_SECRETARY],
    settings: {
      fee: 30,
      validityDate: "2026-08-17",
      requiresPhoto: false,
      requiresThumbmark: false,
      hasFee: true,
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
      BARANGAY_SECRETARY,
    ],
    settings: {
      fee: 0,
      validityDate: "2026-08-17",
      requiresPhoto: false,
      requiresThumbmark: false,
      hasFee: false,
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
    signatories: [PUNONG_BARANGAY],
    settings: {
      fee: 100,
      validityDate: "2026-08-17",
      requiresPhoto: true,
      requiresThumbmark: false,
      hasFee: true,
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
  signatories: [PUNONG_BARANGAY],
  settings: {
    fee: 0,
    validityDate: "2026-08-17",
    requiresPhoto: false,
    requiresThumbmark: false,
    hasFee: false,
  },
  variables: DEFAULT_VARIABLES,
};

export const mockApi = {
  getTemplateOptions: async (): Promise<TemplateOption[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return TEMPLATE_OPTIONS;
  },

  fetchTemplate: async (templateId: string): Promise<TemplateData> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const template = MOCK_TEMPLATES[templateId];
    if (template) {
      return JSON.parse(JSON.stringify(template));
    }
    return {
      ...DEFAULT_TEMPLATE,
      id: templateId,
      title: templateId.replace(/-/g, " ").toUpperCase(),
    };
  },

  saveTemplate: async (
    templateId: string,
    data: TemplateData,
  ): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    console.log(`Saved template ${templateId}:`, data);
    if (MOCK_TEMPLATES[templateId]) {
      MOCK_TEMPLATES[templateId] = data;
    }
    return true;
  },
};

export const SAMPLE_DATA: Record<string, string> = {
  FULL_NAME: "JUAN P. DELA CRUZ",
  AGE: "35",
  CIVIL_STATUS: "Married",
  ADDRESS: "123 Rizal St., Purok 3",
  RESIDENCY_SINCE: "2015",
  RESIDENCY_DATE: "2015",
  PURPOSE: "EMPLOYMENT",
  OR_NUMBER: "2026-0147",
  DATE_ISSUED: "February 17, 2026",
  AMOUNT_PAID: "P50.00",
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
  LOT_OWNER: "MARIA CLARA",
  BUSINESS_NAME: "JUAN DELA CRUZ SARI-SARI STORE",
  BUSINESS_ADDRESS: "123 Rizal St., Purok 3",
  BUSINESS_NATURE: "SARI-SARI STORE",
  BIRTHDATE: "January 1, 1960",
  DATE_OF_BIRTH: "March 15, 1991",
  PLACE_OF_BIRTH: "Valenzuela City",
  COM_TAX_NO: "CTN-2026-001",
  ISSUED_AT: "Valenzuela City",
  OR_DATE: "February 17, 2026",
  VALID_UNTIL: "August 17, 2028",
  DAY: "7th",
  MONTH: "OCTOBER",
  YEAR: "2025",
};
