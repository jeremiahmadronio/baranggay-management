import { getMyAccess } from "../../service/blotter-api/BlotterPermission";
import {
  BLOTTER_PERMISSIONS,
  hasBlotterPermission,
} from "../../service/blotter-api/BlotterPermission";
import { useEffect, useState, useRef } from "react";
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
import { CenteredLoader } from "../../hooks/LoadingStates";

import {
  getEvidenceTypeOptions,
  getOfficerOptions,
  submitForTheRecord,
  submitFormalComplaint,
} from "../../service/blotter-api/BlotterFormComplaint";
import type {
  EvidenceOptionDTO,
  OfficerOptionDTO,
  WitnessEntry,
} from "../../service/blotter-api/BlotterFormComplaint";
function generateBlotterNumber(): string {
  const year = new Date().getFullYear();
  return `${year}-BLT-XXX`;
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
  const recordStateRef = useRef<any>(null);
  const formalStateRef = useRef<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
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
  const [narrativeFile, setNarrativeFile] = useState<File | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<Set<number>>(
    new Set(),
  );
  const [evidenceFiles, setEvidenceFiles] = useState<Record<number, File | null>>({});
  const [customEvidence, setCustomEvidence] = useState("");
  const [customEvidenceFile, setCustomEvidenceFile] = useState<File | null>(null);
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

  const saveCurrentModeState = (currentMode: Mode) => {
    const state = {
      complainant,
      respondent,
      incident,
      narrativeFile,
      selectedEvidence,
      evidenceFiles,
      customEvidence,
      customEvidenceFile,
      witnesses,
      assignedOfficerId,
      certified,
    };
    if (currentMode === "record") recordStateRef.current = state;
    else formalStateRef.current = state;
  };

  const loadTargetModeState = (targetMode: Mode) => {
    const state = targetMode === "record" ? recordStateRef.current : formalStateRef.current;
    if (state) {
      setComplainant(state.complainant);
      setRespondent(state.respondent);
      setIncident(state.incident);
      setNarrativeFile(state.narrativeFile);
      setSelectedEvidence(state.selectedEvidence);
      setEvidenceFiles(state.evidenceFiles);
      setCustomEvidence(state.customEvidence);
      setCustomEvidenceFile(state.customEvidenceFile);
      setWitnesses(state.witnesses);
      setAssignedOfficerId(state.assignedOfficerId);
      setCertified(state.certified);
    } else {
      resetForm();
    }
  };

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
  const setEvidenceFile = (id: number, file: File | null) => {
    setEvidenceFiles((prev) => ({ ...prev, [id]: file }));
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
    setNarrativeFile(null);
    setSelectedEvidence(new Set());
    setEvidenceFiles({});
    setCustomEvidence("");
    setCustomEvidenceFile(null);
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
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const raw = String(reader.result ?? "");
        // Strip data URL prefix (e.g. "data:application/pdf;base64,")
        const base64 = raw.includes(",") ? raw.split(",")[1] : raw;
        resolve(base64);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const isDuplicatePerson = (): boolean => {
    // Check if Complainant and Respondent match
    if (complainant.id && respondent.id && complainant.id === respondent.id) return true;
    if (
      complainant.firstName.trim() &&
      respondent.firstName.trim() &&
      complainant.firstName.trim().toLowerCase() === respondent.firstName.trim().toLowerCase() &&
      complainant.lastName.trim().toLowerCase() === respondent.lastName.trim().toLowerCase() &&
      complainant.middleName.trim().toLowerCase() === respondent.middleName.trim().toLowerCase()
    ) return true;
    
    // Check if any Witness matches Complainant or Respondent
    for (const w of witnesses) {
      if (!w.fullName.trim()) continue;
      
      const witnessNameLower = w.fullName.trim().toLowerCase();
      
      // Compare with Complainant
      const compFullName = `${complainant.firstName.trim()} ${complainant.middleName.trim()} ${complainant.lastName.trim()}`.replace(/\s+/g, " ").trim().toLowerCase();
      if (witnessNameLower === compFullName && compFullName !== "") return true;
      if (w.personId && complainant.id && w.personId === complainant.id) return true;
      
      // Compare with Respondent
      const respFullName = `${respondent.firstName.trim()} ${respondent.middleName.trim()} ${respondent.lastName.trim()}`.replace(/\s+/g, " ").trim().toLowerCase();
      if (witnessNameLower === respFullName && respFullName !== "") return true;
      if (w.personId && respondent.id && w.personId === respondent.id) return true;
    }

    return false;
  };

  const checkDuplicatePersonSelection = (personId: number, firstName: string, lastName: string, middleName: string): boolean => {
    // Check Complainant
    if (complainant.id === personId) return true;
    if (
      complainant.firstName.trim() &&
      complainant.firstName.trim().toLowerCase() === firstName.trim().toLowerCase() &&
      complainant.lastName.trim().toLowerCase() === lastName.trim().toLowerCase() &&
      complainant.middleName.trim().toLowerCase() === (middleName || "").trim().toLowerCase()
    ) return true;

    // Check Respondent
    if (respondent.id === personId) return true;
    if (
      respondent.firstName.trim() &&
      respondent.firstName.trim().toLowerCase() === firstName.trim().toLowerCase() &&
      respondent.lastName.trim().toLowerCase() === lastName.trim().toLowerCase() &&
      respondent.middleName.trim().toLowerCase() === (middleName || "").trim().toLowerCase()
    ) return true;

    // Check Witnesses
    for (const w of witnesses) {
      if (w.personId === personId) return true;
      const wFullName = w.fullName.trim().toLowerCase();
      const testFullName = `${firstName.trim()} ${(middleName || "").trim()} ${lastName.trim()}`.replace(/\s+/g, " ").trim().toLowerCase();
      if (wFullName === testFullName && testFullName !== "") return true;
    }
    return false;
  };

  const handleDuplicateSelection = (person: any) => {
    if (checkDuplicatePersonSelection(person.id, person.firstName, person.lastName, person.middleName)) {
      setSubmitError("Duplicate person detected. Cannot select the same resident for multiple roles.");
      setShowErrorModal(true);
      return true;
    }
    return false;
  };

  const prevDuplicateRef = useRef(false);
  useEffect(() => {
    const isDup = isDuplicatePerson();
    if (isDup && !prevDuplicateRef.current) {
      setSubmitError("Duplicate person detected. Cannot select the same resident for multiple roles.");
      setShowErrorModal(true);
    }
    prevDuplicateRef.current = isDup;
  }, [complainant, respondent, witnesses]);

  const validate = (): boolean => {
    const e: Errors = {};
    // Officer assignment only required for formal complaints
    if (mode === "formal" && !assignedOfficerId)
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
      if (!respondent.livingWith)
        e.rLivingWith = "Please indicate if respondent is currently living with complainant.";
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
    if (!narrativeFile) e.narrative = "Narrative file is required.";

    const selectedEvidenceOptions = evidenceOptions.filter((option) =>
      selectedEvidence.has(option.id),
    );
    selectedEvidenceOptions.forEach((option) => {
      if (!evidenceFiles[option.id]) {
        e[`evidenceFile_${option.id}`] = "File is required for selected evidence.";
      }
    });

    const hasSelectedOthersEvidence = selectedEvidenceOptions.some((option) =>
      /\bother(s)?\b/i.test(option.typName),
    );
    if (hasSelectedOthersEvidence && !customEvidence.trim()) {
      e.customEvidence =
        'Please specify details for the selected "Others" evidence.';
    } else if (customEvidence.trim().length > MAX_CUSTOM_EVIDENCE_LENGTH) {
      e.customEvidence = `Other evidence must not exceed ${MAX_CUSTOM_EVIDENCE_LENGTH} characters.`;
    }
    if (customEvidence.trim().length > 0 && !customEvidenceFile) {
      e.customEvidenceFile = "File is required for specified evidence.";
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

        if (!w.testimonyFile) {
          e[`witnessTestimony${idx}`] =
            `Witness ${idx + 1} testimony image is required.`;
        } else if (!w.testimonyFile.type.startsWith("image/")) {
          e[`witnessTestimony${idx}`] =
            `Witness ${idx + 1} testimony must be an image file (JPG, PNG, etc.).`;
        }
      });
    }
    if (mode === "formal" && !certified)
      e.certified = "You must certify before filing.";

    if (complainant.id && respondent.id && complainant.id === respondent.id) {
      e.cFirstName = "Complainant and Respondent cannot be the same person.";
      e.rFirstName = "Complainant and Respondent cannot be the same person.";
    } else if (
      complainant.firstName.trim() &&
      respondent.firstName.trim() &&
      complainant.firstName.trim().toLowerCase() === respondent.firstName.trim().toLowerCase() &&
      complainant.lastName.trim().toLowerCase() === respondent.lastName.trim().toLowerCase() &&
      complainant.middleName.trim().toLowerCase() === respondent.middleName.trim().toLowerCase()
    ) {
      e.cFirstName = "Complainant and Respondent cannot have the exact same name.";
      e.rFirstName = "Complainant and Respondent cannot have the exact same name.";
    }

    // Witness duplication validation
    if (mode === "formal") {
      witnesses.forEach((w, idx) => {
        if (!w.fullName.trim()) return;
        const witnessNameLower = w.fullName.trim().toLowerCase();
        const compFullName = `${complainant.firstName.trim()} ${complainant.middleName.trim()} ${complainant.lastName.trim()}`.replace(/\s+/g, " ").trim().toLowerCase();
        const respFullName = `${respondent.firstName.trim()} ${respondent.middleName.trim()} ${respondent.lastName.trim()}`.replace(/\s+/g, " ").trim().toLowerCase();

        if (witnessNameLower === compFullName || (w.personId && complainant.id && w.personId === complainant.id)) {
           e[`witnessFullName${idx}`] = "A witness cannot be the complainant.";
        }
        if (witnessNameLower === respFullName || (w.personId && respondent.id && w.personId === respondent.id)) {
           e[`witnessFullName${idx}`] = "A witness cannot be the respondent.";
        }
      });
    }

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
      if (!narrativeFile) throw new Error("Narrative file is missing.");
      const narrativeBase64 = await fileToBase64(narrativeFile);
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
          narrativeStatement: narrativeBase64,
          ...(assignedOfficerId
            ? { assignToId: Number(assignedOfficerId) }
            : {}),
        };
        const evidenceIds = buildEvidenceIds();
        const evidencesList: any[] = [];
        
        for (const id of evidenceIds) {
          const isOthers = evidenceOptions.find((o) => o.id === Number(id))?.typName.toLowerCase().includes("other");
          // For 'others', prioritize the customEvidenceFile if provided, otherwise fallback to the inline file.
          const file = isOthers ? (customEvidenceFile || evidenceFiles[Number(id)]) : evidenceFiles[Number(id)];
          if (!file) throw new Error(`Missing file for evidence type ${id}`);
          
          const base64 = await fileToBase64(file);
          evidencesList.push({
            evidenceTypeId: id,
            fileData: base64,
            customDescription: isOthers ? customEvidence.trim() : undefined,
          });
        }
        
        // Handle case where user filled out "Other/Specify" but didn't check the checkbox
        const othersOption = evidenceOptions.find(o => /other(s)?/i.test(o.typName));
        if (othersOption && customEvidence.trim().length > 0 && customEvidenceFile) {
          const alreadyAdded = evidencesList.some(e => String(e.evidenceTypeId) === String(othersOption.id));
          if (!alreadyAdded) {
            const base64 = await fileToBase64(customEvidenceFile);
            evidencesList.push({
              evidenceTypeId: String(othersOption.id),
              fileData: base64,
              customDescription: customEvidence.trim(),
            });
          }
        }
        
        if (evidencesList.length) payload.evidences = evidencesList;
        
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
          narrativeStatement: narrativeBase64,
          evidences: await (async () => {
            const evidenceIds = buildEvidenceIds();
            const evidencesList: any[] = [];
            
            for (const id of evidenceIds) {
              const isOthers = evidenceOptions.find((o) => o.id === Number(id))?.typName.toLowerCase().includes("other");
              const file = isOthers ? (customEvidenceFile || evidenceFiles[Number(id)]) : evidenceFiles[Number(id)];
              if (!file) throw new Error(`Missing file for evidence type ${id}`);
              
              const base64 = await fileToBase64(file);
              evidencesList.push({
                evidenceTypeId: id,
                fileData: base64,
                customDescription: isOthers ? customEvidence.trim() : undefined,
              });
            }
            
            const othersOption = evidenceOptions.find(o => /other(s)?/i.test(o.typName));
            if (othersOption && customEvidence.trim().length > 0 && customEvidenceFile) {
              const alreadyAdded = evidencesList.some(e => String(e.evidenceTypeId) === String(othersOption.id));
              if (!alreadyAdded) {
                const base64 = await fileToBase64(customEvidenceFile);
                evidencesList.push({
                  evidenceTypeId: String(othersOption.id),
                  fileData: base64,
                  customDescription: customEvidence.trim(),
                });
              }
            }
            return evidencesList.length > 0 ? evidencesList : undefined;
          })(),
          assignToId: assignedOfficerId ? Number(assignedOfficerId) : undefined,
          witnesses: await Promise.all(
            witnesses
              .filter((w) => (w.fullName ?? "").trim())
              .map(async (w) => ({
                ...w,
                testimonyFile: w.testimonyFile ? await fileToBase64(w.testimonyFile) : undefined,
              }))
          ),
          certifiedTrue: certified,
        };
        resultBlotterNo = await submitFormalComplaint(payload);
      }
      setSuccessBlotterNo(resultBlotterNo || blotterNumber);
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("Submission error:", err);
      setSubmitError(err.message || "Submission failed. Please try again.");
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
    <form 
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmitClick();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          const target = e.target as HTMLElement;
          const tagName = target.tagName.toLowerCase();
          if (tagName === "textarea" || tagName === "button" || target.isContentEditable) {
            return;
          }
          e.preventDefault();
          handleSubmitClick();
        }
      }}
      className="min-h-screen bg-blue-50/40"
    >
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
              if (mode !== "record") {
                saveCurrentModeState(mode);
                loadTargetModeState("record");
                setMode("record");
                setErrors({});
              }
            }}
            title="For the Record Only"
            description="Walk-in consultation or blotter entry without formal complaint yet. (Para sa rekord lang)"
          />
          <RadioCard
            name="complaint_type"
            value="formal"
            checked={mode === "formal"}
            onChange={() => {
              if (mode !== "formal") {
                saveCurrentModeState(mode);
                loadTargetModeState("formal");
                setMode("formal");
                setErrors({});
              }
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

        <ConfirmModal
          isOpen={showCancelModal}
          type="danger"
          title="Cancel Entry"
          message="Are you sure you want to cancel? All information entered will be lost."
          confirmText="Discard Form"
          cancelText="Continue Editing"
          onConfirm={() => {
            setShowCancelModal(false);
            resetForm();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onCancel={() => setShowCancelModal(false)}
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
          onClearPerson={() => {
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
            [
              "cLastName",
              "cFirstName",
              "cContact",
              "cAge",
              "cGender",
              "cCivilStatus",
              "cAddress",
            ].forEach(clearErr);
          }}
          onCheckDuplicate={handleDuplicateSelection}
        />

        <RespondentSection
          mode={mode}
          data={respondent}
          onChange={updateRespondent}
          errors={errors}
          clearErr={clearErr}
          onClearPerson={() => {
            setRespondent({
              id: undefined,
              lastName: "",
              firstName: "",
              middleName: "",
              contact: "",
              relationship: respondent.relationship,
              address: "",
              alias: "",
              age: "",
              dob: "",
              gender: "",
              civilStatus: "",
              livingWith: respondent.livingWith,
              email: "",
            });
            ["rLastName", "rFirstName"].forEach(clearErr);
          }}
          onCheckDuplicate={handleDuplicateSelection}
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
          narrativeFile={narrativeFile}
          onChange={setNarrativeFile}
          error={errors.narrative}
          clearErr={() => clearErr("narrative")}
        />

        <EvidenceSection
          optionsLoading={optionsLoading}
          evidenceOptions={evidenceOptions}
          selectedEvidence={selectedEvidence}
          evidenceFiles={evidenceFiles}
          toggleEvidence={toggleEvidence}
          setEvidenceFile={setEvidenceFile}
          customEvidence={customEvidence}
          setCustomEvidence={setCustomEvidence}
          customEvidenceFile={customEvidenceFile}
          setCustomEvidenceFile={setCustomEvidenceFile}
          errors={errors}
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
            onCheckDuplicate={handleDuplicateSelection}
          />
        )}

        <CertificationSection
          certified={certified}
          onChange={setCertified}
          error={errors.certified}
          clearErr={() => clearErr("certified")}
        />


        <FormActions
          onCancel={() => setShowCancelModal(true)}
          onSubmit={handleSubmitClick}
          submitLabel={mode === "record" ? "Save Record" : "File Case"}
          isSubmitting={isSubmitting}
          disabled={isDuplicatePerson()}
          mode={mode}
        />
      </div>
    </form>
  );
}
