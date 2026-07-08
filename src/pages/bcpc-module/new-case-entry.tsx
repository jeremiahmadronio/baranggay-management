import { useEffect, useMemo, useState } from "react";
import { Search, ShieldOff } from "lucide-react";
import {
  DocketInfoCard,
  FormActions,
  FormDatePicker,
  FormInput,
  FormNotice,
  FormRow,
  FormSelect,
  FormTimePicker,
  SectionCard,
  ConfirmModal,
} from "../blotter-module/reusable/FormComponents";
import { ActionModal } from "../blotter-module/reusable/SuccessModal";
import { PermissionDeniedPage } from "../blotter-module/reusable/PermissionDeniedPage";
import { NarrativeSection } from "../blotter-module/blotter-form/NarrativeSection";
import { searchPeople } from "../../service/blotter-api/Resident";
import type { PersonSearchResponseDTO } from "../../service/blotter-api/Resident";
import {
  submitBcpcCase,
  getBcpcOfficerOptions,
  fileToBase64,
} from "../../service/bcpc-api/BcpcFormService";
import type { BcpcOfficerOptionDTO } from "../../service/bcpc-api/BcpcFormService";
import { useUser, getUserDisplayName } from "../../context/UserContext";
import {
  BCPC_PERMISSIONS,
  getMyAccess,
  hasBcpcPermission,
} from "../../service/bcpc-api/BcpcPermission";

// ── Resident Search ───────────────────────────────────────────────────────────

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
      try { const data = await searchPeople(query); setResults(data); }
      catch { setResults([]); }
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
  { value: "Neglect", label: "Neglect" },
  { value: "Child Labor", label: "Child Labor" },
  { value: "Physical Abuse", label: "Physical Abuse" },
  { value: "Emotional / Psychological Abuse", label: "Emotional / Psychological Abuse" },
  { value: "Sexual Abuse", label: "Sexual Abuse" },
  { value: "School Dropout Risk", label: "School Dropout Risk" },
  { value: "Abandoned / Foundling", label: "Abandoned / Foundling" },
  { value: "Others", label: "Others (Specify in Narrative)" },
];

const VIOLENCE_TYPE_OPTIONS = [
  { value: "Physical Violence", label: "Physical Violence" },
  { value: "Sexual Violence", label: "Sexual Violence" },
  { value: "Psychological Violence", label: "Psychological Violence" },
  { value: "Economic Abuse", label: "Economic Abuse" },
  { value: "Cyber-Violence / OSAEC", label: "Cyber-Violence / OSAEC" },
  { value: "Threats / Intimidation", label: "Threats / Intimidation" },
  { value: "Trafficking", label: "Trafficking" },
  { value: "Others", label: "Others (Specify in Narrative)" },
];

const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Prefer not to say" },
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

type Errors = Record<string, string>;

// ── Birthday → Age calculator ────────────────────────────────────────────────
function computeAgeFromBirthday(birthdayStr: string): string {
  if (!birthdayStr) return "";
  const birth = new Date(birthdayStr);
  if (isNaN(birth.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? String(age) : "";
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function BcpcNewCaseEntryPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const { user } = useUser();
  // Show the full name of the signed-in account; fallback while loading
  const filedByName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username
    : "Loading...";

  // ── Permission guard ───────────────────────────────────────────────────
  const [canCreate, setCanCreate] = useState<boolean | null>(null);

  useEffect(() => {
    getMyAccess()
      .then((access) => setCanCreate(hasBcpcPermission(access, BCPC_PERMISSIONS.CREATE_CASE_ENTRY)))
      .catch(() => setCanCreate(false));
  }, []);

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successCaseNo, setSuccessCaseNo] = useState("");

  // Officer options from API
  const [officerOptions, setOfficerOptions] = useState<{ value: string; label: string }[]>([]);
  const [officersLoading, setOfficersLoading] = useState(true);
  const [assignedOfficer, setAssignedOfficer] = useState("");

  // Section B — Child / Complainant
  const [cPersonId, setCPersonId] = useState<number | undefined>(undefined);
  const [cLastName, setCLastName] = useState("");
  const [cFirstName, setCFirstName] = useState("");
  const [cMiddleName, setCMiddleName] = useState("");
  const [cAge, setCAge] = useState("");
  const [cBirthday, setCBirthday] = useState("");
  const [cGender, setCGender] = useState("");
  const [cGradeSchool, setCGradeSchool] = useState("");
  const [cGuardian, setCGuardian] = useState("");
  const [cContact, setCContact] = useState("");
  const [cAddress, setCAddress] = useState("");
  const [cRelationship, setCRelationship] = useState("");

  // Section C — Respondent / Guardian
  const [rPersonId, setRPersonId] = useState<number | undefined>(undefined);
  const [rLastName, setRLastName] = useState("");
  const [rFirstName, setRFirstName] = useState("");
  const [rMiddleName, setRMiddleName] = useState("");
  const [rAge, setRAge] = useState("");
  const [rBirthday, setRBirthday] = useState("");
  const [rGender, setRGender] = useState("");
  const [rGradeSchool, setRGradeSchool] = useState("");
  const [rGuardian, setRGuardian] = useState("");
  const [rContact, setRContact] = useState("");
  const [rAddress, setRAddress] = useState("");
  const [relationship, setRelationship] = useState("");

  // Section D — Incident Details
  const [natureOfCase, setNatureOfCase] = useState("");
  const [violenceType, setViolenceType] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [incidentPlace, setIncidentPlace] = useState("");
  const [frequency, setFrequency] = useState("");
  const [injuryDesc, setInjuryDesc] = useState("");

  // Section E — Narrative (file upload)
  const [narrativeFile, setNarrativeFile] = useState<File | null>(null);

  // Section F — Certification
  const [certified, setCertified] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const clearErr = (key: string) =>
    setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });

  // ── Load officers from API ────────────────────────────────────────────────
  useEffect(() => {
    getBcpcOfficerOptions()
      .then((data: BcpcOfficerOptionDTO[]) => {
        setOfficerOptions(
          data.map((o) => ({
            value: String(o.id),
            label: `${o.name}${o.position ? ` — ${o.position}` : ""}`,
          }))
        );
      })
      .catch(() => setOfficerOptions([]))
      .finally(() => setOfficersLoading(false));
  }, []);

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Errors = {};
    if (!assignedOfficer) e.assignedOfficer = "Assigned officer is required.";
    if (!cLastName.trim()) e.cLastName = "Last name is required.";
    if (!cFirstName.trim()) e.cFirstName = "First name is required.";
    if (!cAge.trim()) e.cAge = "Age is required.";
    if (!cGender) e.cGender = "Gender is required.";
    if (!cAddress.trim()) e.cAddress = "Complete address is required.";
    if (!cRelationship) e.cRelationship = "Relationship is required.";
    if (!rLastName.trim()) e.rLastName = "Last name is required.";
    if (!rFirstName.trim()) e.rFirstName = "First name is required.";
    if (!relationship) e.relationship = "Relationship is required.";
    if (!incidentDate) e.incidentDate = "Date of incident is required.";
    if (!incidentPlace.trim()) e.incidentPlace = "Place of incident is required.";
    if (!frequency) e.frequency = "Frequency is required.";
    if (!natureOfCase) e.natureOfCase = "Nature of complaint is required.";
    if (!narrativeFile) e.narrative = "Narrative file is required.";
    if (!certified) e.certified = "You must certify before filing.";
    setErrors(e);
    if (Object.keys(e).length > 0) {
      document
        .getElementById(`field-${Object.keys(e)[0]}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
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
      if (!narrativeFile) throw new Error("Narrative file is missing.");
      const narrativeBase64 = await fileToBase64(narrativeFile);

      const caseNo = await submitBcpcCase({
        childPersonId: cPersonId,
        childFirstName: cFirstName,
        childLastName: cLastName,
        childMiddleName: cMiddleName || undefined,
        childAge: cAge ? parseInt(cAge) : undefined,
        childBirthday: cBirthday || undefined,
        childGender: cGender || undefined,
        childGradeSchool: cGradeSchool || undefined,
        childGuardian: cGuardian || undefined,
        childContact: cContact || undefined,
        childAddress: cAddress,
        childRelationship: cRelationship,

        respondentPersonId: rPersonId,
        respondentFirstName: rFirstName,
        respondentLastName: rLastName,
        respondentMiddleName: rMiddleName || undefined,
        respondentAge: rAge ? parseInt(rAge) : undefined,
        respondentBirthday: rBirthday || undefined,
        respondentGender: rGender || undefined,
        respondentGradeSchool: rGradeSchool || undefined,
        respondentGuardian: rGuardian || undefined,
        respondentContact: rContact || undefined,
        respondentAddress: rAddress || undefined,
        relationshipToChild: relationship,

        natureOfCase: natureOfCase || "Child Protection Concern",
        violenceType: violenceType || undefined,
        incidentDate,
        incidentTime: incidentTime ? `${incidentTime}:00` : undefined,
        incidentPlace,
        frequency,
        injuryDescription: injuryDesc || undefined,

        narrativeStatement: narrativeBase64,
        assignToId: assignedOfficer ? Number(assignedOfficer) : undefined,
        certifiedTrue: certified,
      });

      setSuccessCaseNo(caseNo);
      setShowSuccessModal(true);
    } catch (err: any) {
      setSubmitError(err.message || "Submission failed. Please try again.");
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setAssignedOfficer("");
    setCPersonId(undefined); setCLastName(""); setCFirstName(""); setCMiddleName("");
    setCAge(""); setCBirthday(""); setCGender(""); setCGradeSchool(""); setCGuardian(""); setCContact(""); setCAddress(""); setCRelationship("");
    setRPersonId(undefined); setRLastName(""); setRFirstName(""); setRMiddleName("");
    setRAge(""); setRBirthday(""); setRGender(""); setRGradeSchool(""); setRGuardian(""); setRContact(""); setRAddress(""); setRelationship("");
    setViolenceType(""); setNatureOfCase("");
    setIncidentDate(""); setIncidentTime(""); setIncidentPlace(""); setFrequency(""); setInjuryDesc("");
    setNarrativeFile(null); setCertified(false); setErrors({});
  };

  // Permission gate — loading
  if (canCreate === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-blue-50/40">
        <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  // Permission gate — denied
  if (!canCreate) {
    return (
      <PermissionDeniedPage
        message="You do not have permission to create BCPC case entries."
        hint="Ask your administrator to grant the Create Case Entry permission."
        actionLabel="Go to Dashboard"
        onAction={() => window.location.assign('/bcpc/dashboard')}
      />
    );
  }

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
          isOpen={showCancelModal}
          type="warning"
          title="Cancel Entry"
          message="Are you sure you want to cancel? All entered information will be cleared and cannot be recovered."
          confirmText="Yes, Clear Form"
          cancelText="Go Back"
          onConfirm={() => { setShowCancelModal(false); resetForm(); }}
          onCancel={() => setShowCancelModal(false)}
        />
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
        <ActionModal
          isOpen={showSuccessModal}
          onClose={() => { setShowSuccessModal(false); resetForm(); }}
          title="Entry Saved!"
          type="success"
        >
          <p>BCPC case entry has been successfully saved.</p>
          <p className="mt-1 font-semibold text-gray-700">Case No.: {successCaseNo}</p>
        </ActionModal>
        <ActionModal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          title="Error"
          type="danger"
        >
          {submitError}
        </ActionModal>

        {/* ── Section A: Case Information ── */}
        <SectionCard letter="A" title="Case Information">
          <DocketInfoCard
            fields={[
              { label: "Date Filed", value: today, hint: "(today)" },
              { label: "Department", value: "BCPC", hint: "(child protection desk)" },
              { label: "Case Filed By", value: filedByName, hint: "(current user)" },
            ]}
          />
          <div className="md:w-1/2">
            <FormSelect
              id="field-assignedOfficer"
              label="Assigned Officer"
              required
              value={assignedOfficer}
              onChange={(e) => { setAssignedOfficer(e.target.value); clearErr("assignedOfficer"); }}
              options={officersLoading ? [{ value: "", label: "Loading officers..." }] : officerOptions}
              placeholder={officersLoading ? "Loading..." : "Select Officer"}
              error={errors.assignedOfficer}
            />
          </div>
        </SectionCard>

        {/* ── Section B: Child / Complainant Information ── */}
        <SectionCard letter="B" title="Complainant / Child Information">
          <ResidentSearch
            label="Search Resident Record"
            placeholder="Type name to search and auto-fill..."
            onSelect={(p: any) => {
              setCPersonId(p.id);
              setCFirstName(p.firstName || "");
              setCLastName(p.lastName || "");
              setCMiddleName(p.middleName || "");
              setCBirthday(p.birthDate || "");
              setCAge(p.age ? String(p.age) : (p.birthDate ? computeAgeFromBirthday(p.birthDate) : ""));
              setCGender(p.gender || "");
              setCGradeSchool(p.gradeSchool || "");
              setCGuardian(p.guardianName || "");
              setCContact(p.contactNumber || "");
              setCAddress(p.completeAddress || "");
              clearErr("cLastName"); clearErr("cFirstName"); clearErr("cAge");
              clearErr("cGender"); clearErr("cAddress");
            }}
          />
          {/* Lock notice when autofilled */}
          {cPersonId && (
            <div className="mb-3 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5">
              <p className="text-xs text-blue-700">
                ℹ️ Fields are locked — auto-filled from resident record.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCPersonId(undefined);
                  setCLastName(""); setCFirstName(""); setCMiddleName("");
                  setCAge(""); setCBirthday(""); setCGender("");
                  setCGradeSchool(""); setCGuardian(""); setCContact(""); setCAddress("");
                }}
                className="ml-4 rounded-md border border-blue-300 bg-white px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                Cancel Autofill
              </button>
            </div>
          )}
          <FormRow cols={3}>
            <FormInput
              id="field-cLastName"
              label="Last Name"
              required
              value={cLastName}
              onChange={(e) => { if (!cPersonId) { setCLastName(e.target.value); clearErr("cLastName"); } }}
              readOnly={!!cPersonId}
              placeholder="e.g. Santos"
              error={errors.cLastName}
              className={cPersonId ? "bg-slate-100 cursor-not-allowed" : ""}
            />
            <FormInput
              id="field-cFirstName"
              label="First Name"
              required
              value={cFirstName}
              onChange={(e) => { if (!cPersonId) { setCFirstName(e.target.value); clearErr("cFirstName"); } }}
              readOnly={!!cPersonId}
              placeholder="e.g. Maria Isabel"
              error={errors.cFirstName}
              className={cPersonId ? "bg-slate-100 cursor-not-allowed" : ""}
            />
            <FormInput
              label="Middle Name"
              value={cMiddleName}
              onChange={(e) => { if (!cPersonId) setCMiddleName(e.target.value); }}
              readOnly={!!cPersonId}
              placeholder="e.g. Dela Cruz"
              className={cPersonId ? "bg-slate-100 cursor-not-allowed" : ""}
            />
          </FormRow>
          <FormRow cols={3}>
            <FormInput
              id="field-cAge"
              label="Age"
              required
              inputMode="numeric"
              value={cAge}
              onChange={(e) => { if (!cPersonId) { setCAge(e.target.value.replace(/\D/g, "").slice(0, 2)); clearErr("cAge"); } }}
              readOnly={!!cPersonId}
              placeholder="e.g. 12"
              error={errors.cAge}
              className={cPersonId ? "bg-slate-100 cursor-not-allowed" : ""}
            />
            <FormDatePicker
              label="Birthday"
              value={cBirthday}
              onChange={(e) => {
                if (cPersonId) return;
                const bday = e.target.value;
                setCBirthday(bday);
                const computed = computeAgeFromBirthday(bday);
                if (computed) { setCAge(computed); clearErr("cAge"); }
              }}
              disabled={!!cPersonId}
              className={cPersonId ? "bg-slate-100 cursor-not-allowed" : ""}
            />
            <FormSelect
              id="field-cGender"
              label="Gender"
              required
              value={cGender}
              onChange={(e) => { if (!cPersonId) { setCGender(e.target.value); clearErr("cGender"); } }}
              options={GENDER_OPTIONS}
              placeholder="Select"
              error={errors.cGender}
              disabled={!!cPersonId}
              className={cPersonId ? "bg-slate-100 cursor-not-allowed" : ""}
            />
          </FormRow>
          <FormRow cols={2}>
            <FormSelect
              id="field-cRelationship"
              label="Relationship to Child"
              required
              value={cRelationship}
              onChange={(e) => { setCRelationship(e.target.value); clearErr("cRelationship"); }}
              options={RELATIONSHIP_OPTIONS}
              placeholder="Select Relationship"
              error={errors.cRelationship}
            />
            <FormInput
              label="Grade / School"
              value={cGradeSchool}
              onChange={(e) => setCGradeSchool(e.target.value)}
              placeholder="e.g. Grade 5 — Bagong Bayan Elementary"
            />
          </FormRow>
          <FormInput
            label="Guardian / Parent Name"
            value={cGuardian}
            onChange={(e) => setCGuardian(e.target.value)}
            placeholder="e.g. Juan Dela Cruz"
          />
          <FormRow cols={2}>
            <FormInput
              label="Contact Number"
              inputMode="numeric"
              maxLength={11}
              value={cContact}
              onChange={(e) => { if (!cPersonId) setCContact(e.target.value.replace(/\D/g, "").slice(0, 11)); }}
              readOnly={!!cPersonId}
              placeholder="09XXXXXXXXX"
              className={cPersonId ? "bg-slate-100 cursor-not-allowed" : ""}
            />
            <FormInput
              id="field-cAddress"
              label="Complete Address"
              required
              value={cAddress}
              onChange={(e) => { if (!cPersonId) { setCAddress(e.target.value); clearErr("cAddress"); } }}
              readOnly={!!cPersonId}
              placeholder="House No., Street, Barangay, City"
              error={errors.cAddress}
              className={cPersonId ? "bg-slate-100 cursor-not-allowed" : ""}
            />
          </FormRow>
        </SectionCard>

        {/* ── Section C: Respondent / Guardian Information ── */}
        <SectionCard letter="C" title="Respondent / Guardian Information">
          <ResidentSearch
            label="Search Resident Record"
            placeholder="Type name to search and auto-fill..."
            onSelect={(p: any) => {
              setRPersonId(p.id);
              setRFirstName(p.firstName || "");
              setRLastName(p.lastName || "");
              setRMiddleName(p.middleName || "");
              setRBirthday(p.birthDate || "");
              setRAge(p.age ? String(p.age) : (p.birthDate ? computeAgeFromBirthday(p.birthDate) : ""));
              setRGender(p.gender || "");
              setRGradeSchool(p.gradeSchool || "");
              setRGuardian(p.guardianName || "");
              setRContact(p.contactNumber || "");
              setRAddress(p.completeAddress || "");
              clearErr("rLastName"); clearErr("rFirstName"); clearErr("relationship");
            }}
          />
          {/* Lock notice when autofilled */}
          {rPersonId && (
            <div className="mb-3 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5">
              <p className="text-xs text-blue-700">
                ℹ️ Fields are locked — auto-filled from resident record.
              </p>
              <button
                type="button"
                onClick={() => {
                  setRPersonId(undefined);
                  setRLastName(""); setRFirstName(""); setRMiddleName("");
                  setRAge(""); setRBirthday(""); setRGender("");
                  setRGradeSchool(""); setRGuardian(""); setRContact(""); setRAddress("");
                }}
                className="ml-4 rounded-md border border-blue-300 bg-white px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                Cancel Autofill
              </button>
            </div>
          )}
          <FormRow cols={3}>
            <FormInput
              id="field-rLastName"
              label="Last Name"
              required
              value={rLastName}
              onChange={(e) => { if (!rPersonId) { setRLastName(e.target.value); clearErr("rLastName"); } }}
              readOnly={!!rPersonId}
              placeholder="e.g. Santos"
              error={errors.rLastName}
              className={rPersonId ? "bg-slate-100 cursor-not-allowed" : ""}
            />
            <FormInput
              id="field-rFirstName"
              label="First Name"
              required
              value={rFirstName}
              onChange={(e) => { if (!rPersonId) { setRFirstName(e.target.value); clearErr("rFirstName"); } }}
              readOnly={!!rPersonId}
              placeholder="e.g. Teresa"
              error={errors.rFirstName}
              className={rPersonId ? "bg-slate-100 cursor-not-allowed" : ""}
            />
            <FormInput
              label="Middle Name"
              value={rMiddleName}
              onChange={(e) => { if (!rPersonId) setRMiddleName(e.target.value); }}
              readOnly={!!rPersonId}
              placeholder="e.g. Reyes"
              className={rPersonId ? "bg-slate-100 cursor-not-allowed" : ""}
            />
          </FormRow>
          <FormRow cols={3}>
            <FormInput
              label="Age"
              inputMode="numeric"
              value={rAge}
              onChange={(e) => { if (!rPersonId) setRAge(e.target.value.replace(/\D/g, "").slice(0, 3)); }}
              readOnly={!!rPersonId}
              placeholder="e.g. 42"
              className={rPersonId ? "bg-slate-100 cursor-not-allowed" : ""}
            />
            <FormDatePicker
              label="Birthday"
              value={rBirthday}
              onChange={(e) => {
                if (rPersonId) return;
                const bday = e.target.value;
                setRBirthday(bday);
                const computed = computeAgeFromBirthday(bday);
                if (computed) setRAge(computed);
              }}
              disabled={!!rPersonId}
              className={rPersonId ? "bg-slate-100 cursor-not-allowed" : ""}
            />
            <FormSelect
              label="Gender"
              value={rGender}
              onChange={(e) => { if (!rPersonId) setRGender(e.target.value); }}
              options={GENDER_OPTIONS}
              placeholder="Select"
              disabled={!!rPersonId}
              className={rPersonId ? "bg-slate-100 cursor-not-allowed" : ""}
            />
          </FormRow>
          <FormRow cols={2}>
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
              label="Grade / School"
              value={rGradeSchool}
              onChange={(e) => setRGradeSchool(e.target.value)}
              placeholder="e.g. Grade 5 — Bagong Bayan Elementary"
            />
          </FormRow>
          <FormRow cols={2}>
            <FormInput
              label="Guardian / Parent Name"
              value={rGuardian}
              onChange={(e) => setRGuardian(e.target.value)}
              placeholder="e.g. Juan Dela Cruz"
            />
            <FormInput
              label="Contact Number"
              inputMode="numeric"
              maxLength={11}
              value={rContact}
              onChange={(e) => { if (!rPersonId) setRContact(e.target.value.replace(/\D/g, "").slice(0, 11)); }}
              readOnly={!!rPersonId}
              placeholder="09XXXXXXXXX"
              className={rPersonId ? "bg-slate-100 cursor-not-allowed" : ""}
            />
          </FormRow>
          <FormInput
            label="Complete Address"
            value={rAddress}
            onChange={(e) => { if (!rPersonId) setRAddress(e.target.value); }}
            readOnly={!!rPersonId}
            placeholder="House No., Street, Barangay, City"
            className={rPersonId ? "bg-slate-100 cursor-not-allowed" : ""}
          />
        </SectionCard>

        {/* ── Section D: Incident Details ── */}
        <SectionCard letter="D" title="Incident Details">
          <FormRow cols={3}>
            <FormSelect
              id="field-natureOfCase"
              label="Nature of Complaint"
              required
              value={natureOfCase}
              onChange={(e) => { setNatureOfCase(e.target.value); clearErr("natureOfCase"); }}
              options={NATURE_OPTIONS}
              placeholder="Select Nature"
              error={errors.natureOfCase}
            />
            <FormSelect
              label="Type of Violence"
              value={violenceType}
              onChange={(e) => setViolenceType(e.target.value)}
              options={VIOLENCE_TYPE_OPTIONS}
              placeholder="Select Violence Type"
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

        {/* ── Section E: Narrative (File Upload — same as Blotter) ── */}
        <NarrativeSection
          mode="record"
          narrativeFile={narrativeFile}
          onChange={setNarrativeFile}
          error={errors.narrative}
          clearErr={() => clearErr("narrative")}
        />

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
          onCancel={() => setShowCancelModal(true)}
          onSubmit={handleSubmitClick}
          submitLabel="File BCPC Case"
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
