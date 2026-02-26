export interface BodySection {
  id: string
  text: string
  isEditable: boolean
  requiredVariables?: string[] 
}

export interface PaymentField {
  label: string
  variable: string
  value?: string
}

export interface Signatory {
  name: string
  position: string
}

export interface CertificateSettings {
  fee: number
  validityDate: string
  requiresPhoto: boolean
  requiresThumbmark: boolean
  hasFee: boolean
}

export interface TemplateData {
  id: string
  title: string
  bodySections: BodySection[]
  footerText: string
  signatories: Signatory[]
  settings: CertificateSettings
  variables: string[]
}

export interface TemplateOption {
  id: string
  name: string
  isFree: boolean
}
