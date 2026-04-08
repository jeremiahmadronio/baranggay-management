import { getMyAccess } from "../../service/blotter-api/blotter-api";
import {
  BLOTTER_PERMISSIONS,
  hasBlotterPermission,
} from "../../service/blotter-api/blotter-api";
import { useEffect, useState } from "react";
import { ActionModal } from "./reusable/SuccessModal";
import {
  RadioCard,
  FormActions,
  ConfirmModal,
  FormNotice,
} from "./reusable/FormComponents";
import { DocketSection } from "./blotter-form/DocketSection";
import { ComplainantSection } from "./blotter-form/ComplaintSection";
import type { ComplainantState } from "./blotter-form/ComplaintSection";
import { RespondentSection } from "./blotter-form/RespondentSection";
import type { RespondentState } from "./blotter-form/RespondentSection";
import { IncidentDetailsSection } from "./blotter-form/IncidentDetailSection";
import type { IncidentState } from "./blotter-form/IncidentDetailSection";
import { NarrativeSection } from "./blotter-form/NarrativeSection";
import { EvidenceSection } from "./blotter-form/EvidenceSection";
import { WitnessSection } from "./blotter-form/WitnessSection";
import { CertificationSection } from "./blotter-form/CertificationSection";
import { PermissionDeniedPage } from "./reusable/PermissionDeniedPage";
import { CenteredLoader } from "../../reusable/LoadingStates";

import {
  getEvidenceTypeOptions,
  getOfficerOptions,
  submitForTheRecord,
  submitFormalComplaint,
} from "../../service/blotter-api/blotter-api";
import type {
  EvidenceOptionDTO,
  OfficerOptionDTO,
  WitnessEntry,
} from "../../service/blotter-api/blotter-api";
function generateBlotterNumber(): string {
  const year = new Date().getFullYear();
  return `${year}-BLT-${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")}`;
}
type Mode = "record" | "formal";
type Errors = Record<string, string>;
const MAX_WITNESS_FULL_NAME_LENGTH = 80;
const MAX_WITNESS_ADDRESS_LENGTH = 180;
const MAX_WITNESS_TESTIMONY_LENGTH = 500;
const MAX_CUSTOM_EVIDENCE_LENGTH = 200;
export default function BlotterEntryForm() {
  const [hasCreatePermission, setHasCreatePermission] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    const checkPerm = async () => {
      try {
        const access = await getMyAccess();
        setHasCreatePermission(
          hasBlotterPermission(access, BLOTTER_PERMISSIONS.CREATE_CASE_ENTRY),
        );
      } catch (err) {
        setHasCreatePermission(false);
      }
    };
    checkPerm();
  }, []);
  const [mode, setMode] = useState<Mode>("record");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successBlotterNo, setSuccessBlotterNo] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const clearErr = (key: string) =>
    setErrors((prev) => {
      const next = {
        ...prev,
      };
      delete next[key];
      return next;
    });
  const [evidenceOptions, setEvidenceOptions] = useState<EvidenceOptionDTO[]>(
    [],
  );
  const [officerOptions, setOfficerOptions] = useState<OfficerOptionDTO[]>([]);
  const [assignedOfficerId, setAssignedOfficerId] = useState<string>("");

  const [optionsLoading, setOptionsLoading] = useState(true);
  // Form State Groups
  const [complainant, setComplainant] = useState<ComplainantState>({
    id: undefined,
    lastName: "",
    firstName: "",
    middleName: "",
    contact: "",
    age: "",
    gender: "",
    civilStatus: "",
    email: "",
    address: "",
  });
  const [respondent, setRespondent] = useState<RespondentState>({
    id: undefined,
    lastName: "",
    firstName: "",
    middleName: "",
    contact: "",
    relationship: "",
    address: "",
    alias: "",
    age: "",
    dob: "",
    gender: "",
    civilStatus: "",

    livingWith: "",
    email: "",
  });
  const [incident, setIncident] = useState<IncidentState>({
    natureId: "",
    dateOfIncident: "",
    timeOfIncident: "",
    placeOfIncident: "",
    frequency: "",
    injuryDesc: "",
  });
  const [narrative, setNarrative] = useState("");
  const [selectedEvidence, setSelectedEvidence] = useState<Set<number>>(
    new Set(),
  );
  const [customEvidence, setCustomEvidence] = useState("");
  const [witnesses, setWitnesses] = useState<WitnessEntry[]>([
    {
      personId: 0,
      fullName: "",
      contactNumber: "",
      address: "",
      testimony: "",
    },
  ]);
  const [certified, setCertified] = useState(false);
  const [blotterNumber] = useState(generateBlotterNumber());
  useEffect(() => {
    const init = async () => {
      try {
        const evidences = await getEvidenceTypeOptions().catch(() => []);
        const officers = await getOfficerOptions().catch(() => []);
        setEvidenceOptions(evidences);
        setOfficerOptions(officers);
      } catch (err) {
        console.error("Failed to load initialization data:", err);
      } finally {
        setOptionsLoading(false);
      }
    };
    init();
  }, []);
  const updateComplainant = (field: keyof ComplainantState, value: any) =>
    setComplainant((prev) => ({
      ...prev,
      [field]: value,
    }));
  const updateRespondent = (field: keyof RespondentState, value: any) =>
    setRespondent((prev) => ({
      ...prev,
      [field]: value,
    }));
  const updateIncident = (field: keyof IncidentState, value: any) =>
    setIncident((prev) => ({
      ...prev,
      [field]: value,
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
      {
        personId: 0,
        fullName: "",
        contactNumber: "",
        address: "",
        testimony: "",
      },
    ]);
  const removeWitness = (i: number) =>
    setWitnesses((w) => w.filter((_, idx) => idx !== i));
  const updateWitness = (i: number, field: keyof WitnessEntry, value: any) =>
    setWitnesses((w) =>
      w.map((wit, idx) =>
        idx === i
          ? {
              ...wit,
              [field]: value,
            }
          : wit,
      ),
    );
  // Backend expects evidence IDs as string values (e.g., "1", "2")
  const buildEvidenceIds = (): string[] =>
    Array.from(selectedEvidence, (id) => String(id));
  const resetForm = () => {
    setComplainant({
      id: undefined,
      lastName: "",
      firstName: "",
      middleName: "",
      contact: "",
      age: "",
      gender: "",
      civilStatus: "",
      email: "",
      address: "",
    });
    setRespondent({
      id: undefined,
      lastName: "",
      firstName: "",
      middleName: "",
      contact: "",
      relationship: "",
      address: "",
      alias: "",
      age: "",
      dob: "",
      gender: "",
      civilStatus: "",

      livingWith: "",
      email: "",
    });
    setIncident({
      natureId: "",
      dateOfIncident: "",
      timeOfIncident: "",
      placeOfIncident: "",
      frequency: "",
      injuryDesc: "",
    });
    setNarrative("");
    setSelectedEvidence(new Set());
    setCustomEvidence("");
    setAssignedOfficerId("");
    setWitnesses([
      {
        personId: 0,
        fullName: "",
        contactNumber: "",
        address: "",
        testimony: "",
      },
    ]);
    setCertified(false);
    setErrors({});
    setSubmitError(null);
  };
  const validate = (): boolean => {
    const e: Errors = {};
    if (!assignedOfficerId)
      e.assignedOfficerId = "Assigned officer is required.";
    if (!complainant.lastName.trim()) e.cLastName = "Last name is required.";
    if (!complainant.firstName.trim()) e.cFirstName = "First name is required.";
    if (!complainant.age.trim()) e.cAge = "Age is required.";
    if (!complainant.gender) e.cGender = "Gender is required.";
    if (!complainant.civilStatus) e.cCivilStatus = "Civil status is required.";
    if (!complainant.address.trim())
      e.cAddress = "Complete address is required.";
    if (!respondent.relationship)
      e.rRelationship = "Relationship to complainant is required.";
    if (mode === "record") {
      if (!respondent.firstName.trim())
        e.rFirstName = "First name is required.";
      if (!respondent.lastName.trim()) e.rLastName = "Last name is required.";
    } else {
      if (!respondent.lastName.trim()) e.rLastName = "Last name is required.";
      if (!respondent.firstName.trim())
        e.rFirstName = "First name is required.";
      if (!respondent.relationship)
        e.rRelationship = "Relationship to complainant is required.";
      // Witness fullName validation for formal complaints
      witnesses.forEach((w, idx) => {
        // Only require fullName if at least one other field is filled (not all blank)
        const hasOtherInfo = w.contactNumber || w.address || w.personId;
        if (hasOtherInfo && (w.fullName ?? "").trim() === "") {
          e[`witnessFullName${idx}`] =
            `Witness ${idx + 1} full name is required.`;
        }
      });
    }
    if (!incident.natureId) e.natureId = "Nature of complaint is required.";
    if (!incident.dateOfIncident)
      e.dateOfIncident = "Date of incident is required.";
    if (!incident.placeOfIncident.trim())
      e.placeOfIncident = "Place of incident is required.";
    if (!narrative.trim()) e.narrative = "Statement of facts is required.";

    const selectedEvidenceOptions = evidenceOptions.filter((option) =>
      selectedEvidence.has(option.id),
    );
    const hasSelectedOthersEvidence = selectedEvidenceOptions.some((option) =>
      /\bother(s)?\b/i.test(option.typName),
    );
    if (hasSelectedOthersEvidence && !customEvidence.trim()) {
      e.customEvidence =
        'Please specify details for the selected "Others" evidence.';
    } else if (customEvidence.trim().length > MAX_CUSTOM_EVIDENCE_LENGTH) {
      e.customEvidence = `Other evidence must not exceed ${MAX_CUSTOM_EVIDENCE_LENGTH} characters.`;
    }

    if (mode === "formal" && !incident.frequency)
      e.frequency = "Incident frequency is required.";
    if (mode === "formal") {
      witnesses.forEach((w, idx) => {
        const fullName = (w.fullName ?? "").trim();
        const contactNumber = (w.contactNumber ?? "").trim();
        const address = (w.address ?? "").trim();
        const hasAnyWitnessData =
          fullName.length > 0 ||
          contactNumber.length > 0 ||
          address.length > 0 ||
          (w.personId ?? 0) > 0;

        if (!hasAnyWitnessData) return;

        if (!fullName) {
          e[`witnessFullName${idx}`] =
            `Witness ${idx + 1} full name is required.`;
        } else if (fullName.length > MAX_WITNESS_FULL_NAME_LENGTH) {
          e[`witnessFullName${idx}`] =
            `Witness ${idx + 1} full name must not exceed ${MAX_WITNESS_FULL_NAME_LENGTH} characters.`;
        }
        if (!contactNumber) {
          e[`witnessContact${idx}`] =
            `Witness ${idx + 1} contact number is required.`;
        } else if (contactNumber.length < 10) {
          e[`witnessContact${idx}`] =
            `Witness ${idx + 1} contact number is invalid.`;
        }
        if (!address) {
          e[`witnessAddress${idx}`] = `Witness ${idx + 1} address is required.`;
        } else if (address.length > MAX_WITNESS_ADDRESS_LENGTH) {
          e[`witnessAddress${idx}`] =
            `Witness ${idx + 1} address must not exceed ${MAX_WITNESS_ADDRESS_LENGTH} characters.`;
        }

        const testimony = (w.testimony ?? "").trim();
        if (testimony.length > MAX_WITNESS_TESTIMONY_LENGTH) {
          e[`witnessTestimony${idx}`] =
            `Witness ${idx + 1} testimony must not exceed ${MAX_WITNESS_TESTIMONY_LENGTH} characters.`;
        }
      });
    }
    if (mode === "formal" && !certified)
      e.certified = "You must certify before filing.";
    setErrors(e);
    if (Object.keys(e).length > 0) {
      const firstKey = Object.keys(e)[0];
      document.getElementById(`field-${firstKey}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
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
      let resultBlotterNo: string;
      if (mode === "record") {
        const payload: any = {
          complainantId: complainant.id,
          respondentId: respondent.id,
          firstName: complainant.firstName,
          lastName: complainant.lastName,
          middleName: complainant.middleName || undefined,
          contactNumber: complainant.contact,
          age: complainant.age ? parseInt(complainant.age) : 0,
          gender: complainant.gender || undefined,
          civilStatus: complainant.civilStatus || undefined,
          email: complainant.email || undefined,
          completeAddress: complainant.address,
          respondentFirstName: respondent.firstName || "Unknown",
          respondentLastName: respondent.lastName || "Unknown",
          respondentMiddleName: respondent.middleName || undefined,
          respondentContact: respondent.contact || undefined,
          relationshipToComplainant: respondent.relationship || undefined,
          respondentAddress: respondent.address || undefined,
          natureOfComplaintId: incident.natureId,

          dateOfIncident: incident.dateOfIncident,
          timeOfIncident: incident.timeOfIncident
            ? `${incident.timeOfIncident}:00`
            : undefined,
          placeOfIncident: incident.placeOfIncident,
          narrativeStatement: narrative,
          ...(assignedOfficerId
            ? { assignToId: Number(assignedOfficerId) }
            : {}),
        };
        const evidenceIds = buildEvidenceIds();
        if (evidenceIds.length) payload.evidenceTypeIds = evidenceIds;
        if (customEvidence.trim())
          payload.customEvidence = customEvidence.trim();
        resultBlotterNo = await submitForTheRecord(payload);
      } else {
        const payload = {
          complainantId: complainant.id,
          respondentId: respondent.id,
          complainantFirstName: complainant.firstName,
          complainantLastName: complainant.lastName,
          complainantMiddleName: complainant.middleName || undefined,
          complainantContact: complainant.contact,
          complainantAge: complainant.age
            ? parseInt(complainant.age)
            : undefined,
          complainantGender: complainant.gender || undefined,
          complainantCivilStatus: complainant.civilStatus || undefined,
          complainantEmail: complainant.email || undefined,
          complainantAddress: complainant.address,
          respondentFirstName: respondent.firstName,
          respondentLastName: respondent.lastName,
          respondentMiddleName: respondent.middleName || undefined,
          respondentAlias: respondent.alias || undefined,
          respondentAge: respondent.age ? parseInt(respondent.age) : undefined,
          respondentDob: respondent.dob || undefined,
          respondentGender: respondent.gender || undefined,
          respondentCivilStatus: respondent.civilStatus || undefined,
          respondentContact: respondent.contact || undefined,
          respondentAddress: respondent.address || undefined,
          relationshipTypeName: respondent.relationship || undefined,
          livingWithComplainant:
            respondent.livingWith !== ""
              ? respondent.livingWith === "true"
              : undefined,
          natureOfComplaintId: incident.natureId,
          dateOfIncident: incident.dateOfIncident,
          timeOfIncident: incident.timeOfIncident
            ? `${incident.timeOfIncident}:00`
            : undefined,
          placeOfIncident: incident.placeOfIncident,
          frequencyOfIncident: incident.frequency || undefined,

          descriptionOfInjuries: incident.injuryDesc || undefined,
          narrativeStatement: narrative,
          evidenceTypeIds: buildEvidenceIds().length
            ? buildEvidenceIds()
            : undefined,
          customEvidence: customEvidence.trim() || undefined,
          assignToId: assignedOfficerId ? Number(assignedOfficerId) : undefined,
          witnesses: witnesses
            .filter((w) => (w.fullName ?? "").trim())
            .map((w) => ({
              ...w,
              testimony: (w.testimony ?? "").trim(),
            })),
          certifiedTrue: certified,
        };
        resultBlotterNo = await submitFormalComplaint(payload);
      }
      setSuccessBlotterNo(resultBlotterNo || blotterNumber);
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("Submission error:");
      setSubmitError("Submission failed. Please try again.");
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    resetForm();
  };
  if (hasCreatePermission === null) {
    return <CenteredLoader minHeight="min-h-[70vh]" />;
  }
  if (!hasCreatePermission) {
    return (
      <PermissionDeniedPage
        message="You do not have permission to file complaints or create case entries."
        hint="Ask your administrator to grant Create Case Entry access."
      />
    );
  }
  return (
    <div className="min-h-screen bg-blue-50/40">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
        <FormNotice
          tone="warning"
          text="Privacy Notice: In compliance with the Data Privacy Act of 2012 (R.A. 10173), all personal information collected in this blotter report shall be kept strictly confidential. Access to full details is restricted to authorized barangay personnel only."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RadioCard
            name="complaint_type"
            value="record"
            checked={mode === "record"}
            onChange={() => {
              setMode("record");
              setErrors({});
            }}
            title="For the Record Only"
            description="Walk-in consultation or blotter entry without formal complaint yet. (Para sa rekord lang)"
          />
          <RadioCard
            name="complaint_type"
            value="formal"
            checked={mode === "formal"}
            onChange={() => {
              setMode("formal");
              setErrors({});
            }}
            title="Formal Complaint"
            description="Formal complaint requiring barangay intervention. May involve mediation or legal action."
          />
        </div>

        <ConfirmModal
          isOpen={showConfirmModal}
          type="warning"
          title="Confirm Submission"
          message={`Please confirm that all provided information is correct. ${mode === "formal" ? "This will be filed as a formal complaint." : "This will be recorded as a blotter entry."} This action cannot be undone.`}
          confirmText={mode === "record" ? "Save Record" : "File Case"}
          cancelText="Review Again"
          onConfirm={handleConfirmedSubmit}
          onCancel={() => setShowConfirmModal(false)}
        />

        <ActionModal
          isOpen={showSuccessModal}
          onClose={handleSuccessClose}
          title="Entry Saved!"
          type="success"
        >
          <p>Blotter entry has been successfully saved.</p>
          <p className="mt-1 font-semibold text-gray-700">
            Blotter No.: {successBlotterNo}
          </p>
        </ActionModal>

        <ActionModal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          title="Error"
          type="danger"
        >
          {submitError}
        </ActionModal>

        <DocketSection
          mode={mode}
          blotterNumber={blotterNumber}
          officerOptions={officerOptions}
          assignedOfficerId={assignedOfficerId}
          onAssignedOfficerChange={setAssignedOfficerId}
          errors={errors}
          clearErr={clearErr}
        />

        <ComplainantSection
          data={complainant}
          onChange={updateComplainant}
          errors={errors}
          clearErr={clearErr}
        />

        <RespondentSection
          mode={mode}
          data={respondent}
          onChange={updateRespondent}
          errors={errors}
          clearErr={clearErr}
        />

        <IncidentDetailsSection
          mode={mode}
          data={incident}
          onChange={updateIncident}
          errors={errors}
          clearErr={clearErr}
        />

        <NarrativeSection
          mode={mode}
          narrative={narrative}
          onChange={setNarrative}
          error={errors.narrative}
          clearErr={() => clearErr("narrative")}
        />

        <EvidenceSection
          optionsLoading={optionsLoading}
          evidenceOptions={evidenceOptions}
          selectedEvidence={selectedEvidence}
          toggleEvidence={toggleEvidence}
          customEvidence={customEvidence}
          setCustomEvidence={setCustomEvidence}
          error={errors.customEvidence}
          clearErr={() => clearErr("customEvidence")}
        />

        {mode === "formal" && (
          <WitnessSection
            witnesses={witnesses}
            addWitness={addWitness}
            removeWitness={removeWitness}
            updateWitness={updateWitness}
            errors={errors}
            clearErr={clearErr}
          />
        )}

        <CertificationSection
          certified={certified}
          onChange={setCertified}
          error={errors.certified}
          clearErr={() => clearErr("certified")}
        />

        <FormActions
          onCancel={() => window.history.back()}
          onSubmit={handleSubmitClick}
          submitLabel={mode === "record" ? "Save Record" : "File Case"}
          isSubmitting={isSubmitting}
          mode={mode}
        />
      </div>
    </div>
  );
}
