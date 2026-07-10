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
  toDateInputValue,
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
  middleName: "",
  lastName: "",
  suffix: "",
  birthDate: "",
  age: "",
  gender: "",
  civilStatus: "",
  address: "",
  religion: "",
  residencyDate: "",
  residencyYears: "",
  contactNumber: "",
  email: "",
  submittedDate: "",
  educationalAttainment: "",
  course: "",
  institution: "",
  validIdType: "",
  schoolAddress: "",
  requestReason: "",
};

const searchInputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pl-10 text-[15px] text-slate-900 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all";

const EDUCATIONAL_ATTAINMENT_SELECT_OPTIONS = EDUCATIONAL_ATTAINMENT_OPTIONS.map(
  (option) => ({ value: option, label: option }),
);

const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
];

const COURSE_OPTIONS = [
  { value: "BS Information Technology", label: "BS Information Technology" },
  { value: "BS Computer Science", label: "BS Computer Science" },
  { value: "BS Business Administration", label: "BS Business Administration" },
  { value: "BS Accountancy", label: "BS Accountancy" },
  { value: "BS Education", label: "BS Education" },
  { value: "BS Engineering", label: "BS Engineering" },
  { value: "BS Nursing", label: "BS Nursing" },
  { value: "BS Criminology", label: "BS Criminology" },
  { value: "BS Hospitality Management", label: "BS Hospitality Management" },
  { value: "BS Tourism Management", label: "BS Tourism Management" },
  { value: "BS Psychology", label: "BS Psychology" },
  { value: "BS Architecture", label: "BS Architecture" },
  { value: "BS Pharmacy", label: "BS Pharmacy" },
  { value: "BS Medical Technology", label: "BS Medical Technology" },
  { value: "BS Radiologic Technology", label: "BS Radiologic Technology" },
  { value: "BS Agriculture", label: "BS Agriculture" },
  { value: "BS Marine Transportation", label: "BS Marine Transportation" },
  { value: "BS Marine Engineering", label: "BS Marine Engineering" },
  { value: "BA Communication", label: "BA Communication" },
  { value: "BA Political Science", label: "BA Political Science" },
  { value: "SHS - STEM", label: "SHS - STEM" },
  { value: "SHS - ABM", label: "SHS - ABM" },
  { value: "SHS - HUMSS", label: "SHS - HUMSS" },
  { value: "SHS - GAS", label: "SHS - GAS" },
  { value: "Others", label: "Others" }
];

const RELIGION_OPTIONS = [
  { value: "Roman Catholic", label: "Roman Catholic" },
  { value: "Islam", label: "Islam" },
  { value: "Iglesia ni Cristo", label: "Iglesia ni Cristo" },
  { value: "Born Again Christian", label: "Born Again Christian" },
  { value: "Seventh-day Adventist", label: "Seventh-day Adventist" },
  { value: "Others", label: "Others" }
];

const CIVIL_STATUS_OPTIONS = [
  { value: "Single", label: "Single" },
  { value: "Married", label: "Married" },
  { value: "Widowed", label: "Widowed" },
  { value: "Separated", label: "Separated" },
];

function calculateAge(birthDateStr: string): string {
  if (!birthDateStr) return "";
  const today = new Date();
  const dob = new Date(birthDateStr);
  if (isNaN(dob.getTime())) return "";
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? String(age) : "";
}

function calculateBirthDateFromAge(ageStr: string, prevBirthDate: string = ""): string {
  if (!ageStr) return "";
  const age = parseInt(ageStr, 10);
  if (isNaN(age) || age < 0) return "";
  const today = new Date();
  const birthYear = today.getFullYear() - age;
  
  if (prevBirthDate) {
    const prevDate = new Date(prevBirthDate);
    if (!isNaN(prevDate.getTime())) {
      const month = String(prevDate.getMonth() + 1).padStart(2, '0');
      const day = String(prevDate.getDate()).padStart(2, '0');
      return `${birthYear}-${month}-${day}`;
    }
  }
  return `${birthYear}-01-01`; // Approximation
}

function calculateResidencyYears(dateStr: string): string {
  if (!dateStr) return "";
  const today = new Date();
  const start = new Date(dateStr);
  if (isNaN(start.getTime())) return "";
  let years = today.getFullYear() - start.getFullYear();
  const m = today.getMonth() - start.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < start.getDate())) {
    years--;
  }
  return years >= 0 ? String(years) : "";
}

function calculateResidencyDateFromYears(yearsStr: string, prevDateStr: string = ""): string {
  if (!yearsStr) return "";
  const years = parseInt(yearsStr, 10);
  if (isNaN(years) || years < 0) return "";
  const today = new Date();
  const startYear = today.getFullYear() - years;
  
  if (prevDateStr) {
    const prevDate = new Date(prevDateStr);
    if (!isNaN(prevDate.getTime())) {
      const month = String(prevDate.getMonth() + 1).padStart(2, '0');
      const day = String(prevDate.getDate()).padStart(2, '0');
      return `${startYear}-${month}-${day}`;
    }
  }
  return `${startYear}-01-01`; // Approximation
}

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
        Search Resident (Auto-fill)
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
          maxLength={50}
          value={query}
          onChange={(event) => {
            const sanitized = event.target.value.replace(/[0-9]/g, "").replace(/[^a-zA-Z\s.,\-ñÑ]/g, "");
            setQuery(sanitized);
            if (sanitized.length < 2) setIsOpen(false);
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
  const [hasBarangayUgongId, setHasBarangayUgongId] = useState(false);
  const [courseSelection, setCourseSelection] = useState("");
  const [religionSelection, setReligionSelection] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedResident, setSelectedResident] =
    useState<PersonSearchResponseDTO | null>(null);

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
        case "middleName":
        case "lastName":
          // Letters, spaces, periods, hyphens (no numbers)
          return limitText(value.replace(/[^a-zA-ZñÑ\s.,\-]/g, ""), NAME_MAX_LENGTH) as (typeof INITIAL_FORM)[K];
        case "suffix":
          return limitText(value.replace(/[^a-zA-Z\s.,]/g, ""), 10) as (typeof INITIAL_FORM)[K];
        case "address":
        case "schoolAddress":
          // Alphanumeric + basic punctuation
          return limitText(value.replace(/[^a-zA-Z0-9ñÑ\s.,\-'()/#&]/g, ""), ADDRESS_MAX_LENGTH) as (typeof INITIAL_FORM)[K];
        case "contactNumber":
          return normalizeMobileNumber(value) as (typeof INITIAL_FORM)[K];
        case "email":
          return limitText(value.replace(/\s/g, ""), EMAIL_MAX_LENGTH) as (typeof INITIAL_FORM)[K];
        case "course":
          return limitText(value.replace(/[^a-zA-Z0-9ñÑ\s.,\-'()]/g, ""), COURSE_MAX_LENGTH) as (typeof INITIAL_FORM)[K];
        case "institution":
          return limitText(value.replace(/[^a-zA-Z0-9ñÑ\s.,\-'()]/g, ""), INSTITUTION_MAX_LENGTH) as (typeof INITIAL_FORM)[K];
        case "requestReason":
          return limitText(value.replace(/[^a-zA-Z0-9ñÑ\s.,\-'()"\n]/g, ""), REASON_MAX_LENGTH) as (typeof INITIAL_FORM)[K];
        case "age":
        case "residencyYears":
          return limitText(value.replace(/\D/g, ""), 3) as (typeof INITIAL_FORM)[K];
        case "religion":
          return limitText(value.replace(/[^a-zA-Z0-9ñÑ\s.,\-]/g, ""), 50) as (typeof INITIAL_FORM)[K];
        default:
          return value;
      }
    })();

    setForm((prev) => {
      if (key === "birthDate") {
        return {
          ...prev,
          birthDate: normalizedValue as string,
          age: calculateAge(normalizedValue as string)
        };
      }

      if (key === "age" && normalizedValue) {
        return {
          ...prev,
          age: normalizedValue as string,
          birthDate: calculateBirthDateFromAge(normalizedValue as string, prev.birthDate)
        };
      }

      if (key === "residencyDate") {
        return {
          ...prev,
          residencyDate: normalizedValue as string,
          residencyYears: calculateResidencyYears(normalizedValue as string)
        };
      }

      if (key === "residencyYears" && normalizedValue) {
        return {
          ...prev,
          residencyYears: normalizedValue as string,
          residencyDate: calculateResidencyDateFromYears(normalizedValue as string, prev.residencyDate)
        };
      }

      return { ...prev, [key]: normalizedValue };
    });

    setErrors((prev) => ({
      ...prev,
      [key]: "",
    }));
  }

  function resetForm() {
    setForm({
      ...INITIAL_FORM,
      submittedDate: toDateInputValue(new Date()),
    });
    setOathFile(null);
    setHasBarangayUgongId(false);
    setCourseSelection("");
    setReligionSelection("");
    setErrors({});
    setSelectedResident(null);
  }

  function applyResidentProfile(person: PersonSearchResponseDTO) {
    setSelectedResident(person);
    setForm((prev) => ({
      ...prev,
      residentId: String(person.id),
      firstName: limitText(person.firstName || "", NAME_MAX_LENGTH),
      middleName: limitText(person.middleName || "", NAME_MAX_LENGTH),
      lastName: limitText(person.lastName || "", NAME_MAX_LENGTH),
      suffix: limitText((person as any).suffix || "", 10),
      birthDate: person.birthDate || "",
      age: person.age ? String(person.age) : "",
      gender: person.gender || "",
      civilStatus: person.civilStatus || "",
      address: limitText(person.completeAddress || "", ADDRESS_MAX_LENGTH),
      contactNumber: normalizeMobileNumber(person.contactNumber || ""),
      email: limitText(person.email || "", EMAIL_MAX_LENGTH),
      // Note: We leave religion empty if it was unselected so the user can see it's blank.
      religion: limitText((person as any).religion || "", 50),
      residencyDate: (person as any).residencyDate || "",
      residencyYears: calculateResidencyYears((person as any).residencyDate || ""),
    }));
    
    if ((person as any).religion) {
      const isStandardReligion = RELIGION_OPTIONS.some(opt => opt.value === (person as any).religion);
      if (isStandardReligion) {
        setReligionSelection((person as any).religion);
      } else {
        setReligionSelection("Others");
      }
    }
  }

  async function handleSelectResident(person: PersonSearchResponseDTO) {
    applyResidentProfile(person);
  }

  function handleClearSelection() {
    setSelectedResident(null);
    setForm((prev) => ({
      ...prev,
      residentId: "",
      firstName: "",
      middleName: "",
      lastName: "",
      suffix: "",
      birthDate: "",
      age: "",
      gender: "",
      civilStatus: "",
      address: "",
      contactNumber: "",
      email: "",
      religion: "",
      residencyDate: "",
      residencyYears: "",
    }));
    setReligionSelection("");
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

    if (form.schoolAddress.trim().length > ADDRESS_MAX_LENGTH) {
      nextErrors.schoolAddress = `School address must not exceed ${ADDRESS_MAX_LENGTH} characters.`;
    }

    if (form.course.trim().length > COURSE_MAX_LENGTH) {
      nextErrors.course = `Course must not exceed ${COURSE_MAX_LENGTH} characters.`;
    }

    if (form.institution.trim().length > INSTITUTION_MAX_LENGTH) {
      nextErrors.institution = `Institution must not exceed ${INSTITUTION_MAX_LENGTH} characters.`;
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
        middleName: form.middleName.trim() || undefined,
        lastName: form.lastName.trim(),
        suffix: form.suffix.trim() || undefined,
        birthDate: form.birthDate || undefined,
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender.trim(),
        civilStatus: form.civilStatus.trim() || undefined,
        address: form.address.trim(),
        religion: form.religion.trim() || undefined,
        residencyDate: form.residencyDate || undefined,
        contactNumber: form.contactNumber.trim(),
        email: form.email.trim() || undefined,
        educationalAttainment: form.educationalAttainment,
        course: form.course.trim() || undefined,
        institution: form.institution.trim() || undefined,
        validIdType: form.validIdType || undefined,
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
        <SectionCard step="A" title="First Time Job Seeker Entry">
          <p className="text-sm text-slate-600">
            Search for an existing resident record to auto-fill personal
            information. If no record is found, you may enter the details
            manually using the required fields below.
          </p>
        </SectionCard>

        <div className="mt-6 space-y-5">
          <SectionCard
            step="B"
            title="Personal Information"
          >
            <ResidentSearchInput onSelect={handleSelectResident} />

            {selectedResident ? (
              <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <span>
                  Existing resident record selected: <span className="font-semibold">{selectedResident.firstName} {selectedResident.lastName}</span>
                </span>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-emerald-700 hover:text-emerald-900 hover:underline font-medium text-xs flex items-center gap-1 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Clear Selection
                </button>
              </div>
            ) : null}

            <FormRow>
              <FormInput
                label="First Name"
                value={form.firstName}
                onChange={(event) => setValue("firstName", event.target.value)}
                disabled={!!selectedResident}
                maxLength={NAME_MAX_LENGTH}
                showCounter
                required
                error={errors.firstName}
              />
              <FormInput
                label="Middle Name"
                value={form.middleName}
                onChange={(event) => setValue("middleName", event.target.value)}
                disabled={!!selectedResident}
                maxLength={NAME_MAX_LENGTH}
                showCounter
              />
              <FormInput
                label="Last Name"
                value={form.lastName}
                onChange={(event) => setValue("lastName", event.target.value)}
                disabled={!!selectedResident}
                maxLength={NAME_MAX_LENGTH}
                showCounter
                required
                error={errors.lastName}
              />
              <FormInput
                label="Suffix"
                value={form.suffix}
                onChange={(event) => setValue("suffix", event.target.value)}
                disabled={!!selectedResident}
                maxLength={10}
                placeholder="Jr., III, etc."
              />
            </FormRow>

            <FormRow>
              <FormDatePicker
                label="Birthday"
                value={form.birthDate}
                onChange={(event) => setValue("birthDate", event.target.value)}
                disabled={!!selectedResident}
              />
              <FormInput
                label="Age"
                value={form.age}
                onChange={(event) => setValue("age", event.target.value)}
                disabled={!!selectedResident}
                inputMode="numeric"
                maxLength={3}
              />
              <FormSelect
                label="Gender"
                value={form.gender}
                onChange={(event) => setValue("gender", event.target.value)}
                disabled={!!selectedResident}
                required
                options={GENDER_OPTIONS}
                placeholder="Select gender"
                error={errors.gender}
              />
              <FormSelect
                label="Civil Status"
                value={form.civilStatus}
                onChange={(event) => setValue("civilStatus", event.target.value)}
                disabled={!!selectedResident}
                options={CIVIL_STATUS_OPTIONS}
                placeholder="Select civil status"
              />
            </FormRow>

            <FormRow>
              <FormInput
                label="Contact Number"
                value={form.contactNumber}
                onChange={(event) => setValue("contactNumber", event.target.value)}
                disabled={!!selectedResident}
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
                disabled={!!selectedResident}
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
                disabled
                error={errors.submittedDate}
              />
            </FormRow>

            <FormTextarea
              label="Complete Address"
              value={form.address}
              rows={3}
              onChange={(event) => setValue("address", event.target.value)}
              disabled={!!selectedResident}
              maxLength={ADDRESS_MAX_LENGTH}
              hint={`Maximum of ${ADDRESS_MAX_LENGTH} characters.`}
              required
              error={errors.address}
            />

            <FormRow cols={2}>
              <div className="col-span-1 md:col-span-1 xl:col-span-1">
                <div className="flex gap-4 items-start">
                  <div className="flex-1">
                    <FormDatePicker
                      label="Residency Date"
                      value={form.residencyDate}
                      onChange={(event) => setValue("residencyDate", event.target.value)}
                      disabled={Boolean(selectedResident && (selectedResident as any).residencyDate)}
                    />
                  </div>
                  <div className="w-24">
                    <FormInput
                      label="Years"
                      value={form.residencyYears}
                      onChange={(event) => setValue("residencyYears", event.target.value)}
                      inputMode="numeric"
                      placeholder="Yrs"
                      maxLength={3}
                      disabled={Boolean(selectedResident && (selectedResident as any).residencyDate)}
                    />
                  </div>
                </div>
              </div>

              <div className="col-span-1 md:col-span-1 xl:col-span-1">
                <FormSelect
                  label="Religion"
                  value={religionSelection}
                  onChange={(event) => {
                    setReligionSelection(event.target.value);
                    if (event.target.value !== "Others") {
                      setValue("religion", event.target.value);
                    } else {
                      setValue("religion", "");
                    }
                  }}
                  options={RELIGION_OPTIONS}
                  placeholder="Select Religion"
                  disabled={Boolean(selectedResident && (selectedResident as any).religion)}
                />
                {religionSelection === "Others" && (
                  <div className="mt-3">
                    <FormInput
                      label="Specify Religion"
                      value={form.religion}
                      onChange={(event) => setValue("religion", event.target.value)}
                      disabled={Boolean(selectedResident && (selectedResident as any).religion)}
                      maxLength={50}
                    />
                  </div>
                )}
              </div>
            </FormRow>
          </SectionCard>

          <SectionCard
            step="C"
            title="Educational & Identity Details"
          >
            <div className="flex gap-4 items-start">
              <div className="flex-1">
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
              </div>
              <div className="flex-1">
                <FormSelect
                  label="Course"
                  value={courseSelection}
                  onChange={(event) => {
                    setCourseSelection(event.target.value);
                    if (event.target.value !== "Others") {
                      setValue("course", event.target.value);
                    } else {
                      setValue("course", "");
                    }
                  }}
                  options={COURSE_OPTIONS}
                  placeholder="Select Course"
                />
                {courseSelection === "Others" && (
                  <div className="mt-3">
                    <FormInput
                      label="Specify Course"
                      value={form.course}
                      onChange={(event) => setValue("course", event.target.value)}
                      placeholder="Course if applicable"
                      maxLength={COURSE_MAX_LENGTH}
                      showCounter
                      error={errors.course}
                    />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <FormInput
                  label="Institution"
                  value={form.institution}
                  onChange={(event) => setValue("institution", event.target.value)}
                  placeholder="School or training institution"
                  maxLength={INSTITUTION_MAX_LENGTH}
                  showCounter
                  error={errors.institution}
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 flex items-center justify-between relative mt-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasBarangayUgongId}
                  onChange={(e) => {
                    setHasBarangayUgongId(e.target.checked);
                    setValue("validIdType", e.target.checked ? "Barangay Ugong ID" : "");
                  }}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-semibold tracking-wide text-slate-700">Valid ID with Barangay Ugong address</span>
              </label>

              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  id="oathUpload"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(event) => setOathFile(event.target.files?.[0] ?? null)}
                  className="hidden"
                  disabled={!hasBarangayUgongId}
                />
                <label 
                  htmlFor="oathUpload" 
                  className={`flex items-center justify-center space-x-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    hasBarangayUgongId 
                      ? "border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer" 
                      : "border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed pointer-events-none"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>{oathFile ? oathFile.name : "Upload File"}</span>
                </label>
              </div>
              {errors.oathFiles ? (
                <p className="mt-1 text-xs text-red-500 w-full absolute left-0 -bottom-6">{errors.oathFiles}</p>
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
              placeholder="e.g., Requesting FTJS certificate for first job application requirement."
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