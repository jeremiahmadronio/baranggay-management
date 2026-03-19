import { getMyAccess } from "../blotter-api/BlotterPermission";
import { useEffect, useState } from "react";
import { ActionModal } from "./reusable/SuccessModal";
import {
  RadioCard,
  FormActions,
  ConfirmModal,
} from "./reusable/FormComponents";
import { DocketSection } from "./blotter-form/DocketSection";
import { ComplainantSection } from "./blotter-form/ComplaintSection";
import type { ComplainantState } from "./blotter-form/ComplaintSection";
import { RespondentSection } from "./blotter-form/RespondentSection";
import type { RespondentState } from "./blotter-form/RespondentSection";
import { IncidentDetailsSection } from "../blotter-module/blotter-form/IncidentDetailSection";
import type { IncidentState } from "./blotter-form/IncidentDetailSection";
import { getFrequencyOptions } from "../blotter-api/DocketView";
import type { IncidentOptionDTO } from "../blotter-api/DocketView";
import { NarrativeSection } from "./blotter-form/NarrativeSection";
import { EvidenceSection } from "./blotter-form/EvidenceSection";
import { WitnessSection } from "./blotter-form/WitnessSection";
import { CertificationSection } from "./blotter-form/CertificationSection";

import {
  getNatureOfComplaintOptions,
  getEvidenceTypeOptions,
  submitForTheRecord,
  submitFormalComplaint,
} from "../blotter-api/BlotterFormComplaint";
import type {
  NatureOptionDTO,
  EvidenceOptionDTO,
  WitnessEntry,
} from "../blotter-api/BlotterFormComplaint";
function generateBlotterNumber(): string {
  const year = new Date().getFullYear();
  return `${year}-BLT-${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")}`;
}
type Mode = "record" | "formal";
type Errors = Record<string, string>;
export default function BlotterEntryForm() {
  const [hasCreatePermission, setHasCreatePermission] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    const checkPerm = async () => {
      try {
        const access = await getMyAccess();
        setHasCreatePermission(
          access.permissions.includes("Create Blotter Entry"),
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
  const [natureOptions, setNatureOptions] = useState<NatureOptionDTO[]>([]);
  const [evidenceOptions, setEvidenceOptions] = useState<EvidenceOptionDTO[]>(
    [],
  );
  const [frequencyOptions, setFrequencyOptions] = useState<IncidentOptionDTO[]>(
    [],
  );
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
    occupation: "",
    livingWith: "",
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
    },
  ]);
  const [certified, setCertified] = useState(false);
  const [blotterNumber] = useState(generateBlotterNumber());
  useEffect(() => {
    const init = async () => {
      try {
        const [natures, evidences, frequencies] = await Promise.all([
          getNatureOfComplaintOptions().catch(() => []),
          getEvidenceTypeOptions().catch(() => []),
          getFrequencyOptions().catch(() => []),
        ]);
        setNatureOptions(natures);
        setEvidenceOptions(evidences);
        setFrequencyOptions(frequencies);
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
  const buildEvidenceIds = (): string[] => [
    ...Array.from(selectedEvidence).map(String),
    ...(customEvidence.trim() ? [customEvidence.trim()] : []),
  ];
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
      occupation: "",
      livingWith: "",
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
    setWitnesses([
      {
        personId: 0,
        fullName: "",
        contactNumber: "",
        address: "",
      },
    ]);
    setCertified(false);
    setErrors({});
    setSubmitError(null);
  };
  const validate = (): boolean => {
    const e: Errors = {};
    if (!complainant.lastName.trim()) e.cLastName = "Last name is required.";
    if (!complainant.firstName.trim()) e.cFirstName = "First name is required.";
    if (!complainant.contact.trim()) e.cContact = "Contact number is required.";
    if (!complainant.address.trim())
      e.cAddress = "Complete address is required.";
    if (mode === "record") {
      if (!respondent.firstName.trim())
        e.rFirstName = "First name is required.";
      if (!respondent.lastName.trim()) e.rLastName = "Last name is required.";
    } else {
      if (!respondent.lastName.trim()) e.rLastName = "Last name is required.";
      if (!respondent.firstName.trim())
        e.rFirstName = "First name is required.";
      if (!respondent.relationship)
        e.rFormalRelationship = "Relationship is required.";
      // Witness fullName validation for formal complaints
      witnesses.forEach((w, idx) => {
        if ((w.fullName ?? "").trim() === "") {
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
    if (mode === "formal" && !incident.frequency)
      e.frequency = "Incident frequency is required.";
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
        const payload = {
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
          natureOfComplaintId: Number(incident.natureId),
          dateOfIncident: incident.dateOfIncident,
          timeOfIncident: incident.timeOfIncident
            ? `${incident.timeOfIncident}:00`
            : undefined,
          placeOfIncident: incident.placeOfIncident,
          narrativeStatement: narrative,
          evidenceTypeIds: buildEvidenceIds().length
            ? buildEvidenceIds()
            : undefined,
        };
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
          respondentOccupation: respondent.occupation || undefined,
          respondentContact: respondent.contact || undefined,
          respondentAddress: respondent.address || undefined,
          relationshipTypeName: respondent.relationship || undefined,
          livingWithComplainant:
            respondent.livingWith !== ""
              ? respondent.livingWith === "true"
              : undefined,
          natureOfComplaintId: Number(incident.natureId),
          dateOfIncident: incident.dateOfIncident,
          timeOfIncident: incident.timeOfIncident
            ? `${incident.timeOfIncident}:00`
            : undefined,
          placeOfIncident: incident.placeOfIncident,
          frequencyOfIncident: incident.frequency
            ? Number(incident.frequency)
            : undefined,
          descriptionOfInjuries: incident.injuryDesc || undefined,
          narrativeStatement: narrative,
          evidenceTypeIds: buildEvidenceIds().length
            ? buildEvidenceIds()
            : undefined,
          witnesses: witnesses.filter((w) => w.fullName),
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
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Checking permissions...
      </div>
    );
  }
  if (!hasCreatePermission) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 font-semibold">
        You do not have permission to create records.
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div className="flex items-start gap-2 rounded-lg px-4 py-3 text-sm bg-amber-50 border border-amber-200 text-amber-800">
          <svg
            className="mt-0.5 shrink-0 text-amber-500"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>
            <span className="font-semibold">Privacy Notice: </span>
            In compliance with the Data Privacy Act of 2012 (R.A. 10173), all
            personal information collected in this blotter report shall be kept
            strictly confidential. Access to full details is restricted to
            authorized barangay personnel only.
          </p>
        </div>

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

        {mode === "formal" && (
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
            <svg
              className="mt-0.5 shrink-0"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>
              <span className="font-semibold">Confidentiality Reminder: </span>
              Handle this information with utmost confidentiality. Do not share
              victim information with unauthorized persons. Violation is
              punishable under R.A. 9262.
            </p>
          </div>
        )}

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

        <DocketSection mode={mode} blotterNumber={blotterNumber} />

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
          natureOptions={natureOptions}
          frequencyOptions={frequencyOptions}
          optionsLoading={optionsLoading}
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
        />

      

        {mode === "formal" && (
          <WitnessSection
            witnesses={witnesses}
            addWitness={addWitness}
            removeWitness={removeWitness}
            updateWitness={updateWitness}
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
