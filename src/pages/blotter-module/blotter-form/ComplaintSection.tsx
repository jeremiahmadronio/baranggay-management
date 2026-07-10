import {
  SectionCard,
  FormRow,
  FormInput,
  FormSelect,
} from "../reusable/FormComponents";
import { PersonSearchInput } from "../reusable/PersonSearchInput";
import { type PersonSearchResponseDTO } from "../../../service/blotter-api/Resident";
import { XCircle } from "lucide-react";

export const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Prefer not to say" },
];

export const CIVIL_STATUS_OPTIONS = [
  { value: "Single", label: "Single" },
  { value: "Married", label: "Married" },
  { value: "Widowed", label: "Widowed" },
  { value: "Separated", label: "Separated" },
];

export interface ComplainantState {
  id?: number;
  lastName: string;
  firstName: string;
  middleName: string;
  contact: string;
  age: string;
  gender: string;
  civilStatus: string;
  email: string;
  address: string;
}

interface ComplainantSectionProps {
  data: ComplainantState;
  onChange: (field: keyof ComplainantState, value: any) => void;
  errors: Record<string, string>;
  clearErr: (key: string) => void;
  onClearPerson?: () => void;
  onCheckDuplicate?: (person: PersonSearchResponseDTO) => boolean;
}

const CharCounter = ({ current, max }: { current: number; max: number }) => (
  <div className="flex justify-end pr-1">
    <span
      className={`text-[10px] ${current >= max ? "text-red-500 font-bold" : "text-slate-400"}`}
    >
      {current}/{max}
    </span>
  </div>
);

export const ComplainantSection = ({
  data,
  onChange,
  errors,
  clearErr,
  onClearPerson,
  onCheckDuplicate,
}: ComplainantSectionProps) => {
  const NAME_LIMIT = 50;
  const ADDRESS_LIMIT = 200;

  const handleSelectPerson = (person: PersonSearchResponseDTO) => {
    if (onCheckDuplicate && onCheckDuplicate(person)) return;
    onChange("id", person.id);
    onChange("firstName", person.firstName.substring(0, NAME_LIMIT));
    onChange("lastName", person.lastName.substring(0, NAME_LIMIT));
    onChange("middleName", (person.middleName || "").substring(0, NAME_LIMIT));
    onChange("contact", person.contactNumber || "");
    onChange("age", person.age ? String(person.age) : "");
    onChange("gender", person.gender || "");
    onChange("civilStatus", person.civilStatus || "");
    onChange("email", person.email || "");
    onChange(
      "address",
      (person.completeAddress || "").substring(0, ADDRESS_LIMIT),
    );
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

  return (
    <SectionCard letter="B" title="Complainant Information">
      <PersonSearchInput
        label="Search Complainant (Auto-fill)"
        placeholder="Search by name..."
        onSelect={handleSelectPerson}
      />
      
      {!!data.id && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <span>
            Existing resident record selected: <span className="font-semibold">{data.firstName} {data.lastName}</span>
          </span>
          <button
            type="button"
            onClick={onClearPerson}
            className="text-emerald-700 hover:text-emerald-900 hover:underline font-medium text-xs flex items-center gap-1 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Clear Selection
          </button>
        </div>
      )}

      <FormRow cols={3}>
        <div>
          <FormInput
            id="field-cLastName"
            label="Last Name"
            required
            placeholder="e.g. Dela Cruz"
            value={data.lastName}
            maxLength={NAME_LIMIT}
            disabled={!!data.id}
            className={!!data.id ? "bg-slate-100 cursor-not-allowed" : ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              onChange("lastName", e.target.value);
              clearErr("cLastName");
            }}
            error={errors.cLastName}
          />
          <CharCounter current={data.lastName.length} max={NAME_LIMIT} />
        </div>

        <div>
          <FormInput
            id="field-cFirstName"
            label="First Name"
            required
            placeholder="e.g. Juan"
            value={data.firstName}
            maxLength={NAME_LIMIT}
            disabled={!!data.id}
            className={!!data.id ? "bg-slate-100 cursor-not-allowed" : ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              onChange("firstName", e.target.value);
              clearErr("cFirstName");
            }}
            error={errors.cFirstName}
          />
          <CharCounter current={data.firstName.length} max={NAME_LIMIT} />
        </div>

        <div>
          <FormInput
            label="Middle Name"
            placeholder="e.g. Santos"
            value={data.middleName}
            maxLength={NAME_LIMIT}
            disabled={!!data.id}
            className={!!data.id ? "bg-slate-100 cursor-not-allowed" : ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange("middleName", e.target.value)
            }
          />
          <CharCounter current={data.middleName.length} max={NAME_LIMIT} />
        </div>
      </FormRow>

      <FormRow cols={3}>
        <FormInput
          id="field-cContact"
          label="Contact Number"
          placeholder="09XX XXX XXXX"
          inputMode="numeric"
          maxLength={11}
          value={data.contact}
          disabled={!!data.id}
          className={!!data.id ? "bg-slate-100 cursor-not-allowed" : ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const v = e.target.value.replace(/\D/g, "");
            onChange("contact", v);
            clearErr("cContact");
          }}
          error={errors.cContact}
        />
        <div>
          <FormInput
            id="field-cAge"
            label="Age"
            type="text"
            inputMode="numeric"
            required
            placeholder="e.g. 35"
            maxLength={3}
            value={data.age}
            disabled={!!data.id}
            className={!!data.id ? "bg-slate-100 cursor-not-allowed" : ""}
            error={errors.cAge}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              // Allow numbers only, max 3 digits
              const v = e.target.value.replace(/\D/g, "").slice(0, 3);
              onChange("age", v);
              clearErr("cAge");
            }}
          />
          <CharCounter current={data.age.length} max={3} />
        </div>
        <FormSelect
          id="field-cGender"
          label="Gender"
          required
          options={GENDER_OPTIONS}
          placeholder="Select Gender"
          value={data.gender}
          disabled={!!data.id}
          className={!!data.id ? "bg-slate-100 cursor-not-allowed" : ""}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            onChange("gender", e.target.value);
            clearErr("cGender");
          }}
          error={errors.cGender}
        />
      </FormRow>

      <FormRow cols={2}>
        <FormSelect
          id="field-cCivilStatus"
          label="Civil Status"
          required
          options={CIVIL_STATUS_OPTIONS}
          placeholder="Select Civil Status"
          value={data.civilStatus}
          disabled={!!data.id}
          className={!!data.id ? "bg-slate-100 cursor-not-allowed" : ""}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            onChange("civilStatus", e.target.value);
            clearErr("cCivilStatus");
          }}
          error={errors.cCivilStatus}
        />
        <div>
          <FormInput
            label="Email Address"
            type="email"
            placeholder="email@example.com"
            maxLength={50}
            value={data.email}
            disabled={!!data.id}
            className={!!data.id ? "bg-slate-100 cursor-not-allowed" : ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const v = e.target.value;
              onChange("email", v);
              // Real-time validation: must contain '@'
              if (v && !v.includes("@")) {
                errors.email = "Email must contain '@'";
              } else {
                errors.email = "";
              }
            }}
            error={errors.email}
          />
          <CharCounter current={data.email.length} max={50} />
        </div>
      </FormRow>

      <div>
        <FormInput
          id="field-cAddress"
          label="Complete Address"
          required
          placeholder="House No., Street, Barangay, Municipality/City"
          value={data.address}
          maxLength={ADDRESS_LIMIT}
          disabled={!!data.id}
          className={!!data.id ? "bg-slate-100 cursor-not-allowed" : ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            onChange("address", e.target.value);
            clearErr("cAddress");
          }}
          error={errors.cAddress}
        />
        <CharCounter current={data.address.length} max={ADDRESS_LIMIT} />
      </div>
    </SectionCard>
  );
};
