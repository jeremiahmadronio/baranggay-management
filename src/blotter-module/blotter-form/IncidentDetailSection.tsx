import {
  SectionCard,
  FormRow,
  FormSelect,
  FormDatePicker,
  FormTimePicker,
  FormInput,
} from "../reusable/FormComponents";
import { type NatureOptionDTO } from "../../blotter-api/BlotterFormComplaint";
export const FREQUENCY_OPTIONS = [
  {
    value: "First Time",
    label: "First Time",
  },
  {
    value: "Second Time",
    label: "Second Time",
  },
  {
    value: "Third Time",
    label: "Third Time",
  },
  {
    value: "Recurring",
    label: "Recurring / Multiple Times",
  },
];
export interface IncidentState {
  natureId: string;
  dateOfIncident: string;
  timeOfIncident: string;
  placeOfIncident: string;
  frequency: string;
  injuryDesc: string;
}
import type { IncidentOptionDTO } from "../../blotter-api/DocketView";
interface IncidentDetailsSectionProps {
  mode: "record" | "formal";
  data: IncidentState;
  onChange: (field: keyof IncidentState, value: any) => void;
  errors: Record<string, string>;
  clearErr: (key: string) => void;
  natureOptions: NatureOptionDTO[];
  frequencyOptions: IncidentOptionDTO[];
  optionsLoading: boolean;
}
export const IncidentDetailsSection = ({
  mode,
  data,
  onChange,
  errors,
  clearErr,
  natureOptions,
  frequencyOptions,
  optionsLoading,
}: IncidentDetailsSectionProps) => {
  const natureSelectOptions = natureOptions.map((n) => ({
    value: String(n.id),
    label: n.natureName,
  }));
  return (
    <SectionCard letter="D" title="Incident Details">
      <FormRow cols={3}>
        <FormSelect
          id="field-natureId"
          label="Nature of Complaint"
          required
          options={natureSelectOptions}
          placeholder={
            optionsLoading ? "Loading..." : "Select Nature of Complaint"
          }
          value={data.natureId}
          onChange={(e) => {
            onChange("natureId", e.target.value);
            clearErr("natureId");
          }}
          disabled={optionsLoading}
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
            options={frequencyOptions.map((opt) => ({
              value: opt.label,
              label: opt.label,
            }))}
            placeholder={optionsLoading ? "Loading..." : "Select Frequency"}
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
