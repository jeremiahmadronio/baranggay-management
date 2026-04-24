import { useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, Search } from "lucide-react";
import { ActionModal } from "../../reusable";
import {
  FormDatePicker,
  FormInput,
  FormRow,
  FormSelect,
  FormTextarea,
  SectionCard as BlotterSectionCard,
} from "../blotter-module/reusable/FormComponents";
import {
  ftjsApi,
  FTJS_PERMISSIONS,
  hasFtjsPermission,
  type FtjsRequestDTO,
  type PersonSearchResponseDTO,
} from "../../service/first-time-job-seeker-api/FirstTimeJobSeeker";
import { CenteredLoader } from "../../hooks/LoadingStates";
import { PermissionDeniedPage } from "../blotter-module/reusable/PermissionDeniedPage";
import {
  EDUCATIONAL_ATTAINMENT_OPTIONS,
  fileToByteArray,
  getFtjsValidIdConfig,
  toDateInputValue,
  VALID_ID_OPTIONS,
} from "./shared";
import { generateFtjsCertificate } from "./generateFtjsCertificate.ts";
import { useFtjsAccess } from "./useFtjsAccess";

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
  email: "",
  submittedDate: "",
  educationalAttainment: "",
  course: "",
  institution: "",
  validIdType: "",
  idNumber: "",
  schoolAddress: "",
  requestReason: "",
};

const searchInputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pl-10 text-[15px] text-slate-900 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all";

const EDUCATIONAL_ATTAINMENT_SELECT_OPTIONS = EDUCATIONAL_ATTAINMENT_OPTIONS.map(
  (option) => ({ value: option, label: option }),
);

const VALID_ID_SELECT_OPTIONS = VALID_ID_OPTIONS.map((option) => ({
  value: option,
  label: option,
}));

const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PH_MOBILE_REGEX = /^09\d{9}$/;
const NAME_MAX_LENGTH = 50;
const ADDRESS_MAX_LENGTH = 100;
const MOBILE_MAX_LENGTH = 11;
const EMAIL_MAX_LENGTH = 254;
const COURSE_MAX_LENGTH = 100;
const INSTITUTION_MAX_LENGTH = 100;
const ID_NUMBER_MAX_LENGTH = 50;
const REASON_MAX_LENGTH = 255;

function limitText(value: string, maxLength: number) {
  return value.slice(0, maxLength);
}

function normalizeMobileNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, MOBILE_MAX_LENGTH);
}

function SectionCard({
  step,
  title,
  notice,
  children,
}: {
  step: string;
  title: string;
  notice?: string;
  children: ReactNode;
}) {
  return (
    <BlotterSectionCard letter={step} title={title} notice={notice}>
      {children}
    </BlotterSectionCard>
  );
}

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
      } catch (searchError) {
        console.error(searchError);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <label className="text-sm font-semibold text-slate-700 tracking-wide">
        Search Person/Resident (Auto-fill)
      </label>
      <div className="relative mt-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          ) : (
            <Search className="h-4 w-4 text-slate-400" />
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
          placeholder="Search by name..."
          className={searchInputCls}
        />
      </div>

      {isOpen && query.trim().length >= 2 ? (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {results.length > 0 ? (
            <ul className="py-1">
              {results.map((person) => (
                <li
                  key={person.id}
                  className="cursor-pointer border-b border-slate-100 px-4 py-3 hover:bg-slate-50 last:border-0"
                  onClick={() => {
                    onSelect(person);
                    setQuery("");
                    setIsOpen(false);
                  }}
                >
                  <div className="text-sm font-medium text-slate-900">
                    {person.firstName} {person.middleName ? `${person.middleName} ` : ""}
                    {person.lastName}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-slate-500">
                    {person.completeAddress || "No address"}
                    {person.contactNumber ? ` • ${person.contactNumber}` : ""}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-center text-sm text-slate-500">
              No resident found for "{query}"
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function FtjsEntryPage() {
  const { accessLoading, userAccess } = useFtjsAccess();
  const [form, setForm] = useState(() => ({
    ...INITIAL_FORM,
    submittedDate: toDateInputValue(new Date()),
  }));
  const [oathFile, setOathFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedResident, setSelectedResident] =
    useState<PersonSearchResponseDTO | null>(null);

  const selectedValidIdConfig = getFtjsValidIdConfig(form.validIdType);
  const acceptsIdNumber = selectedValidIdConfig.acceptsIdNumber;
  const requiresSchoolAddress = selectedValidIdConfig.requiresSchoolAddress;
  const requiresIdNumber = selectedValidIdConfig.requiresIdNumber;
  const personalFieldsLocked = Boolean(selectedResident);
  const canRegisterApplicant = hasFtjsPermission(
    userAccess,
    FTJS_PERMISSIONS.REGISTER_APPLICANT,
  );

  function setValue<K extends keyof typeof INITIAL_FORM>(
    key: K,
    value: (typeof INITIAL_FORM)[K],
  ) {
    const normalizedValue = (() => {
      if (typeof value !== "string") return value;

      switch (key) {
        case "firstName":
        case "lastName":
          return limitText(value, NAME_MAX_LENGTH) as (typeof INITIAL_FORM)[K];
        case "address":
        case "schoolAddress":
          return limitText(value, ADDRESS_MAX_LENGTH) as (typeof INITIAL_FORM)[K];
        case "contactNumber":
          return normalizeMobileNumber(value) as (typeof INITIAL_FORM)[K];
        case "email":
          return limitText(value, EMAIL_MAX_LENGTH) as (typeof INITIAL_FORM)[K];
        case "course":
          return limitText(value, COURSE_MAX_LENGTH) as (typeof INITIAL_FORM)[K];
        case "institution":
          return limitText(value, INSTITUTION_MAX_LENGTH) as (typeof INITIAL_FORM)[K];
        case "idNumber":
          return limitText(value, ID_NUMBER_MAX_LENGTH) as (typeof INITIAL_FORM)[K];
        case "requestReason":
          return limitText(value, REASON_MAX_LENGTH) as (typeof INITIAL_FORM)[K];
        default:
          return value;
      }
    })();

    setForm((prev) => {
      if (key === "validIdType") {
        const config = getFtjsValidIdConfig(String(normalizedValue || ""));
        return {
          ...prev,
          [key]: normalizedValue,
          schoolAddress: config.requiresSchoolAddress ? prev.schoolAddress : "",
          idNumber: config.acceptsIdNumber ? prev.idNumber : "",
        };
      }

      return { ...prev, [key]: normalizedValue };
    });

    setErrors((prev) => ({
      ...prev,
      [key]: "",
      ...(key === "validIdType" ? { schoolAddress: "", idNumber: "" } : {}),
    }));
  }

  function resetForm() {
    setForm({
      ...INITIAL_FORM,
      submittedDate: toDateInputValue(new Date()),
    });
    setOathFile(null);
    setErrors({});
    setSelectedResident(null);
  }

  function applyResidentProfile(person: PersonSearchResponseDTO) {
    setSelectedResident(person);
    setForm((prev) => ({
      ...prev,
      residentId: String(person.id),
      firstName: limitText(person.firstName || "", NAME_MAX_LENGTH),
      lastName: limitText(person.lastName || "", NAME_MAX_LENGTH),
      gender: person.gender || "",
      address: limitText(person.completeAddress || "", ADDRESS_MAX_LENGTH),
      contactNumber: normalizeMobileNumber(person.contactNumber || ""),
      email: limitText(person.email || "", EMAIL_MAX_LENGTH),
    }));
  }

  async function handleSelectResident(person: PersonSearchResponseDTO) {
    applyResidentProfile(person);
  }

  function validate() {
    const nextErrors: Record<string, string> = {};
    const emailValue = form.email.trim();
    const contactValue = form.contactNumber.trim();

    if (!form.firstName.trim()) {
      nextErrors.firstName = "First name is required.";
    } else if (form.firstName.trim().length > NAME_MAX_LENGTH) {
      nextErrors.firstName = `First name must not exceed ${NAME_MAX_LENGTH} characters.`;
    }

    if (!form.lastName.trim()) {
      nextErrors.lastName = "Last name is required.";
    } else if (form.lastName.trim().length > NAME_MAX_LENGTH) {
      nextErrors.lastName = `Last name must not exceed ${NAME_MAX_LENGTH} characters.`;
    }

    if (!form.gender.trim()) {
      nextErrors.gender = "Gender is required.";
    }

    if (!form.address.trim()) {
      nextErrors.address = "Address is required.";
    } else if (form.address.trim().length > ADDRESS_MAX_LENGTH) {
      nextErrors.address = `Address must not exceed ${ADDRESS_MAX_LENGTH} characters.`;
    }

    if (!form.submittedDate) {
      nextErrors.submittedDate = "Date submitted is required.";
    }

    if (!contactValue) {
      nextErrors.contactNumber = "Contact number is required.";
    } else if (!PH_MOBILE_REGEX.test(contactValue)) {
      nextErrors.contactNumber =
        "Contact number must start with 09 and contain 11 digits.";
    }

    if (emailValue && !EMAIL_REGEX.test(emailValue)) {
      nextErrors.email = "Enter a valid email address.";
    } else if (emailValue.length > EMAIL_MAX_LENGTH) {
      nextErrors.email = `Email must not exceed ${EMAIL_MAX_LENGTH} characters.`;
    }

    if (!form.educationalAttainment.trim()) {
      nextErrors.educationalAttainment = "Educational attainment is required.";
    }

    if (requiresSchoolAddress && !form.schoolAddress.trim()) {
      nextErrors.schoolAddress =
        "School address is required when School ID is used.";
    } else if (
      requiresSchoolAddress &&
      form.schoolAddress.trim().length > ADDRESS_MAX_LENGTH
    ) {
      nextErrors.schoolAddress = `School address must not exceed ${ADDRESS_MAX_LENGTH} characters.`;
    }

    if (form.course.trim().length > COURSE_MAX_LENGTH) {
      nextErrors.course = `Course must not exceed ${COURSE_MAX_LENGTH} characters.`;
    }

    if (form.institution.trim().length > INSTITUTION_MAX_LENGTH) {
      nextErrors.institution = `Institution must not exceed ${INSTITUTION_MAX_LENGTH} characters.`;
    }

    if (acceptsIdNumber && form.idNumber.trim().length > ID_NUMBER_MAX_LENGTH) {
      nextErrors.idNumber = `ID number must not exceed ${ID_NUMBER_MAX_LENGTH} characters.`;
    } else if (requiresIdNumber && !form.idNumber.trim()) {
      nextErrors.idNumber = `${selectedValidIdConfig.idNumberLabel} is required.`;
    }

    if (!oathFile) {
      nextErrors.oathFiles = "Oath of Undertaking file is required.";
    }

    if (!form.requestReason.trim()) {
      nextErrors.requestReason =
        "Please provide the reason for requesting FTJS.";
    } else if (form.requestReason.trim().length > REASON_MAX_LENGTH) {
      nextErrors.requestReason = `Reason must not exceed ${REASON_MAX_LENGTH} characters.`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    const issuedDate = new Date(form.submittedDate);

    if (Number.isNaN(issuedDate.getTime())) {
      setErrors((prev) => ({
        ...prev,
        submittedDate: "Enter a valid submitted date.",
      }));
      return;
    }

    try {
      setSubmitting(true);
      const payload: FtjsRequestDTO = {
        resident_id: form.residentId.trim() ? Number(form.residentId) : null,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        gender: form.gender.trim(),
        address: form.address.trim(),
        contactNumber: form.contactNumber.trim(),
        email: form.email.trim() || undefined,
        educationalAttainment: form.educationalAttainment,
        course: form.course.trim() || undefined,
        institution: form.institution.trim() || undefined,
        validIdType: form.validIdType || undefined,
        idNumber: acceptsIdNumber ? form.idNumber.trim() || undefined : undefined,
        schoolAddress: form.schoolAddress.trim() || undefined,
        oathFiles: await fileToByteArray(oathFile),
        purpose: form.requestReason.trim(),
      };

      await ftjsApi.createRequest(payload);
      generateFtjsCertificate({
        fullName: `${form.firstName} ${form.lastName}`,
        age: selectedResident?.age,
        address: form.address.trim(),
        purpose: form.requestReason.trim(),
        dateIssued: issuedDate,
      });
      setFeedback({
        type: "success",
        title: "FTJS request submitted",
        message:
          "The FTJS entry has been encoded successfully and the certificate PDF was prepared for printing.",
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

  if (accessLoading) {
    return <CenteredLoader minHeight="min-h-[70vh]" />;
  }

  if (!canRegisterApplicant) {
    return (
      <PermissionDeniedPage
        message="You do not have permission to register a new FTJS applicant."
        hint="Ask your administrator to grant the Register New Applicant permission."
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8">
       

        <div className="mt-6 space-y-5">
          <SectionCard
            step="B"
            title="Personal Information"
          >
            <ResidentSearchInput onSelect={handleSelectResident} />

            {selectedResident ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                Existing resident record selected: <span className="font-semibold">{selectedResident.firstName} {selectedResident.lastName}</span>
              </div>
            ) : null}

            <FormRow>
              <FormInput
                label="First Name"
                value={form.firstName}
                onChange={(event) => setValue("firstName", event.target.value)}
                readOnly={personalFieldsLocked}
                maxLength={NAME_MAX_LENGTH}
                showCounter
                required
                error={errors.firstName}
              />
              <FormInput
                label="Last Name"
                value={form.lastName}
                onChange={(event) => setValue("lastName", event.target.value)}
                readOnly={personalFieldsLocked}
                maxLength={NAME_MAX_LENGTH}
                showCounter
                required
                error={errors.lastName}
              />
              <FormSelect
                label="Gender"
                value={form.gender}
                onChange={(event) => setValue("gender", event.target.value)}
                disabled={personalFieldsLocked}
                required
                options={GENDER_OPTIONS}
                placeholder="Select gender"
                error={errors.gender}
              />
              <FormInput
                label="Contact Number"
                value={form.contactNumber}
                onChange={(event) => setValue("contactNumber", event.target.value)}
                readOnly={personalFieldsLocked}
                inputMode="numeric"
                maxLength={MOBILE_MAX_LENGTH}
                placeholder="09XXXXXXXXX"
                hint="Use 11-digit Philippine mobile format"
                showCounter
                required
                error={errors.contactNumber}
              />
              <FormInput
                label="Email"
                type="email"
                value={form.email}
                onChange={(event) => setValue("email", event.target.value)}
                readOnly={personalFieldsLocked}
                placeholder="name@example.com"
                maxLength={EMAIL_MAX_LENGTH}
                showCounter
                error={errors.email}
              />
              <FormDatePicker
                label="Date Submitted"
                value={form.submittedDate}
                onChange={(event) => setValue("submittedDate", event.target.value)}
                required
                error={errors.submittedDate}
              />
            </FormRow>

            <FormTextarea
              label="Complete Address"
              value={form.address}
              rows={3}
              onChange={(event) => setValue("address", event.target.value)}
              readOnly={personalFieldsLocked}
              maxLength={ADDRESS_MAX_LENGTH}
              hint={`Maximum of ${ADDRESS_MAX_LENGTH} characters.`}
              required
              error={errors.address}
            />
          </SectionCard>

          <SectionCard
            step="C"
            title="Educational & Identity Details"
            notice="These fields are sent directly to the FTJS API request."
          >
            <FormRow>
              <FormSelect
                label="Educational Attainment"
                required
                value={form.educationalAttainment}
                onChange={(event) =>
                  setValue("educationalAttainment", event.target.value)
                }
                options={EDUCATIONAL_ATTAINMENT_SELECT_OPTIONS}
                placeholder="Select educational"
                error={errors.educationalAttainment}
              />
              <FormInput
                label="Course"
                value={form.course}
                onChange={(event) => setValue("course", event.target.value)}
                placeholder="Course if applicable"
                maxLength={COURSE_MAX_LENGTH}
                showCounter
                error={errors.course}
              />
              <FormInput
                label="Institution"
                value={form.institution}
                onChange={(event) => setValue("institution", event.target.value)}
                placeholder="School or training institution"
                maxLength={INSTITUTION_MAX_LENGTH}
                showCounter
                error={errors.institution}
              />
              <FormSelect
                label="Valid ID Type"
                value={form.validIdType}
                onChange={(event) => setValue("validIdType", event.target.value)}
                options={VALID_ID_SELECT_OPTIONS}
                placeholder="Select valid ID"
              />
              <FormInput
                label={selectedValidIdConfig.idNumberLabel}
                value={form.idNumber}
                onChange={(event) => setValue("idNumber", event.target.value)}
                placeholder={selectedValidIdConfig.idNumberPlaceholder}
                maxLength={ID_NUMBER_MAX_LENGTH}
                hint={selectedValidIdConfig.idNumberHint}
                showCounter={acceptsIdNumber}
                required={requiresIdNumber}
                disabled={!form.validIdType || !acceptsIdNumber}
                error={errors.idNumber}
              />
            </FormRow>

            {requiresSchoolAddress ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                <FormTextarea
                  label="School Address"
                  required
                  value={form.schoolAddress}
                  onChange={(event) => setValue("schoolAddress", event.target.value)}
                  rows={3}
                  placeholder="Enter school address"
                  maxLength={ADDRESS_MAX_LENGTH}
                  hint={`Maximum of ${ADDRESS_MAX_LENGTH} characters.`}
                  error={errors.schoolAddress}
                />
              </div>
            ) : null}

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
              <label className="mb-1.5 block text-sm font-semibold tracking-wide text-slate-700">
                Oath Attachment
                <span className="ml-0.5 text-red-500">*</span>
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(event) => setOathFile(event.target.files?.[0] ?? null)}
                className="w-full text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-blue-700 hover:file:bg-blue-100"
              />
              {errors.oathFiles ? (
                <p className="mt-1 text-xs text-red-500">{errors.oathFiles}</p>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard
            step="D"
            title="Reason for Request"
            notice="State why the resident is requesting the first-time job seeker certificate."
          >
            <FormTextarea
              label="Reason / Purpose"
              required
              value={form.requestReason}
              onChange={(event) => setValue("requestReason", event.target.value)}
              rows={4}
              placeholder="Halimbawa: Kukuha po ng FTJS certificate para sa first job application requirement."
              maxLength={REASON_MAX_LENGTH}
              hint={`Maximum of ${REASON_MAX_LENGTH} characters.`}
              error={errors.requestReason}
            />
          </SectionCard>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Reset Form
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
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