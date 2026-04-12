import { useEffect, useRef, useState } from "react";
import { Loader2, Search, ShieldCheck } from "lucide-react";
import { ActionModal } from "../../reusable";
import {
  ftjsApi,
  type FtjsRequestDTO,
  type PersonSearchResponseDTO,
} from "../../service/ftjs/FirstTimeJobSeeker";
import {
  EDUCATIONAL_ATTAINMENT_OPTIONS,
  FieldShell,
  fileToByteArray,
  FormSection,
  SectionCard,
  toDateInputValue,
  VALID_ID_OPTIONS,
} from "./shared";

type FeedbackState = {
  type: "success" | "danger" | "info";
  title: string;
  message: string;
} | null;

const INITIAL_FORM = {
  residentId: "",
  firstName: "",
  lastName: "",
  gender: "",
  address: "",
  contactNumber: "",
  educationalAttainment: "",
  course: "",
  institution: "",
  validIdType: "",
  idNumber: "",
  requestReason: "",
};

function ResidentSearchInput({
  onSelect,
}: {
  onSelect: (person: PersonSearchResponseDTO) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonSearchResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        const response = await ftjsApi.searchResidents(query);
        setResults(response.filter((person) => person.isResident !== false));
        setIsOpen(true);
      } catch (error) {
        console.error(error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        Search Resident
        <span className="text-red-500 ml-1">*</span>
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-gray-400" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (event.target.value.trim().length < 2) setIsOpen(false);
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Search by resident name..."
          className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
        />
      </div>

      {isOpen && query.trim().length >= 2 ? (
        <div className="absolute z-20 mt-1 w-full bg-white rounded-lg shadow-lg border border-blue-100 max-h-64 overflow-auto">
          {results.length > 0 ? (
            <ul className="py-1">
              {results.map((person) => (
                <li
                  key={person.id}
                  className="px-4 py-2 hover:bg-blue-50/60 cursor-pointer border-b border-slate-100 last:border-0"
                  onClick={() => {
                    onSelect(person);
                    setQuery("");
                    setIsOpen(false);
                  }}
                >
                  <div className="text-sm font-medium text-slate-900">
                    {person.firstName}{" "}
                    {person.middleName ? `${person.middleName} ` : ""}
                    {person.lastName}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">
                    {person.completeAddress || "No address"}
                    {person.contactNumber ? ` • ${person.contactNumber}` : ""}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-slate-500 text-center">
              No resident found for "{query}"
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function FtjsEntryPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [oathFile, setOathFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedResident, setSelectedResident] =
    useState<PersonSearchResponseDTO | null>(null);

  function setValue<K extends keyof typeof INITIAL_FORM>(
    key: K,
    value: (typeof INITIAL_FORM)[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setOathFile(null);
    setErrors({});
    setSelectedResident(null);
  }

  function handleSelectResident(person: PersonSearchResponseDTO) {
    setSelectedResident(person);
    setForm((prev) => ({
      ...prev,
      residentId: String(person.id),
      firstName: person.firstName || "",
      lastName: person.lastName || "",
      gender: person.gender || "",
      address: person.completeAddress || "",
      contactNumber: person.contactNumber || "",
    }));
    setErrors((prev) => ({ ...prev, residentId: "" }));
  }

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (!form.residentId.trim()) {
      nextErrors.residentId = "Please search and select a resident first.";
    }

    if (!form.educationalAttainment.trim()) {
      nextErrors.educationalAttainment = "Educational attainment is required.";
    }

    if (!form.requestReason.trim()) {
      nextErrors.requestReason =
        "Please provide the reason for requesting FTJS.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    try {
      setSubmitting(true);
      const payload: FtjsRequestDTO = {
        resident_id: form.residentId.trim() ? Number(form.residentId) : null,
        educationalAttainment: form.educationalAttainment,
        course: form.course.trim() || undefined,
        institution: form.institution.trim() || undefined,
        validIdType: form.validIdType || undefined,
        idNumber: form.idNumber.trim() || undefined,
        dateSubmitted: toDateInputValue(new Date()),
        purpose: form.requestReason.trim(),
        oathFiles: oathFile ? await fileToByteArray(oathFile) : undefined,
      };

      await ftjsApi.createRequest(payload);
      setFeedback({
        type: "success",
        title: "FTJS request submitted",
        message: "The FTJS entry has been encoded successfully.",
      });
      resetForm();
    } catch (error) {
      setFeedback({
        type: "danger",
        title: "Submission failed",
        message:
          error instanceof Error
            ? error.message
            : "Please review the FTJS form and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <SectionCard
          title="First Time Job Seeker Entry"
          subtitle="Search a resident first, then complete the FTJS request details using the official API fields."
        >
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
            <p>
              Resident search mirrors the blotter form flow: select a resident,
              auto-fill the applicant details, then submit the FTJS request.
              Date submitted is automatically set to today.
            </p>
          </div>
        </SectionCard>

        <div className="space-y-5">
          <FormSection
            title="Resident Lookup"
            subtitle="Search and select the resident so the FTJS request can use the resident ID automatically."
          >
            <ResidentSearchInput onSelect={handleSelectResident} />
            {errors.residentId ? (
              <p className="text-xs text-red-500 -mt-2">{errors.residentId}</p>
            ) : null}

            {selectedResident ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                Selected resident:{" "}
                <span className="font-semibold">
                  {selectedResident.firstName} {selectedResident.lastName}
                </span>
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldShell label="First Name">
                <input
                  type="text"
                  value={form.firstName}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                />
              </FieldShell>
              <FieldShell label="Last Name">
                <input
                  type="text"
                  value={form.lastName}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                />
              </FieldShell>
              <FieldShell label="Gender">
                <input
                  type="text"
                  value={form.gender}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                />
              </FieldShell>
              <FieldShell label="Contact Number">
                <input
                  type="text"
                  value={form.contactNumber}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                />
              </FieldShell>
              <div className="md:col-span-2">
                <FieldShell label="Complete Address">
                  <textarea
                    value={form.address}
                    readOnly
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none bg-gray-50"
                  />
                </FieldShell>
              </div>
            </div>

            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              Date submitted will be set automatically to{" "}
              <span className="font-semibold text-gray-900">
                {toDateInputValue(new Date())}
              </span>{" "}
              when you submit.
            </div>
          </FormSection>

          <FormSection
            title="Educational & Identity Details"
            subtitle="These fields map directly to the FTJS request DTO."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldShell
                label="Educational Attainment"
                required
                error={errors.educationalAttainment}
              >
                <select
                  value={form.educationalAttainment}
                  onChange={(event) =>
                    setValue("educationalAttainment", event.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="">Select attainment</option>
                  {EDUCATIONAL_ATTAINMENT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FieldShell>

              <FieldShell label="Course">
                <input
                  type="text"
                  value={form.course}
                  onChange={(event) => setValue("course", event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </FieldShell>

              <FieldShell label="Institution">
                <input
                  type="text"
                  value={form.institution}
                  onChange={(event) =>
                    setValue("institution", event.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </FieldShell>

              <FieldShell label="Valid ID Type">
                <select
                  value={form.validIdType}
                  onChange={(event) =>
                    setValue("validIdType", event.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="">Select valid ID</option>
                  {VALID_ID_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FieldShell>

              <FieldShell label="ID Number">
                <input
                  type="text"
                  value={form.idNumber}
                  onChange={(event) => setValue("idNumber", event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </FieldShell>

              <div className="md:col-span-2">
                <FieldShell label="Oath Attachment">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(event) =>
                      setOathFile(event.target.files?.[0] ?? null)
                    }
                    className="w-full text-sm text-gray-700 file:mr-4 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </FieldShell>
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Reason for Request"
            subtitle="State why the resident is requesting the first-time job seeker certificate."
          >
            <FieldShell
              label="Reason / Purpose"
              required
              error={errors.requestReason}
            >
              <textarea
                value={form.requestReason}
                onChange={(event) =>
                  setValue("requestReason", event.target.value)
                }
                rows={4}
                placeholder="Halimbawa: Kukuha po ng FTJS certificate para sa first job application requirement."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
              />
            </FieldShell>

            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Preview
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {form.requestReason.trim() || "No reason entered yet."}
              </p>
            </div>
          </FormSection>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Reset Form
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit FTJS Entry"}
            </button>
          </div>
        </div>

        <ActionModal
          isOpen={!!feedback}
          onClose={() => setFeedback(null)}
          title={feedback?.title || "FTJS Entry"}
          type={feedback?.type || "info"}
        >
          {feedback?.message}
        </ActionModal>
      </div>
    </div>
  );
}
