/**
 * Shared Types for Clearance Module APIs
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

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
  validityMonths: number;
  requiresPhoto: boolean;
  requiresThumbmark: boolean;
  hasFee: boolean;
}

export interface TemplateData {
  id: number | string; // number from DB, string slug for URL/lookup
  title: string;
  bodySections: BodySection[]; // cert_body jsonb
  footerText: string; // cert_tagline
  signatories: Signatory[]; // signatories jsonb
  settings: CertificateSettings;
  variables: string[]; // variables jsonb
  deptId?: number; // dept_id
}

export interface TemplateOption {
  id: number | string; // number from DB, string slug for dropdown
  name: string;
  isFree: boolean; // computed from cert_fee === 0
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: "text" | "select" | "date" | "number" | "textarea" | "radio";
  options?: string[];
  placeholder?: string;
  required?: boolean;
  value?: string;
  autoFilled?: boolean;
  readOnly?: boolean;
  helpText?: string;
}

export interface FormSection {
  title: string;
  fields: FormFieldConfig[];
}

export interface FormFieldsConfig {
  sections: FormSection[];
}

export interface IssuanceTemplate extends TemplateData {
  formFields: FormFieldsConfig;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ISSUED CERTIFICATE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface IssuedStats {
  totalIssued: number;
  totalRevenue: number;
  totalFreeCertificates: number;
  totalPaidCertificates: number;
  revenueGrowth: number;
  revenueDirection: "up" | "down" | "neutral";
}

export interface IssuedCertificate {
  id: string; // uuid from DB
  templateId: number | string; // template_id - FK to certificate_template (number in DB, string slug in mock)
  certificateType: string; // JOIN: certificate_template.cert_title
  requesterName: string; // requestor_name
  certificateData?: Record<string, string>; // certificate_data jsonb
  isFree: boolean; // is_free
  issuedById?: string; // issued_by_id uuid
  issuedBy: string; // JOIN: users.name
  deptId?: number; // dept_id
  status: "Released" | "Pending" | "Cancelled"; // ← Fixed to match DB default
  dateIssued: string; // issued_at
  expiryDate?: string; // expiry_date
  // From revenue_records JOIN:
  orNumber?: string; // revenue_records.or_number
  fee?: number; // revenue_records.amount
}

// ═══════════════════════════════════════════════════════════════════════════════
// API RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
