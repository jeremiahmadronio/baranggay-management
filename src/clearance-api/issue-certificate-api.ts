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
          { name: "AMOUNT_PAID", label: "Amount Paid" },
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
          { name: "AMOUNT_PAID", label: "Amount Paid" },
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
        fields: createFields([
          { name: "OR_NUMBER", label: "OR Number" },
          { name: "AMOUNT_PAID", label: "Amount Paid" },
        ]),
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
        fields: createFields([
          { name: "OR_NUMBER", label: "OR Number" },
          { name: "AMOUNT_PAID", label: "Amount Paid" },
        ]),
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
        fields: createFields([
          { name: "OR_NUMBER", label: "OR Number" },
          { name: "AMOUNT_PAID", label: "Amount Paid" },
        ]),
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
        fields: createFields([
          { name: "OR_NUMBER", label: "OR Number" },
          { name: "AMOUNT_PAID", label: "Amount Paid" },
        ]),
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
 */
export const fetchIssuanceTemplate = async (
  templateId: string,
): Promise<IssuanceTemplate> => {
  try {
    const response = await fetch(`${API_BASE_URL}/issue/${templateId}`);
    if (!response.ok)
      throw new Error(`Failed to fetch issuance template: ${templateId}`);
    return await response.json();
  } catch (error) {
    console.warn("API unavailable, building from mock data:", error);

    // Get template data from template-api
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
