import { useState } from "react";
import { EditorForm } from "./EditorForm";
import { PreviewBondPaper } from "./PreviewBondPaper";

// ITO ANG KUMPLETONG MOCK DATA BASE SA PICTURES MO
export const mockDatabase = [
  {
    id: 1,
    template_code: "CERT_INDIGENCY",
    name: "Certificate of Indigency",
    title: "CERTIFICATE OF INDIGENCY",
    dynamicFields: [
      { key: "AGE", label: "Age", placeholder: "e.g. 22" },
      { key: "ADDRESS", label: "Address", placeholder: "e.g. 1288 Que Grande St." },
      { key: "PURPOSE", label: "Purpose", placeholder: "e.g. Medical Assistance" }
    ],
    bodyText1: "This is to CERTIFY that {{FULL_NAME}}, {{AGE}} years old, residing at {{ADDRESS}}, is known to belong to the indigent families/sector of Barangay Ugong as of this date.",
    bodyText2: "This CERTIFICATION is being issued upon the request of the said individual for the purpose of {{PURPOSE}} or for whatever legal purpose this may serve best.",
    hasGridLayout: false
  },
  {
    id: 2,
    template_code: "CLEARANCE_TRICYCLE",
    name: "Tricycle Clearance",
    title: "CERTIFICATION",
    dynamicFields: [
      { key: "MAKE", label: "Make / Brand", placeholder: "e.g. Honda" },
      { key: "PLATE_NO", label: "Plate No.", placeholder: "e.g. 123 ABC" },
      { key: "MOTOR_NO", label: "Motor No.", placeholder: "Enter Motor No." },
      { key: "CHASIS_NO", label: "Chasis No.", placeholder: "Enter Chasis No." },
      { key: "BODY_COLOR", label: "Body Color", placeholder: "e.g. Red" },
      { key: "PURPOSE", label: "Purpose", placeholder: "TRICYCLE REGULATION UNIT REGISTRATION" }
    ],
    bodyText1: "To whom it may concern;\n\nThis is to CERTIFY that {{FULL_NAME}} is a bonafide member of and the owner of motorcycle with the following description:",
    bodyText2: "This CERTIFICATION is being issued upon the request of the above individual for the purpose of {{PURPOSE}} only.",
    hasGridLayout: true // TRUE ITO KASI MAY LISTAHAN SA GITNA
  },
  {
    id: 3,
    template_code: "PERMIT_WATER",
    name: "Water Service (Maynilad)",
    title: "CLEARANCE / PERMIT",
    dynamicFields: [
      { key: "LOCATION", label: "Project Location", placeholder: "e.g. Ugong, Valenzuela City" }
    ],
    bodyText1: "To apply for WATER SERVICE PERMIT (MAYNILAD) Located at {{LOCATION}} is hereby granted to {{FULL_NAME}}.\n\nHas been found to be fully complying with and not violative of the existing rules and regulations / building code being enforced and is located within the limits of this barangay. This is to further certify that upon verification of the records filed in this office, applicant owner was found to have NO DEROGATORY RECORD.",
    bodyText2: "IMPORTANT REMINDERS:\nThis clearance is subject for REVOCATION for any violation of Building Codes, DENR Guidelines and existing laws.\n\nThis Barangay Clearance for WATER CONNECTION application cannot be used as PERMIT for the subject/s to directly commence their project, unless filed with the City Engineer's Office and approved by the Mayor, City of Valenzuela.",
    hasGridLayout: false
  }
];

export const MainTemplatePage = () => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [templateData, setTemplateData] = useState<any>(null);

  const handleSelectTemplate = (template: any) => {
    setSelectedTemplateId(template.id);
    // Kapag pumili ng bago, i-reset yung tinype na variables
    setTemplateData({ ...template, variables: {} }); 
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans">
      <div className="mb-8 flex flex-wrap gap-4">
        {mockDatabase.map((template) => (
          <button 
            key={template.id}
            onClick={() => handleSelectTemplate(template)}
            className={`px-4 py-2 rounded font-semibold transition-all ${
              selectedTemplateId === template.id 
                ? "bg-blue-800 text-white shadow-md ring-2 ring-blue-300 ring-offset-2" 
                : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
            }`}
          >
            {template.name}
          </button>
        ))}
      </div>

      {templateData ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          <div className="lg:col-span-4">
             <EditorForm data={templateData} setData={setTemplateData} />
          </div>
          <div className="lg:col-span-8 overflow-auto">
             <PreviewBondPaper data={templateData} />
          </div>
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white">
          <p className="text-slate-500 font-medium">Please select a template above to start editing.</p>
        </div>
      )}
    </div>
  );
};