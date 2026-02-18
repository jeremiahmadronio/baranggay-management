import { useState } from "react";
import type { ReactNode, ChangeEvent, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

// Type definitions for form components
interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
}

interface FormSelectOption {
  value: string;
  label: string;
}
interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  required?: boolean;
  options: FormSelectOption[];
  placeholder?: string;
  error?: string;
  className?: string;
}

interface FormDatePickerProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
}

interface FormTimePickerProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
}

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
}

interface SectionCardProps {
  letter: string;
  title: string;
  children: ReactNode;
  notice?: string;
}

interface FormRowProps {
  children: ReactNode;
  cols?: 2 | 3 | 4;
}

interface RadioCardProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  title: string;
  description?: string;
}

interface DocketInfoField {
  label: string;
  value: string;
  hint?: string;
}
interface DocketInfoCardProps {
  fields: DocketInfoField[];
}

interface FormActionsProps {
  onCancel: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

interface SectionDividerProps {
  label: string;
}


export const FormInput = ({ label, required, hint, error, className = "", ...props }: FormInputProps) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      {...props}
      className={`w-full rounded-md border ${error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"} px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all ${className}`}
    />
    {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

export const FormSelect = ({ label, required, options, placeholder = "Select...", error, className = "", ...props }: FormSelectProps) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      {...props}
      className={`w-full rounded-md border ${error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"} px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

export const FormDatePicker = ({ label, required, error, className = "", ...props }: FormDatePickerProps) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type="date"
      required={required}
      {...props}
      className={`w-full rounded-md border ${error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"} px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all ${className}`}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

export const FormTimePicker = ({ label, required, error, className = "", ...props }: FormTimePickerProps) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type="time"
      required={required}
      {...props}
      className={`w-full rounded-md border ${error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"} px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all ${className}`}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

export const FormTextarea = ({ label, required, error, className = "", ...props }: FormTextareaProps) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea
      {...props}
      className={`w-full rounded-md border ${error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"} px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none ${className}`}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

export const SectionCard = ({ letter, title, children, notice }: SectionCardProps) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5">
    <div className="flex items-center gap-3">
      <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center shrink-0">
        {letter}
      </span>
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
    </div>
    {notice && (
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-md px-4 py-3 text-sm text-blue-700">
        <svg className="mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8.01"/><line x1="12" y1="12" x2="12" y2="16"/>
        </svg>
        <span>{notice}</span>
      </div>
    )}
    {children}
  </div>
);

const colsMap = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" };
export const FormRow = ({ children, cols = 2 }: FormRowProps) => (
  <div className={`grid ${colsMap[cols]} gap-4`}>{children}</div>
);

export const RadioCard = ({ name, value, checked, onChange, title, description }: RadioCardProps) => (
  <label className={`flex items-start gap-3 rounded-xl border-2 px-5 py-4 cursor-pointer transition-all ${checked ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
    <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="mt-0.5 accent-blue-600" />
    <div>
      <p className={`text-sm font-semibold ${checked ? "text-blue-700" : "text-gray-700"}`}>{title}</p>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
  </label>
);

export const DocketInfoCard = ({ fields }: DocketInfoCardProps) => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg px-5 py-4 grid grid-cols-3 gap-4">
    {fields.map((f) => (
      <div key={f.label}>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{f.label}</p>
        <p className="text-sm font-semibold text-gray-800">{f.value}</p>
        {f.hint && <p className="text-xs text-gray-400">{f.hint}</p>}
      </div>
    ))}
  </div>
);

export const FormActions = ({ onCancel, onSaveDraft, onSubmit, submitLabel = "Save & Record Entry", isSubmitting = false }: FormActionsProps) => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-6 py-4 flex items-center justify-between">
    <button type="button" onClick={onCancel} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
      </svg>
      Cancel
    </button>
    <div className="flex items-center gap-3">
      <button type="button" onClick={onSaveDraft} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-all">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
        </svg>
        Save as Draft
      </button>
      <button type="button" onClick={onSubmit} disabled={isSubmitting} className="flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-5 py-2.5 rounded-lg transition-all shadow-sm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </div>
  </div>
);

export const SectionDivider = ({ label }: SectionDividerProps) => (
  <div className="flex items-center gap-3 mt-2">
    <div className="h-px flex-1 bg-gray-100" />
    <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">{label}</span>
    <div className="h-px flex-1 bg-gray-100" />
  </div>
);

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Prefer not to say" },
];
const CIVIL_STATUS_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "widowed", label: "Widowed" },
  { value: "separated", label: "Separated" },
];
const RELATIONSHIP_OPTIONS = [
  { value: "spouse", label: "Spouse / Partner" },
  { value: "parent", label: "Parent" },
  { value: "child", label: "Child" },
  { value: "sibling", label: "Sibling" },
  { value: "neighbor", label: "Neighbor" },
  { value: "acquaintance", label: "Acquaintance" },
  { value: "stranger", label: "Stranger / Unknown" },
];
const NATURE_OPTIONS = [
  { value: "physical", label: "Physical Assault" },
  { value: "verbal", label: "Verbal Abuse" },
  { value: "theft", label: "Theft / Robbery" },
  { value: "vawc", label: "VAWC" },
  { value: "trespassing", label: "Trespassing" },
  { value: "other", label: "Other" },
];
const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];
const ACTION_OPTIONS = [
  { value: "mediation", label: "Mediation / Settlement" },
  { value: "referral", label: "Referral to Higher Authority" },
  { value: "blotter", label: "Blotter Entry Only" },
  { value: "restraining", label: "Restraining Order Issued" },
];
const OFFICER_OPTIONS = [
  { value: "cruz", label: "Off. Maria Cruz" },
  { value: "santos", label: "Off. Juan Santos" },
  { value: "reyes", label: "Off. Ana Reyes" },
];

export default function NewBlotterEntryPage() {
  const [complaintType, setComplaintType] = useState("formal");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-800">New Blotter Entry</h1>
          <p className="text-xs text-gray-400">Fill out the form below to create a new record.</p>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="px-6 pt-5 max-w-4xl mx-auto">
        <div className="flex items-start gap-2 rounded-md px-4 py-3 text-sm bg-amber-50 border border-amber-200 text-amber-800">
          <svg className="mt-0.5 shrink-0 text-amber-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p><span className="font-semibold">Privacy Notice: </span>In compliance with RA 9262 (Anti-VAWC Act) and the Data Privacy Act of 2012, all records display victim initials only. Full details are accessible only to authorized personnel.</p>
        </div>
      </div>

      {/* Form Body */}
      <div className="px-6 py-5 flex flex-col gap-5 max-w-4xl mx-auto">

        {/* Complaint Type */}
        <div className="grid grid-cols-2 gap-4">
          <RadioCard name="complaint_type" value="formal" checked={complaintType === "formal"} onChange={() => setComplaintType("formal")} title="Formal Complaint" description="May Paanyaya at Salaysay – Irerefer sa Lupon" />
          <RadioCard name="complaint_type" value="record" checked={complaintType === "record"} onChange={() => setComplaintType("record")} title="For the Record Only" description="Para sa rekord lang – Walang formal na aksyon" />
        </div>

        {/* A — Docket Information */}
        <SectionCard letter="A" title="Docket Information">
          <DocketInfoCard fields={[
            { label: "Docket Number", value: "2026-BLT-0016", hint: "(auto-generated)" },
            { label: "Date Reported", value: "02/17/2026", hint: "(today)" },
            { label: "Filing Officer", value: "Off. Maria Cruz", hint: "(logged in)" },
          ]} />
        </SectionCard>

        {/* B — Complainant Details */}
        <SectionCard letter="B" title="Complainant Details">
          <FormRow cols={3}>
            <FormInput label="Last Name" required />
            <FormInput label="First Name" required />
            <FormInput label="Middle Name" />
          </FormRow>
          <FormRow cols={2}>
            <FormInput label="Suffix (Jr./Sr./III)" />
            <FormInput label="Alias/Nickname" placeholder="(optional)" />
          </FormRow>
          <FormRow cols={4}>
            <FormInput label="Age" required type="number" />
            <FormDatePicker label="Date of Birth" />
            <FormSelect label="Gender" required options={GENDER_OPTIONS} />
            <FormSelect label="Civil Status" required options={CIVIL_STATUS_OPTIONS} />
          </FormRow>
          <FormRow cols={2}>
            <FormInput label="Contact Number" required placeholder="09XXXXXXXXX" />
            <FormInput label="Occupation" placeholder="(optional)" />
          </FormRow>
          <SectionDivider label="Complete Address" />
          <FormInput label="House No. & Street" required />
          <FormRow cols={3}>
            <FormInput label="Purok/Zone" />
            <FormInput label="Barangay" defaultValue="Barangay 6" />
            <FormInput label="Municipality" defaultValue="Manila" />
          </FormRow>
        </SectionCard>

        {/* C — Respondent Details */}
        <SectionCard letter="C" title="Respondent Details" notice="Punan ang available na impormasyon. Kung hindi kilala ang respondent, ilagay ang 'Unknown'.">
          <FormRow cols={3}>
            <FormInput label="Last Name" />
            <FormInput label="First Name" />
            <FormInput label="Middle Name" />
          </FormRow>
          <FormRow cols={2}>
            <FormInput label="Suffix" />
            <FormInput label="Alias/Nickname" />
          </FormRow>
          <FormRow cols={4}>
            <FormInput label="Age (approx)" type="number" />
            <FormDatePicker label="Date of Birth" />
            <FormSelect label="Gender" options={GENDER_OPTIONS} />
            <FormSelect label="Civil Status" options={CIVIL_STATUS_OPTIONS} />
          </FormRow>
          <FormRow cols={2}>
            <FormInput label="Contact Number" placeholder="(if known)" />
            <FormInput label="Occupation" placeholder="(if known)" />
          </FormRow>
          <SectionDivider label="Address & Relationship" />
          <FormInput label="House No. & Street" />
          <FormRow cols={3}>
            <FormInput label="Purok/Zone" />
            <FormInput label="Barangay" />
            <FormInput label="Municipality" />
          </FormRow>
          <FormSelect label="Relationship to Complainant" required options={RELATIONSHIP_OPTIONS} />
        </SectionCard>

        {/* D — Incident Details */}
        <SectionCard letter="D" title="Incident Details">
          <FormRow cols={3}>
            <FormSelect label="Nature of Complaint" required options={NATURE_OPTIONS} />
            <FormDatePicker label="Date of Incident" required />
            <FormTimePicker label="Time of Incident" required />
          </FormRow>
          <FormInput label="Location / Place of Incident" required placeholder="Ex: Sa harap ng 123 Rizal St., Purok 3" />
          <FormTextarea label="Narrative / Statement of Facts" required placeholder="Ilagay ang buong salaysay ng pangyayari..." rows={5} />
        </SectionCard>

        {/* E — Action Taken */}
        <SectionCard letter="E" title="Action Taken / Aksyon Ginawa">
          <FormRow cols={2}>
            <FormSelect label="Assigned Officer" required options={OFFICER_OPTIONS} defaultValue="cruz" />
            <FormSelect label="Priority Level" options={PRIORITY_OPTIONS} defaultValue="normal" />
          </FormRow>
          <FormSelect label="Initial Action Taken" required options={ACTION_OPTIONS} />
          <FormTextarea label="Remarks / Karagdagang Puna" placeholder="(optional)" rows={3} />
          <FormRow cols={2}>
            <FormDatePicker label="Hearing Date (optional)" />
            <FormTimePicker label="Hearing Time (optional)" />
          </FormRow>
        </SectionCard>

        {/* Form Actions */}
        <FormActions
          onCancel={() => alert("Cancelled")}
          onSaveDraft={() => alert("Saved as draft!")}
          onSubmit={() => alert("Entry recorded!")}
        />
      </div>
    </div>
  );
}