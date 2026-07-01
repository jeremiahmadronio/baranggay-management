import { useEffect, useMemo, useState } from "react";
import { XIcon, SearchIcon, UserIcon, ChevronDownIcon } from "lucide-react";
import type {
  EditComplaintEntry,
  EvidenceOptionDTO,
  NatureOptionDTO,
  OfficerOptionDTO,
  WitnessEntry,
} from "../../../../service/blotter-api/BlotterFormComplaint";

import type {
  BlotterDocketViewDTO,
} from "../../../../service/blotter-api/DocketView";

import type {
  PersonSearchResponseDTO
} from "../../../../service/blotter-api/Resident";

import {
  getEvidenceTypeOptions,
  getNatureOfComplaintOptions,
  getOfficerOptions,
  updateCaseInformation,
} from "../../../../service/blotter-api/BlotterFormComplaint";
import { PersonSearchInput } from "../reusable/PersonSearchInput";
import { formatDate } from "../shared/utils";

const MAX_WITNESS_TESTIMONY_LENGTH = 500;
const MAX_FIRST_NAME_LENGTH = 50;
const INITIAL_EVIDENCE_VISIBLE = 6;
const MAX_MIDDLE_NAME_LENGTH = 50;
const MAX_LAST_NAME_LENGTH = 50;
const MAX_ALIAS_LENGTH = 50;
const MAX_CONTACT_LENGTH = 15;
const MAX_AGE_LENGTH = 3;
const MAX_EMAIL_LENGTH = 100;
const MAX_ADDRESS_LENGTH = 255;
const MAX_RELATIONSHIP_LENGTH = 80;
const MAX_PLACE_LENGTH = 150;
const MAX_NARRATIVE_LENGTH = 2000;
const MAX_WITNESS_NAME_LENGTH = 100;

interface Props {
  docket: BlotterDocketViewDTO;
  hasPermission: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormState {
  complainantId: number | null;
  complainantFirstName: string;
  complainantLastName: string;
  complainantMiddleName: string;
  complainantContact: string;
  complainantAge: string;
  complainantGender: string;
  complainantCivilStatus: string;
  complainantEmail: string;
  complainantAddress: string;

  respondentId: number | null;
  respondentFirstName: string;
  respondentLastName: string;
  respondentMiddleName: string;
  respondentAlias: string;
  respondentAge: string;
  respondentDob: string;
  respondentGender: string;
  respondentCivilStatus: string;
  respondentContact: string;
  respondentAddress: string;
  relationshipTypeName: string;
  livingWithComplainant: boolean;

  natureOfComplaintId: string;
  dateOfIncident: string;
  timeOfIncident: string;
  placeOfIncident: string;
  frequencyOfIncident: string;
  descriptionOfInjuries: string;
  narrativeStatement: string;

  assignToId: string;
}

const parseTimeFromISO = (value?: string) => {
  if (!value) return "";
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) return value.slice(0, 5);
  const parsed = new Date(`1970-01-01T${value}`);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`;
};

const toIsoTime = (value: string) => (value ? `${value}:00` : null);

function buildInitialState(docket: BlotterDocketViewDTO): FormState {
  return {
    complainantId: null,
    complainantFirstName: docket.firstName ?? "",
    complainantLastName: docket.lastName ?? "",
    complainantMiddleName: docket.middleName ?? "",
    complainantContact: docket.contactNumber ?? "",
    complainantAge: docket.age ? String(docket.age) : "",
    complainantGender: docket.gender ?? "",
    complainantCivilStatus: docket.civilStatus ?? "",
    complainantEmail: docket.email ?? "",
    complainantAddress: docket.completeAddress ?? "",

    respondentId: null,
    respondentFirstName: docket.respondentFirstName ?? "",
    respondentLastName: docket.respondentLastName ?? "",
    respondentMiddleName: docket.respondentMiddleName ?? "",
    respondentAlias: docket.respondentAlias ?? "",
    respondentAge: docket.respondentAge ? String(docket.respondentAge) : "",
    respondentDob: docket.respondentDateOfBirth ?? "",
    respondentGender: docket.respondentGender ?? "",
    respondentCivilStatus: docket.respondentCivilStatus ?? "",
    respondentContact: docket.respondentContact ?? "",
    respondentAddress: docket.respondentAddress ?? "",
    relationshipTypeName: docket.relationshipToComplainant ?? "",
    livingWithComplainant: !!docket.livingWithComplainant,

    natureOfComplaintId: "",
    dateOfIncident: docket.incidentDate ?? "",
    timeOfIncident: parseTimeFromISO(docket.incidentTime),
    placeOfIncident: docket.incidentLocation ?? "",
    frequencyOfIncident: docket.frequencyOfIncident ?? "",
    descriptionOfInjuries: docket.descriptionOfInjuries ?? "",
    narrativeStatement: docket.narrative ?? "",

    assignToId: "",
  };
}

export function EditCaseModal({
  docket,
  hasPermission,
  onSuccess,
  onCancel,
}: Props) {
  const [form, setForm] = useState<FormState>(() => buildInitialState(docket));
  const [lockComplainantFields, setLockComplainantFields] = useState(false);
  const [lockRespondentFields, setLockRespondentFields] = useState(false);
  const [selectedComplainantName, setSelectedComplainantName] = useState("");
  const [selectedRespondentName, setSelectedRespondentName] = useState("");
  const [showAllEvidence, setShowAllEvidence] = useState(false);

  const [witnesses, setWitnesses] = useState<WitnessEntry[]>(
    (docket.witnesses ?? []).map((w) => ({
      personId: w.personId ?? 0,
      fullName: w.fullName ?? "",
      contactNumber: w.contactNumber ?? "",
      address: w.address ?? "",
      testimony: w.testimony ?? "",
    })),
  );
  const [selectedEvidence, setSelectedEvidence] = useState<Set<string>>(
    new Set((docket.evidenceTypeIds ?? []).map(String)),
  );

  const [natureOptions, setNatureOptions] = useState<NatureOptionDTO[]>([]);
  const [evidenceOptions, setEvidenceOptions] = useState<EvidenceOptionDTO[]>(
    [],
  );
  const [officerOptions, setOfficerOptions] = useState<OfficerOptionDTO[]>([]);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm(buildInitialState(docket));
    setLockComplainantFields(false);
    setLockRespondentFields(false);
    setSelectedComplainantName("");
    setSelectedRespondentName("");
    setShowAllEvidence(false);
    setWitnesses(
      (docket.witnesses ?? []).map((w) => ({
        personId: w.personId ?? 0,
        fullName: w.fullName ?? "",
        contactNumber: w.contactNumber ?? "",
        address: w.address ?? "",
        testimony: w.testimony ?? "",
      })),
    );
    setSelectedEvidence(new Set((docket.evidenceTypeIds ?? []).map(String)));
  }, [docket]);

  useEffect(() => {
    setLoadingOptions(true);
    Promise.all([
      getNatureOfComplaintOptions().catch(() => []),
      getEvidenceTypeOptions().catch(() => []),
      getOfficerOptions().catch(() => []),
    ])
      .then(([natures, evidences, officers]) => {
        setNatureOptions(natures);
        setEvidenceOptions(evidences);
        setOfficerOptions(officers);

        if (!form.natureOfComplaintId && natures.length > 0) {
          const found = natures.find(
            (n) => n.natureName === docket.natureOfComplaint,
          );
          if (found) {
            setForm((prev) => ({
              ...prev,
              natureOfComplaintId: String(found.id),
            }));
          }
        }

        if (!form.assignToId && docket.assignOfficer && officers.length > 0) {
          const normalizedTarget = docket.assignOfficer.toLowerCase();
          const foundOfficer = officers.find((o) =>
            o.name.toLowerCase().includes(normalizedTarget),
          );
          if (foundOfficer) {
            setForm((prev) => ({
              ...prev,
              assignToId: String(foundOfficer.id),
            }));
          }
        }
      })
      .finally(() => setLoadingOptions(false));
  }, [docket.assignOfficer, docket.natureOfComplaint]);

  const caseId = useMemo(() => docket.caseId ?? docket.id ?? null, [docket]);

  const setField = (
    key: keyof FormState,
    value: string | boolean | number | null,
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }) as FormState);
  };

  const pickPersonName = (person: PersonSearchResponseDTO) =>
    `${person.firstName ?? ""} ${person.middleName ? `${person.middleName} ` : ""}${person.lastName ?? ""}`
      .replace(/\s+/g, " ")
      .trim();

  const linkComplainant = (person: PersonSearchResponseDTO) => {
    setField("complainantId", person.id);
    setField("complainantFirstName", person.firstName || "");
    setField("complainantLastName", person.lastName || "");
    setField("complainantMiddleName", person.middleName || "");
    setField("complainantContact", person.contactNumber || "");
    setField("complainantAddress", person.completeAddress || "");
    setSelectedComplainantName(pickPersonName(person));
    setLockComplainantFields(true);
  };

  const unlinkComplainant = () => {
    setField("complainantId", null);
    setSelectedComplainantName("");
    setLockComplainantFields(false);
  };

  const linkRespondent = (person: PersonSearchResponseDTO) => {
    setField("respondentId", person.id);
    setField("respondentFirstName", person.firstName || "");
    setField("respondentLastName", person.lastName || "");
    setField("respondentMiddleName", person.middleName || "");
    setField("respondentContact", person.contactNumber || "");
    setField("respondentAddress", person.completeAddress || "");
    setSelectedRespondentName(pickPersonName(person));
    setLockRespondentFields(true);
  };

  const unlinkRespondent = () => {
    setField("respondentId", null);
    setSelectedRespondentName("");
    setLockRespondentFields(false);
  };

  const toggleEvidence = (id: string) => {
    setSelectedEvidence((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addWitness = () =>
    setWitnesses((prev) => [
      ...prev,
      {
        personId: 0,
        fullName: "",
        contactNumber: "",
        address: "",
        testimony: "",
      },
    ]);

  const removeWitness = (index: number) =>
    setWitnesses((prev) => prev.filter((_, i) => i !== index));

  const updateWitness = (
    index: number,
    field: keyof WitnessEntry,
    value: string | number,
  ) =>
    setWitnesses((prev) =>
      prev.map((w, i) => (i === index ? { ...w, [field]: value } : w)),
    );

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.complainantFirstName.trim())
      nextErrors.complainantFirstName = "Required";
    if (!form.complainantLastName.trim())
      nextErrors.complainantLastName = "Required";
    if (!form.complainantContact.trim())
      nextErrors.complainantContact = "Required";
    if (!form.complainantAddress.trim())
      nextErrors.complainantAddress = "Required";

    if (!form.respondentFirstName.trim())
      nextErrors.respondentFirstName = "Required";
    if (!form.respondentLastName.trim())
      nextErrors.respondentLastName = "Required";

    if (!form.natureOfComplaintId) nextErrors.natureOfComplaintId = "Required";
    if (!form.dateOfIncident) nextErrors.dateOfIncident = "Required";
    if (!form.placeOfIncident.trim()) nextErrors.placeOfIncident = "Required";
    if (!form.narrativeStatement.trim())
      nextErrors.narrativeStatement = "Required";
    if (!form.assignToId)
      nextErrors.assignToId = "Assigned officer is required";

    witnesses.forEach((w, idx) => {
      const testimony = (w.testimony ?? "").trim();
      if (testimony.length > MAX_WITNESS_TESTIMONY_LENGTH) {
        nextErrors[`witnessTestimony${idx}`] =
          `Max ${MAX_WITNESS_TESTIMONY_LENGTH} characters`;
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!hasPermission) return;
    if (!caseId) {
      setError("Missing case ID. Please reload and try again.");
      return;
    }
    if (!validate()) return;

    setSubmitting(true);
    setError(null);
    try {
      const payload: EditComplaintEntry = {
        complainantId: form.complainantId,
        respondentId: form.respondentId,

        complainantLastName: form.complainantLastName.trim(),
        complainantFirstName: form.complainantFirstName.trim(),
        complainantMiddleName: form.complainantMiddleName.trim() || null,
        complainantContact: form.complainantContact.trim(),
        complainantAge: form.complainantAge
          ? Number(form.complainantAge)
          : null,
        complainantGender: form.complainantGender || null,
        complainantCivilStatus: form.complainantCivilStatus || null,
        complainantEmail: form.complainantEmail.trim() || null,
        complainantAddress: form.complainantAddress.trim(),

        respondentLastName: form.respondentLastName.trim(),
        respondentFirstName: form.respondentFirstName.trim(),
        respondentMiddleName: form.respondentMiddleName.trim() || null,
        respondentAlias: form.respondentAlias.trim() || null,
        respondentAge: form.respondentAge ? Number(form.respondentAge) : null,
        respondentDob: form.respondentDob || null,
        respondentGender: form.respondentGender || null,
        respondentCivilStatus: form.respondentCivilStatus || null,
        respondentContact: form.respondentContact.trim() || null,
        respondentAddress: form.respondentAddress.trim() || null,
        relationshipTypeName: form.relationshipTypeName.trim() || null,
        livingWithComplainant: !!form.livingWithComplainant,

        natureOfComplaintId: form.natureOfComplaintId,
        dateOfIncident: form.dateOfIncident,
        timeOfIncident: toIsoTime(form.timeOfIncident),
        placeOfIncident: form.placeOfIncident.trim(),
        frequencyOfIncident: form.frequencyOfIncident.trim() || null,
        descriptionOfInjuries: form.descriptionOfInjuries.trim() || null,
        narrativeStatement: form.narrativeStatement.trim(),

        assignToId: form.assignToId ? Number(form.assignToId) : null,
        evidenceTypeIds: Array.from(selectedEvidence),
        witnesses: witnesses
          .filter((w) => (w.fullName ?? "").trim())
          .map((w) => ({
            personId: w.personId ?? 0,
            fullName: (w.fullName ?? "").trim(),
            contactNumber: (w.contactNumber ?? "").trim() || undefined,
            address: (w.address ?? "").trim() || undefined,
            testimony: (w.testimony ?? "").trim() || undefined,
          })),
      };

      await updateCaseInformation(caseId, payload);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update case.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[92vh] overflow-y-auto border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Edit Case Information
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {docket.caseNumber} · Filed {formatDate(docket.dateFiled)}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6 bg-slate-50/60">
          {!hasPermission && (
            <div className="px-3 py-2.5 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-700">
              You do not have permission to update case information.
            </div>
          )}

          {loadingOptions ? (
            <div className="text-sm text-gray-500">Loading form options...</div>
          ) : (
            <>
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Assignment & Case Controls
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Assigned Officer <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="input"
                      value={form.assignToId}
                      onChange={(e) => setField("assignToId", e.target.value)}
                    >
                      <option value="">Select assigned officer</option>
                      {officerOptions.map((o) => (
                        <option key={o.id} value={String(o.id)}>
                          {o.name}
                          {o.position ? ` (${o.position})` : ""}
                        </option>
                      ))}
                    </select>
                    {errors.assignToId && (
                      <p className="text-xs text-red-500">
                        {errors.assignToId}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Nature of Complaint{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="input"
                      value={form.natureOfComplaintId}
                      onChange={(e) =>
                        setField("natureOfComplaintId", e.target.value)
                      }
                    >
                      <option value="">Select nature</option>
                      {natureOptions.map((n) => (
                        <option key={n.id} value={String(n.id)}>
                          {n.natureName}
                        </option>
                      ))}
                    </select>
                    {errors.natureOfComplaintId && (
                      <p className="text-xs text-red-500">
                        {errors.natureOfComplaintId}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Complainant (with person re-link)
                </p>
                <PersonSearchInput
                  label="Search and Re-link Complainant"
                  placeholder="Search complainant by name..."
                  onSelect={linkComplainant}
                />

                {form.complainantId && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      <UserIcon className="w-4 h-4" />
                      <span>
                        Selected User:{" "}
                        <strong>
                          {selectedComplainantName ||
                            `${form.complainantFirstName} ${form.complainantLastName}`.trim()}
                        </strong>{" "}
                        (ID #{form.complainantId})
                      </span>
                    </div>
                    <button
                      type="button"
                      className="text-xs font-medium text-blue-700 hover:text-blue-900"
                      onClick={unlinkComplainant}
                    >
                      Edit manually
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="input"
                      placeholder="e.g. Juan"
                      value={form.complainantFirstName}
                      maxLength={MAX_FIRST_NAME_LENGTH}
                      readOnly={lockComplainantFields}
                      onChange={(e) =>
                        setField("complainantFirstName", e.target.value)
                      }
                    />
                    <p className="text-[11px] text-right text-slate-400">
                      {form.complainantFirstName.length}/{MAX_FIRST_NAME_LENGTH}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Middle Name
                    </label>
                    <input
                      className="input"
                      placeholder="Enter middle name"
                      value={form.complainantMiddleName}
                      maxLength={MAX_MIDDLE_NAME_LENGTH}
                      readOnly={lockComplainantFields}
                      onChange={(e) =>
                        setField("complainantMiddleName", e.target.value)
                      }
                    />
                    <p className="text-[11px] text-right text-slate-400">
                      {form.complainantMiddleName.length}/
                      {MAX_MIDDLE_NAME_LENGTH}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="input"
                      placeholder="Enter last name"
                      value={form.complainantLastName}
                      maxLength={MAX_LAST_NAME_LENGTH}
                      readOnly={lockComplainantFields}
                      onChange={(e) =>
                        setField("complainantLastName", e.target.value)
                      }
                    />
                    <p className="text-[11px] text-right text-slate-400">
                      {form.complainantLastName.length}/{MAX_LAST_NAME_LENGTH}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Contact Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="input"
                      placeholder="09XX XXX XXXX"
                      value={form.complainantContact}
                      maxLength={MAX_CONTACT_LENGTH}
                      readOnly={lockComplainantFields}
                      onChange={(e) =>
                        setField("complainantContact", e.target.value)
                      }
                    />
                    <p className="text-[11px] text-right text-slate-400">
                      {form.complainantContact.length}/{MAX_CONTACT_LENGTH}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Age
                    </label>
                    <input
                      className="input"
                      placeholder="Age"
                      value={form.complainantAge}
                      maxLength={MAX_AGE_LENGTH}
                      onChange={(e) =>
                        setField(
                          "complainantAge",
                          e.target.value.replace(/\D/g, ""),
                        )
                      }
                    />
                    <p className="text-[11px] text-right text-slate-400">
                      {form.complainantAge.length}/{MAX_AGE_LENGTH}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Email
                    </label>
                    <input
                      className="input"
                      placeholder="name@email.com"
                      value={form.complainantEmail}
                      maxLength={MAX_EMAIL_LENGTH}
                      onChange={(e) =>
                        setField("complainantEmail", e.target.value)
                      }
                    />
                    <p className="text-[11px] text-right text-slate-400">
                      {form.complainantEmail.length}/{MAX_EMAIL_LENGTH}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="input w-full"
                    placeholder="Complete address"
                    value={form.complainantAddress}
                    maxLength={MAX_ADDRESS_LENGTH}
                    readOnly={lockComplainantFields}
                    onChange={(e) =>
                      setField("complainantAddress", e.target.value)
                    }
                  />
                  <p className="text-[11px] text-right text-slate-400">
                    {form.complainantAddress.length}/{MAX_ADDRESS_LENGTH}
                  </p>
                </div>
              </section>

              <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Respondent (with person re-link)
                </p>
                <PersonSearchInput
                  label="Search and Re-link Respondent"
                  placeholder="Search respondent by name..."
                  onSelect={linkRespondent}
                />

                {form.respondentId && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      <UserIcon className="w-4 h-4" />
                      <span>
                        Selected User:{" "}
                        <strong>
                          {selectedRespondentName ||
                            `${form.respondentFirstName} ${form.respondentLastName}`.trim()}
                        </strong>{" "}
                        (ID #{form.respondentId})
                      </span>
                    </div>
                    <button
                      type="button"
                      className="text-xs font-medium text-blue-700 hover:text-blue-900"
                      onClick={unlinkRespondent}
                    >
                      Edit manually
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="input"
                      placeholder="e.g. Juan"
                      value={form.respondentFirstName}
                      maxLength={MAX_FIRST_NAME_LENGTH}
                      readOnly={lockRespondentFields}
                      onChange={(e) =>
                        setField("respondentFirstName", e.target.value)
                      }
                    />
                    <p className="text-[11px] text-right text-slate-400">
                      {form.respondentFirstName.length}/{MAX_FIRST_NAME_LENGTH}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Middle Name
                    </label>
                    <input
                      className="input"
                      placeholder="Enter middle name"
                      value={form.respondentMiddleName}
                      maxLength={MAX_MIDDLE_NAME_LENGTH}
                      readOnly={lockRespondentFields}
                      onChange={(e) =>
                        setField("respondentMiddleName", e.target.value)
                      }
                    />
                    <p className="text-[11px] text-right text-slate-400">
                      {form.respondentMiddleName.length}/
                      {MAX_MIDDLE_NAME_LENGTH}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="input"
                      placeholder="Enter last name"
                      value={form.respondentLastName}
                      maxLength={MAX_LAST_NAME_LENGTH}
                      readOnly={lockRespondentFields}
                      onChange={(e) =>
                        setField("respondentLastName", e.target.value)
                      }
                    />
                    <p className="text-[11px] text-right text-slate-400">
                      {form.respondentLastName.length}/{MAX_LAST_NAME_LENGTH}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Alias
                    </label>
                    <input
                      className="input"
                      placeholder="Alias"
                      value={form.respondentAlias}
                      maxLength={MAX_ALIAS_LENGTH}
                      onChange={(e) =>
                        setField("respondentAlias", e.target.value)
                      }
                    />
                    <p className="text-[11px] text-right text-slate-400">
                      {form.respondentAlias.length}/{MAX_ALIAS_LENGTH}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Contact Number
                    </label>
                    <input
                      className="input"
                      placeholder="09XX XXX XXXX"
                      value={form.respondentContact}
                      maxLength={MAX_CONTACT_LENGTH}
                      readOnly={lockRespondentFields}
                      onChange={(e) =>
                        setField("respondentContact", e.target.value)
                      }
                    />
                    <p className="text-[11px] text-right text-slate-400">
                      {form.respondentContact.length}/{MAX_CONTACT_LENGTH}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Relationship to Complainant
                    </label>
                    <input
                      className="input"
                      placeholder="Relationship"
                      value={form.relationshipTypeName}
                      maxLength={MAX_RELATIONSHIP_LENGTH}
                      onChange={(e) =>
                        setField("relationshipTypeName", e.target.value)
                      }
                    />
                    <p className="text-[11px] text-right text-slate-400">
                      {form.relationshipTypeName.length}/
                      {MAX_RELATIONSHIP_LENGTH}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    Address
                  </label>
                  <input
                    className="input w-full"
                    placeholder="Address"
                    value={form.respondentAddress}
                    maxLength={MAX_ADDRESS_LENGTH}
                    readOnly={lockRespondentFields}
                    onChange={(e) =>
                      setField("respondentAddress", e.target.value)
                    }
                  />
                  <p className="text-[11px] text-right text-slate-400">
                    {form.respondentAddress.length}/{MAX_ADDRESS_LENGTH}
                  </p>
                </div>
              </section>

              <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Incident Details
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Date of Incident <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="input"
                      type="date"
                      value={form.dateOfIncident}
                      onChange={(e) =>
                        setField("dateOfIncident", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Time of Incident
                    </label>
                    <input
                      className="input"
                      type="time"
                      value={form.timeOfIncident}
                      onChange={(e) =>
                        setField("timeOfIncident", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    Place of Incident <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="input w-full"
                    placeholder="Where did the incident happen?"
                    value={form.placeOfIncident}
                    maxLength={MAX_PLACE_LENGTH}
                    onChange={(e) =>
                      setField("placeOfIncident", e.target.value)
                    }
                  />
                  <p className="text-[11px] text-right text-slate-400">
                    {form.placeOfIncident.length}/{MAX_PLACE_LENGTH}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    Narrative Statement <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="input w-full min-h-[96px]"
                    placeholder="Provide complete incident narrative..."
                    value={form.narrativeStatement}
                    maxLength={MAX_NARRATIVE_LENGTH}
                    onChange={(e) =>
                      setField("narrativeStatement", e.target.value)
                    }
                  />
                  <p className="text-[11px] text-right text-slate-400">
                    {form.narrativeStatement.length}/{MAX_NARRATIVE_LENGTH}
                  </p>
                </div>
              </section>

              <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Evidence Types
                  </p>
                  {evidenceOptions.length > INITIAL_EVIDENCE_VISIBLE && (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                      onClick={() => setShowAllEvidence((s) => !s)}
                    >
                      {showAllEvidence
                        ? "See less"
                        : `See more (${evidenceOptions.length - INITIAL_EVIDENCE_VISIBLE})`}
                      <ChevronDownIcon
                        className={`w-3.5 h-3.5 transition-transform ${showAllEvidence ? "rotate-180" : ""}`}
                      />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {(showAllEvidence
                    ? evidenceOptions
                    : evidenceOptions.slice(0, INITIAL_EVIDENCE_VISIBLE)
                  ).map((ev) => {
                    const key = String(ev.id);
                    const checked = selectedEvidence.has(key);
                    return (
                      <label
                        key={ev.id}
                        className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-sm cursor-pointer ${checked ? "border-blue-300 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700"}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleEvidence(key)}
                        />
                        <span>{ev.typName}</span>
                      </label>
                    );
                  })}
                </div>
              </section>

              <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Witnesses (with testimony)
                  </p>
                  <button
                    type="button"
                    onClick={addWitness}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add Witness
                  </button>
                </div>

                {witnesses.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No witnesses added yet.
                  </p>
                )}

                <div className="space-y-3">
                  {witnesses.map((w, i) => (
                    <div
                      key={i}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50/40 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Witness {i + 1}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeWitness(i)}
                          className="text-xs text-gray-400 hover:text-red-500"
                        >
                          Remove
                        </button>
                      </div>

                      <PersonSearchInput
                        label="Search and re-link witness"
                        placeholder="Search witness by name..."
                        onSelect={(person) => {
                          updateWitness(i, "personId", person.id);
                          updateWitness(
                            i,
                            "fullName",
                            `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim(),
                          );
                          updateWitness(
                            i,
                            "contactNumber",
                            person.contactNumber || "",
                          );
                          updateWitness(
                            i,
                            "address",
                            person.completeAddress || "",
                          );
                        }}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          className="input"
                          placeholder="Full name"
                          value={w.fullName ?? ""}
                          maxLength={MAX_WITNESS_NAME_LENGTH}
                          onChange={(e) =>
                            updateWitness(i, "fullName", e.target.value)
                          }
                        />
                        <input
                          className="input"
                          placeholder="Contact"
                          value={w.contactNumber ?? ""}
                          maxLength={MAX_CONTACT_LENGTH}
                          onChange={(e) =>
                            updateWitness(i, "contactNumber", e.target.value)
                          }
                        />
                        <p className="text-[11px] text-right text-slate-400 -mt-1 md:col-span-1">
                          {(w.fullName ?? "").length}/{MAX_WITNESS_NAME_LENGTH}
                        </p>
                        <p className="text-[11px] text-right text-slate-400 -mt-1 md:col-span-1">
                          {(w.contactNumber ?? "").length}/{MAX_CONTACT_LENGTH}
                        </p>
                      </div>
                      <input
                        className="input w-full"
                        placeholder="Address"
                        value={w.address ?? ""}
                        maxLength={MAX_ADDRESS_LENGTH}
                        onChange={(e) =>
                          updateWitness(i, "address", e.target.value)
                        }
                      />
                      <p className="text-[11px] text-right text-slate-400 -mt-2">
                        {(w.address ?? "").length}/{MAX_ADDRESS_LENGTH}
                      </p>
                      <textarea
                        className={`input w-full min-h-[84px] ${errors[`witnessTestimony${i}`] ? "border-red-400 bg-red-50" : ""}`}
                        placeholder="Testimony (optional)"
                        value={w.testimony ?? ""}
                        maxLength={MAX_WITNESS_TESTIMONY_LENGTH}
                        onChange={(e) =>
                          updateWitness(i, "testimony", e.target.value)
                        }
                      />
                      <p className="text-xs text-gray-400">
                        {(w.testimony ?? "").length}/
                        {MAX_WITNESS_TESTIMONY_LENGTH}
                      </p>
                      {errors[`witnessTestimony${i}`] && (
                        <p className="text-xs text-red-500 -mt-1">
                          {errors[`witnessTestimony${i}`]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {Object.keys(errors).length > 0 && (
            <div className="px-3 py-2.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
              Please complete the required fields before saving updates.
            </div>
          )}

          {error && (
            <div className="px-3 py-2.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-md text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !hasPermission || loadingOptions}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <SearchIcon className="w-3.5 h-3.5 animate-spin" />
            ) : null}
            {submitting ? "Updating..." : "Save Updates"}
          </button>
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 0.5rem;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          line-height: 1.4;
          color: #111827;
          background: #fff;
          outline: none;
          transition: all 0.15s ease;
        }
        .input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.12);
        }
        .input[readonly] {
          background: #f8fafc;
          color: #475569;
        }
      `}</style>
    </div>
  );
}
