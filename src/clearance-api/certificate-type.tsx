export interface CertificateTemplate {
  id: number;
  cert_title: string;
  cert_fee: number;
  isFree: boolean;
  requires_photo: boolean;
  requires_thumbmark: boolean;
  cert_body: {
    fields: Array<{
      key: string;
      label: string;
      type: "text" | "select" | "date";
      options?: string[];
      placeholder?: string;
    }>;
  };
}

const sampleTemplates: CertificateTemplate[] = [
  {
    id: 1,
    cert_title: "Barangay Clearance",
    cert_fee: 50,
    isFree: false,
    requires_photo: true,
    requires_thumbmark: true,
    cert_body: {
      fields: [
        {
          key: "purpose",
          label: "Purpose",
          type: "select",
          options: ["Employment", "Travel", "Identification", "Loan"],
        },
        {
          key: "civil_status",
          label: "Civil Status",
          type: "select",
          options: ["Single", "Married", "Widowed", "Separated"],
        },
        {
          key: "length_of_residency",
          label: "Length of Residency",
          type: "text",
          placeholder: "e.g. 10 Years",
        },
      ],
    },
  },
  {
    id: 4,
    cert_title: "Indigency Certificate",
    cert_fee: 0,
    isFree: true,
    requires_photo: false,
    requires_thumbmark: false,
    cert_body: {
      fields: [
        {
          key: "purpose",
          label: "Purpose",
          type: "text",
          placeholder: "Reason for request...",
        },
        {
          key: "representative",
          label: "Authorized Representative",
          type: "text",
        },
      ],
    },
  },
];


export const fetchCertificateTemplates = async (): Promise<CertificateTemplate[]> => {
  try {
    const response = await fetch("/api/clearance/certificate-templates");
    if (!response.ok) {
        throw new Error("Failed to fetch certificate templates");


    }    return await response.json();
  } catch (error) {
    console.error("Error fetching certificate templates:", error);
    return sampleTemplates;
  }
};