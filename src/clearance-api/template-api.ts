/**
 * Template API Service
 * Handles all template-related API calls with mock data fallback
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface BodySection {
  id: string;
  text: string;
  isEditable: boolean;
  requiredVariables?: string[];
}

export interface Signatory {
  name: string;
  position: string;
}

export interface CertificateSettings {
  fee: number;
  validityMonths: number; // How many months the certificate is valid (e.g., 6 = 6 months)
  requiresPhoto: boolean;
  requiresThumbmark: boolean;
  hasFee: boolean;
}

export interface TemplateData {
  id: string;
  title: string;
  bodySections: BodySection[];
  footerText: string;
  signatories: Signatory[];
  settings: CertificateSettings;
  variables: string[];
}

export interface TemplateOption {
  id: string;
  name: string;
  isFree: boolean;
}

// For IssueCertificate form fields
export interface FormFieldConfig {
  key: string;
  label: string;
  type: "text" | "select" | "date" | "number" | "textarea";
  options?: string[];
  placeholder?: string;
  required?: boolean;
  section?: "personal" | "details" | "vehicle" | "payment" | "other";
  autoFilled?: boolean; // Auto-filled by system
  readOnly?: boolean; // Cannot be edited
  helpText?: string; // Help text for the field
}

// Combined template for issuance
export interface IssuanceTemplate extends TemplateData {
  formFields: FormFieldConfig[];
}

// ============================================
// CONSTANTS
// ============================================

const API_BASE_URL = "/api/clearance";

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
};

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

// ============================================
// SAMPLE DATA FOR PREVIEW
// ============================================

export const SAMPLE_DATA: Record<string, string> = {
  FULL_NAME: "JUAN P. DELA CRUZ",
  AGE: "35",
  CIVIL_STATUS: "Married",
  ADDRESS: "123 Rizal St., Purok 3",
  RESIDENCY_SINCE: "2015",
  RESIDENCY_DATE: "2015",
  PURPOSE: "EMPLOYMENT",
  OR_NUMBER: "2026-0147",
  DATE_ISSUED: "March 8, 2026",
  AMOUNT_PAID: "₱50.00",
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
  OR_DATE: "March 8, 2026",
  VALID_UNTIL: "September 8, 2026",
  DAY: "8th",
  MONTH: "MARCH",
  YEAR: "2026",
  FLOOR_AREA: "120",
  CERT_NATURE: "Electrical Clearance (MERALCO)",
  NATURE_OF_WORK: "Electrical Installation",
  TIME: "12:00 PM - 5:00 PM",
};

// ============================================
// MOCK TEMPLATE OPTIONS
// ============================================

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

// ============================================
// MOCK FORM FIELDS FOR ISSUANCE
// ============================================

const FORM_FIELDS_CONFIG: Record<string, FormFieldConfig[]> = {
  "barangay-clearance": [
    {
      key: "FULL_NAME",
      label: "Full Name",
      type: "text",
      placeholder: "Juan P. Dela Cruz",
      required: true,
      section: "personal",
    },
    {
      key: "DATE_OF_BIRTH",
      label: "Date of Birth",
      type: "date",
      required: true,
      section: "personal",
    },
    {
      key: "PLACE_OF_BIRTH",
      label: "Place of Birth",
      type: "text",
      placeholder: "City/Municipality",
      section: "personal",
    },
    {
      key: "ADDRESS",
      label: "Address",
      type: "text",
      placeholder: "House No., Street, Purok",
      required: true,
      section: "personal",
    },
    {
      key: "RESIDENCY_SINCE",
      label: "Residing Since",
      type: "text",
      placeholder: "e.g. 2015",
      section: "details",
    },
    {
      key: "PURPOSE",
      label: "Purpose",
      type: "select",
      options: [
        "Employment",
        "Travel Abroad",
        "School Requirements",
        "Bank Transaction",
        "NBI Clearance",
        "Police Clearance",
        "Others",
      ],
      required: true,
      section: "details",
    },
    // Payment/Administrative Fields
    {
      key: "COM_TAX_NO",
      label: "Community Tax No. (CTC)",
      type: "text",
      placeholder: "CTN-2026-001",
      section: "payment",
    },
    {
      key: "OR_NUMBER",
      label: "O.R. Number",
      type: "text",
      placeholder: "2026-0001",
      required: true,
      section: "payment",
    },
    // Auto-filled fields (system-generated)
    {
      key: "ISSUED_AT",
      label: "Issued At",
      type: "text",
      section: "payment",
      autoFilled: true,
      readOnly: true,
      helpText: "Barangay Hall location",
    },
    {
      key: "DATE_ISSUED",
      label: "Date Issued",
      type: "text",
      section: "payment",
      autoFilled: true,
      readOnly: true,
      helpText: "Today's date",
    },
    {
      key: "OR_DATE",
      label: "O.R. Date",
      type: "text",
      section: "payment",
      autoFilled: true,
      readOnly: true,
      helpText: "Payment date",
    },
    {
      key: "AMOUNT_PAID",
      label: "Amount Paid (₱)",
      type: "text",
      section: "payment",
      autoFilled: true,
      readOnly: true,
      helpText: "Based on certificate fee",
    },
    {
      key: "VALID_UNTIL",
      label: "Valid Until",
      type: "text",
      section: "payment",
      autoFilled: true,
      readOnly: true,
      helpText: "6 months from issuance",
    },
  ],
  indigency: [
    {
      key: "FULL_NAME",
      label: "Full Name",
      type: "text",
      placeholder: "Juan P. Dela Cruz",
      required: true,
      section: "personal",
    },
    {
      key: "AGE",
      label: "Age",
      type: "number",
      placeholder: "35",
      required: true,
      section: "personal",
    },
    {
      key: "ADDRESS",
      label: "Address",
      type: "text",
      placeholder: "House No., Street, Purok",
      required: true,
      section: "personal",
    },
    {
      key: "RESIDENCY_SINCE",
      label: "Residing Since",
      type: "text",
      placeholder: "e.g. 2015",
      section: "details",
    },
    {
      key: "PURPOSE",
      label: "Purpose",
      type: "select",
      options: [
        "Medical Assistance",
        "Educational Assistance",
        "Burial Assistance",
        "DSWD Requirements",
        "PhilHealth Requirements",
        "Hospital Bill Discount",
        "Others",
      ],
      required: true,
      section: "details",
    },
    // Auto-filled fields
    {
      key: "DATE_ISSUED",
      label: "Date Issued",
      type: "text",
      section: "payment",
      autoFilled: true,
      readOnly: true,
      helpText: "Today's date",
    },
  ],
  residency: [
    {
      key: "FULL_NAME",
      label: "Full Name",
      type: "text",
      placeholder: "Juan P. Dela Cruz",
      required: true,
      section: "personal",
    },
    {
      key: "AGE",
      label: "Age",
      type: "number",
      placeholder: "35",
      required: true,
      section: "personal",
    },
    {
      key: "CIVIL_STATUS",
      label: "Civil Status",
      type: "select",
      options: ["Single", "Married", "Widowed", "Separated"],
      section: "personal",
    },
    {
      key: "ADDRESS",
      label: "Address",
      type: "text",
      placeholder: "House No., Street, Purok",
      required: true,
      section: "personal",
    },
    {
      key: "RESIDENCY_SINCE",
      label: "Residing Since",
      type: "text",
      placeholder: "e.g. 2015",
      required: true,
      section: "details",
    },
    {
      key: "PURPOSE",
      label: "Purpose",
      type: "select",
      options: [
        "Employment",
        "School Requirements",
        "Voter Registration",
        "Government Transaction",
        "Others",
      ],
      required: true,
      section: "details",
    },
    // Payment/Administrative Fields
    {
      key: "OR_NUMBER",
      label: "O.R. Number",
      type: "text",
      placeholder: "2026-0001",
      required: true,
      section: "payment",
    },
    // Auto-filled fields
    {
      key: "DATE_ISSUED",
      label: "Date Issued",
      type: "text",
      section: "payment",
      autoFilled: true,
      readOnly: true,
      helpText: "Today's date",
    },
    {
      key: "OR_DATE",
      label: "O.R. Date",
      type: "text",
      section: "payment",
      autoFilled: true,
      readOnly: true,
      helpText: "Payment date",
    },
    {
      key: "AMOUNT_PAID",
      label: "Amount Paid (₱)",
      type: "text",
      section: "payment",
      autoFilled: true,
      readOnly: true,
      helpText: "Based on certificate fee",
    },
    {
      key: "VALID_UNTIL",
      label: "Valid Until",
      type: "text",
      section: "payment",
      autoFilled: true,
      readOnly: true,
      helpText: "6 months from issuance",
    },
  ],
  "job-seeker": [
    {
      key: "FULL_NAME",
      label: "Full Name",
      type: "text",
      placeholder: "Juan P. Dela Cruz",
      required: true,
      section: "personal",
    },
    {
      key: "AGE",
      label: "Age",
      type: "number",
      placeholder: "22",
      required: true,
      section: "personal",
    },
    {
      key: "ADDRESS",
      label: "Address",
      type: "text",
      placeholder: "House No., Street, Purok",
      required: true,
      section: "personal",
    },
    // Date Fields (for certificate text) - Auto-filled
    {
      key: "DAY",
      label: "Day",
      type: "text",
      section: "details",
      autoFilled: true,
      readOnly: true,
      helpText: "Current day",
    },
    {
      key: "MONTH",
      label: "Month",
      type: "text",
      section: "details",
      autoFilled: true,
      readOnly: true,
      helpText: "Current month",
    },
    {
      key: "YEAR",
      label: "Year",
      type: "text",
      section: "details",
      autoFilled: true,
      readOnly: true,
      helpText: "Current year",
    },
    // Auto-filled fields
    {
      key: "DATE_ISSUED",
      label: "Date Issued",
      type: "text",
      section: "payment",
      autoFilled: true,
      readOnly: true,
      helpText: "Today's date",
    },
  ],
  tricycle: [
    {
      key: "FULL_NAME",
      label: "Owner's Full Name",
      type: "text",
      placeholder: "Juan P. Dela Cruz",
      required: true,
      section: "personal",
    },
    {
      key: "MAKE",
      label: "Model of Vehicle",
      type: "text",
      placeholder: "HONDA",
      required: true,
      section: "vehicle",
    },
    {
      key: "VEHICLE_NO",
      label: "Vehicle No.",
      type: "text",
      placeholder: "V-12345",
      section: "vehicle",
    },
    {
      key: "MOTOR_NO",
      label: "Motor No.",
      type: "text",
      placeholder: "M123456",
      section: "vehicle",
    },
    {
      key: "BATTERY_NO",
      label: "Battery No.",
      type: "text",
      placeholder: "BAT-789",
      section: "vehicle",
    },
    {
      key: "CHARGER_NO",
      label: "Charger No.",
      type: "text",
      placeholder: "CHG-456",
      section: "vehicle",
    },
    {
      key: "BODY_COLOR",
      label: "Body Color",
      type: "text",
      placeholder: "RED",
      section: "vehicle",
    },
    {
      key: "PLATE_NO",
      label: "Plate No.",
      type: "text",
      placeholder: "123-XYZ",
      section: "vehicle",
    },
    // Date Fields (for certificate text) - Auto-filled
    {
      key: "DAY",
      label: "Day",
      type: "text",
      section: "details",
      autoFilled: true,
      readOnly: true,
      helpText: "Current day",
    },
    {
      key: "MONTH",
      label: "Month",
      type: "text",
      section: "details",
      autoFilled: true,
      readOnly: true,
      helpText: "Current month",
    },
    {
      key: "YEAR",
      label: "Year",
      type: "text",
      section: "details",
      autoFilled: true,
      readOnly: true,
      helpText: "Current year",
    },
    // Payment Fields
    {
      key: "OR_NUMBER",
      label: "O.R. Number",
      type: "text",
      placeholder: "2026-0001",
      required: true,
      section: "payment",
    },
    // Auto-filled fields
    {
      key: "DATE_ISSUED",
      label: "Date Issued",
      type: "text",
      section: "payment",
      autoFilled: true,
      readOnly: true,
      helpText: "Today's date",
    },
    {
      key: "AMOUNT_PAID",
      label: "Amount Paid (₱)",
      type: "text",
      section: "payment",
      autoFilled: true,
      readOnly: true,
      helpText: "Based on certificate fee",
    },
    {
      key: "VALID_UNTIL",
      label: "Valid Until",
      type: "text",
      section: "payment",
      autoFilled: true,
      readOnly: true,
      helpText: "6 months from issuance",
    },
  ],
  "tricycle-registration": [
    {
      key: "FULL_NAME",
      label: "Owner's Full Name",
      type: "text",
      placeholder: "Juan P. Dela Cruz",
      required: true,
      section: "personal",
    },
    {
      key: "MAKE",
      label: "Make",
      type: "text",
      placeholder: "HONDA",
      required: true,
      section: "vehicle",
    },
    {
      key: "PLATE_NO",
      label: "Plate No.",
      type: "text",
      placeholder: "123-XYZ",
      section: "vehicle",
    },
    {
      key: "MOTOR_NO",
      label: "Motor No.",
      type: "text",
      placeholder: "M123456",
      section: "vehicle",
    },
    {
      key: "CHASSIS_NO",
      label: "Chassis No.",
      type: "text",
      placeholder: "C987654",
      section: "vehicle",
    },
    {
      key: "BODY_NO",
      label: "Body No.",
      type: "text",
      placeholder: "B-999",
      section: "vehicle",
    },
    {
      key: "BODY_COLOR",
      label: "Body Color",
      type: "text",
      placeholder: "RED",
      section: "vehicle",
    },
    {
      key: "CR_NO",
      label: "CR No.",
      type: "text",
      placeholder: "CR-12345",
      section: "vehicle",
    },
    {
      key: "OR_NO_VEHICLE",
      label: "OR No.",
      type: "text",
      placeholder: "OR-67890",
      section: "vehicle",
    },
    {
      key: "MTOP_NO",
      label: "MTOP No.",
      type: "text",
      placeholder: "MTOP-2026-001",
      section: "vehicle",
    },
    // Payment Fields
    {
      key: "OR_NUMBER",
      label: "Payment O.R. Number",
      type: "text",
      placeholder: "2026-0001",
      required: true,
      section: "payment",
    },
    // Auto-filled fields
    {
      key: "DATE_ISSUED",
      label: "Date Issued",
      type: "text",
      section: "payment",
      autoFilled: true,
      readOnly: true,
      helpText: "Today's date",
    },
    {
      key: "AMOUNT_PAID",
      label: "Amount Paid (₱)",
      type: "text",
      section: "payment",
      autoFilled: true,
      readOnly: true,
      helpText: "Based on certificate fee",
    },
    {
      key: "VALID_UNTIL",
      label: "Valid Until",
      type: "text",
      section: "payment",
      autoFilled: true,
      readOnly: true,
      helpText: "6 months from issuance",
    },
  ],
  "certificate-improvement": [
    {
      key: "FULL_NAME",
      label: "Lot Owner's Full Name",
      type: "text",
      placeholder: "Juan P. Dela Cruz",
      required: true,
      section: "personal",
    },
    {
      key: "FLOOR_AREA",
      label: "Floor Area (sq.m.)",
      type: "number",
      placeholder: "120",
      required: true,
      section: "details",
    },
    {
      key: "YEAR",
      label: "Year Built",
      type: "text",
      placeholder: "2020",
      required: true,
      section: "details",
    },
    // Date Fields - Auto-filled
    {
      key: "DAY",
      label: "Day",
      type: "text",
      section: "details",
      autoFilled: true,
      readOnly: true,
      helpText: "Current day",
    },
    {
      key: "MONTH",
      label: "Month",
      type: "text",
      section: "details",
      autoFilled: true,
      readOnly: true,
      helpText: "Current month",
    },
    // Payment Fields
    {
      key: "OR_NUMBER",
      label: "O.R. Number",
      type: "text",
      placeholder: "2026-0001",
      required: true,
      section: "payment",
    },
    // Auto-filled fields
    {
      key: "DATE_ISSUED",
      label: "Date Issued",
      type: "text",
      section: "payment",
      autoFilled: true,
      readOnly: true,
      helpText: "Today's date",
    },
    {
      key: "AMOUNT_PAID",
      label: "Amount Paid (₱)",
      type: "text",
      section: "payment",
      autoFilled: true,
      readOnly: true,
      helpText: "Based on certificate fee",
    },
    {
      key: "VALID_UNTIL",
      label: "Valid Until",
      type: "text",
      section: "payment",
      autoFilled: true,
      readOnly: true,
      helpText: "6 months from issuance",
    },
  ],
  "technical-permits": [
    {
      key: "FULL_NAME",
      label: "Applicant's Full Name",
      type: "text",
      placeholder: "Juan P. Dela Cruz",
      required: true,
      section: "personal",
    },
    {
      key: "ADDRESS",
      label: "Property Address",
      type: "text",
      placeholder: "House No., Street, Purok",
      required: true,
      section: "personal",
    },
    {
      key: "CERT_NATURE",
      label: "Nature of Permit",
      type: "select",
      options: [
        "Electrical Clearance (MERALCO)",
        "Building Permit",
        "Fencing Permit",
        "Renovation Permit",
        "Demolition Permit",
      ],
      required: true,
      section: "details",
    },
    {
      key: "PURPOSE",
      label: "Purpose",
      type: "text",
      placeholder: "New Installation / Reconnection",
      section: "details",
    },
    // Date Fields - Auto-filled
    {
      key: "DAY",
      label: "Day",
      type: "text",
      section: "details",
      autoFilled: true,
      readOnly: true,
      helpText: "Current day",
    },
    {
      key: "MONTH",
      label: "Month",
      type: "text",
      section: "details",
      autoFilled: true,
      readOnly: true,
      helpText: "Current month",
    },
    {
      key: "YEAR",
      label: "Year",
      type: "text",
      section: "details",
      autoFilled: true,
      readOnly: true,
      helpText: "Current year",
    },
    // Payment Fields
    {
      key: "OR_NUMBER",
      label: "O.R. Number",
      type: "text",
      placeholder: "2026-0001",
      required: true,
      section: "payment",
    },
    // Auto-filled fields
    {
      key: "DATE_ISSUED",
      label: "Date Issued",
      type: "text",
      section: "payment",
      autoFilled: true,
      readOnly: true,
      helpText: "Today's date",
    },
    {
      key: "AMOUNT_PAID",
      label: "Amount Paid (₱)",
      type: "text",
      section: "payment",
      autoFilled: true,
      readOnly: true,
      helpText: "Based on certificate fee",
    },
    {
      key: "VALID_UNTIL",
      label: "Valid Until",
      type: "text",
      section: "payment",
      autoFilled: true,
      readOnly: true,
      helpText: "6 months from issuance",
    },
  ],
  "working-clearance": [
    {
      key: "FULL_NAME",
      label: "Full Name",
      type: "text",
      placeholder: "Juan P. Dela Cruz",
      required: true,
      section: "personal",
    },
    {
      key: "ADDRESS",
      label: "Address",
      type: "text",
      placeholder: "House No., Street, Purok",
      required: true,
      section: "personal",
    },
    {
      key: "NATURE_OF_WORK",
      label: "Nature of Work",
      type: "text",
      placeholder: "Construction / Renovation",
      required: true,
      section: "details",
    },
    {
      key: "TIME",
      label: "Work Schedule",
      type: "text",
      placeholder: "8:00 AM - 5:00 PM",
      section: "details",
    },
    // Date Fields - Auto-filled
    {
      key: "DAY",
      label: "Day",
      type: "text",
      section: "details",
      autoFilled: true,
      readOnly: true,
      helpText: "Current day",
    },
    {
      key: "MONTH",
      label: "Month",
      type: "text",
      section: "details",
      autoFilled: true,
      readOnly: true,
      helpText: "Current month",
    },
    {
      key: "YEAR",
      label: "Year",
      type: "text",
      section: "details",
      autoFilled: true,
      readOnly: true,
      helpText: "Current year",
    },
    // Auto-filled fields (Free cert - no payment)
    {
      key: "DATE_ISSUED",
      label: "Date Issued",
      type: "text",
      section: "payment",
      autoFilled: true,
      readOnly: true,
      helpText: "Today's date",
    },
  ],
};

// ============================================
// MOCK TEMPLATES
// ============================================

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
  },
  variables: DEFAULT_VARIABLES,
};

// ============================================
// LOCAL STORAGE PERSISTENCE (for mock data sync)
// ============================================

const STORAGE_KEY = "barangay_templates";

/**
 * Get template from localStorage or fallback to mock
 */
const getStoredTemplate = (templateId: string): TemplateData | null => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${templateId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn("Failed to read from localStorage:", error);
  }
  return null;
};

/**
 * Save template to localStorage for persistence
 */
const storeTemplate = (templateId: string, data: TemplateData): void => {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${templateId}`, JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to save to localStorage:", error);
  }
};

/**
 * Get effective template (localStorage > MOCK_TEMPLATES > DEFAULT)
 * This ensures edited templates sync between Edit and Issue pages
 */
const getEffectiveTemplate = (templateId: string): TemplateData => {
  // Priority 1: Check localStorage for user-edited version
  const storedTemplate = getStoredTemplate(templateId);
  if (storedTemplate) {
    return storedTemplate;
  }

  // Priority 2: Check mock templates
  const mockTemplate = MOCK_TEMPLATES[templateId];
  if (mockTemplate) {
    return JSON.parse(JSON.stringify(mockTemplate));
  }

  // Priority 3: Return default with custom id
  return {
    ...DEFAULT_TEMPLATE,
    id: templateId,
    title: templateId.replace(/-/g, " ").toUpperCase(),
  };
};

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Fetch all template options (for selector)
 */
export const fetchTemplateOptions = async (): Promise<TemplateOption[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/templates/options`);
    if (!response.ok) {
      throw new Error("Failed to fetch template options");
    }
    return await response.json();
  } catch (error) {
    console.warn("API unavailable, using mock data:", error);
    return MOCK_TEMPLATE_OPTIONS;
  }
};

/**
 * Fetch a single template by ID (for editing)
 * Uses localStorage to persist changes across page navigation
 */
export const fetchTemplate = async (
  templateId: string,
): Promise<TemplateData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/templates/${templateId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch template: ${templateId}`);
    }
    return await response.json();
  } catch (error) {
    console.warn("API unavailable, using mock/stored data:", error);
    return getEffectiveTemplate(templateId);
  }
};

/**
 * Save a template (for editing)
 * Persists to localStorage so changes sync to Issue Certificate page
 */
export const saveTemplate = async (
  templateId: string,
  data: TemplateData,
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/templates/${templateId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to save template: ${templateId}`);
    }
    // Also update localStorage for immediate sync
    storeTemplate(templateId, data);
    return true;
  } catch (error) {
    console.warn("API unavailable, saving to localStorage:", error);
    // Save to localStorage for persistence across page navigation
    storeTemplate(templateId, data);
    // Also update in-memory mock for same-page reference
    if (MOCK_TEMPLATES[templateId]) {
      MOCK_TEMPLATES[templateId] = data;
    }
    return true;
  }
};

/**
 * Reset template to original mock data
 */
export const resetTemplate = async (
  templateId: string,
): Promise<TemplateData> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/templates/${templateId}/reset`,
      {
        method: "POST",
      },
    );
    if (!response.ok) {
      throw new Error(`Failed to reset template: ${templateId}`);
    }
    const data = await response.json();
    // Clear localStorage version
    localStorage.removeItem(`${STORAGE_KEY}_${templateId}`);
    return data;
  } catch (error) {
    console.warn("API unavailable, resetting to mock:", error);
    // Remove from localStorage to reset to original mock
    localStorage.removeItem(`${STORAGE_KEY}_${templateId}`);
    // Return fresh copy of mock template
    const mockTemplate = MOCK_TEMPLATES[templateId];
    if (mockTemplate) {
      return JSON.parse(JSON.stringify(mockTemplate));
    }
    return {
      ...DEFAULT_TEMPLATE,
      id: templateId,
      title: templateId.replace(/-/g, " ").toUpperCase(),
    };
  }
};

/**
 * Fetch template with form fields for issuance
 * Uses same data source as fetchTemplate to ensure sync
 */
export const fetchIssuanceTemplate = async (
  templateId: string,
): Promise<IssuanceTemplate> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/templates/${templateId}/issuance`,
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch issuance template: ${templateId}`);
    }
    return await response.json();
  } catch (error) {
    console.warn("API unavailable, using mock/stored data:", error);
    // Use getEffectiveTemplate to get the same data as EditTemplate
    const template = getEffectiveTemplate(templateId);
    const formFields =
      FORM_FIELDS_CONFIG[templateId] ||
      FORM_FIELDS_CONFIG["barangay-clearance"];
    return {
      ...template,
      formFields,
    };
  }
};

/**
 * Fetch all templates with form fields for issuance
 */
export const fetchAllIssuanceTemplates = async (): Promise<
  IssuanceTemplate[]
> => {
  try {
    const response = await fetch(`${API_BASE_URL}/templates/issuance/all`);
    if (!response.ok) {
      throw new Error("Failed to fetch all issuance templates");
    }
    return await response.json();
  } catch (error) {
    console.warn("API unavailable, using mock data:", error);
    return Object.values(MOCK_TEMPLATES).map((template) => ({
      ...JSON.parse(JSON.stringify(template)),
      formFields:
        FORM_FIELDS_CONFIG[template.id] ||
        FORM_FIELDS_CONFIG["barangay-clearance"],
    }));
  }
};

/**
 * Issue a certificate (submit form data)
 */
export const issueCertificate = async (
  templateId: string,
  formData: Record<string, string>,
): Promise<{ success: boolean; certificateId?: string; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/certificates/issue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        templateId,
        formData,
        issuedAt: new Date().toISOString(),
      }),
    });
    if (!response.ok) {
      throw new Error("Failed to issue certificate");
    }
    return await response.json();
  } catch (error) {
    console.warn("API unavailable, simulating success:", error);
    // Simulate successful issuance
    return {
      success: true,
      certificateId: `CERT-${Date.now()}`,
      message: "Certificate issued successfully (mock)",
    };
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Extract variables from template text
 */
export const extractVariables = (text: string): string[] => {
  const matches = text.match(/\{\{[^}]+\}\}/g);
  return matches ? matches.map((m) => m.replace(/[{}]/g, "")) : [];
};

/**
 * Replace variables in text with actual values
 */
export const replaceVariables = (
  text: string,
  data: Record<string, string>,
): string => {
  return text.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
    return data[variable] || match;
  });
};

/**
 * Get sample/preview data merged with form data
 */
export const getPreviewData = (
  formData: Record<string, string>,
): Record<string, string> => {
  return { ...SAMPLE_DATA, ...formData };
};
