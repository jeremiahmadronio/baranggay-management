import { useState, useEffect } from "react";
import {
  FileText,
  Check,
  Printer,
  Maximize2,
  User,
  ClipboardList,
  Wallet,
} from "lucide-react";
import { LoadingModal } from "../reusable/LoadingModal";
import { type CertificateTemplate , fetchCertificateTemplates} from "../clearance-api/certificate-type";

export const IssueCertificatePage = () => {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const selectedTemplate = templates.find((t) => t.id === selectedId);

  useEffect(() => {
     const loadAllData = async () => {
       setLoading(true);
       try {
         const [templates] = await Promise.all([
          fetchCertificateTemplates(),
         ]);
 
         setTemplates(templates);

       } catch (error) {
         console.error("Error loading dashboard:", error);
       } finally {
         setLoading(false);
       }
     };
 
     loadAllData();
   }, []);
 
  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  if (loading)
    return <LoadingModal isOpen={true} message="Fetching templates..." />;

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        {/* HEADER & SELECTION */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
            Select Certificate Template
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {templates.map((cert) => (
              <button
                key={cert.id}
                onClick={() => {
                  setSelectedId(cert.id);
                  setFormData({});
                }}
                className={`group relative flex items-center gap-3 rounded-xl border p-4 text-left transition-all 
                  ${
                    selectedId === cert.id
                      ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors
                  ${selectedId === cert.id ? "border-blue-200 bg-white text-blue-600" : "border-slate-100 bg-slate-50 text-slate-400"}`}
                >
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-bold ${selectedId === cert.id ? "text-blue-900" : "text-slate-700"}`}
                  >
                    {cert.cert_title}
                  </p>
                  {cert.isFree && (
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">
                      Free
                    </span>
                  )}
                </div>
                {selectedId === cert.id && (
                  <div className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white ring-2 ring-white shadow-md">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* WORKSPACE */}
        {selectedTemplate ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-blue-600" />
                    Issue {selectedTemplate.cert_title}
                  </h3>
                </div>

                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <FormSection
                      title="Personal Information"
                      icon={<User className="w-3 h-3" />}
                    />
                    <InputField
                      label="Full Name"
                      placeholder="Juan P. Dela Cruz"
                      onChange={(v: string) => handleInputChange("name", v)}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <InputField
                        label="Date of Birth"
                        type="date"
                        onChange={(v: string) => handleInputChange("dob", v)}
                      />
                      <InputField
                        label="Place of Birth"
                        placeholder="City/Municipality"
                        onChange={(v: string) => handleInputChange("pob", v)}
                      />
                    </div>
                  </div>

                  {/* Dynamic Fields from JSONB */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <FormSection
                      title="Request Details"
                      icon={<ClipboardList className="w-3 h-3" />}
                    />
                    {selectedTemplate.cert_body.fields.map((field) =>
                      field.type === "select" ? (
                        <SelectField
                          key={field.key}
                          label={field.label}
                          options={field.options || []}
                          onChange={(v: string) =>
                            handleInputChange(field.key, v)
                          }
                        />
                      ) : (
                        <InputField
                          key={field.key}
                          label={field.label}
                          placeholder={field.placeholder}
                          onChange={(v: string) =>
                            handleInputChange(field.key, v)
                          }
                        />
                      ),
                    )}
                  </div>

                  {/* Payment Info */}
                  <div className="pt-4 border-t border-slate-100">
                    <FormSection
                      title="Payment"
                      icon={<Wallet className="w-3 h-3" />}
                    />
                    <div className="mt-2 flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                      <span className="text-sm text-slate-600">Total Fee:</span>
                      <span className="text-lg font-black text-slate-900">
                        ₱{selectedTemplate.cert_fee.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 border-t border-slate-100">
                  <button className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-[0.98]">
                    Issue Certificate
                  </button>
                  <p className="mt-3 text-center text-[11px] text-slate-400">
                    Ensure all data is verified before issuing.
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT: PREVIEW */}
            <div className="lg:col-span-7">
              <div className="sticky top-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Live Preview
                  </h3>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                      <Maximize2 className="h-3 w-3" /> Full Screen
                    </button>
                    <button className="flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                      <Printer className="h-3 w-3" /> Print
                    </button>
                  </div>
                </div>

                {/* THE PAPER SIMULATION */}
                {/* CONTAINER: A4 Ratio (210mm x 297mm) */}
{/* CONTAINER: Strict A4 Size (210mm x 297mm) */}
<div className="relative mx-auto w-full max-w-[210mm] aspect-[1.414/1] md:aspect-[1/1.414] bg-white shadow-2xl overflow-hidden print:shadow-none print:m-0 flex flex-col font-serif">
  
  {/* 1. COMPACT HEADER BAR (Reduced height to h-16) */}
  <div className="absolute top-0 left-0 right-0 h-16 bg-[#1e40af] flex items-center justify-between px-8 text-white z-20 shadow-sm">
    {/* Left Seals (Small but visible) */}
    <div className="flex gap-2 shrink-0">
      <div className="h-10 w-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-[6px] text-center p-1 uppercase backdrop-blur-sm">Seal 1</div>
      <div className="h-10 w-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-[6px] text-center p-1 uppercase backdrop-blur-sm">Seal 2</div>
    </div>

    {/* Center Text (Compact Hierarchy) */}
    <div className="text-center flex-1 px-2">
      <p className="text-[8px] uppercase tracking-[0.2em] font-medium opacity-90 font-sans">City of Valenzuela</p>
      <p className="text-[9px] font-bold uppercase tracking-wide font-sans">Office of the Sangguniang Barangay</p>
      <h2 className="text-xl font-black tracking-tighter uppercase italic leading-none font-sans">Barangay Ugong</h2>
    </div>

    {/* Right Seals */}
    <div className="flex gap-2 shrink-0">
      <div className="h-10 w-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-[6px] text-center p-1 uppercase backdrop-blur-sm">Seal 3</div>
      <div className="h-10 w-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-[6px] text-center p-1 uppercase backdrop-blur-sm font-bold text-yellow-400">Seal 4</div>
    </div>

    {/* Thin Diagonal Accent */}
    <div className="absolute top-0 right-0 h-full w-[35%] bg-blue-600/40 -skew-x-[25deg] translate-x-12 pointer-events-none" />
  </div>

  {/* 2. CENTER WATERMARK (Optimized) */}
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.03]">
    <div className="w-[70%] aspect-square rounded-full border-[15px] border-slate-900 flex items-center justify-center">
      <span className="text-[100px] font-black uppercase -rotate-12 tracking-tighter">UGONG</span>
    </div>
  </div>

  {/* 3. MAIN CONTENT (Lower Padding since header is smaller) */}
  <div className="relative h-full flex flex-col pt-24 pb-16 px-[12%] z-10 flex-1">
    
    {/* Document Title (Smaller but Bold) */}
    <div className="text-center mb-8">
      <h4 className="inline-block text-2xl font-sans font-black uppercase tracking-[0.15em] text-slate-900 italic border-b-4 border-double border-slate-900 px-6 pb-0.5">
        {selectedTemplate.cert_title || "Certification"}
      </h4>
    </div>

    {/* Content Area */}
    <div className="flex-1 flex flex-col text-[13px] leading-[1.6] text-slate-900">
      <p className="font-sans font-bold text-[11px] tracking-widest text-slate-500 mb-4 uppercase">
        To whom it may concern;
      </p>

      <p className="text-justify mb-6">
        This is to <span className="font-bold uppercase underline decoration-1 underline-offset-4">CERTIFY</span> that <span className="font-bold uppercase border-b-2 border-slate-900 px-2 mx-1">{formData.name || "________________________________"}</span> is a bonafide member of and the owner of <span className="italic font-bold underline underline-offset-2">motorcycle</span> with the following description:
      </p>

      {/* METADATA GRID (Compact rows) */}
      <div className="grid grid-cols-1 gap-y-1 mb-8 pl-8 py-1 border-l-2 border-slate-100">
        {Object.entries(formData).map(([k, v]) => 
          !["name", "purpose", "dob", "or_no"].includes(k) && (
            <div key={k} className="flex items-baseline gap-4 max-w-[85%] border-b border-dotted border-slate-200">
              <span className="uppercase font-sans font-black text-[10px] w-32 shrink-0 text-slate-500 tracking-tighter">{k.replace("_", " ")}</span>
              <span className="font-bold text-[14px]">: {v || "________________"}</span>
            </div>
          )
        )}
      </div>

      <p className="text-justify indent-10 mb-10">
        This <span className="font-bold uppercase tracking-tight">CERTIFICATION</span> is being issued upon the request of the above individual for the purpose of 
        <span className="font-bold italic uppercase underline underline-offset-4 mx-1"> {formData.purpose || "TRICYCLE REGULATION UNIT REGISTRATION"} </span> only.
      </p>

      {/* FOOTER ELEMENTS (Payment + Signature) */}
      <div className="mt-auto grid grid-cols-2 items-end">
        
        {/* Payment Info */}
        <div className="space-y-0.5 font-sans text-[10px] font-bold text-slate-800 border-l-4 border-blue-900 pl-3">
          <div className="flex gap-2"><span>PAID UNDER O.R. NO</span><span>: {formData.or_no || "________________"}</span></div>
          <div className="flex gap-2 italic text-slate-500"><span>ISSUED ON</span><span className="pl-6">: (MM/DD/YYYY)</span></div>
          <div className="flex gap-2 italic text-slate-500"><span>AMOUNT</span><span className="pl-10">: PHP 0.00</span></div>
        </div>

        {/* Signature Area (Properly Aligned) */}
        <div className="text-center">
          <div className="h-12 flex flex-col items-center justify-end">
             <div className="w-56 h-[1.5px] bg-slate-900 mb-1" />
          </div>
          <p className="font-black uppercase text-[15px] tracking-tight leading-none mb-0.5">
            MARICEL PINEDA - EMPERADOR
          </p>
          <p className="text-[11px] font-bold text-slate-700 tracking-wide font-sans leading-none">
            Punong Barangay
          </p>
        </div>
      </div>
    </div>
  </div>

  {/* 4. OFFICIAL FOOTER (Thinner Bar) */}
  <div className="h-8 relative overflow-hidden shrink-0">
    <div className="absolute right-0 bottom-0 bg-[#1e40af] h-full w-[55%] -skew-x-[25deg] translate-x-10 flex items-center justify-center pl-10 text-white">
        <p className="text-[11px] font-bold italic tracking-tighter translate-x-2">
            Una ang <span className="uppercase text-sky-300">KAPakanan</span> ng Mamamayan...
        </p>
    </div>
    <div className="absolute right-0 bottom-0 bg-sky-400 h-[4px] w-full" />
  </div>
</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
            <div className="mb-4 rounded-full bg-slate-50 p-4">
              <FileText className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">
              No Template Selected
            </h3>
            <p className="max-w-xs text-sm text-slate-500">
              Pumili muna ng template sa itaas para makapagsimula ng issuance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- HELPER COMPONENTS (Para malinis ang code) ---

const FormSection = ({
  title,
  icon,
}: {
  title: string;
  icon: React.ReactNode;
}) => (
  <div className="flex items-center gap-2 mb-1">
    <div className="p-1 bg-blue-50 text-blue-600 rounded">{icon}</div>
    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
      {title}
    </h4>
  </div>
);

const InputField = ({ label, type = "text", placeholder, onChange }: any) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-700">{label}</label>
    <input
      type={type}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-200 bg-slate-50/30 px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
    />
  </div>
);

const SelectField = ({ label, options, onChange }: any) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-700">{label}</label>
    <select
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-200 bg-slate-50/30 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white"
    >
      <option value="">Select {label}...</option>
      {options.map((opt: string) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

export default IssueCertificatePage;
