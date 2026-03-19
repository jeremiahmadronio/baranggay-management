import {
  SectionCard,
  FormRow,
  FormInput,
  FormSelect,
} from "../reusable/FormComponents";
import { PersonSearchInput } from "../reusable/PersonSearchInput";
import { type PersonSearchResponseDTO } from "../../blotter-api/resident";

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
}

export const ComplainantSection = ({
  data,
  onChange,
  errors,
  clearErr,
}: ComplainantSectionProps) => {
  const handleSelectPerson = (person: PersonSearchResponseDTO) => {
    onChange("id", person.id);
    onChange("firstName", person.firstName);
    onChange("lastName", person.lastName);
    onChange("middleName", person.middleName || "");
    onChange("contact", person.contactNumber || "");
    onChange("age", person.age ? String(person.age) : "");
    onChange("gender", person.gender || "");
    onChange("civilStatus", person.civilStatus || "");
    onChange("email", person.email || "");
    onChange("address", person.completeAddress || "");
    ["cLastName", "cFirstName", "cContact", "cAddress"].forEach(clearErr);
  };

  // Helper Function: Pinapayagan lang ang Letters, Spaces, Hyphen (-), at Period (.)
  const handleNameChange = (
    field: keyof ComplainantState,
    value: string,
    errorKey: string
  ) => {
    const validNameRegex = /^[A-Za-z\s.-]*$/;
    if (validNameRegex.test(value)) {
      onChange(field, value);
      if (errorKey) clearErr(errorKey);
    }
  };

  return (
    <SectionCard letter="B" title="Complainant Information">
      <PersonSearchInput
        label="Search Complainant (Auto-fill)"
        placeholder="Search by name..."
        onSelect={handleSelectPerson}
      />

      <FormRow cols={3}>
        <FormInput
          id="field-cLastName"
          label="Last Name"
          required
          placeholder="e.g. Dela Cruz"
          maxLength={20}
          value={data.lastName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleNameChange("lastName", e.target.value, "cLastName")
          }
          error={errors.cLastName}
        />
        <FormInput
          id="field-cFirstName"
          label="First Name"
          required
          placeholder="e.g. Juan"
          maxLength={20}
          value={data.firstName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleNameChange("firstName", e.target.value, "cFirstName")
          }
          error={errors.cFirstName}
        />
        <FormInput
          label="Middle Name"
          placeholder="e.g. Santos"
          maxLength={20}
          value={data.middleName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleNameChange("middleName", e.target.value, "")
          }
        />
      </FormRow>
      <FormRow cols={3}>
        <FormInput
          id="field-cContact"
          label="Contact Number"
          required
          placeholder="09XX XXX XXXX"
          inputMode="numeric"
          maxLength={11}
          value={data.contact}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            // Pinapayagan lang ang numbers
            const v = e.target.value.replace(/\D/g, "");
            onChange("contact", v);
            
            // Real-time validation para sa 09 start and 11 digits
            if (v.length > 0 && !v.startsWith("09")) {
              errors.cContact = "Must start with 09";
            } else if (v.length > 0 && v.length < 11) {
              errors.cContact = "Must be 11 digits";
            } else {
              clearErr("cContact");
            }
          }}
          error={errors.cContact}
        />
        <FormInput
          label="Age"
          type="text" // Gamitin ang text tapos numeric regex para walang up/down arrows
          inputMode="numeric"
          placeholder="e.g. 35"
          maxLength={3}
          value={data.age}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            // Allow numbers only, max age 150
            const v = e.target.value.replace(/\D/g, "");
            if (v === "" || parseInt(v) <= 150) {
              onChange("age", v);
            }
          }}
        />
        <FormSelect
          label="Gender"
          options={GENDER_OPTIONS}
          placeholder="Select Gender"
          value={data.gender}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            onChange("gender", e.target.value)
          }
        />
      </FormRow>
      <FormRow cols={2}>
        <FormSelect
          label="Civil Status"
          options={CIVIL_STATUS_OPTIONS}
          placeholder="Select Civil Status"
          value={data.civilStatus}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            onChange("civilStatus", e.target.value)
          }
        />
        <FormInput
          label="Email Address"
          type="email"
          placeholder="email@example.com"
          maxLength={50}
          value={data.email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange("email", e.target.value)
          }
        />
      </FormRow>
      <FormInput
        id="field-cAddress"
        label="Complete Address"
        required
        placeholder="House No., Street, Barangay, Municipality/City"
        maxLength={150}
        value={data.address}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          onChange("address", e.target.value);
          clearErr("cAddress");
        }}
        error={errors.cAddress}
      />
    </SectionCard>
  );
};