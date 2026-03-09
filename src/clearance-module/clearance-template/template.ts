export interface BodySection {
  id: string;
  text: string;
  isEditable: boolean;
  requiredVariables?: string[];
}

export interface PaymentField {
  label: string;
  variable: string;
  value?: string;
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
  id: string | number;
  title: string;
  bodySections: BodySection[];
  footerText: string;
  signatories: Signatory[];
  settings: CertificateSettings;
  variables: string[];
}

export interface TemplateOption {
  id: string | number;
  name: string;
  isFree: boolean;
}
