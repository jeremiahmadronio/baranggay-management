import React, { useState } from "react";
import {
  Printer,
  Save,
  RotateCcw,
  Layout,
  Type,
  UserCheck,
} from "lucide-react";

export const EditTemplatePage = () => {
  const [editingData, setEditingData] = useState({
    cert_title: "BARANGAY CLEARANCE",
    opening_statement:
      "This is to CERTIFY that the person whose name and signature, right thumbmark and picture appeared herein is a bonafide resident of this barangay, requesting for a record and clearance from this office to wit:",
    closing_statement:
      "This is to further certify that upon verification of the records filed in this office, subject individual have: NO DEROGATORY RECORD",
    signatory_name: "MARICEL PINEDA - EMPERADOR",
    signatory_position: "Punong Barangay",
    footer_text: "Una ang KAPakanan ng Mamamayan...",
    clearance_no: "__________",
    cert_fee: "100.00",
    valid_until: "",
    top_fields: [
      { label: "NAME", key: "{{FULL_NAME}}" },
      { label: "ADDRESS", key: "{{ADDRESS}}" },
      { label: "DATE OF BIRTH", key: "{{DOB}}" },
      { label: "PLACE OF BIRTH", key: "{{POB}}" },
      { label: "PURPOSE", key: "{{PURPOSE}}" },
      { label: "RESIDENCY DATE", key: "{{RESIDENCY_DATE}}" },
    ],
    bottom_fields: [
      { label: "Com. Tax No.", key: "{{COM_TAX_NO}}" },
      { label: "Issued At", key: "{{ISSUED_AT}}" },
      { label: "Issued On", key: "{{ISSUED_ON}}" },
      { label: "O.R. No.", key: "{{OR_NO}}" },
      { label: "O.R. Date", key: "{{OR_DATE}}" },
      { label: "Valid Until", key: "{{VALID_UNTIL}}" },
    ],
  });

  const handleChange = (field: string, value: string) => {
    setEditingData({ ...editingData, [field]: value });
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-8 font-sans">
      <div className="mx-auto max-w-[1500px] grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* EDITOR SIDEBAR */}
        <div className="xl:col-span-4 flex flex-col" style={{ height: 'calc(100vh - 2rem)' }}>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1 min-h-0">
            <div className="flex items-center mb-6">
              <h2 className="font-black text-slate-800 uppercase tracking-tight flex-1">
                System Configuration
              </h2>
            </div>
            <div className="space-y-6 flex-1 pr-2">
              <h3 className="text-base font-bold text-blue-700 mb-2">
                Certificate Template Settings
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600">
                    Certificate Title
                  </label>
                  <input
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm font-bold focus:border-blue-500 outline-none uppercase bg-slate-50"
                    value={editingData.cert_title}
                    onChange={(e) => handleChange("cert_title", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600">
                    Opening Statement
                  </label>
                  <textarea
                    rows={3}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500 bg-slate-50"
                    value={editingData.opening_statement}
                    onChange={(e) =>
                      handleChange("opening_statement", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600">
                    Closing Statement
                  </label>
                  <textarea
                    rows={2}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500 bg-slate-50"
                    value={editingData.closing_statement}
                    onChange={(e) =>
                      handleChange("closing_statement", e.target.value)
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600">
                      Punong Barangay Name
                    </label>
                    <input
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold bg-slate-50"
                      value={editingData.signatory_name}
                      onChange={(e) =>
                        handleChange("signatory_name", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600">
                      Position
                    </label>
                    <input
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-slate-50"
                      value={editingData.signatory_position}
                      onChange={(e) =>
                        handleChange("signatory_position", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600">
                      Certificate Fee (₱)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-slate-50"
                      value={editingData.cert_fee}
                      onChange={(e) => handleChange("cert_fee", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600">
                      Valid Until
                    </label>
                    <input
                      type="date"
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-slate-50"
                      value={editingData.valid_until}
                      onChange={(e) =>
                        handleChange("valid_until", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600">
                    Clearance No. Variable
                  </label>
                  <input
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-slate-50"
                    value={editingData.clearance_no}
                    onChange={(e) =>
                      handleChange("clearance_no", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600">
                    Footer Text
                  </label>
                  <input
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-slate-50"
                    value={editingData.footer_text}
                    onChange={(e) =>
                      handleChange("footer_text", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
            <div className="pt-6 flex-shrink-0">
              <button className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-blue-100 transition-all active:scale-95">
                <Save size={16} /> SAVE TEMPLATE
              </button>
            </div>
          </div>
        </div>

        {/* PREVIEW AREA */}
        <div className="xl:col-span-8 flex flex-col items-center">
          <div className="mb-4 flex gap-4">
            <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-xs font-bold text-slate-600 shadow-sm">
              <Printer size={16} /> PRINT PREVIEW
            </button>
          </div>

          <div className="w-full max-w-[210mm] aspect-[1/1.414] bg-white shadow-2xl relative overflow-hidden flex flex-col p-0 border border-slate-300">
            <div className="h-20 bg-[#1e40af] flex items-center justify-between px-8 text-white relative z-10">
              <div className="flex gap-2">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[6px]">
                  SEAL 1
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[6px]">
                  SEAL 2
                </div>
              </div>
              <div className="text-center">
                <p className="text-[8px] tracking-[0.3em] font-light">
                  CITY OF VALENZUELA
                </p>
                <p className="text-[9px] font-bold tracking-widest uppercase opacity-80">
                  Office of the Sangguniang Barangay
                </p>
                <h2 className="text-xl font-black italic uppercase leading-none">
                  Barangay Ugong
                </h2>
              </div>
              <div className="flex gap-2">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[6px]">
                  SEAL 3
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[6px]">
                  SEAL 4
                </div>
              </div>
            </div>

            {/* 2. WATERMARK */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] z-0">
              <div className="w-[80%] aspect-square border-[15px] border-black rounded-full flex items-center justify-center">
                <span className="text-[120px] font-black -rotate-12">
                  UGONG
                </span>
              </div>
            </div>

            {/* 3. BODY CONTENT */}
            <div className="relative z-10 px-14 py-10 flex flex-col h-full text-slate-800">
              {/* Photo Box - moved to top right above title, smaller size */}
              <div className="absolute top-8 right-10 w-[0.85in] h-[0.85in] border-2 border-slate-800 bg-white flex items-center justify-center shadow-md">
                <span className="text-[9px] text-slate-300 font-sans italic">
                  PHOTO
                </span>
              </div>

              {/* Title Section */}
              <div className="text-center mt-6 mb-10">
                <h1 className="text-2xl font-black italic uppercase tracking-widest border-b-4 border-double border-slate-900 inline-block px-10 pb-1">
                  {editingData.cert_title}
                </h1>
              </div>

              {/* Opening */}
              <p className="text-[13px] leading-relaxed text-justify mb-8 font-serif">
                {editingData.opening_statement}
              </p>

              {/* FIXED METADATA FIELDS (Top Section) */}
              <div className="space-y-1 mb-10 pl-6 font-serif">
                {editingData.top_fields.map((f) => (
                  <div key={f.label} className="flex items-start text-[14px]">
                    <span className="w-36 font-bold uppercase shrink-0">
                      {f.label}
                    </span>
                    <span className="mr-2">:</span>
                    <span className="text-blue-600 font-bold underline decoration-slate-300 decoration-dotted flex-1">
                      {f.key}
                    </span>
                  </div>
                ))}
              </div>

              {/* Applicant Signature Section (Middle) */}
              <div className="flex flex-row items-center justify-center mb-8 gap-6 relative">
                <div className="flex flex-col items-center">
                  <div className="w-72 border-b-2 border-slate-900 mb-1" />
                  <p className="text-[10px] font-bold uppercase font-sans">
                    Applicant's Signature Over Printed Name
                  </p>
                  <p className="text-[11px] font-bold font-sans mt-1">
                    Clearance No. :{" "}
                    <span className="text-blue-600 px-2">
                      {editingData.clearance_no}
                    </span>
                  </p>
                </div>
                {/* Thumbmark Box - right side of signature, same size as photo */}
                <div className="w-[0.85in] h-[0.85in] border-2 border-slate-800 bg-white flex items-center justify-center shadow-md ml-4">
                  <span className="text-[9px] text-slate-300 font-sans italic">
                    THUMBMARK
                  </span>
                </div>
              </div>

              {/* Closing / Derogatory */}
              <p className="text-[13px] leading-relaxed text-justify mb-8 font-serif font-bold italic">
                {editingData.closing_statement}
              </p>

              {/* FOOTER DATA (Bottom Section) */}
              <div className="mt-auto flex flex-row items-end pb-8 w-full">
                {/* Tax/OR Info */}
                <div className="flex-1 space-y-1 pl-4 font-serif">
                  {editingData.bottom_fields.map((f) => (
                    <div key={f.label} className="flex text-[11px]">
                      <span className="w-24 shrink-0 font-bold">{f.label}</span>
                      <span className="mr-2">:</span>
                      <span className="text-blue-600 font-bold">{f.key}</span>
                    </div>
                  ))}
                </div>
                {/* Signatory Area - pushed to the right */}
                <div
                  className="flex flex-col items-center text-center ml-auto pr-12"
                  style={{ minWidth: "260px" }}
                >
                  <div className="w-full border-b-2 border-slate-900 mb-1" />
                  <p className="text-[14px] font-black uppercase tracking-tighter">
                    {editingData.signatory_name}
                  </p>
                  <p className="text-[11px] font-medium font-sans italic">
                    {editingData.signatory_position}
                  </p>
                </div>
              </div>
            </div>

            {/* 4. FOOTER BAR */}
            <div className="h-10 relative overflow-hidden shrink-0">
              <div className="absolute right-0 bottom-0 bg-[#1e40af] h-full w-[65%] -skew-x-[25deg] translate-x-10 flex items-center justify-center pl-10 text-white">
                <p className="text-[11px] font-bold italic translate-x-2">
                  Una ang{" "}
                  <span className="text-sky-300 uppercase">KAPakanan</span> ng
                  Mamamayan...
                </p>
              </div>
              <div className="absolute right-0 bottom-0 bg-sky-400 h-[4px] w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTemplatePage;
