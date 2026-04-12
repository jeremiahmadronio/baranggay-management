import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import {
  ConfirmModal,
  FormActions,
  FormInput,
  FormNotice,
  FormRow,
  FormSelect,
  FormTextarea,
  SectionCard as BlotterSectionCard,
} from "../blotter-module/reusable/FormComponents";
import { ActionModal } from "../blotter-module/reusable/SuccessModal";
import { useUser } from "../../context/UserContext";
import {
  fileVawcComplaint,
  getAssignOfficerComplaintOptions,
  getEvidenceOptions,
  getMyAccess,
  getViolenceOptions,
  hasVawcPermission,
  searchPeople,
  VAWC_PERMISSIONS,
} from "../../service/vawc-api/vawc-api";
import type {
  ComplaintDTO,
  ViolenceOptionDTO,
  AssignOfficerOptionDTO,
  EvidenceOptionDTO,
  PersonSearchResponseDTO,
  UserAccessPermission,
} from "../../service/vawc-api/vawc-api";
import { PermissionDeniedPage } from "../blotter-module/reusable/PermissionDeniedPage";

/* ─── Constants ─────────────────────────────────────────────────────────── */

const RECENT_SUBMISSION_KEY = "vawc:lastComplaintSubmission";
const COMPLAINT_DRAFT_KEY = "vawc:complaintDraft";
const RECENT_SUBMISSION_WINDOW_MS = 2 * 60 * 1000;
const NAME_PATTERN = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .,'-]*$/;
const PHONE_PATTERN = /^09\d{9}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LIMITS = {
  nameMin: 2,
  nameMax: 80,
  addressMin: 8,
  addressMax: 180,
  narrativeMin: 20,
  narrativeMax: 5000,
  locationMin: 3,
  locationMax: 120,
  shortTextMax: 120,
  descriptionMax: 250,
  testimonyMax: 500,
};

const searchInputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pl-10 text-[15px] text-slate-900 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all";

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
  { value: "Husband/Wife", label: "Husband / Wife" },
  { value: "Ex-Husband/Ex-Wife", label: "Ex-Husband / Ex-Wife" },
  { value: "Live-in Partner", label: "Live-in Partner" },
  { value: "Former Live-in Partner", label: "Former Live-in Partner" },
  { value: "Dating Relationship", label: "Dating Relationship" },
  { value: "Other", label: "Other" },
];

const NATURE_OF_COMPLAINT_OPTIONS = [
  { value: "1", label: "Physical Violence" },
  { value: "2", label: "Sexual Violence" },
  { value: "3", label: "Psychological Violence" },
  { value: "4", label: "Economic Abuse" },
  { value: "5", label: "Threats / Intimidation" },
  { value: "6", label: "Violation of Protection Order" },
  { value: "7", label: "Others (Specify in Narrative)" },
];

const FREQUENCY_OPTIONS = [
  { value: "First Time", label: "First Time" },
  { value: "Second Time", label: "Second Time" },
  { value: "Habitual / Third Time+", label: "Habitual / Third Time+" },
];

function generateCaseNumber(): string {
  const year = new Date().getFullYear();
  return `${year}-VAWC-${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")}`;
}

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function stripUnsafeChars(value: string): string {
  return value.replace(/[<>]/g, "");
}

function sanitizeText(value: string, maxLength?: number): string {
  const normalized = stripUnsafeChars(normalizeWhitespace(value));
  return typeof maxLength === "number"
    ? normalized.slice(0, maxLength)
    : normalized;
}

function sanitizeParagraph(value: string, maxLength?: number): string {
  const normalized = stripUnsafeChars(value)
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return typeof maxLength === "number"
    ? normalized.slice(0, maxLength)
    : normalized;
}

function sanitizePhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11);
}

function sanitizeEmail(value: string): string {
  return normalizeWhitespace(value).toLowerCase();
}

function isValidName(value: string): boolean {
  return NAME_PATTERN.test(value);
}

function isValidPhone(value: string): boolean {
  return PHONE_PATTERN.test(value);
}

function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}

function normalizeComplaintSubmitError(error: unknown): string {
  const rawMessage = error instanceof Error ? error.message : "";
  const normalized = rawMessage.trim();

  if (!normalized) {
    return "Unable to file the complaint right now. Please try again.";
  }

  if (
    normalized === "Internal Server Error" ||
    normalized === "Error: 500" ||
    /internal server error/i.test(normalized)
  ) {
    return "Unable to file the complaint right now because the server encountered an error. Please try again in a moment.";
  }

  if (/failed to fetch/i.test(normalized) || /networkerror/i.test(normalized)) {
    return "Unable to reach the server. Check your connection and try again.";
  }

  return normalized;
}

/* ─── Reusable primitives ───────────────────────────────────────────────── */

const SectionCard = ({
  step,
  title,
  notice,
  noticeTone,
  children,
}: {
  step: string;
  title: string;
  notice?: string;
  noticeTone?: "info" | "warning" | "success" | "danger" | "neutral";
  children: React.ReactNode;
}) => (
  <BlotterSectionCard
    letter={step}
    title={title}
    notice={notice}
    noticeTone={noticeTone}
  >
    {children}
  </BlotterSectionCard>
);

const ToggleCard = ({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) => (
  <label
    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-all ${checked ? "border-blue-400 bg-blue-50 text-blue-700 font-medium" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"}`}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="accent-blue-600 shrink-0"
    />
    <span>{label}</span>
  </label>
);

const PersonSearchField = ({
  label,
  placeholder,
  onSelect,
}: {
  label: string;
  placeholder: string;
  onSelect: (person: PersonSearchResponseDTO) => void;
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonSearchResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const response = await searchPeople(query);
        setResults(response);
      } catch (error) {
        console.error("Error searching people:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative w-full mb-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-700 tracking-wide">
          {label}
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            className={searchInputCls}
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
              onClick={() => {
                onSelect(person);
                setQuery("");
                setResults([]);
              }}
              className="block w-full border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50"
            >
              <div className="text-sm font-medium text-slate-900">
                {person.firstName}{" "}
                {person.middleName ? `${person.middleName} ` : ""}
                {person.lastName}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {person.completeAddress}
                {person.contactNumber ? ` • ${person.contactNumber}` : ""}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const CharCounter = ({ current, max }: { current: number; max: number }) => (
  <div className="flex justify-end pr-1 mt-1">
    <span
      className={`text-[10px] ${current >= max ? "text-red-500 font-bold" : "text-slate-400"}`}
    >
      {current}/{max}
    </span>
  </div>
);

/* ─── Witness entry ─────────────────────────────────────────────────────── */

interface WitnessEntry {
  id?: number;
  firstName: string;
  lastName: string;
  contactNumber: string;
  address: string;
  testimony: string;
}

const emptyWitness = (): WitnessEntry => ({
  id: undefined,
  firstName: "",
  lastName: "",
  contactNumber: "",
  address: "",
  testimony: "",
});

function buildWitnessFullName(witness: {
  firstName?: string;
  lastName?: string;
}): string {
  return [witness.firstName?.trim(), witness.lastName?.trim()]
    .filter(Boolean)
    .join(" ");
}

// Accept both WitnessEntry and SanitizedWitnessEntry
function hasWitnessContent(witness: {
  firstName?: string;
  lastName?: string;
  contactNumber?: string;
  address?: string;
  testimony?: string;
}): boolean {
  return Boolean(
    (witness.firstName && witness.firstName.trim()) ||
    (witness.lastName && witness.lastName.trim()) ||
    (witness.contactNumber && witness.contactNumber.trim()) ||
    (witness.address && witness.address.trim()) ||
    (witness.testimony && witness.testimony.trim()),
  );
}

type SanitizedWitnessEntry = {
  id?: number;
  firstName: string;
  lastName: string;
  contactNumber: string;
  address: string;
  testimony: string;
};

type SanitizedComplaintForm = {
  complainant: {
    lastName: string;
    firstName: string;
    middleName: string;
    contact: string;
    age: string;
    gender: string;
    civilStatus: string;
    email: string;
    address: string;
  };
  respondent: {
    lastName: string;
    firstName: string;
    middleName: string;
    alias: string;
    contact: string;
    age: string;
    dob: string;
    gender: string;
    civilStatus: string;
    address: string;
  };
  relationshipTypeName: string;
  incident: {
    dateOfIncident: string;
    timeOfIncident: string;
    placeOfIncident: string;
    frequencyOfIncident: string;
    descriptionOfInjuries: string;
  };
  narrative: string;
  witnesses: SanitizedWitnessEntry[];
};

type ComplaintDraft = {
  assignToId: string;
  selectedComplainantId?: number;
  selectedRespondentId?: number;
  selectedViolenceIds: number[];
  selectedEvidenceIds: string[];
  certified: boolean;
  complainant: {
    lastName: string;
    firstName: string;
    middleName: string;
    contact: string;
    age: string;
    gender: string;
    civilStatus: string;
    email: string;
    address: string;
  };
  respondent: {
    lastName: string;
    firstName: string;
    middleName: string;
    alias: string;
    contact: string;
    age: string;
    dob: string;
    gender: string;
    civilStatus: string;
    address: string;
  };
  relationshipTypeName: string;
  livingWithComplainant: boolean;
  natureOfComplaintId: string;
  incident: {
    dateOfIncident: string;
    timeOfIncident: string;
    placeOfIncident: string;
    frequencyOfIncident: string;
    descriptionOfInjuries: string;
  };
  narrative: string;
  witnesses: WitnessEntry[];
};

const sanitizeComplaintForm = (
  complainant: {
    lastName: string;
    firstName: string;
    middleName: string;
    contact: string;
    age: string;
    gender: string;
    civilStatus: string;
    email: string;
    address: string;
  },
  respondent: {
    lastName: string;
    firstName: string;
    middleName: string;
    alias: string;
    contact: string;
    age: string;
    dob: string;
    gender: string;
    civilStatus: string;
    address: string;
  },
  relationshipTypeName: string,
  incident: {
    dateOfIncident: string;
    timeOfIncident: string;
    placeOfIncident: string;
    frequencyOfIncident: string;
    descriptionOfInjuries: string;
  },
  narrative: string,
  witnesses: WitnessEntry[],
): SanitizedComplaintForm => ({
  complainant: {
    lastName: sanitizeText(complainant.lastName, LIMITS.nameMax),
    firstName: sanitizeText(complainant.firstName, LIMITS.nameMax),
    middleName: sanitizeText(complainant.middleName, LIMITS.nameMax),
    contact: sanitizePhone(complainant.contact),
    age: complainant.age.replace(/\D/g, "").slice(0, 3),
    gender: sanitizeText(complainant.gender, 20),
    civilStatus: sanitizeText(complainant.civilStatus, 30),
    email: sanitizeEmail(complainant.email),
    address: sanitizeText(complainant.address, LIMITS.addressMax),
  },
  respondent: {
    lastName: sanitizeText(respondent.lastName, LIMITS.nameMax),
    firstName: sanitizeText(respondent.firstName, LIMITS.nameMax),
    middleName: sanitizeText(respondent.middleName, LIMITS.nameMax),
    alias: sanitizeText(respondent.alias, LIMITS.nameMax),
    contact: sanitizePhone(respondent.contact),
    age: respondent.age.replace(/\D/g, "").slice(0, 3),
    dob: respondent.dob,
    gender: sanitizeText(respondent.gender, 20),
    civilStatus: sanitizeText(respondent.civilStatus, 30),
    address: sanitizeText(respondent.address, LIMITS.addressMax),
  },
  relationshipTypeName: sanitizeText(relationshipTypeName, 40),
  incident: {
    dateOfIncident: incident.dateOfIncident,
    timeOfIncident: incident.timeOfIncident,
    placeOfIncident: sanitizeText(incident.placeOfIncident, LIMITS.locationMax),
    frequencyOfIncident: sanitizeText(
      incident.frequencyOfIncident,
      LIMITS.shortTextMax,
    ),
    descriptionOfInjuries: sanitizeText(
      incident.descriptionOfInjuries,
      LIMITS.descriptionMax,
    ),
  },
  narrative: sanitizeParagraph(narrative, LIMITS.narrativeMax),
  witnesses: witnesses.map((witness) => ({
    id: witness.id,
    firstName: sanitizeText(witness.firstName, LIMITS.nameMax),
    lastName: sanitizeText(witness.lastName, LIMITS.nameMax),
    contactNumber: sanitizePhone(witness.contactNumber),
    address: sanitizeText(witness.address, LIMITS.addressMax),
    testimony: sanitizeParagraph(witness.testimony, LIMITS.testimonyMax),
  })),
});

/* ─── Main component ────────────────────────────────────────────────────── */

export function VAWCNewComplaint() {
  const navigate = useNavigate();
  const { user } = useUser();
  const submissionLockRef = useRef(false);

  /* ── officer display name ── */
  let officerName = "Unknown Officer";
  if (user) {
    const cap = (s: string) =>
      s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    const first = user.firstName ? cap(user.firstName) : "";
    const last = user.lastName ? cap(user.lastName) : "";
    officerName = `${first} ${last}`.trim() || "Unknown Officer";
  }

  /* ── auto‑generated values ── */
  const [caseNumber] = useState(generateCaseNumber);
  const today = new Date();
  const formattedDate = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;
  const todayISO = today.toISOString().split("T")[0];

  /* ── modal state ── */
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successCaseNo, setSuccessCaseNo] = useState("");

  /* ── options ── */
  const [violenceOptions, setViolenceOptions] = useState<ViolenceOptionDTO[]>(
    [],
  );
  const [evidenceOptions, setEvidenceOptions] = useState<EvidenceOptionDTO[]>(
    [],
  );
  const [officerOptions, setOfficerOptions] = useState<
    AssignOfficerOptionDTO[]
  >([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [optionsWarning, setOptionsWarning] = useState<string | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);
  const [userAccess, setUserAccess] = useState<UserAccessPermission | null>(null);

  /* ── selections ── */
  const [assignToId, setAssignToId] = useState("");
  const [selectedComplainantId, setSelectedComplainantId] = useState<
    number | undefined
  >();
  const [selectedRespondentId, setSelectedRespondentId] = useState<
    number | undefined
  >();
  const [selectedViolenceIds, setSelectedViolenceIds] = useState<number[]>([]);
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);
  const [certified, setCertified] = useState(false);
  const canCreateCaseEntry = hasVawcPermission(userAccess, VAWC_PERMISSIONS.CREATE_CASE_ENTRY);

  /* ── complainant ── */
  const [complainant, setComplainant] = useState({
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
  const updateComplainant = (field: string, value: string) =>
    setComplainant((prev) => ({ ...prev, [field]: value }));

  /* ── respondent ── */
  const [respondent, setRespondent] = useState({
    lastName: "",
    firstName: "",
    middleName: "",
    alias: "",
    contact: "",
    age: "",
    dob: "",
    gender: "",
    civilStatus: "",
    address: "",
  });
  const updateRespondent = (field: string, value: string) =>
    setRespondent((prev) => ({ ...prev, [field]: value }));

  /* ── relationship ── */
  const [relationshipTypeName, setRelationshipTypeName] = useState("");
  const [livingWithComplainant, setLivingWithComplainant] = useState(false);

  /* ── nature of complaint ── */
  const [natureOfComplaintId, setNatureOfComplaintId] = useState("");

  /* ── incident ── */
  const [incident, setIncident] = useState({
    dateOfIncident: "",
    timeOfIncident: "",
    placeOfIncident: "",
    frequencyOfIncident: "",
    descriptionOfInjuries: "",
  });
  const updateIncident = (field: string, value: string) =>
    setIncident((prev) => ({ ...prev, [field]: value }));

  /* ── narrative ── */
  const [narrative, setNarrative] = useState("");

  /* ── witnesses ── */
  const [witnesses, setWitnesses] = useState<WitnessEntry[]>([emptyWitness()]);
  const addWitness = () => setWitnesses((w) => [...w, emptyWitness()]);
  const removeWitness = (i: number) =>
    setWitnesses((w) => w.filter((_, idx) => idx !== i));
  const updateWitness = (
    i: number,
    field: keyof WitnessEntry,
    value: string | number,
  ) =>
    setWitnesses((w) =>
      w.map((wit, idx) => (idx === i ? { ...wit, [field]: value } : wit)),
    );

  const updateWitnessNameField = (
    i: number,
    field: "firstName" | "lastName",
    value: string,
  ) =>
    setWitnesses((current) =>
      current.map((wit, idx) =>
        idx === i ? { ...wit, id: undefined, [field]: value } : wit,
      ),
    );

  /* ── errors ── */
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAllEvidence, setShowAllEvidence] = useState(false);
  const clearErr = (key: string) =>
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const buildComplaintDraft = (): ComplaintDraft => ({
    assignToId,
    selectedComplainantId,
    selectedRespondentId,
    selectedViolenceIds,
    selectedEvidenceIds,
    certified,
    complainant,
    respondent,
    relationshipTypeName,
    livingWithComplainant,
    natureOfComplaintId,
    incident,
    narrative,
    witnesses,
  });

  const persistComplaintDraft = () => {
    sessionStorage.setItem(
      COMPLAINT_DRAFT_KEY,
      JSON.stringify(buildComplaintDraft()),
    );
  };

  const clearComplaintDraft = () => {
    sessionStorage.removeItem(COMPLAINT_DRAFT_KEY);
  };

  useEffect(() => {
    const loadAccess = async () => {
      try {
        setAccessLoading(true);
        const access = await getMyAccess();
        setUserAccess(access);
      } catch (error) {
        console.error("Failed to load VAWC access:", error);
        setUserAccess(null);
      } finally {
        setAccessLoading(false);
      }
    };

    void loadAccess();
  }, []);

  /* ── load options ── */
  useEffect(() => {
    if (accessLoading || !canCreateCaseEntry) {
      if (!accessLoading) {
        setIsLoadingOptions(false);
      }
      return;
    }

    const loadOptions = async () => {
      try {
        const [officersResult, violenceResult, evidenceResult] =
          await Promise.allSettled([
            getAssignOfficerComplaintOptions(),
            getViolenceOptions(),
            getEvidenceOptions(),
          ]);
        const warnings: string[] = [];
        if (officersResult.status === "fulfilled")
          setOfficerOptions(officersResult.value);
        else {
          setOfficerOptions([]);
          warnings.push("reporting officers");
        }
        if (violenceResult.status === "fulfilled")
          setViolenceOptions(violenceResult.value);
        else {
          setViolenceOptions([]);
          warnings.push("violence options");
        }
        if (evidenceResult.status === "fulfilled")
          setEvidenceOptions(evidenceResult.value);
        else setEvidenceOptions([]);
        setOptionsWarning(
          warnings.length
            ? `Some dropdown data could not be loaded: ${warnings.join(", ")}.`
            : null,
        );
      } finally {
        setIsLoadingOptions(false);
      }
    };
    loadOptions();
  }, [accessLoading, canCreateCaseEntry]);

  useEffect(() => {
    const raw = sessionStorage.getItem(COMPLAINT_DRAFT_KEY);
    if (!raw) return;

    try {
      const draft = JSON.parse(raw) as ComplaintDraft;
      setAssignToId(draft.assignToId || "");
      setSelectedComplainantId(draft.selectedComplainantId);
      setSelectedRespondentId(draft.selectedRespondentId);
      setSelectedViolenceIds(
        Array.isArray(draft.selectedViolenceIds)
          ? draft.selectedViolenceIds
          : [],
      );
      setSelectedEvidenceIds(
        Array.isArray(draft.selectedEvidenceIds)
          ? draft.selectedEvidenceIds
          : [],
      );
      setCertified(Boolean(draft.certified));
      setComplainant(draft.complainant);
      setRespondent(draft.respondent);
      setRelationshipTypeName(draft.relationshipTypeName || "");
      setLivingWithComplainant(Boolean(draft.livingWithComplainant));
      setNatureOfComplaintId(draft.natureOfComplaintId || "");
      setIncident(draft.incident);
      setNarrative(draft.narrative || "");
      setWitnesses(
        Array.isArray(draft.witnesses) && draft.witnesses.length > 0
          ? draft.witnesses
          : [emptyWitness()],
      );
    } catch {
      sessionStorage.removeItem(COMPLAINT_DRAFT_KEY);
    }
  }, []);

  /* ── toggles ── */
  const toggleViolence = (id: number) =>
    setSelectedViolenceIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  const toggleEvidence = (id: string) =>
    setSelectedEvidenceIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );

  /* ── person search callbacks ── */
  const applyComplainant = (person: PersonSearchResponseDTO) => {
    setSelectedComplainantId(person.id);
    setComplainant({
      firstName: person.firstName,
      lastName: person.lastName,
      middleName: person.middleName || "",
      contact: person.contactNumber || "",
      age: person.age ? String(person.age) : "",
      gender: person.gender || "",
      civilStatus: person.civilStatus || "",
      email: person.email || "",
      address: person.completeAddress || "",
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
  };

  const applyRespondent = (person: PersonSearchResponseDTO) => {
    setSelectedRespondentId(person.id);
    setRespondent({
      firstName: person.firstName,
      lastName: person.lastName,
      middleName: person.middleName || "",
      alias: "",
      contact: person.contactNumber || "",
      age: person.age ? String(person.age) : "",
      dob: person.birthDate || "",
      gender: person.gender || "",
      civilStatus: person.civilStatus || "",
      address: person.completeAddress || "",
    });
    ["rLastName", "rFirstName"].forEach(clearErr);
  };

  /* ── duplicate guard ── */
  const buildComplaintFingerprint = (dto: ComplaintDTO) =>
    JSON.stringify({
      complainantId: dto.complainantId ?? null,
      complainantLastName: dto.complainantLastName?.trim().toLowerCase() ?? "",
      complainantFirstName:
        dto.complainantFirstName?.trim().toLowerCase() ?? "",
      respondentId: dto.respondentId ?? null,
      respondentLastName: dto.respondentLastName?.trim().toLowerCase() ?? "",
      respondentFirstName: dto.respondentFirstName?.trim().toLowerCase() ?? "",
      relationshipTypeName:
        dto.relationshipTypeName?.trim().toLowerCase() ?? "",
      dateOfIncident: dto.dateOfIncident,
      timeOfIncident: dto.timeOfIncident ?? "",
      placeOfIncident: dto.placeOfIncident.trim().toLowerCase(),
      narrativeStatement: dto.narrativeStatement.trim().toLowerCase(),
      violenceTypeIds: [...(dto.violenceTypeIds ?? [])].sort((a, b) => a - b),
    });

  const hasRecentMatchingSubmission = (fingerprint: string) => {
    const raw = sessionStorage.getItem(RECENT_SUBMISSION_KEY);
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw) as {
        fingerprint?: string;
        submittedAt?: number;
      };
      if (
        parsed.fingerprint === fingerprint &&
        typeof parsed.submittedAt === "number" &&
        Date.now() - parsed.submittedAt < RECENT_SUBMISSION_WINDOW_MS
      )
        return true;
    } catch {
      sessionStorage.removeItem(RECENT_SUBMISSION_KEY);
    }
    return false;
  };

  /* ── validation ── */
  const validate = (): boolean => {
    const sanitized = sanitizeComplaintForm(
      complainant,
      respondent,
      relationshipTypeName,
      incident,
      narrative,
      witnesses,
    );
    const e: Record<string, string> = {};
    if (!assignToId) e.assignToId = "Assigned officer is required.";
    if (!sanitized.complainant.lastName) e.cLastName = "Last name is required.";
    else if (sanitized.complainant.lastName.length < LIMITS.nameMin)
      e.cLastName = "Last name must be at least 2 characters.";
    else if (!isValidName(sanitized.complainant.lastName))
      e.cLastName =
        "Last name can only contain letters, spaces, apostrophes, periods, commas, and hyphens.";

    if (!sanitized.complainant.firstName)
      e.cFirstName = "First name is required.";
    else if (sanitized.complainant.firstName.length < LIMITS.nameMin)
      e.cFirstName = "First name must be at least 2 characters.";
    else if (!isValidName(sanitized.complainant.firstName))
      e.cFirstName =
        "First name can only contain letters, spaces, apostrophes, periods, commas, and hyphens.";

    if (
      sanitized.complainant.middleName &&
      !isValidName(sanitized.complainant.middleName)
    )
      e.cMiddleName = "Middle name contains invalid characters.";
    if (
      sanitized.complainant.contact &&
      !isValidPhone(sanitized.complainant.contact)
    )
      e.cContact = "Contact number must start with 09 and contain 11 digits.";
    if (!sanitized.complainant.age) e.cAge = "Age is required.";
    else {
      const complainantAge = Number(sanitized.complainant.age);
      if (
        Number.isNaN(complainantAge) ||
        complainantAge < 1 ||
        complainantAge > 130
      )
        e.cAge = "Age must be between 1 and 130.";
    }
    if (!sanitized.complainant.gender) e.cGender = "Gender is required.";
    if (
      sanitized.complainant.email &&
      !isValidEmail(sanitized.complainant.email)
    )
      e.cEmail = "Email address must be in a valid format.";
    if (!sanitized.complainant.address)
      e.cAddress = "Complete address is required.";
    else if (sanitized.complainant.address.length < LIMITS.addressMin)
      e.cAddress = "Complete address must be at least 8 characters.";

    if (!sanitized.respondent.lastName) e.rLastName = "Last name is required.";
    else if (sanitized.respondent.lastName.length < LIMITS.nameMin)
      e.rLastName = "Last name must be at least 2 characters.";
    else if (!isValidName(sanitized.respondent.lastName))
      e.rLastName =
        "Last name can only contain letters, spaces, apostrophes, periods, commas, and hyphens.";

    if (!sanitized.respondent.firstName)
      e.rFirstName = "First name is required.";
    else if (sanitized.respondent.firstName.length < LIMITS.nameMin)
      e.rFirstName = "First name must be at least 2 characters.";
    else if (!isValidName(sanitized.respondent.firstName))
      e.rFirstName =
        "First name can only contain letters, spaces, apostrophes, periods, commas, and hyphens.";

    if (
      sanitized.respondent.middleName &&
      !isValidName(sanitized.respondent.middleName)
    )
      e.rMiddleName = "Middle name contains invalid characters.";
    if (sanitized.respondent.alias && !isValidName(sanitized.respondent.alias))
      e.rAlias = "Alias contains invalid characters.";
    if (
      sanitized.respondent.contact &&
      !isValidPhone(sanitized.respondent.contact)
    )
      e.rContact = "Contact number must start with 09 and contain 11 digits.";
    if (sanitized.respondent.age) {
      const respondentAge = Number(sanitized.respondent.age);
      if (
        Number.isNaN(respondentAge) ||
        respondentAge < 1 ||
        respondentAge > 130
      )
        e.rAge = "Age must be between 1 and 130.";
    }
    if (
      sanitized.respondent.address &&
      sanitized.respondent.address.length < LIMITS.addressMin
    )
      e.rAddress = "Complete address must be at least 8 characters.";
    if (!sanitized.relationshipTypeName)
      e.rRelationship = "Relationship to victim is required.";
    if (!natureOfComplaintId)
      e.natureOfComplaintId = "Nature of complaint is required.";
    if (!sanitized.incident.dateOfIncident)
      e.dateOfIncident = "Date of incident is required.";
    if (!sanitized.incident.placeOfIncident)
      e.placeOfIncident = "Place of incident is required.";
    else if (sanitized.incident.placeOfIncident.length < LIMITS.locationMin)
      e.placeOfIncident = "Place of incident must be at least 3 characters.";
    if (selectedViolenceIds.length === 0)
      e.violence = "Select at least one type of violence.";
    if (!sanitized.narrative) e.narrative = "Narrative statement is required.";
    else if (sanitized.narrative.length < LIMITS.narrativeMin)
      e.narrative = "Narrative statement must be at least 20 characters.";

    sanitized.witnesses.forEach((witness, index) => {
      if (!hasWitnessContent(witness)) return;
      const keyFirst = `witness-${index}-firstName`;
      const keyLast = `witness-${index}-lastName`;
      if (!witness.firstName)
        e[keyFirst] = `Witness ${index + 1}: first name is required.`;
      else if (witness.firstName.length < LIMITS.nameMin)
        e[keyFirst] =
          `Witness ${index + 1}: first name must be at least 2 characters.`;
      else if (!isValidName(witness.firstName))
        e[keyFirst] =
          `Witness ${index + 1}: first name contains invalid characters.`;
      if (!witness.lastName)
        e[keyLast] = `Witness ${index + 1}: last name is required.`;
      else if (witness.lastName.length < LIMITS.nameMin)
        e[keyLast] =
          `Witness ${index + 1}: last name must be at least 2 characters.`;
      else if (!isValidName(witness.lastName))
        e[keyLast] =
          `Witness ${index + 1}: last name contains invalid characters.`;
      if (witness.contactNumber && !isValidPhone(witness.contactNumber))
        e[`witness-${index}-contact`] =
          `Witness ${index + 1}: contact number must start with 09 and contain 11 digits.`;
      if (witness.address && witness.address.length < LIMITS.addressMin)
        e[`witness-${index}-address`] =
          `Witness ${index + 1}: address must be at least 8 characters.`;
      if (!witness.testimony)
        e[`witness-${index}-testimony`] =
          `Witness ${index + 1}: testimony is required.`;
      else if (witness.testimony.length < 10)
        e[`witness-${index}-testimony`] =
          `Witness ${index + 1}: testimony must be at least 10 characters.`;
    });

    if (!certified)
      e.certified = "You must certify the information is true and correct.";
    setErrors(e);

    if (Object.keys(e).length > 0) {
      const fieldMap: Record<string, string> = {
        assignToId: "field-assignToId",
        cLastName: "field-cLastName",
        cFirstName: "field-cFirstName",
        cMiddleName: "field-cMiddleName",
        cContact: "field-cContact",
        cAge: "field-cAge",
        cGender: "field-cGender",
        cEmail: "field-cEmail",
        cAddress: "field-cAddress",
        rLastName: "field-rLastName",
        rFirstName: "field-rFirstName",
        rMiddleName: "field-rMiddleName",
        rAlias: "field-rAlias",
        rContact: "field-rContact",
        rAge: "field-rAge",
        rAddress: "field-rAddress",
        rRelationship: "field-rRelationship",
        natureOfComplaintId: "field-natureOfComplaintId",
        dateOfIncident: "field-dateOfIncident",
        placeOfIncident: "field-placeOfIncident",
        violence: "field-violence",
        narrative: "field-narrative",
        certified: "field-certified",
      };
      const firstKey = Object.keys(e)[0];
      const elId = fieldMap[firstKey];
      const el = elId ? document.getElementById(elId) : null;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        if ("focus" in el && typeof el.focus === "function") {
          el.focus();
        }
      }
    }

    return Object.keys(e).length === 0;
  };

  /* ── build DTO ── */
  const buildDTO = (): ComplaintDTO => {
    const sanitized = sanitizeComplaintForm(
      complainant,
      respondent,
      relationshipTypeName,
      incident,
      narrative,
      witnesses,
    );

    return {
      complainantId: selectedComplainantId,
      respondentId: selectedRespondentId,
      complainantLastName: sanitized.complainant.lastName,
      complainantFirstName: sanitized.complainant.firstName,
      complainantMiddleName: sanitized.complainant.middleName || undefined,
      complainantAge: sanitized.complainant.age
        ? Number(sanitized.complainant.age)
        : undefined,
      complainantGender: sanitized.complainant.gender || undefined,
      complainantCivilStatus: sanitized.complainant.civilStatus || undefined,
      complainantContact: sanitized.complainant.contact || undefined,
      complainantEmail: sanitized.complainant.email || undefined,
      complainantAddress: sanitized.complainant.address || undefined,
      respondentLastName: sanitized.respondent.lastName,
      respondentFirstName: sanitized.respondent.firstName,
      respondentMiddleName: sanitized.respondent.middleName || undefined,
      respondentAlias: sanitized.respondent.alias || undefined,
      respondentAge: sanitized.respondent.age
        ? Number(sanitized.respondent.age)
        : undefined,
      respondentDob: sanitized.respondent.dob || undefined,
      respondentGender: sanitized.respondent.gender || undefined,
      respondentCivilStatus: sanitized.respondent.civilStatus || undefined,
      respondentContact: sanitized.respondent.contact || undefined,
      respondentAddress: sanitized.respondent.address || undefined,
      relationshipTypeName: sanitized.relationshipTypeName || undefined,
      livingWithComplainant,
      natureOfComplaintId,
      dateOfIncident: sanitized.incident.dateOfIncident,
      timeOfIncident: sanitized.incident.timeOfIncident
        ? `${sanitized.incident.timeOfIncident}:00`
        : undefined,
      placeOfIncident: sanitized.incident.placeOfIncident,
      frequencyOfIncident: sanitized.incident.frequencyOfIncident || undefined,
      descriptionOfInjuries:
        sanitized.incident.descriptionOfInjuries || undefined,
      narrativeStatement: sanitized.narrative,
      violenceTypeIds: selectedViolenceIds,
      assignToId: assignToId ? Number(assignToId) : undefined,
      evidenceTypeIds: selectedEvidenceIds.length
        ? selectedEvidenceIds
        : undefined,
      witnesses: sanitized.witnesses
        .map((w) => ({
          personId: w.id ?? null,
          fullName: buildWitnessFullName(w),
          contactNumber: w.contactNumber || undefined,
          address: w.address || undefined,
          testimony: w.testimony || undefined,
        }))
        .filter((w) => w.fullName),
    };
  };

  const handleSubmitClick = () => {
    if (!validate()) return;
    setShowConfirmModal(true);
  };

  const handleCancelClick = () => {
    setShowCancelConfirmModal(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelConfirmModal(false);
    persistComplaintDraft();
    navigate("/vawc/cases");
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirmModal(false);
    if (submissionLockRef.current || isSubmitting) return;

    const dto = buildDTO();
    const fingerprint = buildComplaintFingerprint(dto);
    if (hasRecentMatchingSubmission(fingerprint)) {
      setSubmitError("This complaint was already submitted recently.");
      setShowErrorModal(true);
      return;
    }

    submissionLockRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await fileVawcComplaint(dto);

      sessionStorage.setItem(
        RECENT_SUBMISSION_KEY,
        JSON.stringify({ fingerprint, submittedAt: Date.now() }),
      );
      clearComplaintDraft();
      setSuccessCaseNo(caseNumber);
      setShowSuccessModal(true);
    } catch (err: any) {
      setSubmitError(normalizeComplaintSubmitError(err));
      setShowErrorModal(true);
    } finally {
      submissionLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate("/vawc/cases");
  };

  /* ─── Render ──────────────────────────────────────────────────────────── */

  if (accessLoading) {
    return (
      <div className="min-h-screen bg-blue-50/40">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
            Loading access permissions...
          </div>
        </div>
      </div>
    );
  }

  if (!canCreateCaseEntry) {
    return (
      <PermissionDeniedPage
        message="You do not have permission to create a VAWC complaint entry."
        hint="Ask your administrator to grant the Create Case Entry permission."
        actionLabel="Go to Dashboard"
        onAction={() => navigate('/vawc/dashboard')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-blue-50/40">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
        <FormNotice
          tone="warning"
          text="Privacy Notice: In compliance with the Data Privacy Act of 2012 (R.A. 10173), all personal information collected in this VAWC complaint shall be kept strictly confidential. Access to full details is restricted to authorized barangay personnel only."
        />

        {optionsWarning && <FormNotice tone="warning" text={optionsWarning} />}

        <ConfirmModal
          isOpen={showConfirmModal}
          type="warning"
          title="Confirm Submission"
          message="Please confirm that all provided information is correct. This will be filed as a formal VAWC complaint. This action cannot be undone."
          confirmText="File Case"
          cancelText="Review Again"
          onConfirm={handleConfirmedSubmit}
          onCancel={() => setShowConfirmModal(false)}
        />

        <ConfirmModal
          isOpen={showCancelConfirmModal}
          type="warning"
          title="Are you sure to cancel?"
          message="Any unsaved information in this complaint form will be lost if you cancel now."
          confirmText="Yes, Cancel"
          cancelText="No, Stay Here"
          onConfirm={handleConfirmCancel}
          onCancel={() => setShowCancelConfirmModal(false)}
        />

        <ActionModal
          isOpen={showSuccessModal}
          onClose={handleSuccessClose}
          title="Case Filed!"
          type="success"
        >
          <p>VAWC complaint has been successfully filed.</p>
          <p className="mt-1 font-semibold text-gray-700">
            Case No.: {successCaseNo}
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

        {/* ─── Section A: Case Information ───────────────────────────────── */}
        <SectionCard step="A" title="Case Information">
          <div className="bg-blue-50/40 border border-blue-100 rounded-lg px-5 py-4 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                label: "Case / Blotter Number",
                value: caseNumber,
                hint: "(auto-generated)",
              },
              { label: "Date Filed", value: formattedDate, hint: "(today)" },
              {
                label: "Reporting Officer",
                value: officerName,
                hint: "(logged in)",
              },
            ].map((f) => (
              <div key={f.label} className="text-center">
                <p className="text-xs font-semibold text-slate-600 tracking-wide mb-1">
                  {f.label}
                </p>
                <p className="text-sm font-semibold text-blue-900">{f.value}</p>
                {f.hint && <p className="text-xs text-slate-600">{f.hint}</p>}
              </div>
            ))}
          </div>
          <FormRow cols={2}>
            <FormSelect
              id="field-assignToId"
              label="Assigned Officer"
              required
              placeholder="Select Officer"
              value={assignToId}
              onChange={(e) => {
                setAssignToId(e.target.value);
                clearErr("assignToId");
              }}
              options={officerOptions.map((o) => ({
                value: String(o.id),
                label: `${o.name}${o.position ? ` (${o.position})` : ""}`,
              }))}
              error={errors.assignToId}
            />
          </FormRow>
        </SectionCard>

        {/* ─── Section B: Complainant Information ────────────────────────── */}
        <SectionCard step="B" title="Complainant Information">
          <PersonSearchField
            label="Search Complainant (Auto-fill)"
            placeholder="Search by name..."
            onSelect={applyComplainant}
          />

          <FormRow cols={3}>
            <FormInput
              id="field-cLastName"
              label="Last Name"
              required
              placeholder="e.g. Dela Cruz"
              value={complainant.lastName}
              onChange={(e) => {
                updateComplainant("lastName", e.target.value);
                clearErr("cLastName");
              }}
              error={errors.cLastName}
            />
            <FormInput
              id="field-cFirstName"
              label="First Name"
              required
              placeholder="e.g. Maria"
              value={complainant.firstName}
              onChange={(e) => {
                updateComplainant("firstName", e.target.value);
                clearErr("cFirstName");
              }}
              error={errors.cFirstName}
            />
            <FormInput
              id="field-cMiddleName"
              label="Middle Name"
              placeholder="e.g. Santos"
              value={complainant.middleName}
              onChange={(e) => updateComplainant("middleName", e.target.value)}
            />
          </FormRow>

          <FormRow cols={3}>
            <FormInput
              id="field-cContact"
              label="Contact Number"
              placeholder="09XX XXX XXXX"
              inputMode="numeric"
              maxLength={11}
              value={complainant.contact}
              onChange={(e) => {
                updateComplainant("contact", e.target.value.replace(/\D/g, ""));
                clearErr("cContact");
              }}
              error={errors.cContact}
            />
            <FormInput
              id="field-cAge"
              label="Age"
              required
              placeholder="e.g. 35"
              inputMode="numeric"
              maxLength={3}
              value={complainant.age}
              onChange={(e) => {
                updateComplainant(
                  "age",
                  e.target.value.replace(/\D/g, "").slice(0, 3),
                );
                clearErr("cAge");
              }}
              error={errors.cAge}
            />
            <FormSelect
              id="field-cGender"
              label="Gender"
              required
              options={GENDER_OPTIONS}
              placeholder="Select Gender"
              value={complainant.gender}
              onChange={(e) => {
                updateComplainant("gender", e.target.value);
                clearErr("cGender");
              }}
              error={errors.cGender}
            />
          </FormRow>

          <FormRow cols={2}>
            <FormSelect
              label="Civil Status"
              options={CIVIL_STATUS_OPTIONS}
              placeholder="Select Civil Status"
              value={complainant.civilStatus}
              onChange={(e) => updateComplainant("civilStatus", e.target.value)}
            />
            <FormInput
              id="field-cEmail"
              label="Email Address"
              type="email"
              placeholder="email@example.com"
              maxLength={50}
              value={complainant.email}
              onChange={(e) => updateComplainant("email", e.target.value)}
            />
          </FormRow>

          <FormInput
            id="field-cAddress"
            label="Complete Address"
            required
            placeholder="House No., Street, Barangay, Municipality/City"
            value={complainant.address}
            onChange={(e) => {
              updateComplainant("address", e.target.value);
              clearErr("cAddress");
            }}
            error={errors.cAddress}
          />
        </SectionCard>

        {/* ─── Section C: Respondent Information ─────────────────────────── */}
        <SectionCard
          step="C"
          title="Respondent Information"
          notice="Per RA 9262, the relationship of the respondent to the complainant must be documented."
          noticeTone="warning"
        >
          <PersonSearchField
            label="Search Respondent (Auto-fill)"
            placeholder="Search by name..."
            onSelect={applyRespondent}
          />

          <FormRow cols={3}>
            <FormInput
              id="field-rLastName"
              label="Last Name"
              required
              placeholder="e.g. Santos"
              value={respondent.lastName}
              onChange={(e) => {
                updateRespondent("lastName", e.target.value);
                clearErr("rLastName");
              }}
              error={errors.rLastName}
            />
            <FormInput
              id="field-rFirstName"
              label="First Name"
              required
              placeholder="e.g. Pedro"
              value={respondent.firstName}
              onChange={(e) => {
                updateRespondent("firstName", e.target.value);
                clearErr("rFirstName");
              }}
              error={errors.rFirstName}
            />
            <FormInput
              id="field-rMiddleName"
              label="Middle Name"
              placeholder="e.g. Reyes"
              value={respondent.middleName}
              onChange={(e) => updateRespondent("middleName", e.target.value)}
            />
          </FormRow>

          <FormRow cols={4}>
            <FormInput
              id="field-rAlias"
              label="Alias / Nickname"
              placeholder="If any"
              value={respondent.alias}
              onChange={(e) => updateRespondent("alias", e.target.value)}
            />
            <FormInput
              id="field-rContact"
              label="Contact Number"
              placeholder="09XX XXX XXXX"
              inputMode="numeric"
              maxLength={11}
              value={respondent.contact}
              onChange={(e) =>
                updateRespondent("contact", e.target.value.replace(/\D/g, ""))
              }
            />
            <FormInput
              id="field-rAge"
              label="Age"
              placeholder="Age"
              inputMode="numeric"
              maxLength={3}
              value={respondent.age}
              onChange={(e) =>
                updateRespondent(
                  "age",
                  e.target.value.replace(/\D/g, "").slice(0, 3),
                )
              }
            />
            <FormInput
              label="Date of Birth"
              type="date"
              value={respondent.dob}
              onChange={(e) => updateRespondent("dob", e.target.value)}
            />
          </FormRow>

          <FormRow cols={3}>
            <FormSelect
              label="Gender"
              options={GENDER_OPTIONS}
              placeholder="Select Gender"
              value={respondent.gender}
              onChange={(e) => updateRespondent("gender", e.target.value)}
            />
            <FormSelect
              label="Civil Status"
              options={CIVIL_STATUS_OPTIONS}
              placeholder="Select Civil Status"
              value={respondent.civilStatus}
              onChange={(e) => updateRespondent("civilStatus", e.target.value)}
            />
            <FormSelect
              id="field-rRelationship"
              label="Relationship to Complainant"
              required
              options={RELATIONSHIP_OPTIONS}
              placeholder="Select Relationship"
              value={relationshipTypeName}
              onChange={(e) => {
                setRelationshipTypeName(e.target.value);
                clearErr("rRelationship");
              }}
              error={errors.rRelationship}
            />
          </FormRow>

          <FormInput
            id="field-rAddress"
            label="Complete Address"
            placeholder="House No., Street, Barangay, Municipality/City, Province"
            value={respondent.address}
            onChange={(e) => updateRespondent("address", e.target.value)}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-700 tracking-wide">
              Currently Living with Complainant?
            </label>
            <div className="flex items-center gap-6 rounded-lg border border-slate-200 bg-white px-4 py-3">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="livingWithComplainant"
                  checked={livingWithComplainant === true}
                  onChange={() => setLivingWithComplainant(true)}
                  className="accent-blue-600"
                />
                Yes
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="livingWithComplainant"
                  checked={livingWithComplainant === false}
                  onChange={() => setLivingWithComplainant(false)}
                  className="accent-blue-600"
                />
                No
              </label>
            </div>
          </div>
        </SectionCard>

        {/* ─── Section D: Incident Details ───────────────────────────────── */}
        <SectionCard step="D" title="Incident Details">
          <FormRow cols={3}>
            <FormSelect
              id="field-natureOfComplaintId"
              label="Nature of Complaint"
              required
              options={NATURE_OF_COMPLAINT_OPTIONS}
              placeholder="Select Nature of Complaint"
              value={natureOfComplaintId}
              onChange={(e) => {
                setNatureOfComplaintId(e.target.value);
                clearErr("natureOfComplaintId");
              }}
              error={errors.natureOfComplaintId}
            />
            <FormInput
              id="field-dateOfIncident"
              label="Date of Incident"
              required
              type="date"
              max={todayISO}
              value={incident.dateOfIncident}
              onChange={(e) => {
                updateIncident("dateOfIncident", e.target.value);
                clearErr("dateOfIncident");
              }}
              error={errors.dateOfIncident}
            />
            <FormInput
              label="Time of Incident"
              type="time"
              value={incident.timeOfIncident}
              onChange={(e) => updateIncident("timeOfIncident", e.target.value)}
            />
          </FormRow>
          <FormRow cols={3}>
            <FormInput
              id="field-placeOfIncident"
              label="Place / Location of Incident"
              required
              placeholder="e.g. Residence, Public Market"
              value={incident.placeOfIncident}
              onChange={(e) => {
                updateIncident("placeOfIncident", e.target.value);
                clearErr("placeOfIncident");
              }}
              error={errors.placeOfIncident}
            />
            <FormSelect
              label="Frequency of Incident"
              placeholder="Select Frequency"
              options={FREQUENCY_OPTIONS}
              value={incident.frequencyOfIncident}
              onChange={(e) =>
                updateIncident("frequencyOfIncident", e.target.value)
              }
            />
            <FormInput
              label="Description of Injuries / Damages"
              placeholder="If any physical injuries or property damage"
              value={incident.descriptionOfInjuries}
              onChange={(e) =>
                updateIncident("descriptionOfInjuries", e.target.value)
              }
            />
          </FormRow>
        </SectionCard>

        {/* ─── Section E: Type of Violence + Risk ────────────────────────── */}
        <SectionCard step="E" title="Type of Violence">
          <div id="field-violence" className="flex flex-col gap-2">
            <p className="text-xs text-gray-500 -mt-1">
              Select all types of violence that apply to this complaint.
            </p>
            {isLoadingOptions ? (
              <p className="text-sm text-gray-400">Loading violence types...</p>
            ) : violenceOptions.length === 0 ? (
              <p className="text-sm text-gray-500">
                No violence options were returned by the API.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {violenceOptions.map((option) => (
                  <ToggleCard
                    key={option.id}
                    checked={selectedViolenceIds.includes(option.id)}
                    label={option.type}
                    onChange={() => toggleViolence(option.id)}
                  />
                ))}
              </div>
            )}
            {errors.violence && (
              <p className="text-xs text-red-500 mt-1">{errors.violence}</p>
            )}
          </div>
        </SectionCard>

        {/* ─── Section F: Narrative / Statement of Facts ──────────────────── */}
        <SectionCard step="F" title="Narrative / Statement of Facts">
          <FormTextarea
            id="field-narrative"
            label="Detailed Statement of Facts"
            required
            rows={6}
            placeholder="Provide a complete and detailed account of the incident. Include the sequence of events, actions taken by each party, words exchanged, any threats made, injuries sustained, and all other relevant circumstances..."
            hint="Include all relevant details: who, what, when, where, how, and why."
            value={narrative}
            maxLength={5000}
            onChange={(e) => {
              setNarrative(e.target.value);
              clearErr("narrative");
            }}
            error={errors.narrative}
          />
          <CharCounter current={narrative.length} max={5000} />
        </SectionCard>

        {/* ─── Section G: Evidence Provided ───────────────────────────────── */}
        <SectionCard step="G" title="Evidence Provided">
          <p className="text-xs text-gray-500 -mt-1">
            Choose the relevant evidence types submitted by the complainant.
          </p>
          {isLoadingOptions ? (
            <p className="text-sm text-gray-400">Loading evidence types...</p>
          ) : evidenceOptions.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                {(showAllEvidence
                  ? evidenceOptions
                  : evidenceOptions.slice(0, 8)
                ).map((option) => {
                  const optionId = String(option.id);
                  return (
                    <ToggleCard
                      key={option.id}
                      checked={selectedEvidenceIds.includes(optionId)}
                      label={option.typName}
                      onChange={() => toggleEvidence(optionId)}
                    />
                  );
                })}
              </div>
              {evidenceOptions.length > 8 && (
                <div className="flex justify-center mt-1">
                  <button
                    type="button"
                    onClick={() => setShowAllEvidence((v) => !v)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    {showAllEvidence
                      ? "Show Less"
                      : `Show ${evidenceOptions.length - 8} more...`}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400 italic">
              No evidence types available.
            </p>
          )}

          <FormInput
            label="Other / Specify"
            placeholder="e.g. Medical certificate, CCTV footage, etc."
          />
        </SectionCard>

        {/* ─── Section H: Witnesses ──────────────────────────────────────── */}
        <SectionCard step="H" title="Witnesses">
          <div className="flex flex-col gap-4">
            {witnesses.map((w, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3 bg-gray-50/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Witness {i + 1}
                  </span>
                  {witnesses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeWitness(i)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
                    >
                      <svg
                        width="12"
                        height="12"
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
                      Remove
                    </button>
                  )}
                </div>
                <PersonSearchField
                  label="Search Witness (Auto-fill)"
                  placeholder="Search by name..."
                  onSelect={(person) => {
                    updateWitness(i, "id", person.id);
                    updateWitness(i, "firstName", person.firstName || "");
                    updateWitness(i, "lastName", person.lastName || "");
                    updateWitness(
                      i,
                      "contactNumber",
                      person.contactNumber || "",
                    );
                    updateWitness(i, "address", person.completeAddress || "");
                  }}
                />
                <FormRow cols={2}>
                  <div>
                    <FormInput
                      label="First Name"
                      placeholder="First name"
                      value={w.firstName}
                      maxLength={80}
                      onChange={(e) =>
                        updateWitnessNameField(i, "firstName", e.target.value)
                      }
                    />
                    <CharCounter current={w.firstName.length} max={80} />
                  </div>
                  <div>
                    <FormInput
                      label="Last Name"
                      placeholder="Last name"
                      value={w.lastName}
                      maxLength={80}
                      onChange={(e) =>
                        updateWitnessNameField(i, "lastName", e.target.value)
                      }
                    />
                    <CharCounter current={w.lastName.length} max={80} />
                  </div>
                  <FormInput
                    label="Contact Number"
                    placeholder="09XX XXX XXXX"
                    inputMode="numeric"
                    maxLength={11}
                    value={w.contactNumber}
                    onChange={(e) =>
                      updateWitness(
                        i,
                        "contactNumber",
                        e.target.value.replace(/\D/g, ""),
                      )
                    }
                  />
                </FormRow>
                <div>
                  <FormInput
                    label="Address"
                    placeholder="Complete address"
                    value={w.address}
                    maxLength={180}
                    onChange={(e) =>
                      updateWitness(i, "address", e.target.value)
                    }
                  />
                  <CharCounter current={w.address.length} max={180} />
                </div>
                <FormTextarea
                  id={`field-witness-${i}-testimony`}
                  label="Testimony"
                  required
                  rows={3}
                  maxLength={500}
                  placeholder="Enter witness testimony / statement..."
                  value={w.testimony}
                  onChange={(e) =>
                    updateWitness(i, "testimony", e.target.value)
                  }
                  hint="Max 500 characters"
                  error={errors[`witness-${i}-testimony`]}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addWitness}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors self-start"
          >
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
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            + Add Witness
          </button>
        </SectionCard>

        <SectionCard step="I" title="Certification">
          <div id="field-certified">
            <label
              className={`flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${certified ? "border-blue-400 bg-blue-50" : errors.certified ? "border-red-400 bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
            >
              <input
                type="checkbox"
                checked={certified}
                onChange={(e) => {
                  setCertified(e.target.checked);
                  clearErr("certified");
                }}
                className="mt-0.5 accent-blue-600 shrink-0"
              />
              <p className="text-sm text-gray-700 leading-relaxed">
                I hereby certify that the above information is true and correct
                to the best of my knowledge and belief. I understand that any
                false statement made herein may subject me to the penalties
                prescribed by law. I am voluntarily executing this complaint and
                authorize the Barangay to take appropriate action in accordance
                with RA 9262 (Anti-Violence Against Women and Their Children
                Act).
              </p>
            </label>
            {errors.certified && (
              <p className="text-xs text-red-500 mt-1">{errors.certified}</p>
            )}
          </div>
        </SectionCard>

        {/* ─── Form Actions ──────────────────────────────────────────────── */}
        <FormActions
          onCancel={handleCancelClick}
          onSubmit={handleSubmitClick}
          submitLabel="File Case"
          isSubmitting={isSubmitting}
          mode="formal"
        />
      </div>
    </div>
  );
}

export default VAWCNewComplaint;
