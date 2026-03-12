import { useState, useEffect } from "react";
import type {
  ReactNode,
  ChangeEvent,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import {
  getNatureOfComplaintOptions,
  getEvidenceTypeOptions,
  submitForTheRecord,
  submitFormalComplaint,
  type NatureOptionDTO,
  type EvidenceOptionDTO,
  type WitnessEntry,
} from "../blotter-api/BlotterFormComplaint";

// ─── Reusable Component Types ────────────────────────────────────────────────

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
  hint?: string;
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
  onSubmit: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  mode?: "record" | "formal";
}
interface SectionDividerProps {
  label: string;
}

// ─── Reusable Components ─────────────────────────────────────────────────────

export const FormInput = ({
  label,
  required,
  hint,
  error,
  className = "",
  ...props
}: FormInputProps) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <input
      {...props}
      className={`w-full rounded-md border ${
        error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
      } px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all ${className}`}
    />
    {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
  </div>
);

export const FormSelect = ({
  label,
  required,
  options,
  placeholder = "Select...",
  error,
  className = "",
  ...props
}: FormSelectProps) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <select
      {...props}
      className={`w-full rounded-md border ${
        error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
      } px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
  </div>
);

export const FormDatePicker = ({
  label,
  required,
  error,
  className = "",
  ...props
}: FormDatePickerProps) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <input
      type="date"
      required={required}
      {...props}
      className={`w-full rounded-md border ${
        error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
      } px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all ${className}`}
    />
    {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
  </div>
);

export const FormTimePicker = ({
  label,
  required,
  error,
  className = "",
  ...props
}: FormTimePickerProps) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <input
      type="time"
      required={required}
      {...props}
      className={`w-full rounded-md border ${
        error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
      } px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all ${className}`}
    />
    {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
  </div>
);

export const FormTextarea = ({
  label,
  required,
  error,
  hint,
  className = "",
  ...props
}: FormTextareaProps) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <textarea
      {...props}
      className={`w-full rounded-md border ${
        error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
      } px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none ${className}`}
    />
    {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
  </div>
);

export const SectionCard = ({
  letter,
  title,
  children,
  notice,
}: SectionCardProps) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
      <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
        {letter}
      </span>
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
        {title}
      </h2>
    </div>
    <div className="p-6 flex flex-col gap-4">
      {notice && (
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-md px-4 py-3 text-sm text-blue-700">
          <svg
            className="mt-0.5 shrink-0"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="8.01" />
            <line x1="12" y1="12" x2="12" y2="16" />
          </svg>
          <span>{notice}</span>
        </div>
      )}
      {children}
    </div>
  </div>
);

const colsMap = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" };
export const FormRow = ({ children, cols = 2 }: FormRowProps) => (
  <div className={`grid ${colsMap[cols]} gap-4`}>{children}</div>
);

export const RadioCard = ({
  name,
  value,
  checked,
  onChange,
  title,
  description,
}: RadioCardProps) => (
  <label
    className={`flex items-start gap-3 rounded-xl border-2 px-5 py-4 cursor-pointer transition-all ${
      checked
        ? "border-blue-500 bg-blue-50"
        : "border-gray-200 bg-white hover:border-gray-300"
    }`}
  >
    <input
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      className="mt-0.5 accent-blue-600"
    />
    <div>
      <p className={`text-sm font-semibold ${checked ? "text-blue-700" : "text-gray-700"}`}>
        {title}
      </p>
      {description && (
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      )}
    </div>
  </label>
);

export const DocketInfoCard = ({ fields }: DocketInfoCardProps) => (
  <div
    className="bg-gray-50 border border-gray-200 rounded-lg px-5 py-4 grid gap-4"
    style={{ gridTemplateColumns: `repeat(${fields.length}, minmax(0, 1fr))` }}
  >
    {fields.map((f) => (
      <div key={f.label}>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
          {f.label}
        </p>
        <p className="text-sm font-semibold text-gray-800">{f.value}</p>
        {f.hint && <p className="text-xs text-gray-400">{f.hint}</p>}
      </div>
    ))}
  </div>
);

export const FormActions = ({
  onCancel,
  onSubmit,
  submitLabel = "Save & Record Entry",
  isSubmitting = false,
  mode = "record",
}: FormActionsProps) => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-6 py-4 flex items-center justify-between">
    <p className="text-xs text-gray-400">
      Fields marked with <span className="text-red-500 font-semibold">*</span> are required.
    </p>
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        Cancel
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className={`flex items-center gap-2 text-sm font-semibold text-white disabled:opacity-60 px-5 py-2.5 rounded-lg transition-all shadow-sm ${
          mode === "formal"
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-gray-800 hover:bg-gray-900"
        }`}
      >
        {isSubmitting ? (
          <>
            <svg
              className="animate-spin"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            Saving...
          </>
        ) : (
          <>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            {submitLabel}
          </>
        )}
      </button>
    </div>
  </div>
);

export const SectionDivider = ({ label }: SectionDividerProps) => (
  <div className="flex items-center gap-3 mt-1">
    <div className="h-px flex-1 bg-gray-100" />
    <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">
      {label}
    </span>
    <div className="h-px flex-1 bg-gray-100" />
  </div>
);

// ─── Static Options ──────────────────────────────────────────────────────────

const GENDER_OPTIONS: FormSelectOption[] = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Prefer not to say" },
];
const CIVIL_STATUS_OPTIONS: FormSelectOption[] = [
  { value: "Single", label: "Single" },
  { value: "Married", label: "Married" },
  { value: "Widowed", label: "Widowed" },
  { value: "Separated", label: "Separated" },
];
const RELATIONSHIP_OPTIONS: FormSelectOption[] = [
  { value: "Spouse / Partner", label: "Spouse / Partner" },
  { value: "Parent", label: "Parent" },
  { value: "Child", label: "Child" },
  { value: "Sibling", label: "Sibling" },
  { value: "Neighbor", label: "Neighbor" },
  { value: "Acquaintance", label: "Acquaintance" },
  { value: "Stranger / Unknown", label: "Stranger / Unknown" },
];
const FREQUENCY_OPTIONS: FormSelectOption[] = [
  { value: "First Time", label: "First Time" },
  { value: "Second Time", label: "Second Time" },
  { value: "Third Time", label: "Third Time" },
  { value: "Recurring", label: "Recurring / Multiple Times" },
];

// ─── Main Form ────────────────────────────────────────────────────────────────

type Mode = "record" | "formal";
type Errors = Record<string, string>;

export default function BlotterEntryForm() {
  const [showAllEvidence, setShowAllEvidence] = useState(false);
  const [mode, setMode] = useState<Mode>("record");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Validation errors ──
  const [errors, setErrors] = useState<Errors>({});
  const clearErr = (key: string) =>
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

  // ── Options from API ──
  const [natureOptions, setNatureOptions] = useState<NatureOptionDTO[]>([]);
  const [evidenceOptions, setEvidenceOptions] = useState<EvidenceOptionDTO[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  // ── Complainant ──
  const [cLastName, setCLastName] = useState("");
  const [cFirstName, setCFirstName] = useState("");
  const [cMiddleName, setCMiddleName] = useState("");
  const [cContact, setCContact] = useState("");
  const [cAge, setCAge] = useState("");
  const [cGender, setCGender] = useState("");
  const [cCivilStatus, setCCivilStatus] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cAddress, setCAddress] = useState("");

  // ── Respondent – For the Record (simple) ──
  const [rFullName, setRFullName] = useState("");
  const [rContact, setRContact] = useState("");
  const [rRelationship, setRRelationship] = useState("");
  const [rAddress, setRAddress] = useState("");

  // ── Respondent – Formal (full) ──
  const [rLastName, setRLastName] = useState("");
  const [rFirstName, setRFirstName] = useState("");
  const [rMiddleName, setRMiddleName] = useState("");
  const [rAlias, setRAlias] = useState("");
  const [rAge, setRAge] = useState("");
  const [rDob, setRDob] = useState("");
  const [rGender, setRGender] = useState("");
  const [rCivilStatus, setRCivilStatus] = useState("");
  const [rOccupation, setROccupation] = useState("");
  const [rFormalContact, setRFormalContact] = useState("");
  const [rFormalAddress, setRFormalAddress] = useState("");
  const [rFormalRelationship, setRFormalRelationship] = useState("");
  const [livingWith, setLivingWith] = useState<"true" | "false" | "">("");

  // ── Incident ──
  const [natureId, setNatureId] = useState("");
  const [dateOfIncident, setDateOfIncident] = useState("");
  const [timeOfIncident, setTimeOfIncident] = useState("");
  const [placeOfIncident, setPlaceOfIncident] = useState("");
  const [frequency, setFrequency] = useState("");
  const [injuryDesc, setInjuryDesc] = useState("");

  // ── Narrative ──
  const [narrative, setNarrative] = useState("");

  // ── Evidence ──
  const [selectedEvidence, setSelectedEvidence] = useState<Set<number>>(new Set());
  const [customEvidence, setCustomEvidence] = useState("");

  // ── Witnesses (formal) ──
  const [witnesses, setWitnesses] = useState<WitnessEntry[]>([
    { firstName: "", lastName: "", contactNumber: "", address: "" },
  ]);

  // ── Certification (formal) ──
  const [certified, setCertified] = useState(false);

  const today = new Date();
  const formattedDate = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;
  const formattedTime = today
    .toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
    .toLowerCase();

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [natures, evidences] = await Promise.all([
          getNatureOfComplaintOptions(),
          getEvidenceTypeOptions(),
        ]);
        setNatureOptions(natures);
        setEvidenceOptions(evidences);
      } catch (err) {
        console.error("Failed to load options:", err);
      } finally {
        setOptionsLoading(false);
      }
    };
    fetchOptions();
  }, []);

  const natureSelectOptions: FormSelectOption[] = natureOptions.map((n) => ({
    value: String(n.id),
    label: n.natureName,
  }));

  const toggleEvidence = (id: number) => {
    setSelectedEvidence((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addWitness = () =>
    setWitnesses((w) => [
      ...w,
      { firstName: "", lastName: "", contactNumber: "", address: "" },
    ]);
  const removeWitness = (i: number) =>
    setWitnesses((w) => w.filter((_, idx) => idx !== i));
  const updateWitness = (i: number, field: keyof WitnessEntry, value: string) =>
    setWitnesses((w) =>
      w.map((wit, idx) => (idx === i ? { ...wit, [field]: value } : wit))
    );

  const buildEvidenceIds = (): (string | number)[] => {
    const ids: (string | number)[] = Array.from(selectedEvidence);
    if (customEvidence.trim()) ids.push(customEvidence.trim());
    return ids;
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Errors = {};

    // Complainant — required in both modes
    if (!cLastName.trim())    e.cLastName  = "Last name is required.";
    if (!cFirstName.trim())   e.cFirstName = "First name is required.";
    if (!cContact.trim())     e.cContact   = "Contact number is required.";
    if (!cAddress.trim())     e.cAddress   = "Complete address is required.";

    // Respondent
    if (mode === "record") {
      if (!rFullName.trim())  e.rFullName  = "Respondent name is required.";
    } else {
      if (!rLastName.trim())  e.rLastName  = "Last name is required.";
      if (!rFirstName.trim()) e.rFirstName = "First name is required.";
      if (!rFormalRelationship) e.rFormalRelationship = "Relationship is required.";
    }

    // Incident
    if (!natureId)                e.natureId       = "Nature of complaint is required.";
    if (!dateOfIncident)          e.dateOfIncident = "Date of incident is required.";
    if (!placeOfIncident.trim())  e.placeOfIncident = "Place of incident is required.";

    // Narrative
    if (!narrative.trim())    e.narrative  = "Statement of facts is required.";

    // Formal only
    if (mode === "formal" && !certified) e.certified = "You must certify before filing.";

    setErrors(e);

    if (Object.keys(e).length > 0) {
      // Scroll to the first error field
      const firstKey = Object.keys(e)[0];
      document
        .getElementById(`field-${firstKey}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    return Object.keys(e).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      let blotterNumber: string;
      if (mode === "record") {
        const parts = rFullName.trim().split(/\s+/);
        blotterNumber = await submitForTheRecord({
          firstName: cFirstName,
          lastName: cLastName,
          middleName: cMiddleName || undefined,
          contactNumber: cContact,
          age: cAge ? parseInt(cAge) : 0,
          gender: cGender || undefined,
          civilStatus: cCivilStatus || undefined,
          email: cEmail || undefined,
          completeAddress: cAddress,
          respondentFirstName: parts[0] ?? "Unknown",
          respondentLastName: parts.slice(1).join(" ") || "Unknown",
          respondentContact: rContact || undefined,
          relationshipToComplainant: rRelationship || undefined,
          respondentAddress: rAddress || undefined,
          natureOfComplaintId: Number(natureId),
          dateOfIncident,
          timeOfIncident: timeOfIncident ? `${timeOfIncident}:00` : undefined,
          placeOfIncident,
          narrativeStatement: narrative,
          evidenceTypeIds: buildEvidenceIds().length ? buildEvidenceIds() : undefined,
        });
      } else {
        blotterNumber = await submitFormalComplaint({
          complainantFirstName: cFirstName,
          complainantLastName: cLastName,
          complainantMiddleName: cMiddleName || undefined,
          complainantContact: cContact,
          complainantAge: cAge ? parseInt(cAge) : undefined,
          complainantGender: cGender || undefined,
          complainantCivilStatus: cCivilStatus || undefined,
          complainantEmail: cEmail || undefined,
          complainantAddress: cAddress,
          respondentFirstName: rFirstName,
          respondentLastName: rLastName,
          respondentMiddleName: rMiddleName || undefined,
          respondentAlias: rAlias || undefined,
          respondentAge: rAge ? parseInt(rAge) : undefined,
          respondentDob: rDob || undefined,
          respondentGender: rGender || undefined,
          respondentCivilStatus: rCivilStatus || undefined,
          respondentOccupation: rOccupation || undefined,
          respondentContact: rFormalContact || undefined,
          respondentAddress: rFormalAddress || undefined,
          relationshipTypeName: rFormalRelationship || undefined,
          livingWithComplainant: livingWith !== "" ? livingWith === "true" : undefined,
          natureOfComplaintId: Number(natureId),
          dateOfIncident,
          timeOfIncident: timeOfIncident ? `${timeOfIncident}:00` : undefined,
          placeOfIncident,
          frequencyOfIncident: frequency || undefined,
          descriptionOfInjuries: injuryDesc || undefined,
          narrativeStatement: narrative,
          evidenceTypeIds: buildEvidenceIds().length ? buildEvidenceIds() : undefined,
          witnesses: witnesses.filter((w) => w.firstName || w.lastName),
          certifiedTrue: certified,
        });
      }
      setSubmitSuccess(`Entry saved successfully! Blotter No.: ${blotterNumber}`);
    } catch (err: any) {
      setSubmitError(err.message || "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col gap-5">

        {/* ── Privacy Notice ── */}
        <div className="flex items-start gap-2 rounded-lg px-4 py-3 text-sm bg-amber-50 border border-amber-200 text-amber-800">
          <svg className="mt-0.5 shrink-0 text-amber-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>
            <span className="font-semibold">Privacy Notice: </span>
            In compliance with RA 9262 (Anti-VAWC Act) and the Data Privacy Act of 2012, all
            records display victim initials only. Full details are accessible only to authorized
            personnel.
          </p>
        </div>

        {/* ── Mode Selector ── */}
        <div className="grid grid-cols-2 gap-4">
          <RadioCard
            name="complaint_type"
            value="record"
            checked={mode === "record"}
            onChange={() => { setMode("record"); setErrors({}); }}
            title="For the Record Only"
            description="Walk-in consultation or blotter entry without formal complaint yet. (Para sa rekord lang)"
          />
          <RadioCard
            name="complaint_type"
            value="formal"
            checked={mode === "formal"}
            onChange={() => { setMode("formal"); setErrors({}); }}
            title="Formal Complaint"
            description="Formal complaint requiring barangay intervention. May involve mediation or legal action."
          />
        </div>

        {/* ── Confidentiality reminder (formal only) ── */}
        {mode === "formal" && (
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
            <svg className="mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>
              <span className="font-semibold">Confidentiality Reminder: </span>
              Handle this information with utmost confidentiality. Do not share victim information
              with unauthorized persons. Violation is punishable under R.A. 9262.
            </p>
          </div>
        )}

        {/* ── Submit feedback banners ── */}
        {submitSuccess && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-300 text-green-800 rounded-lg px-5 py-3 text-sm font-medium">
            <svg className="w-4 h-4 shrink-0 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {submitSuccess}
          </div>
        )}
        {submitError && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-300 text-red-700 rounded-lg px-5 py-3 text-sm font-medium">
            <svg className="w-4 h-4 shrink-0 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {submitError}
          </div>
        )}

        {/* ── A — Docket / Case Information ── */}
        <SectionCard letter="A" title={mode === "record" ? "Docket Information" : "Case Information"}>
          <DocketInfoCard
            fields={[
              { label: mode === "record" ? "Blotter Number" : "Case / Blotter Number", value: "2026-BLT-0016", hint: "(auto-generated)" },
              { label: mode === "record" ? "Date Reported" : "Date Filed", value: formattedDate, hint: "(today)" },
              { label: mode === "record" ? "Time Reported" : "Time Filed", value: formattedTime, hint: "(now)" },
              { label: mode === "record" ? "Reporting Officer" : "Receiving Officer", value: "Off. Maria Cruz", hint: "(logged in)" },
            ]}
          />
        </SectionCard>

        {/* ── B — Complainant Information ── */}
        <SectionCard letter="B" title="Complainant Information">
          <FormRow cols={3}>
            <FormInput
              id="field-cLastName"
              label="Last Name"
              required
              placeholder="e.g. Dela Cruz"
              value={cLastName}
              onChange={(e) => { setCLastName(e.target.value); clearErr("cLastName"); }}
              error={errors.cLastName}
            />
            <FormInput
              id="field-cFirstName"
              label="First Name"
              required
              placeholder="e.g. Juan"
              value={cFirstName}
              onChange={(e) => { setCFirstName(e.target.value); clearErr("cFirstName"); }}
              error={errors.cFirstName}
            />
            <FormInput
              label="Middle Name"
              placeholder="e.g. Santos"
              value={cMiddleName}
              onChange={(e) => setCMiddleName(e.target.value)}
            />
          </FormRow>
          <FormRow cols={3}>
            <FormInput
              id="field-cContact"
              label="Contact Number"
              required
              placeholder="09XX XXX XXXX"
              value={cContact}
              onChange={(e) => { setCContact(e.target.value); clearErr("cContact"); }}
              error={errors.cContact}
            />
            <FormInput
              label="Age"
              type="number"
              placeholder="e.g. 35"
              value={cAge}
              onChange={(e) => setCAge(e.target.value)}
            />
            <FormSelect
              label="Gender"
              options={GENDER_OPTIONS}
              placeholder="Select Gender"
              value={cGender}
              onChange={(e) => setCGender(e.target.value)}
            />
          </FormRow>
          <FormRow cols={2}>
            <FormSelect
              label="Civil Status"
              options={CIVIL_STATUS_OPTIONS}
              placeholder="Select Civil Status"
              value={cCivilStatus}
              onChange={(e) => setCCivilStatus(e.target.value)}
            />
            <FormInput
              label="Email Address"
              type="email"
              placeholder="email@example.com"
              value={cEmail}
              onChange={(e) => setCEmail(e.target.value)}
            />
          </FormRow>
          <FormInput
            id="field-cAddress"
            label="Complete Address"
            required
            placeholder="House No., Street, Barangay, Municipality/City"
            value={cAddress}
            onChange={(e) => { setCAddress(e.target.value); clearErr("cAddress"); }}
            error={errors.cAddress}
          />
        </SectionCard>

        {/* ── C — Respondent Information ── */}
        {mode === "record" ? (
          <SectionCard
            letter="C"
            title="Respondent Information"
            notice='Punan ang available na impormasyon. Kung hindi kilala ang respondent, ilagay ang "Unknown".'
          >
            <FormInput
              id="field-rFullName"
              label="Full Name"
              required
              placeholder="Full name of the person being complained about"
              hint='Enter "Unknown" if identity is not known'
              value={rFullName}
              onChange={(e) => { setRFullName(e.target.value); clearErr("rFullName"); }}
              error={errors.rFullName}
            />
            <FormRow cols={3}>
              <FormInput
                label="Contact Number"
                placeholder="09XX XXX XXXX (if known)"
                value={rContact}
                onChange={(e) => setRContact(e.target.value)}
              />
              <FormSelect
                label="Relationship to Complainant"
                options={RELATIONSHIP_OPTIONS}
                placeholder="Select Relationship"
                value={rRelationship}
                onChange={(e) => setRRelationship(e.target.value)}
              />
              <FormInput
                label="Address"
                placeholder="Address (if known)"
                value={rAddress}
                onChange={(e) => setRAddress(e.target.value)}
              />
            </FormRow>
          </SectionCard>
        ) : (
          <SectionCard
            letter="C"
            title="Respondent Information"
            notice='Punan ang available na impormasyon. Kung hindi kilala ang respondent, ilagay ang "Unknown".'
          >
            <FormRow cols={3}>
              <FormInput
                id="field-rLastName"
                label="Last Name"
                required
                placeholder="e.g. Santos"
                value={rLastName}
                onChange={(e) => { setRLastName(e.target.value); clearErr("rLastName"); }}
                error={errors.rLastName}
              />
              <FormInput
                id="field-rFirstName"
                label="First Name"
                required
                placeholder="e.g. Pedro"
                value={rFirstName}
                onChange={(e) => { setRFirstName(e.target.value); clearErr("rFirstName"); }}
                error={errors.rFirstName}
              />
              <FormInput
                label="Middle Name"
                placeholder="e.g. Reyes"
                value={rMiddleName}
                onChange={(e) => setRMiddleName(e.target.value)}
              />
            </FormRow>
            <FormRow cols={4}>
              <FormInput
                label="Alias / Nickname"
                placeholder="If any"
                value={rAlias}
                onChange={(e) => setRAlias(e.target.value)}
              />
              <FormInput
                label="Age"
                type="number"
                placeholder="e.g. 40"
                value={rAge}
                onChange={(e) => setRAge(e.target.value)}
              />
              <FormDatePicker
                label="Date of Birth"
                value={rDob}
                onChange={(e) => setRDob(e.target.value)}
              />
              <FormSelect
                label="Gender"
                options={GENDER_OPTIONS}
                placeholder="Select Gender"
                value={rGender}
                onChange={(e) => setRGender(e.target.value)}
              />
            </FormRow>
            <FormRow cols={3}>
              <FormSelect
                label="Civil Status"
                options={CIVIL_STATUS_OPTIONS}
                placeholder="Select Civil Status"
                value={rCivilStatus}
                onChange={(e) => setRCivilStatus(e.target.value)}
              />
              <FormInput
                label="Occupation"
                placeholder="e.g. Farmer, Teacher"
                value={rOccupation}
                onChange={(e) => setROccupation(e.target.value)}
              />
              <FormInput
                label="Contact Number"
                placeholder="09XX XXX XXXX (if known)"
                value={rFormalContact}
                onChange={(e) => setRFormalContact(e.target.value)}
              />
            </FormRow>
            <FormInput
              label="Complete Address"
              placeholder="House No., Street, Barangay, Municipality/City, Province"
              value={rFormalAddress}
              onChange={(e) => setRFormalAddress(e.target.value)}
            />
            <SectionDivider label="Relationship" />
            <FormRow cols={2}>
              <FormSelect
                id="field-rFormalRelationship"
                label="Relationship to Complainant"
                required
                options={RELATIONSHIP_OPTIONS}
                placeholder="Select Relationship"
                value={rFormalRelationship}
                onChange={(e) => { setRFormalRelationship(e.target.value); clearErr("rFormalRelationship"); }}
                error={errors.rFormalRelationship}
              />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Currently Living with Complainant?
                </label>
                <div className="flex items-center gap-5 mt-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="radio" name="livingWith" value="true" checked={livingWith === "true"} onChange={() => setLivingWith("true")} className="accent-blue-600" />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="radio" name="livingWith" value="false" checked={livingWith === "false"} onChange={() => setLivingWith("false")} className="accent-blue-600" />
                    No
                  </label>
                </div>
              </div>
            </FormRow>
          </SectionCard>
        )}

        {/* ── D — Incident Details ── */}
        <SectionCard letter="D" title="Incident Details">
          <FormRow cols={3}>
            <FormSelect
              id="field-natureId"
              label="Nature of Complaint"
              required
              options={natureSelectOptions}
              placeholder={optionsLoading ? "Loading..." : "Select Nature of Complaint"}
              value={natureId}
              onChange={(e) => { setNatureId(e.target.value); clearErr("natureId"); }}
              disabled={optionsLoading}
              error={errors.natureId}
            />
            <FormDatePicker
              id="field-dateOfIncident"
              label="Date of Incident"
              required
              value={dateOfIncident}
              onChange={(e) => { setDateOfIncident(e.target.value); clearErr("dateOfIncident"); }}
              error={errors.dateOfIncident}
            />
            <FormTimePicker
              label="Time of Incident"
              value={timeOfIncident}
              onChange={(e) => setTimeOfIncident(e.target.value)}
            />
          </FormRow>
          {mode === "formal" ? (
            <FormRow cols={3}>
              <FormInput
                id="field-placeOfIncident"
                label="Place / Location of Incident"
                required
                placeholder="e.g. Residence, Public Market"
                value={placeOfIncident}
                onChange={(e) => { setPlaceOfIncident(e.target.value); clearErr("placeOfIncident"); }}
                error={errors.placeOfIncident}
              />
              <FormSelect
                label="Frequency of Incident"
                options={FREQUENCY_OPTIONS}
                placeholder="Select Frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              />
              <FormInput
                label="Description of Injuries / Damages"
                placeholder="If any physical injuries or property damage"
                value={injuryDesc}
                onChange={(e) => setInjuryDesc(e.target.value)}
              />
            </FormRow>
          ) : (
            <FormInput
              id="field-placeOfIncident"
              label="Place / Location of Incident"
              required
              placeholder="e.g. Near the basketball court, Purok 3"
              value={placeOfIncident}
              onChange={(e) => { setPlaceOfIncident(e.target.value); clearErr("placeOfIncident"); }}
              error={errors.placeOfIncident}
            />
          )}
        </SectionCard>

        {/* ── E — Narrative ── */}
        <SectionCard
          letter="E"
          title={mode === "record" ? "Narrative / Statement of Facts" : "Narrative / Sworn Statement"}
        >
          <FormTextarea
            id="field-narrative"
            label="Detailed Statement of Facts"
            required
            rows={6}
            placeholder="Provide a complete and detailed account of the incident. Include the sequence of events, actions taken by each party, words exchanged, any threats made, injuries sustained, and all other relevant circumstances..."
            hint="Include all relevant details: who, what, when, where, how, and why."
            value={narrative}
            onChange={(e) => { setNarrative(e.target.value); clearErr("narrative"); }}
            error={errors.narrative}
          />
        </SectionCard>

        {/* ── F — Evidence Provided ── */}
        <SectionCard letter="F" title="Other Documents or Evidence Provided">
          <p className="text-xs text-gray-500 -mt-1">
            Piliin ang lahat ng uri ng ebidensya na isinumite ng complainant.
          </p>
          {optionsLoading ? (
            <p className="text-sm text-gray-400">Loading evidence types...</p>
          ) : evidenceOptions.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                {(showAllEvidence ? evidenceOptions : evidenceOptions.slice(0, 8)).map((ev) => (
                  <label
                    key={ev.id}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer text-sm transition-all ${
                      selectedEvidence.has(ev.id)
                        ? "border-blue-400 bg-blue-50 text-blue-700 font-medium"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedEvidence.has(ev.id)}
                      onChange={() => toggleEvidence(ev.id)}
                      className="accent-blue-600 shrink-0"
                    />
                    {ev.typName}
                  </label>
                ))}
              </div>
              {evidenceOptions.length > 8 && (
                <button
                  type="button"
                  className="mt-2 text-blue-600 hover:underline text-xs font-medium"
                  onClick={() => setShowAllEvidence((s) => !s)}
                >
                  {showAllEvidence ? "Show less" : `Show ${evidenceOptions.length - 8} more...`}
                </button>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400 italic">No evidence types available.</p>
          )}
          <FormInput
            label="Other / Specify"
            placeholder="e.g. Medical certificate, CCTV footage, etc."
            value={customEvidence}
            onChange={(e) => setCustomEvidence(e.target.value)}
            hint="You may type a custom evidence description here."
          />
        </SectionCard>

        {/* ── G — Witnesses (formal only) ── */}
        {mode === "formal" && (
          <SectionCard letter="G" title="Witnesses">
            <div className="flex flex-col gap-4">
              {witnesses.map((w, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Witness {i + 1}
                    </span>
                    {witnesses.length > 1 && (
                      <button
                        onClick={() => removeWitness(i)}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Remove
                      </button>
                    )}
                  </div>
                  <FormRow cols={3}>
                    <FormInput label="First Name" placeholder="First name" value={w.firstName} onChange={(e) => updateWitness(i, "firstName", e.target.value)} />
                    <FormInput label="Last Name" placeholder="Last name" value={w.lastName} onChange={(e) => updateWitness(i, "lastName", e.target.value)} />
                    <FormInput label="Contact Number" placeholder="09XX XXX XXXX" value={w.contactNumber ?? ""} onChange={(e) => updateWitness(i, "contactNumber", e.target.value)} />
                  </FormRow>
                  <FormInput label="Address" placeholder="Complete address" value={w.address ?? ""} onChange={(e) => updateWitness(i, "address", e.target.value)} />
                </div>
              ))}
            </div>
            <button
              onClick={addWitness}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors self-start"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              + Add Witness
            </button>
          </SectionCard>
        )}

        {/* ── H — Certification (formal only) ── */}
        {mode === "formal" && (
          <SectionCard letter="H" title="Certification">
            <div id="field-certified">
              <label
                className={`flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                  certified
                    ? "border-blue-400 bg-blue-50"
                    : errors.certified
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={certified}
                  onChange={(e) => { setCertified(e.target.checked); clearErr("certified"); }}
                  className="mt-0.5 accent-blue-600 shrink-0"
                />
                <p className="text-sm text-gray-700 leading-relaxed">
                  I hereby certify that the above information is true and correct to the best of my
                  knowledge and belief. I understand that any false statement made herein may subject
                  me to the penalties prescribed by law. I am voluntarily executing this complaint
                  and authorize the Barangay to take appropriate action.
                </p>
              </label>
              {errors.certified && (
                <p className="text-xs text-red-500 mt-1">{errors.certified}</p>
              )}
            </div>
          </SectionCard>
        )}

        {/* ── Form Actions ── */}
        <FormActions
          onCancel={() => window.history.back()}
          onSubmit={handleSubmit}
          submitLabel={mode === "record" ? "Save Record" : "File Case"}
          isSubmitting={isSubmitting}
          mode={mode}
        />

      </div>
    </div>
  );
}