import { useEffect, useMemo, useState } from "react";
import { XIcon, SearchIcon, UserIcon } from "lucide-react";
import type {
  EditComplaintEntry,
  EvidenceOptionDTO,
  NatureOptionDTO,
  OfficerOptionDTO,
  WitnessEntry,
} from "../../../service/blotter-api/BlotterFormComplaint";

import type {
  BlotterDocketViewDTO,
} from "../../../service/blotter-api/DocketView";

import type {
  PersonSearchResponseDTO
} from "../../../service/blotter-api/Resident";

import {
  getEvidenceTypeOptions,
  getNatureOfComplaintOptions,
  getOfficerOptions,
  updateCaseInformation,
} from "../../../service/blotter-api/BlotterFormComplaint";
import { formatDate } from "../shared/utils";
import { EvidenceSection } from "../blotter-form/EvidenceSection";
import { WitnessSection } from "../blotter-form/WitnessSection";
import { EvidenceViewer } from "../shared/EvidenceViewer";

const MAX_WITNESS_TESTIMONY_LENGTH = 500;
const MAX_WITNESS_NAME_LENGTH = 100;
const MAX_FIRST_NAME_LENGTH = 50;
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

  const [witnesses, setWitnesses] = useState<(WitnessEntry & { testimonyFile?: File | null })[]>(
    (docket.witnesses ?? []).map((w) => ({
      personId: w.personId ?? 0,
      fullName: w.fullName ?? "",
      contactNumber: w.contactNumber ?? "",
      address: w.address ?? "",
      testimony: w.testimony ?? "",
      testimonyFile: null,
    })),
  );

  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<Set<number>>(new Set());
  const [lockedEvidenceIds, setLockedEvidenceIds] = useState<Set<number>>(new Set());
  const [evidenceFiles, setEvidenceFiles] = useState<Record<number, File | null>>({});
  const [customEvidence, setCustomEvidence] = useState("");
  const [customEvidenceFile, setCustomEvidenceFile] = useState<File | null>(null);

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
        testimonyFile: null,
      })),
    );
    setSelectedEvidenceIds(new Set());
    setLockedEvidenceIds(new Set());
    setEvidenceFiles({});
    setCustomEvidence("");
    setCustomEvidenceFile(null);
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

        setSelectedEvidenceIds((prev) => {
          const next = new Set<number>();
          (docket.evidences ?? []).forEach((ev) => {
            if (ev.evidenceTypeId !== null && ev.evidenceTypeId !== undefined) {
              next.add(Number(ev.evidenceTypeId));
            } else if (ev.typeName) {
              const found = evidences.find((e) => e.typName === ev.typeName);
              if (found) next.add(found.id);
            }
          });
          setLockedEvidenceIds(new Set(next));
          return next;
        });

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

  const toggleEvidence = (id: number) => {
    setSelectedEvidenceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setEvidenceFile = (id: number, file: File | null) => {
    setEvidenceFiles((prev) => ({ ...prev, [id]: file }));
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });

  const addWitness = () =>
    setWitnesses((prev) => [
      ...prev,
      {
        personId: 0,
        fullName: "",
        contactNumber: "",
        address: "",
        testimony: "",
        testimonyFile: null,
      },
    ]);

  const removeWitness = (index: number) =>
    setWitnesses((prev) => prev.filter((_, i) => i !== index));

  const updateWitness = (
    index: number,
    field: keyof WitnessEntry | "testimonyFile",
    value: any,
  ) =>
    setWitnesses((prev) =>
      prev.map((w, i) => (i === index ? { ...w, [field]: value } : w)),
    );

  const validate = () => {
    const nextErrors: Record<string, string> = {};

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
        evidenceTypeIds: Array.from(selectedEvidenceIds).map(String),
        evidences: await (async () => {
          const evidencesList: any[] = [];
          for (const id of Array.from(selectedEvidenceIds)) {
            const isOthers = evidenceOptions.find((o) => o.id === id)?.typName.toLowerCase().includes("other");
            const file = isOthers ? (customEvidenceFile || evidenceFiles[id]) : evidenceFiles[id];
            
            // For editing, if there's no new file provided, we just send the evidenceTypeId in the other list. 
            // We only upload new base64 files if the user actually chose a new file.
            if (file) {
              const base64 = await fileToBase64(file);
              evidencesList.push({
                evidenceTypeId: String(id),
                fileData: base64,
                customDescription: isOthers ? customEvidence.trim() : undefined,
              });
            }
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
              // also add to IDs just in case
              payload.evidenceTypeIds!.push(String(othersOption.id));
            }
          }
          return evidencesList.length > 0 ? evidencesList : undefined;
        })(),
        witnesses: await Promise.all(
          witnesses
            .filter((w) => (w.fullName ?? "").trim())
            .map(async (w) => ({
              personId: w.personId ?? 0,
              fullName: (w.fullName ?? "").trim(),
              contactNumber: (w.contactNumber ?? "").trim() || undefined,
              address: (w.address ?? "").trim() || undefined,
              testimony: (w.testimony ?? "").trim() || undefined,
              testimonyFile: w.testimonyFile ? await fileToBase64(w.testimonyFile) : undefined,
            }))
        ),
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const target = e.target as HTMLElement;
            const tagName = target.tagName.toLowerCase();
            if (tagName === "textarea" || tagName === "button" || target.isContentEditable) {
              return;
            }
            e.preventDefault();
            handleSubmit();
          }
        }}
        className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[92vh] overflow-y-auto border border-slate-200"
      >
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
            type="button"
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
                    <input
                      type="text"
                      className="input bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200"
                      value={(() => {
                        const officer = officerOptions.find(o => String(o.id) === form.assignToId);
                        if (officer) return `${officer.name}${officer.position ? ` (${officer.position})` : ""}`;
                        return docket.assignOfficer || "Unassigned";
                      })()}
                      readOnly
                      disabled
                    />
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
                  Complainant
                </p>
                

                

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
                      readOnly={true}
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
                      readOnly={true}
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
                      readOnly={true}
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
                      readOnly={true}
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
                      maxLength={MAX_AGE_LENGTH} readOnly={true}
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
                      maxLength={MAX_EMAIL_LENGTH} readOnly={true}
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
                    readOnly={true}
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
                  Respondent
                </p>
                

                

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
                      readOnly={true}
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
                      readOnly={true}
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
                      readOnly={true}
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
                      maxLength={MAX_ALIAS_LENGTH} readOnly={true}
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
                      readOnly={true}
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
                      maxLength={MAX_RELATIONSHIP_LENGTH} readOnly={true}
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
                    readOnly={true}
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
                  <div className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-300 bg-slate-50/60 rounded-xl px-6 py-6 cursor-not-allowed opacity-80">
                    <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m16 16-4-4-4 4"></path></svg>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-700">
                        Drag &amp; drop narrative file here
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Cannot be modified in edit mode
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Read-only Evidence Display */}
              {docket.evidences && docket.evidences.length > 0 && (
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Evidence Submitted</p>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">Cannot be modified</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {docket.evidences.map((ev) => (
                      <div
                        key={ev.recordId}
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700"
                      >
                        <div className="flex items-center gap-2.5">
                          <svg className="w-4 h-4 flex-shrink-0 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                          <span className="text-sm font-medium">{ev.customDescription || ev.typeName}</span>
                        </div>
                        {ev.hasFile && (
                          <EvidenceViewer
                            recordId={ev.recordId}
                            fileName={ev.customDescription || ev.typeName}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <EvidenceSection
                optionsLoading={loadingOptions}
                evidenceOptions={evidenceOptions}
                selectedEvidence={selectedEvidenceIds}
                evidenceFiles={evidenceFiles}
                toggleEvidence={toggleEvidence}
                setEvidenceFile={setEvidenceFile}
                customEvidence={customEvidence}
                setCustomEvidence={setCustomEvidence}
                customEvidenceFile={customEvidenceFile}
                setCustomEvidenceFile={setCustomEvidenceFile}
                errors={errors}
                clearErr={() => setErrors((e) => { const ne = { ...e }; delete ne.evidence; return ne; })}
                lockedEvidence={lockedEvidenceIds}
              />

              <WitnessSection
                witnesses={witnesses}
                addWitness={addWitness}
                removeWitness={removeWitness}
                updateWitness={updateWitness}
                errors={errors}
                clearErr={() => {}}
                disableUpload={true}
              />
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
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-md text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button autoFocus
            type="submit"
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
      </form>

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
