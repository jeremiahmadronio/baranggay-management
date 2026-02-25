// mock-template-data.ts

export type CertificateTemplate = {
  id: number;
  cert_title: string;
  isFree: boolean;
  body_top: string;
  body_bottom: string;
  fee: number;
  validity_months: number;
  requires_photo: boolean;
  requires_thumbmark: boolean;
  signatory_name: string;
  signatory_position: string;
  footer_text: string;
  fields: Array<{ label: string; key: string; type: string }>;
};

export const MOCK_VARIABLES = [
  "{{FULL_NAME}}", "{{ADDRESS}}", "{{DATE_OF_BIRTH}}", 
  "{{PLACE_OF_BIRTH}}", "{{CIVIL_STATUS}}", "{{PURPOSE}}", 
  "{{RESIDENCY_LENGTH}}", "{{OR_NUMBER}}", "{{DATE_ISSUED}}", 
  "{{AMOUNT_PAID}}", "{{DAY}}", "{{MONTH}}", "{{YEAR}}"
];

export const MOCK_TEMPLATES: CertificateTemplate[] = [
  {
    id: 1,
    cert_title: "BARANGAY CLEARANCE",
    isFree: false,
    body_top: "This is to CERTIFY that the person whose name and signature, right thumbmark and picture appeared herein is a bonafide resident of this barangay; requesting for a record and clearance from this office to wit:",
    body_bottom: "This is to further certify that upon verification of the records filed in this office, subject individual have: NO DEROGATORY RECORD",
    fee: 50,
    validity_months: 6,
    requires_photo: true,
    requires_thumbmark: true,
    signatory_name: "MARICEL PINEDA - EMPERADOR",
    signatory_position: "Punong Barangay",
    footer_text: "Una ang KAPakanan ng Mamamayan...",
    fields: [
      { label: "NAME", key: "{{FULL_NAME}}", type: "text" },
      { label: "ADDRESS", key: "{{ADDRESS}}", type: "text" },
      { label: "DATE OF BIRTH", key: "{{DATE_OF_BIRTH}}", type: "date" },
      { label: "PLACE OF BIRTH", key: "{{PLACE_OF_BIRTH}}", type: "text" },
      { label: "CIVIL STATUS", key: "{{CIVIL_STATUS}}", type: "text" },
      { label: "PURPOSE", key: "{{PURPOSE}}", type: "text" },
      { label: "LENGTH OF RESIDENCY", key: "{{RESIDENCY_LENGTH}}", type: "text" },
    ]
  },
  {
    id: 2,
    cert_title: "CERTIFICATE OF INDIGENCY",
    isFree: true,
    body_top: "This is to CERTIFY that {{FULL_NAME}} of legal age, residing at UGONG, VALENZUELA CITY since {{RESIDENCY_LENGTH}}, is known to belong to the indigent families/sector of Barangay as of this date.",
    body_bottom: "This CERTIFICATION is being issued upon the request of the said individual for {{PURPOSE}} purpose or for whatever legal purpose this may serve best.\n\nSigned this {{DAY}} Day of {{MONTH}} {{YEAR}}",
    fee: 0,
    validity_months: 6,
    requires_photo: false,
    requires_thumbmark: false,
    signatory_name: "MARICEL PINEDA - EMPERADOR",
    signatory_position: "Punong Barangay",
    footer_text: "Una ang KAPakanan ng Mamamayan...",
    fields: []
  }
];