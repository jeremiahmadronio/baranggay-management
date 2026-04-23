import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  DocketInfoCard,
  FormActions,
  FormDatePicker,
  FormInput,
  FormNotice,
  FormRow,
  FormSelect,
  FormTextarea,
  FormTimePicker,
  SectionCard,
  ConfirmModal,
} from "../blotter-module/reusable/FormComponents";
import { ActionModal } from "../blotter-module/reusable/SuccessModal";
import { searchPeople } from "../../service/blotter-api/Resident";
import type { PersonSearchResponseDTO } from "../../service/blotter-api/Resident";

// ── Resident Search Component ─────────────────────────────────────────────────

function ResidentSearch({ label, placeholder, onSelect }: {
  label: string;
  placeholder: string;
  onSelect: (person: PersonSearchResponseDTO) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonSearchResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) { setResults([]); return; }
      setLoading(true);
      try {
        const data = await searchPeople(query);
        setResults(data);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative w-full mb-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-700 tracking-wide">{label}</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pl-10 text-[15px] text-slate-900 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
          />
        </div>
      </div>
      {loading && <p className="text-xs text-slate-400 mt-1">Searching...</p>}
      {!loading && results.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {results.map((person) => (
            <button
              key={person.id}
              type="button"
              onClick={() => { onSelect(person); setQuery(""); setResults([]); }}
              className="block w-full border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50"
            >
              <div className="text-sm font-medium text-slate-900">
                {person.firstName} {person.middleName ? `${person.middleName} ` : ""}{person.lastName}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {person.completeAddress}{person.contactNumber ? ` • ${person.contactNumber}` : ""}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const NATURE_OPTIONS = [
  { value: "neglect", label: "Neglect" },
  { value: "child-labor", label: "Child Labor" },
  { value: "physical-abuse", label: "Physical Abuse" },
  { value: "emotional-abuse", label: "Emotional / Psychological Abuse" },
  { value: "sexual-abuse", label: "Sexual Abuse" },
  { value: "school-dropout-risk", label: "School Dropout Risk" },
  { value: "abandoned", label: "Abandoned / Foundling" },
  { value: "others", label: "Others (Specify in Narrative)" },
];

const VIOLENCE_TYPE_OPTIONS = [
  { value: "physical", label: "Physical Violence" },
  { value: "sexual", label: "Sexual Violence" },
  { value: "psychological", label: "Psychological Violence" },
  { value: "economic", label: "Economic Abuse" },
  { value: "cyber", label: "Cyber-Violence / OSAEC" },
  { value: "threats", label: "Threats / Intimidation" },
  { value: "trafficking", label: "Trafficking" },
  { value: "others", label: "Others (Specify in Narrative)" },
];

const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Prefer not to say" },
];

const CIVIL_STATUS_OPTIONS = [
  { value: "Single", label: "Single" },
  { value: "Married", label: "Married" },
  { value: "Widowed", label: "Widowed" },
  { value: "Separated", label: "Separated" },
];

const RELATIONSHIP_OPTIONS = [
  { value: "Parent", label: "Parent" },
  { value: "Step-Parent", label: "Step-Parent" },
  { value: "Relative", label: "Relative" },
  { value: "Guardian", label: "Guardian" },
  { value: "Neighbor", label: "Neighbor" },
  { value: "Teacher/School Staff", label: "Teacher / School Staff" },
  { value: "Stranger", label: "Stranger" },
  { value: "Other", label: "Other" },
];

const FREQUENCY_OPTIONS = [
  { value: "First Time", label: "First Time" },
  { value: "Second Time", label: "Second Time" },
  { value: "Habitual / Third Time+", label: "Habitual / Third Time+" },
];

const OFFICER_OPTIONS = [
  { value: "joana-reyes", label: "MSW Joana Reyes" },
  { value: "carlo-bautista", label: "MSW Carlo Bautista" },
  { value: "dianne-flores", label: "MSW Dianne Flores" },
];

function generateCaseNumber(): string {
  const year = new Date().getFullYear();
  return `${year}-BCPC-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;
}

type Errors = Record<string, string>;

// ── Main Component ────────────────────────────────────────────────────────────

export default function BcpcNewCaseEntryPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [caseNumber] = useState(generateCaseNumber);
  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successCaseNo, setSuccessCaseNo] = useState("");

  // Section A — Docket / Case Info
  const [assignedOfficer, setAssignedOfficer] = useState("");

  // Section B — Child / Complainant
  const [cLastName, setCLastName] = useState("");
  const [cFirstName, setCFirstName] = useState("");
  const [cMiddleName, setCMiddleName] = useState("");
  const [cAge, setCAge] = useState("");
  const [cGender, setCGender] = useState("");
  const [cCivilStatus, setCCivilStatus] = useState("");
  const [cContact, setCContact] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cAddress, setCAddress] = useState("");

  // Section C — Respondent / Guardian
  const [rLastName, setRLastName] = useState("");
  const [rFirstName, setRFirstName] = useState("");
  const [rMiddleName, setRMiddleName] = useState("");
  const [rAge, setRAge] = useState("");
  const [rGender, setRGender] = useState("");
  const [rCivilStatus, setRCivilStatus] = useState("");
  const [rContact, setRContact] = useState("");
  const [rAddress, setRAddress] = useState("");
  const [relationship, setRelationship] = useState("");

  // Section D — Incident Details
  const [caseType, setCaseType] = useState("");
  const [violenceType, setViolenceType] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [incidentPlace, setIncidentPlace] = useState("");
  const [frequency, setFrequency] = useState("");
  const [injuryDesc, setInjuryDesc] = useState("");

  // Section E — Narrative
  const [narrative, setNarrative] = useState("");

  // Section F — Certification
  const [certified, setCertified] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Errors>({});
  const clearErr = (key: string) => setErrors(prev => { const next = { ...prev }; delete next[key]; return next; });

  // ── Validation ──
  const validate = (): boolean => {
    const e: Errors = {};
    if (!assignedOfficer) e.assignedOfficer = "Assigned officer is required.";
    if (!cLastName.trim()) e.cLastName = "Last name is required.";
    if (!cFirstName.trim()) e.cFirstName = "First name is required.";
    if (!cAge.trim()) e.cAge = "Age is required.";
    if (!cGender) e.cGender = "Gender is required.";
    if (!cAddress.trim()) e.cAddress = "Complete address is required.";
    if (!rLastName.trim()) e.rLastName = "Last name is required.";
    if (!rFirstName.trim()) e.rFirstName = "First name is required.";
    if (!relationship) e.relationship = "Relationship is required.";
    if (!caseType) e.caseType = "Nature of case is required.";
    if (!incidentDate) e.incidentDate = "Date of incident is required.";
    if (!incidentPlace.trim()) e.incidentPlace = "Place of incident is required.";
    if (!narrative.trim()) e.narrative = "Statement of facts is required.";
    if (!frequency) e.frequency = "Frequency is required.";
    if (!certified) e.certified = "You must certify before filing.";
    setErrors(e);
    if (Object.keys(e).length > 0) {
      const firstKey = Object.keys(e)[0];
      document.getElementById(`field-${firstKey}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return Object.keys(e).length === 0;
  };

  const handleSubmitClick = () => {
    if (!validate()) return;
    setShowConfirmModal(true);
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // Mock submit — backend integration later
      await new Promise(r => setTimeout(r, 600));
      setSuccessCaseNo(caseNumber);
      setShowSuccessModal(true);
    } catch {
      setSubmitError("Submission failed. Please try again.");
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setAssignedOfficer("");
    setCLastName(""); setCFirstName(""); setCMiddleName("");
    setCAge(""); setCGender(""); setCCivilStatus("");
    setCContact(""); setCEmail(""); setCAddress("");
    setRLastName(""); setRFirstName(""); setRMiddleName("");
    setRAge(""); setRGender(""); setRCivilStatus("");
    setRContact(""); setRAddress(""); setRelationship("");
    setCaseType(""); setViolenceType("");
    setIncidentDate(""); setIncidentTime("");
    setIncidentPlace(""); setFrequency(""); setInjuryDesc("");
    setNarrative(""); setCertified(false); setErrors({});
  };

  return (
    <div className="min-h-screen bg-blue-50/40">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* ── Privacy Notice ── */}
        <FormNotice
          tone="warning"
          text="Privacy Notice: Child case information is confidential and must only be accessed by authorized BCPC personnel. In compliance with the Data Privacy Act of 2012 (R.A. 10173)."
        />

        {/* ── Modals ── */}
        <ConfirmModal
          isOpen={showConfirmModal}
          type="warning"
          title="Confirm Submission"
          message="Please confirm that all provided information is correct. This will be filed as a BCPC case entry. This action cannot be undone."
          confirmText="File BCPC Case"
          cancelText="Review Again"
          onConfirm={handleConfirmedSubmit}
          onCancel={() => setShowConfirmModal(false)}
        />
        <ActionModal isOpen={showSuccessModal} onClose={() => { setShowSuccessModal(false); resetForm(); }} title="Entry Saved!" type="success">
          <p>BCPC case entry has been successfully saved.</p>
          <p className="mt-1 font-semibold text-gray-700">Case No.: {successCaseNo}</p>
        </ActionModal>
        <ActionModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} title="Error" type="danger">
          {submitError}
        </ActionModal>

        {/* ── Section A: Docket / Case Information ── */}
        <SectionCard letter="A" title="Case Information">
          <DocketInfoCard
            fields={[
              { label: "Case / Blotter Number", value: caseNumber, hint: "(auto-generated)" },
              { label: "Date Filed", value: today, hint: "(today)" },
              { label: "Department", value: "BCPC", hint: "(child protection desk)" },
            ]}
          />
          <FormRow cols={2}>
            <FormSelect
              id="field-assignedOfficer"
              label="Assigned Officer"
              required
              value={assignedOfficer}
              onChange={(e) => { setAssignedOfficer(e.target.value); clearErr("assignedOfficer"); }}
              options={OFFICER_OPTIONS}
              placeholder="Select Officer"
              error={errors.assignedOfficer}
            />
            <FormSelect
              id="field-caseType"
              label="Nature of Child Case"
              required
              value={caseType}
              onChange={(e) => { setCaseType(e.target.value); clearErr("caseType"); }}
              options={NATURE_OPTIONS}
              placeholder="Select Case Type"
              error={errors.caseType}
            />
          </FormRow>
        </SectionCard>

        {/* ── Section B: Child / Complainant Information ── */}
        <SectionCard letter="B" title="Complainant / Child Information">
          <ResidentSearch
            label="Search Resident Record"
            placeholder="Type name to search and auto-fill..."
            onSelect={(p) => {
              setCFirstName(p.firstName || "");
              setCLastName(p.lastName || "");
              setCMiddleName(p.middleName || "");
              setCAge(p.age ? String(p.age) : "");
              setCGender(p.gender || "");
              setCCivilStatus(p.civilStatus || "");
              setCContact(p.contactNumber || "");
              setCEmail(p.email || "");
              setCAddress(p.completeAddress || "");
              clearErr("cLastName"); clearErr("cFirstName"); clearErr("cAge"); clearErr("cGender"); clearErr("cAddress");
            }}
          />
          <FormRow cols={3}>
            <FormInput
              id="field-cLastName"
              label="Last Name"
              required
              value={cLastName}
              onChange={(e) => { setCLastName(e.target.value); clearErr("cLastName"); }}
              placeholder="e.g. Santos"
              error={errors.cLastName}
            />
            <FormInput
              id="field-cFirstName"
              label="First Name"
              required
              value={cFirstName}
              onChange={(e) => { setCFirstName(e.target.value); clearErr("cFirstName"); }}
              placeholder="e.g. Maria Isabel"
              error={errors.cFirstName}
            />
            <FormInput
              label="Middle Name"
              value={cMiddleName}
              onChange={(e) => setCMiddleName(e.target.value)}
              placeholder="e.g. Dela Cruz"
            />
          </FormRow>
          <FormRow cols={4}>
            <FormInput
              id="field-cAge"
              label="Age"
              required
              inputMode="numeric"
              value={cAge}
              onChange={(e) => { setCAge(e.target.value.replace(/\D/g, "").slice(0, 2)); clearErr("cAge"); }}
              placeholder="e.g. 12"
              error={errors.cAge}
            />
            <FormSelect
              id="field-cGender"
              label="Gender"
              required
              value={cGender}
              onChange={(e) => { setCGender(e.target.value); clearErr("cGender"); }}
              options={GENDER_OPTIONS}
              placeholder="Select"
              error={errors.cGender}
            />
            <FormSelect
              label="Civil Status"
              value={cCivilStatus}
              onChange={(e) => setCCivilStatus(e.target.value)}
              options={CIVIL_STATUS_OPTIONS}
              placeholder="Select"
            />
            <FormInput
              label="Contact Number"
              inputMode="numeric"
              maxLength={11}
              value={cContact}
              onChange={(e) => setCContact(e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="09XXXXXXXXX"
            />
          </FormRow>
          <FormInput
            label="Email Address"
            type="email"
            value={cEmail}
            onChange={(e) => setCEmail(e.target.value)}
            placeholder="optional@email.com"
          />
          <FormInput
            id="field-cAddress"
            label="Complete Address"
            required
            value={cAddress}
            onChange={(e) => { setCAddress(e.target.value); clearErr("cAddress"); }}
            placeholder="House No., Street, Barangay, City"
            error={errors.cAddress}
          />
        </SectionCard>

        {/* ── Section C: Respondent / Guardian Information ── */}
        <SectionCard letter="C" title="Respondent / Guardian Information">
          <ResidentSearch
            label="Search Resident Record"
            placeholder="Type name to search and auto-fill..."
            onSelect={(p) => {
              setRFirstName(p.firstName || "");
              setRLastName(p.lastName || "");
              setRMiddleName(p.middleName || "");
              setRAge(p.age ? String(p.age) : "");
              setRGender(p.gender || "");
              setRCivilStatus(p.civilStatus || "");
              setRContact(p.contactNumber || "");
              setRAddress(p.completeAddress || "");
              clearErr("rLastName"); clearErr("rFirstName"); clearErr("relationship");
            }}
          />
          <FormRow cols={3}>
            <FormInput
              id="field-rLastName"
              label="Last Name"
              required
              value={rLastName}
              onChange={(e) => { setRLastName(e.target.value); clearErr("rLastName"); }}
              placeholder="e.g. Santos"
              error={errors.rLastName}
            />
            <FormInput
              id="field-rFirstName"
              label="First Name"
              required
              value={rFirstName}
              onChange={(e) => { setRFirstName(e.target.value); clearErr("rFirstName"); }}
              placeholder="e.g. Teresa"
              error={errors.rFirstName}
            />
            <FormInput
              label="Middle Name"
              value={rMiddleName}
              onChange={(e) => setRMiddleName(e.target.value)}
              placeholder="e.g. Reyes"
            />
          </FormRow>
          <FormRow cols={4}>
            <FormSelect
              id="field-relationship"
              label="Relationship to Child"
              required
              value={relationship}
              onChange={(e) => { setRelationship(e.target.value); clearErr("relationship"); }}
              options={RELATIONSHIP_OPTIONS}
              placeholder="Select Relationship"
              error={errors.relationship}
            />
            <FormInput
              label="Age"
              inputMode="numeric"
              value={rAge}
              onChange={(e) => setRAge(e.target.value.replace(/\D/g, "").slice(0, 3))}
              placeholder="e.g. 42"
            />
            <FormSelect
              label="Gender"
              value={rGender}
              onChange={(e) => setRGender(e.target.value)}
              options={GENDER_OPTIONS}
              placeholder="Select"
            />
            <FormSelect
              label="Civil Status"
              value={rCivilStatus}
              onChange={(e) => setRCivilStatus(e.target.value)}
              options={CIVIL_STATUS_OPTIONS}
              placeholder="Select"
            />
          </FormRow>
          <FormRow cols={2}>
            <FormInput
              label="Contact Number"
              inputMode="numeric"
              maxLength={11}
              value={rContact}
              onChange={(e) => setRContact(e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="09XXXXXXXXX"
            />
            <FormInput
              label="Complete Address"
              value={rAddress}
              onChange={(e) => setRAddress(e.target.value)}
              placeholder="House No., Street, Barangay, City"
            />
          </FormRow>
        </SectionCard>

        {/* ── Section D: Incident Details ── */}
        <SectionCard letter="D" title="Incident Details">
          <FormRow cols={3}>
            <FormSelect
              id="field-caseType"
              label="Nature of Child Protection Concern"
              required
              value={caseType}
              onChange={(e) => { setCaseType(e.target.value); clearErr("caseType"); }}
              options={NATURE_OPTIONS}
              placeholder="Select Nature"
              error={errors.caseType}
            />
            <FormDatePicker
              id="field-incidentDate"
              label="Date of Incident"
              required
              value={incidentDate}
              onChange={(e) => { setIncidentDate(e.target.value); clearErr("incidentDate"); }}
              error={errors.incidentDate}
            />
            <FormTimePicker
              label="Time of Incident"
              value={incidentTime}
              onChange={(e) => setIncidentTime(e.target.value)}
            />
          </FormRow>

          {/* Violence Type — NEW FIELD */}
          <FormSelect
            label="Type of Violence"
            value={violenceType}
            onChange={(e) => setViolenceType(e.target.value)}
            options={VIOLENCE_TYPE_OPTIONS}
            placeholder="Select Violence Type (if applicable)"
          />

          <FormRow cols={3}>
            <FormInput
              id="field-incidentPlace"
              label="Place / Location of Incident"
              required
              placeholder="e.g. Residence, School"
              value={incidentPlace}
              onChange={(e) => { setIncidentPlace(e.target.value); clearErr("incidentPlace"); }}
              error={errors.incidentPlace}
            />
            <FormSelect
              id="field-frequency"
              label="Frequency of Incident"
              required
              options={FREQUENCY_OPTIONS}
              placeholder="Select Frequency"
              value={frequency}
              onChange={(e) => { setFrequency(e.target.value); clearErr("frequency"); }}
              error={errors.frequency}
            />
            <FormInput
              label="Description of Injuries / Damages"
              placeholder="If any physical injuries or property damage"
              value={injuryDesc}
              onChange={(e) => setInjuryDesc(e.target.value)}
            />
          </FormRow>
        </SectionCard>

        {/* ── Section E: Statement of Facts / Narrative ── */}
        <SectionCard letter="E" title="Statement of Facts / Narrative">
          <FormTextarea
            id="field-narrative"
            label="Initial Case Narrative"
            required
            rows={6}
            value={narrative}
            onChange={(e) => { setNarrative(e.target.value); clearErr("narrative"); }}
            placeholder="Describe the child protection concern, immediate risk, and initial BCPC action taken..."
            error={errors.narrative}
          />
        </SectionCard>

        {/* ── Section F: Certification ── */}
        <SectionCard letter="F" title="Certification">
          <label className="inline-flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={certified}
              onChange={(e) => { setCertified(e.target.checked); clearErr("certified"); }}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>
              I hereby certify that the information provided is true and correct based on my
              personal knowledge and records.
            </span>
          </label>
          {errors.certified && <p className="text-xs text-red-500 mt-1">{errors.certified}</p>}
        </SectionCard>

        {/* ── Submit Actions ── */}
        <FormActions
          onCancel={() => window.history.back()}
          onSubmit={handleSubmitClick}
          submitLabel="File BCPC Case"
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
