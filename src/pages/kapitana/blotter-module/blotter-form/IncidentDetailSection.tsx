import {
  SectionCard,
  FormRow,
  FormSelect,
  FormDatePicker,
  FormTimePicker,
  FormInput,
} from "../reusable/FormComponents";

const NATURE_OPTIONS = [
  "Physical Injury",
  "Slander / Oral Defamation",
  "Theft",
  "Threats",
  "Trespassing",
  "Grave Coercion",
  "Debt / Financial Dispute",
  "Unjust Vexation",
  "Boundary / Land Dispute",
  "Family / Relational Dispute",
  "Noise Nuisance (Videoke, Loud Music)",
  "Animal Nuisance (Stray/Noise/Waste)",
  "Public Disturbance / Scandal",
  "Illegal Parking / Obstruction",
  "Violation of Barangay Ordinance",
  "Others (Specify in Narrative)",
].map((v) => ({ value: v, label: v }));

const FREQUENCY_OPTIONS = [
  "First Time",
  "Second Time",
  "Habitual / Third Time+",
].map((v) => ({ value: v, label: v }));

export interface IncidentState {
  natureId: string;
  dateOfIncident: string;
  timeOfIncident: string;
  placeOfIncident: string;
  frequency: string;
  injuryDesc: string;
}

interface IncidentDetailsSectionProps {
  mode: "record" | "formal";
  data: IncidentState;
  onChange: (field: keyof IncidentState, value: any) => void;
  errors: Record<string, string>;
  clearErr: (key: string) => void;
}

export const IncidentDetailsSection = ({
  mode,
  data,
  onChange,
  errors,
  clearErr,
}: IncidentDetailsSectionProps) => {
  return (
    <SectionCard letter="D" title="Incident Details">
      <FormRow cols={3}>
        <FormSelect
          id="field-natureId"
          label="Nature of Complaint"
          required
          options={NATURE_OPTIONS}
          placeholder="Select Nature of Complaint"
          value={data.natureId}
          onChange={(e) => {
            onChange("natureId", e.target.value);
            clearErr("natureId");
          }}
          error={errors.natureId}
        />
        <FormDatePicker
          id="field-dateOfIncident"
          label="Date of Incident"
          required
          value={data.dateOfIncident}
          onChange={(e) => {
            onChange("dateOfIncident", e.target.value);
            clearErr("dateOfIncident");
          }}
          error={errors.dateOfIncident}
        />
        <FormTimePicker
          label="Time of Incident"
          value={data.timeOfIncident}
          onChange={(e) => onChange("timeOfIncident", e.target.value)}
        />
      </FormRow>
      {mode === "formal" ? (
        <FormRow cols={3}>
          <FormInput
            id="field-placeOfIncident"
            label="Place / Location of Incident"
            required
            placeholder="e.g. Residence, Public Market"
            value={data.placeOfIncident}
            onChange={(e) => {
              onChange("placeOfIncident", e.target.value);
              clearErr("placeOfIncident");
            }}
            error={errors.placeOfIncident}
          />
          <FormSelect
            id="field-frequency"
            label="Frequency of Incident"
            required
            options={FREQUENCY_OPTIONS}
            placeholder="Select Frequency"
            value={data.frequency}
            onChange={(e) => {
              onChange("frequency", e.target.value);
              clearErr("frequency");
            }}
            error={errors.frequency}
          />
          <FormInput
            label="Description of Injuries / Damages"
            placeholder="If any physical injuries or property damage"
            value={data.injuryDesc}
            onChange={(e) => onChange("injuryDesc", e.target.value)}
          />
        </FormRow>
      ) : (
        <FormInput
          id="field-placeOfIncident"
          label="Place / Location of Incident"
          required
          placeholder="e.g. Near the basketball court, Purok 3"
          value={data.placeOfIncident}
          onChange={(e) => {
            onChange("placeOfIncident", e.target.value);
            clearErr("placeOfIncident");
          }}
          error={errors.placeOfIncident}
        />
      )}
    </SectionCard>
  );
};
