/**
 * Issue Certificate API Service
 * For Issue Certificate Page
 *
 * Functions:
 * - fetchIssuanceTemplate() → Get template + form fields for issuing
 * - fetchAllIssuanceTemplates() → Get all templates for form selection
 * - issueCertificate() → Submit and issue a certificate
 */

import type {
  FormFieldConfig,
  FormFieldsConfig,
  IssuanceTemplate,
  BodySection,
  Signatory,
  CertificateSettings,
} from "./types";
import {
  getEffectiveTemplate,
  replaceVariables,
  getPreviewData,
  fetchTemplate,
} from "./template-api";

// Re-export types for convenience
export type { FormFieldConfig, FormFieldsConfig, IssuanceTemplate };

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE_URL = "/api/clearance";

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS - Create field configs
// ═══════════════════════════════════════════════════════════════════════════════

type FieldInput = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "textarea" | "radio";
  required?: boolean;
  options?: string[];
  value?: string;
  placeholder?: string;
};

const createFields = (fields: FieldInput[]): FormFieldConfig[] =>
  fields.map((f) => ({
    name: f.name,
    label: f.label,
    type: f.type || "text",
    required: f.required !== false,
    options: f.options,
    value: f.value || "",
    placeholder: f.placeholder,
  }));

// ═══════════════════════════════════════════════════════════════════════════════
// DYNAMIC FORM FIELD BUILDER (for templates from real API)
// ═══════════════════════════════════════════════════════════════════════════════

interface FieldMeta {
  label: string;
  section: string;
  type?: FormFieldConfig["type"];
  options?: string[];
  placeholder?: string;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
}

const FIELD_METADATA: Record<string, FieldMeta> = {
  // ── Personal Information (snake_case from API + UPPER_SNAKE for legacy) ──
  full_name: {
    label: "Full Name",
    section: "Personal Information",
    maxLength: 100,
    pattern: "^[A-Za-zÀ-ÿñÑ .,'\\-]+$",
    patternMessage: "Letters, spaces, dots, commas, hyphens only",
  },
  FULL_NAME: {
    label: "Full Name",
    section: "Personal Information",
    maxLength: 100,
    pattern: "^[A-Za-zÀ-ÿñÑ .,'\\-]+$",
    patternMessage: "Letters, spaces, dots, commas, hyphens only",
  },
  address: {
    label: "Address",
    section: "Personal Information",
    maxLength: 200,
  },
  ADDRESS: {
    label: "Address",
    section: "Personal Information",
    maxLength: 200,
  },
  age: {
    label: "Age",
    section: "Personal Information",
    type: "number",
    min: 1,
    max: 150,
  },
  AGE: {
    label: "Age",
    section: "Personal Information",
    type: "number",
    min: 1,
    max: 150,
  },
  civil_status: {
    label: "Civil Status",
    section: "Personal Information",
    type: "select",
    options: ["Single", "Married", "Widowed", "Separated"],
  },
  CIVIL_STATUS: {
    label: "Civil Status",
    section: "Personal Information",
    type: "select",
    options: ["Single", "Married", "Widowed", "Separated"],
  },
  date_of_birth: {
    label: "Date of Birth",
    section: "Personal Information",
    type: "date",
  },
  DATE_OF_BIRTH: {
    label: "Date of Birth",
    section: "Personal Information",
    type: "date",
  },
  place_of_birth: {
    label: "Place of Birth",
    section: "Personal Information",
    maxLength: 100,
  },
  PLACE_OF_BIRTH: {
    label: "Place of Birth",
    section: "Personal Information",
    maxLength: 100,
  },
  gender: {
    label: "Gender",
    section: "Personal Information",
    type: "select",
    options: ["Male", "Female"],
  },
  GENDER: {
    label: "Gender",
    section: "Personal Information",
    type: "select",
    options: ["Male", "Female"],
  },
  nationality: {
    label: "Nationality",
    section: "Personal Information",
    maxLength: 50,
  },
  NATIONALITY: {
    label: "Nationality",
    section: "Personal Information",
    maxLength: 50,
  },
  contact_no: {
    label: "Contact No.",
    section: "Personal Information",
    maxLength: 15,
    pattern: "^[0-9+\\-() ]+$",
    patternMessage: "Numbers, +, -, (, ) only",
  },
  CONTACT_NO: {
    label: "Contact No.",
    section: "Personal Information",
    maxLength: 15,
    pattern: "^[0-9+\\-() ]+$",
    patternMessage: "Numbers, +, -, (, ) only",
  },
  email: {
    label: "Email Address",
    section: "Personal Information",
    maxLength: 100,
  },
  EMAIL: {
    label: "Email Address",
    section: "Personal Information",
    maxLength: 100,
  },
  voter_status: {
    label: "Registered Voter",
    section: "Personal Information",
    type: "select",
    options: ["Yes", "No"],
  },
  VOTER_STATUS: {
    label: "Registered Voter",
    section: "Personal Information",
    type: "select",
    options: ["Yes", "No"],
  },
  tin_no: {
    label: "TIN Number",
    section: "Personal Information",
    maxLength: 20,
    pattern: "^[0-9\\-]+$",
    patternMessage: "Numbers and dashes only",
  },
  TIN_NO: {
    label: "TIN Number",
    section: "Personal Information",
    maxLength: 20,
    pattern: "^[0-9\\-]+$",
    patternMessage: "Numbers and dashes only",
  },
  ctc_number: {
    label: "Community Tax Cert. No.",
    section: "Personal Information",
    maxLength: 30,
  },

  // ── Residency Details ──
  residency_since: {
    label: "Resident Since",
    section: "Residency Details",
    type: "date",
  },
  RESIDENCY_SINCE: {
    label: "Resident Since",
    section: "Residency Details",
    type: "date",
  },
  years_of_residency: {
    label: "Years of Residency",
    section: "Residency Details",
    type: "number",
    min: 0,
    max: 100,
  },
  YEARS_OF_RESIDENCY: {
    label: "Years of Residency",
    section: "Residency Details",
    type: "number",
    min: 0,
    max: 100,
  },
  house_no: {
    label: "House/Lot No.",
    section: "Residency Details",
    maxLength: 30,
  },
  HOUSE_NO: {
    label: "House/Lot No.",
    section: "Residency Details",
    maxLength: 30,
  },
  zone_purok: {
    label: "Zone/Purok",
    section: "Residency Details",
    maxLength: 30,
  },
  ZONE_PUROK: {
    label: "Zone/Purok",
    section: "Residency Details",
    maxLength: 30,
  },
  precinct_no: {
    label: "Precinct No.",
    section: "Residency Details",
    maxLength: 20,
  },
  PRECINCT_NO: {
    label: "Precinct No.",
    section: "Residency Details",
    maxLength: 20,
  },

  // ── Purpose / Employment ──
  purpose: {
    label: "Purpose",
    section: "Purpose / Employment",
    placeholder: "e.g., EMPLOYMENT, TRAVEL, etc.",
    maxLength: 100,
  },
  PURPOSE: {
    label: "Purpose",
    section: "Purpose / Employment",
    placeholder: "e.g., EMPLOYMENT, TRAVEL, etc.",
    maxLength: 100,
  },
  nature_of_work: {
    label: "Nature of Work",
    section: "Purpose / Employment",
    maxLength: 100,
  },
  NATURE_OF_WORK: {
    label: "Nature of Work",
    section: "Purpose / Employment",
    maxLength: 100,
  },
  occupation: {
    label: "Occupation",
    section: "Purpose / Employment",
    maxLength: 80,
  },
  OCCUPATION: {
    label: "Occupation",
    section: "Purpose / Employment",
    maxLength: 80,
  },
  employer: {
    label: "Employer",
    section: "Purpose / Employment",
    maxLength: 100,
  },
  EMPLOYER: {
    label: "Employer",
    section: "Purpose / Employment",
    maxLength: 100,
  },
  employer_address: {
    label: "Employer Address",
    section: "Purpose / Employment",
    maxLength: 200,
  },
  EMPLOYER_ADDRESS: {
    label: "Employer Address",
    section: "Purpose / Employment",
    maxLength: 200,
  },
  monthly_income: {
    label: "Monthly Income",
    section: "Purpose / Employment",
    type: "number",
    min: 0,
  },
  MONTHLY_INCOME: {
    label: "Monthly Income",
    section: "Purpose / Employment",
    type: "number",
    min: 0,
  },
  cert_nature: {
    label: "Nature of Certificate",
    section: "Purpose / Employment",
    maxLength: 100,
  },
  CERT_NATURE: {
    label: "Nature of Certificate",
    section: "Purpose / Employment",
    maxLength: 100,
  },
  relationship_to_beneficiary: {
    label: "Relationship to Beneficiary",
    section: "Purpose / Employment",
    maxLength: 50,
  },

  // ── Property / Business ──
  floor_area: {
    label: "Floor Area (sq.m)",
    section: "Property / Business",
    type: "number",
    min: 1,
  },
  FLOOR_AREA: {
    label: "Floor Area (sq.m)",
    section: "Property / Business",
    type: "number",
    min: 1,
  },
  lot_area: {
    label: "Lot Area (sq.m)",
    section: "Property / Business",
    type: "number",
    min: 1,
  },
  LOT_AREA: {
    label: "Lot Area (sq.m)",
    section: "Property / Business",
    type: "number",
    min: 1,
  },
  building_type: {
    label: "Building Type",
    section: "Property / Business",
    maxLength: 50,
  },
  BUILDING_TYPE: {
    label: "Building Type",
    section: "Property / Business",
    maxLength: 50,
  },
  business_name: {
    label: "Business Name",
    section: "Property / Business",
    maxLength: 100,
  },
  BUSINESS_NAME: {
    label: "Business Name",
    section: "Property / Business",
    maxLength: 100,
  },
  business_type: {
    label: "Business Type",
    section: "Property / Business",
    maxLength: 50,
  },
  BUSINESS_TYPE: {
    label: "Business Type",
    section: "Property / Business",
    maxLength: 50,
  },
  business_address: {
    label: "Business Address",
    section: "Property / Business",
    maxLength: 200,
  },
  BUSINESS_ADDRESS: {
    label: "Business Address",
    section: "Property / Business",
    maxLength: 200,
  },
  time: {
    label: "Activity Time",
    section: "Property / Business",
    placeholder: "e.g., 12:00 PM - 5:00 PM",
    maxLength: 50,
  },
  TIME: {
    label: "Activity Time",
    section: "Property / Business",
    placeholder: "e.g., 12:00 PM - 5:00 PM",
    maxLength: 50,
  },

  // ── Vehicle (Tricycle) ──
  make: { label: "Make/Model", section: "Vehicle Information", maxLength: 50 },
  MAKE: { label: "Make/Model", section: "Vehicle Information", maxLength: 50 },
  vehicle_no: {
    label: "Vehicle Number",
    section: "Vehicle Information",
    maxLength: 30,
  },
  VEHICLE_NO: {
    label: "Vehicle Number",
    section: "Vehicle Information",
    maxLength: 30,
  },
  plate_no: {
    label: "Plate Number",
    section: "Vehicle Information",
    maxLength: 20,
    pattern: "^[A-Za-z0-9\\- ]+$",
    patternMessage: "Letters, numbers, dashes only",
  },
  PLATE_NO: {
    label: "Plate Number",
    section: "Vehicle Information",
    maxLength: 20,
    pattern: "^[A-Za-z0-9\\- ]+$",
    patternMessage: "Letters, numbers, dashes only",
  },
  motor_no: {
    label: "Motor Number",
    section: "Vehicle Information",
    maxLength: 30,
  },
  MOTOR_NO: {
    label: "Motor Number",
    section: "Vehicle Information",
    maxLength: 30,
  },
  battery_no: {
    label: "Battery Number",
    section: "Vehicle Information",
    maxLength: 30,
  },
  BATTERY_NO: {
    label: "Battery Number",
    section: "Vehicle Information",
    maxLength: 30,
  },
  charger_no: {
    label: "Charger Number",
    section: "Vehicle Information",
    maxLength: 30,
  },
  CHARGER_NO: {
    label: "Charger Number",
    section: "Vehicle Information",
    maxLength: 30,
  },
  body_color: {
    label: "Body Color",
    section: "Vehicle Information",
    maxLength: 30,
  },
  BODY_COLOR: {
    label: "Body Color",
    section: "Vehicle Information",
    maxLength: 30,
  },
  chassis_no: {
    label: "Chassis Number",
    section: "Vehicle Information",
    maxLength: 30,
  },
  CHASSIS_NO: {
    label: "Chassis Number",
    section: "Vehicle Information",
    maxLength: 30,
  },
  body_no: {
    label: "Body Number",
    section: "Vehicle Information",
    maxLength: 20,
  },
  BODY_NO: {
    label: "Body Number",
    section: "Vehicle Information",
    maxLength: 20,
  },
  cr_no: {
    label: "CR Number",
    section: "Vehicle Information",
    maxLength: 20,
  },
  CR_NO: {
    label: "CR Number",
    section: "Vehicle Information",
    maxLength: 20,
  },
  or_no_vehicle: {
    label: "OR Number (Vehicle)",
    section: "Vehicle Information",
    maxLength: 20,
  },
  OR_NO_VEHICLE: {
    label: "OR Number (Vehicle)",
    section: "Vehicle Information",
    maxLength: 20,
  },
  mtop_no: {
    label: "MTOP Number",
    section: "Vehicle Information",
    maxLength: 20,
  },
  MTOP_NO: {
    label: "MTOP Number",
    section: "Vehicle Information",
    maxLength: 20,
  },
};

/**
 * Dynamically generate FormFieldsConfig from an array of variable names
 * (used for templates created via the real API — issueFields are snake_case)
 */
export const buildFormFieldsFromVariables = (
  variables: string[],
  hasFee: boolean,
  hasCtn?: boolean,
): FormFieldsConfig => {
  const sectionMap = new Map<string, FormFieldConfig[]>();

  for (const varName of variables) {
    const meta = FIELD_METADATA[varName];
    if (!meta) continue;

    const field: FormFieldConfig = {
      name: varName,
      label: meta.label,
      type: meta.type || "text",
      required: true,
      options: meta.options,
      placeholder: meta.placeholder || `Enter ${meta.label.toLowerCase()}`,
      value: "",
      maxLength: meta.maxLength,
      min: meta.min,
      max: meta.max,
      pattern: meta.pattern,
      patternMessage: meta.patternMessage,
    };

    if (!sectionMap.has(meta.section)) {
      sectionMap.set(meta.section, []);
    }
    sectionMap.get(meta.section)!.push(field);
  }

  // Add Payment Details section when the template has a fee
  if (hasFee) {
    sectionMap.set(
      "Payment Details",
      createFields([
        { name: "or_number", label: "OR Number" },
        { name: "or_date", label: "OR Date", type: "date" },
      ]),
    );
  }

  // Add Community Tax section when the template requires CTN
  if (hasCtn) {
    sectionMap.set(
      "Community Tax",
      createFields([{ name: "ctc_number", label: "Community Tax Cert. No." }]),
    );
  }

  return {
    sections: Array.from(sectionMap.entries()).map(([title, fields]) => ({
      title,
      fields,
    })),
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// FORM FIELD CONFIGURATIONS (per certificate type)
// ═══════════════════════════════════════════════════════════════════════════════

export const FORM_FIELDS_CONFIG: Record<string, FormFieldsConfig> = {
  "barangay-clearance": {
    sections: [
      {
        title: "Personal Information",
        fields: createFields([
          { name: "FULL_NAME", label: "Full Name" },
          { name: "AGE", label: "Age", type: "number" },
          {
            name: "CIVIL_STATUS",
            label: "Civil Status",
            type: "select",
            options: ["Single", "Married", "Widowed", "Separated"],
          },
          { name: "DATE_OF_BIRTH", label: "Date of Birth", type: "date" },
          { name: "PLACE_OF_BIRTH", label: "Place of Birth" },
          { name: "ADDRESS", label: "Address" },
          {
            name: "PURPOSE",
            label: "Purpose",
            placeholder: "e.g., EMPLOYMENT, TRAVEL, etc.",
          },
        ]),
      },
      {
        title: "Payment Details",
        fields: createFields([
          { name: "OR_NUMBER", label: "OR Number" },
          { name: "OR_DATE", label: "OR Date", type: "date" },
          {
            name: "COM_TAX_NO",
            label: "Community Tax Number",
            required: false,
          },
        ]),
      },
    ],
  },

  indigency: {
    sections: [
      {
        title: "Personal Information",
        fields: createFields([
          { name: "FULL_NAME", label: "Full Name" },
          { name: "AGE", label: "Age", type: "number" },
          {
            name: "CIVIL_STATUS",
            label: "Civil Status",
            type: "select",
            options: ["Single", "Married", "Widowed", "Separated"],
          },
          { name: "ADDRESS", label: "Address" },
          { name: "RESIDENCY_SINCE", label: "Resident Since" },
        ]),
      },
      {
        title: "Request Details",
        fields: createFields([
          {
            name: "PURPOSE",
            label: "Purpose of Request",
            type: "select",
            options: [
              "Medical Assistance",
              "Educational Assistance",
              "Financial Assistance",
              "Other",
            ],
          },
        ]),
      },
    ],
  },

  residency: {
    sections: [
      {
        title: "Personal Information",
        fields: createFields([
          { name: "FULL_NAME", label: "Full Name" },
          { name: "AGE", label: "Age", type: "number" },
          {
            name: "CIVIL_STATUS",
            label: "Civil Status",
            type: "select",
            options: ["Single", "Married", "Widowed", "Separated"],
          },
          { name: "ADDRESS", label: "Complete Address" },
          { name: "RESIDENCY_SINCE", label: "Resident Since" },
        ]),
      },
      {
        title: "Request Details",
        fields: createFields([{ name: "PURPOSE", label: "Purpose" }]),
      },
      {
        title: "Payment Details",
        fields: createFields([
          { name: "OR_NUMBER", label: "OR Number" },
          { name: "OR_DATE", label: "OR Date", type: "date" },
        ]),
      },
    ],
  },

  "job-seeker": {
    sections: [
      {
        title: "Personal Information",
        fields: createFields([
          { name: "FULL_NAME", label: "Full Name" },
          { name: "AGE", label: "Age", type: "number" },
          { name: "ADDRESS", label: "Address" },
          { name: "DATE_OF_BIRTH", label: "Date of Birth", type: "date" },
        ]),
      },
      {
        title: "Issue Details",
        fields: createFields([
          { name: "DAY", label: "Day (Ordinal)", placeholder: "e.g., 9th" },
          {
            name: "MONTH",
            label: "Month",
            type: "select",
            options: [
              "JANUARY",
              "FEBRUARY",
              "MARCH",
              "APRIL",
              "MAY",
              "JUNE",
              "JULY",
              "AUGUST",
              "SEPTEMBER",
              "OCTOBER",
              "NOVEMBER",
              "DECEMBER",
            ],
          },
          { name: "YEAR", label: "Year" },
        ]),
      },
    ],
  },

  tricycle: {
    sections: [
      {
        title: "Owner Information",
        fields: createFields([
          { name: "FULL_NAME", label: "Owner's Full Name" },
          { name: "ADDRESS", label: "Address" },
        ]),
      },
      {
        title: "Vehicle Information",
        fields: createFields([
          { name: "MAKE", label: "Make/Model" },
          { name: "VEHICLE_NO", label: "Vehicle Number" },
          { name: "MOTOR_NO", label: "Motor Number" },
          { name: "BATTERY_NO", label: "Battery Number", required: false },
          { name: "CHARGER_NO", label: "Charger Number", required: false },
          { name: "BODY_COLOR", label: "Body Color" },
          { name: "PLATE_NO", label: "Plate Number" },
        ]),
      },
      {
        title: "Payment Details",
        fields: createFields([{ name: "OR_NUMBER", label: "OR Number" }]),
      },
    ],
  },

  "tricycle-registration": {
    sections: [
      {
        title: "Owner Information",
        fields: createFields([
          { name: "FULL_NAME", label: "Owner's Full Name" },
        ]),
      },
      {
        title: "Vehicle Information",
        fields: createFields([
          { name: "MAKE", label: "Make" },
          { name: "PLATE_NO", label: "Plate Number" },
          { name: "MOTOR_NO", label: "Motor Number" },
          { name: "CHASSIS_NO", label: "Chassis Number" },
          { name: "BODY_NO", label: "Body Number" },
          { name: "BODY_COLOR", label: "Body Color" },
          { name: "CR_NO", label: "CR Number" },
          { name: "OR_NO_VEHICLE", label: "OR Number (Vehicle)" },
          { name: "MTOP_NO", label: "MTOP Number" },
        ]),
      },
      {
        title: "Payment Details",
        fields: createFields([{ name: "OR_NUMBER", label: "OR Number" }]),
      },
    ],
  },

  "certificate-improvement": {
    sections: [
      {
        title: "Property Owner Information",
        fields: createFields([
          { name: "FULL_NAME", label: "Property Owner's Name" },
        ]),
      },
      {
        title: "Property Details",
        fields: createFields([
          {
            name: "FLOOR_AREA",
            label: "Floor Area (sq. meters)",
            type: "number",
          },
          { name: "YEAR", label: "Year Built" },
        ]),
      },
      {
        title: "Issue Details",
        fields: createFields([
          { name: "DAY", label: "Day (Ordinal)", placeholder: "e.g., 9th" },
          {
            name: "MONTH",
            label: "Month",
            type: "select",
            options: [
              "JANUARY",
              "FEBRUARY",
              "MARCH",
              "APRIL",
              "MAY",
              "JUNE",
              "JULY",
              "AUGUST",
              "SEPTEMBER",
              "OCTOBER",
              "NOVEMBER",
              "DECEMBER",
            ],
          },
        ]),
      },
      {
        title: "Payment Details",
        fields: createFields([{ name: "OR_NUMBER", label: "OR Number" }]),
      },
    ],
  },

  "technical-permits": {
    sections: [
      {
        title: "Applicant Information",
        fields: createFields([
          { name: "FULL_NAME", label: "Applicant's Name" },
          { name: "ADDRESS", label: "Project Address" },
        ]),
      },
      {
        title: "Permit Details",
        fields: createFields([
          {
            name: "CERT_NATURE",
            label: "Nature of Certificate",
            type: "select",
            options: [
              "Building Permit Clearance",
              "Electrical Clearance (MERALCO)",
              "Water Connection Clearance (MAYNILAD)",
              "Demolition Permit Clearance",
              "Excavation Permit Clearance",
              "Fencing Permit Clearance",
              "Signboard Permit Clearance",
            ],
          },
          { name: "PURPOSE", label: "Purpose" },
        ]),
      },
      {
        title: "Issue Details",
        fields: createFields([
          { name: "DAY", label: "Day (Ordinal)", placeholder: "e.g., 9th" },
          {
            name: "MONTH",
            label: "Month",
            type: "select",
            options: [
              "JANUARY",
              "FEBRUARY",
              "MARCH",
              "APRIL",
              "MAY",
              "JUNE",
              "JULY",
              "AUGUST",
              "SEPTEMBER",
              "OCTOBER",
              "NOVEMBER",
              "DECEMBER",
            ],
          },
          { name: "YEAR", label: "Year" },
        ]),
      },
      {
        title: "Payment Details",
        fields: createFields([{ name: "OR_NUMBER", label: "OR Number" }]),
      },
    ],
  },

  "working-clearance": {
    sections: [
      {
        title: "Applicant Information",
        fields: createFields([
          { name: "FULL_NAME", label: "Applicant's Name" },
          { name: "ADDRESS", label: "Address" },
        ]),
      },
      {
        title: "Activity Details",
        fields: createFields([
          { name: "NATURE_OF_WORK", label: "Nature of Work" },
          {
            name: "TIME",
            label: "Activity Time",
            placeholder: "e.g., 12:00 PM - 5:00 PM",
          },
        ]),
      },
      {
        title: "Issue Details",
        fields: createFields([
          { name: "DAY", label: "Day (Ordinal)", placeholder: "e.g., 9th" },
          {
            name: "MONTH",
            label: "Month",
            type: "select",
            options: [
              "JANUARY",
              "FEBRUARY",
              "MARCH",
              "APRIL",
              "MAY",
              "JUNE",
              "JULY",
              "AUGUST",
              "SEPTEMBER",
              "OCTOBER",
              "NOVEMBER",
              "DECEMBER",
            ],
          },
          { name: "YEAR", label: "Year" },
        ]),
      },
    ],
  },
};

// Default form fields for unknown certificate types
const DEFAULT_FORM_FIELDS: FormFieldsConfig = {
  sections: [
    {
      title: "Personal Information",
      fields: createFields([
        { name: "FULL_NAME", label: "Full Name" },
        { name: "ADDRESS", label: "Address" },
        { name: "PURPOSE", label: "Purpose" },
      ]),
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch issuance template (with form fields)
 * Tries real API (via fetchTemplate) first, then builds form fields dynamically.
 * Falls back to hardcoded FORM_FIELDS_CONFIG for legacy mock template IDs.
 */
export const fetchIssuanceTemplate = async (
  templateId: string,
): Promise<IssuanceTemplate> => {
  try {
    // fetchTemplate already tries real API first, then falls back to mock
    const templateData = await fetchTemplate(templateId);

    // For inline templates: if variables is empty, extract {{variables}} from bodySections
    let variables = templateData.variables;
    if (
      (!variables || variables.length === 0) &&
      templateData.bodySections.length > 0
    ) {
      const extracted = new Set<string>();
      for (const section of templateData.bodySections) {
        const matches = section.text.match(/\{\{([^}]+)\}\}/g);
        if (matches) {
          matches.forEach((m) => extracted.add(m.replace(/[{}]/g, "")));
        }
      }
      if (extracted.size > 0) {
        variables = [...extracted];
      }
    }

    // Use hardcoded form config if available (legacy mock IDs), otherwise build dynamically
    const formConfig =
      FORM_FIELDS_CONFIG[templateId] ||
      buildFormFieldsFromVariables(
        variables,
        templateData.settings.hasFee,
        templateData.settings.hasCtn,
      );

    return {
      id: templateData.id,
      title: templateData.title,
      bodySections: templateData.bodySections,
      footerText: templateData.footerText,
      signatories: templateData.signatories,
      settings: templateData.settings,
      variables: variables,
      formFields: formConfig,
    };
  } catch (error) {
    console.warn("All sources failed, using mock fallback:", error);

    const templateData = getEffectiveTemplate(templateId);
    const formConfig = FORM_FIELDS_CONFIG[templateId] || DEFAULT_FORM_FIELDS;

    return {
      id: templateData.id,
      title: templateData.title,
      bodySections: templateData.bodySections,
      footerText: templateData.footerText,
      signatories: templateData.signatories,
      settings: templateData.settings,
      variables: templateData.variables,
      formFields: formConfig,
    };
  }
};

/**
 * Fetch all issuance templates (for selection dropdown)
 */
export const fetchAllIssuanceTemplates = async (): Promise<
  IssuanceTemplate[]
> => {
  try {
    const response = await fetch(`${API_BASE_URL}/issue/templates`);
    if (!response.ok) throw new Error("Failed to fetch all issuance templates");
    return await response.json();
  } catch (error) {
    console.warn("API unavailable, building from mock data:", error);

    // Build all issuance templates from mock data
    const templateIds = Object.keys(FORM_FIELDS_CONFIG);
    return templateIds.map((id) => {
      const templateData = getEffectiveTemplate(id);
      return {
        id: templateData.id,
        title: templateData.title,
        bodySections: templateData.bodySections,
        footerText: templateData.footerText,
        signatories: templateData.signatories,
        settings: templateData.settings,
        variables: templateData.variables,
        formFields: FORM_FIELDS_CONFIG[id],
      };
    });
  }
};

/**
 * Issue a certificate
 */
export interface IssueCertificatePayload {
  templateId: string;
  formData: Record<string, string>;
  issuedBy: string;
}

export interface IssueCertificateResponse {
  success: boolean;
  certificateNumber: string;
  message: string;
}

export const issueCertificate = async (
  payload: IssueCertificatePayload,
): Promise<IssueCertificateResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/issue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Failed to issue certificate");
    return await response.json();
  } catch (error) {
    console.warn("API unavailable, using mock response:", error);

    // Generate mock certificate number
    const timestamp = Date.now();
    const certNumber = `CERT-${payload.templateId.toUpperCase().substring(0, 3)}-${timestamp}`;

    return {
      success: true,
      certificateNumber: certNumber,
      message: `Certificate ${certNumber} issued successfully`,
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate preview content for certificate
 */
export const generatePreview = (
  template: IssuanceTemplate,
  formData: Record<string, string>,
): {
  bodySections: BodySection[];
  signatories: Signatory[];
  settings: CertificateSettings;
} => {
  const previewData = getPreviewData(formData);

  const processedSections = template.bodySections.map((section) => ({
    ...section,
    text: replaceVariables(section.text, previewData),
  }));

  return {
    bodySections: processedSections,
    signatories: template.signatories,
    settings: template.settings,
  };
};

/**
 * Validate form fields before submission
 */
export const validateFormFields = (
  template: IssuanceTemplate,
  formData: Record<string, string>,
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  template.formFields.sections.forEach((section) => {
    section.fields.forEach((field) => {
      if (field.required && !formData[field.name]?.trim()) {
        errors[field.name] = `${field.label} is required`;
      }
    });
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Re-export preview helper from template-api
export { getPreviewData, replaceVariables };
