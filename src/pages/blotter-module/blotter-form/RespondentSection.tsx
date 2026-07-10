import {
  SectionCard,
  FormRow,
  FormInput,
  FormSelect,
  SectionDivider,
} from "../reusable/FormComponents";
import { PersonSearchInput } from "../reusable/PersonSearchInput";
import { type PersonSearchResponseDTO } from "../../../service/blotter-api/Resident";
import { GENDER_OPTIONS, CIVIL_STATUS_OPTIONS } from "./ComplaintSection";
import { XCircle } from "lucide-react";

export const RELATIONSHIP_OPTIONS = [
  { value: "Spouse / Partner", label: "Spouse / Partner" },
  { value: "Parent", label: "Parent" },
  { value: "Child", label: "Child" },
  { value: "Sibling", label: "Sibling" },
  { value: "Neighbor", label: "Neighbor" },
  { value: "Acquaintance", label: "Acquaintance" },
  { value: "Stranger / Unknown", label: "Stranger / Unknown" },
];

export interface RespondentState {
  email: string | number | readonly string[] | undefined;
  id?: number;
  lastName: string;
  firstName: string;
  middleName: string;
  contact: string;
  relationship: string;
  address: string;
  alias: string;
  age: string;
  dob?: string;
  gender: string;
  civilStatus: string;
  livingWith: "true" | "false" | "";
}

interface RespondentSectionProps {
  mode: "record" | "formal";
  data: RespondentState;
  onChange: (field: keyof RespondentState, value: any) => void;
  errors: Record<string, string>;
  clearErr: (key: string) => void;
  onClearPerson?: () => void;
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

export const RespondentSection = ({
  mode,
  data,
  onChange,
  errors,
  clearErr,
  onClearPerson,
}: RespondentSectionProps) => {
  const NAME_LIMIT = 50;
  const ADDRESS_LIMIT = 150;
  const ALIAS_LIMIT = 30;

  const handleSelectPerson = (person: PersonSearchResponseDTO) => {
    onChange("id", person.id);
    onChange("firstName", person.firstName.substring(0, NAME_LIMIT));
    onChange("lastName", person.lastName.substring(0, NAME_LIMIT));
    onChange("middleName", (person.middleName || "").substring(0, NAME_LIMIT));
    onChange("contact", person.contactNumber || "");
    onChange("age", person.age ? String(person.age) : "");
    onChange("dob", person.birthDate || undefined);
    onChange("gender", person.gender || "");
    onChange("civilStatus", person.civilStatus || "");
    onChange(
      "address",
      (person.completeAddress || "").substring(0, ADDRESS_LIMIT),
    );
    ["rLastName", "rFirstName"].forEach(clearErr);
  };
  // --- RECORD MODE VIEW ---
  if (mode === "record") {
    return (
      <SectionCard
        letter="C"
        title="Respondent Information"
        notice='Provide all available information. If the respondent is unidentified, enter "Unknown".'
        noticeTone="warning"
      >
        <PersonSearchInput
          label="Search Respondent (Auto-fill)"
          placeholder="Search by name..."
          onSelect={handleSelectPerson}
        />
        
        {!!data.id && (
          <div className="mb-3 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5">
            <p className="text-xs text-blue-700">
              ℹ️ Fields are locked — auto-filled from resident record.
            </p>
            <button
              type="button"
              onClick={onClearPerson}
              className="ml-4 rounded-md border border-blue-300 bg-white px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
            >
              Cancel Autofill
            </button>
          </div>
        )}
        <FormRow cols={3}>
          <div>
            <FormInput
              id="field-rLastName"
              label="Last Name"
              required
              placeholder='e.g. Santos (or "Unknown")'
              value={data.lastName}
              maxLength={NAME_LIMIT}
              disabled={!!data.id}
              className={!!data.id ? "bg-slate-100 cursor-not-allowed" : ""}
              onChange={(e) => {
                onChange("lastName", e.target.value);
                clearErr("rLastName");
              }}
              error={errors.rLastName}
            />
            <CharCounter current={data.lastName.length} max={NAME_LIMIT} />
          </div>
          <div>
            <FormInput
              id="field-rFirstName"
              label="First Name"
              required
              placeholder='e.g. Pedro (or "Unknown")'
              value={data.firstName}
              maxLength={NAME_LIMIT}
              disabled={!!data.id}
              className={!!data.id ? "bg-slate-100 cursor-not-allowed" : ""}
              onChange={(e) => {
                onChange("firstName", e.target.value);
                clearErr("rFirstName");
              }}
              error={errors.rFirstName}
            />
            <CharCounter current={data.firstName.length} max={NAME_LIMIT} />
          </div>
          <div>
            <FormInput
              label="Middle Name"
              placeholder="e.g. Reyes (if known)"
              value={data.middleName}
              maxLength={NAME_LIMIT}
              disabled={!!data.id}
              className={!!data.id ? "bg-slate-100 cursor-not-allowed" : ""}
              onChange={(e) => onChange("middleName", e.target.value)}
            />
            <CharCounter current={data.middleName.length} max={NAME_LIMIT} />
          </div>
        </FormRow>
        <FormRow cols={3}>
          <div>
            <FormInput
              label="Contact Number"
              placeholder="09XX XXX XXXX (if known)"
              inputMode="numeric"
              maxLength={11}
              value={data.contact}
              disabled={!!data.id}
              className={!!data.id ? "bg-slate-100 cursor-not-allowed" : ""}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "");
                onChange("contact", v);
                // Validation: must start with 09 and be 11 digits
                if (v.length > 0 && !v.startsWith("09")) {
                  errors.contact = "Must start with 09";
                } else if (v.length > 0 && v.length < 11) {
                  errors.contact = "Must be 11 digits";
                } else if (v.length === 11 && !/^09\d{9}$/.test(v)) {
                  errors.contact = "Invalid number format";
                } else {
                  errors.contact = "";
                }
              }}
              error={errors.contact}
            />
            <CharCounter current={data.contact.length} max={11} />
          </div>
          <FormSelect
            id="field-rRelationship"
            label="Relationship to Complainant"
            required
            options={RELATIONSHIP_OPTIONS}
            placeholder="Select Relationship"
            value={data.relationship}
            onChange={(e) => {
              onChange("relationship", e.target.value);
              clearErr("rRelationship");
            }}
            error={errors.rRelationship}
          />
          <div>
            <FormInput
              label="Address"
              placeholder="Address (if known)"
              value={data.address}
              maxLength={ADDRESS_LIMIT}
              disabled={!!data.id}
              className={!!data.id ? "bg-slate-100 cursor-not-allowed" : ""}
              onChange={(e) => onChange("address", e.target.value)}
            />
            <CharCounter current={data.address.length} max={ADDRESS_LIMIT} />
          </div>
        </FormRow>
      </SectionCard>
    );
  }

  // --- FORMAL MODE VIEW ---
  return (
    <SectionCard letter="C" title="Respondent Information">
      <PersonSearchInput
        label="Search Respondent (Auto-fill)"
        placeholder="Search by name..."
        onSelect={handleSelectPerson}
      />
      
      {!!data.id && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5">
          <p className="text-xs text-blue-700">
            ℹ️ Fields are locked — auto-filled from resident record.
          </p>
          <button
            type="button"
            onClick={onClearPerson}
            className="ml-4 rounded-md border border-blue-300 bg-white px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
          >
            Cancel Autofill
          </button>
        </div>
      )}

      <FormRow cols={3}>
        <div>
          <FormInput
            id="field-rLastName"
            label="Last Name"
            required
            placeholder="e.g. Santos"
            value={data.lastName}
            maxLength={NAME_LIMIT}
            disabled={!!data.id}
            className={!!data.id ? "bg-slate-100 cursor-not-allowed" : ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              onChange("lastName", e.target.value);
              clearErr("rLastName");
            }}
            error={errors.rLastName}
          />
          <CharCounter current={data.lastName.length} max={NAME_LIMIT} />
        </div>
        <div>
          <FormInput
            id="field-rFirstName"
            label="First Name"
            required
            placeholder="e.g. Pedro"
            value={data.firstName}
            maxLength={NAME_LIMIT}
            disabled={!!data.id}
            className={!!data.id ? "bg-slate-100 cursor-not-allowed" : ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              onChange("firstName", e.target.value);
              clearErr("rFirstName");
            }}
            error={errors.rFirstName}
          />
          <CharCounter current={data.firstName.length} max={NAME_LIMIT} />
        </div>
        <div>
          <FormInput
            label="Middle Name"
            placeholder="e.g. Reyes"
            value={data.middleName}
            maxLength={NAME_LIMIT}
            disabled={!!data.id}
            className={!!data.id ? "bg-slate-100 cursor-not-allowed" : ""}
            onChange={(e) => onChange("middleName", e.target.value)}
          />
          <CharCounter current={data.middleName.length} max={NAME_LIMIT} />
        </div>
      </FormRow>
      <FormRow cols={4}>
        <div>
          <FormInput
            label="Alias / Nickname"
            placeholder="If any"
            value={data.alias}
            maxLength={ALIAS_LIMIT}
            disabled={!!data.id}
            className={!!data.id ? "bg-slate-100 cursor-not-allowed" : ""}
            onChange={(e) => onChange("alias", e.target.value)}
          />
          <CharCounter current={data.alias.length} max={ALIAS_LIMIT} />
        </div>
        <div>
          <FormInput
            label="Age"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 40"
            maxLength={3}
            value={data.age}
            disabled={!!data.id}
            className={!!data.id ? "bg-slate-100 cursor-not-allowed" : ""}
            error={errors.rAge}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              // Allow numbers only, max 3 digits
              const v = e.target.value.replace(/\D/g, "").slice(0, 3);
              onChange("age", v);
              clearErr("rAge");
            }}/>
          <CharCounter current={data.age.length} max={3} />
        </div>
        <FormSelect
          label="Gender"
          options={GENDER_OPTIONS}
          placeholder="Select Gender"
          value={data.gender}
          disabled={!!data.id}
          className={!!data.id ? "bg-slate-100 cursor-not-allowed" : ""}
          onChange={(e) => onChange("gender", e.target.value)}
        />
        
        <div>
          <FormInput
            label="Contact Number"
            placeholder="09XX XXX XXXX (if known)"
            inputMode="numeric"
            maxLength={11}
            value={data.contact}
            disabled={!!data.id}
            className={!!data.id ? "bg-slate-100 cursor-not-allowed" : ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const v = e.target.value.replace(/\D/g, "");
              onChange("contact", v);
              clearErr("rContact");
              // Validation: must start with 09 and be 11 digits
              if (v.length > 0 && !v.startsWith("09")) {
                errors.contact = "Must start with 09";
              } else if (v.length > 0 && v.length < 11) {
                errors.contact = "Must be 11 digits";
              } else if (v.length === 11 && !/^09\d{9}$/.test(v)) {
                errors.contact = "Invalid number format";
              } else {
                errors.contact = "";
              }
            }}
            error={errors.contact}
          />
          <CharCounter current={data.contact.length} max={11} />

          
        </div>
        
      </FormRow>
      <div>
        <FormInput
          label="Complete Address"
          placeholder="House No., Street, Barangay, Municipality/City, Province"
          value={data.address}
          maxLength={ADDRESS_LIMIT}
          disabled={!!data.id}
          className={!!data.id ? "bg-slate-100 cursor-not-allowed" : ""}
          onChange={(e) => onChange("address", e.target.value)}
        />
        <CharCounter current={data.address.length} max={ADDRESS_LIMIT} />
      </div>
      <SectionDivider label="Relationship" />
      <FormRow cols={2}>
        <FormSelect
          id="field-rRelationship"
          label="Relationship to Complainant"
          required
          options={RELATIONSHIP_OPTIONS}
          placeholder="Select Relationship"
          value={data.relationship}
          onChange={(e) => {
            onChange("relationship", e.target.value);
            clearErr("rRelationship");
          }}
          error={errors.rRelationship}
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Currently Living with Complainant?
          </label>
          <div className="flex items-center gap-5 mt-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="livingWith"
                value="true"
                checked={data.livingWith === "true"}
                onChange={() => onChange("livingWith", "true")}
                className="accent-blue-600"
              />
              Yes
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="livingWith"
                value="false"
                checked={data.livingWith === "false"}
                onChange={() => onChange("livingWith", "false")}
                className="accent-blue-600"
              />
              No
            </label>
          </div>
        </div>
      </FormRow>
    </SectionCard>
  );
};
