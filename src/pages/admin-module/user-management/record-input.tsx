import { useState } from "react";

import {
  FormInput,
  FormSelect,
  FormDatePicker,
  FormTimePicker,
  FormTextarea,
  SectionCard,
  FormRow,
  RadioCard,
  DocketInfoCard,
  FormActions,
  SectionDivider,
} from "../../../reusable/Records-Input";
import { NoticeBanner } from "../../../reusable/Notification";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Prefer not to say" },
];

const CIVIL_STATUS_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "widowed", label: "Widowed" },
  { value: "separated", label: "Separated" },
];

const RELATIONSHIP_OPTIONS = [
  { value: "spouse", label: "Spouse / Partner" },
  { value: "parent", label: "Parent" },
  { value: "child", label: "Child" },
  { value: "sibling", label: "Sibling" },
  { value: "neighbor", label: "Neighbor" },
  { value: "acquaintance", label: "Acquaintance" },
  { value: "stranger", label: "Stranger / Unknown" },
];

const NATURE_OPTIONS = [
  { value: "physical", label: "Physical Assault" },
  { value: "verbal", label: "Verbal Abuse" },
  { value: "theft", label: "Theft / Robbery" },
  { value: "vawc", label: "VAWC" },
  { value: "trespassing", label: "Trespassing" },
  { value: "other", label: "Other" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const ACTION_OPTIONS = [
  { value: "mediation", label: "Mediation / Settlement" },
  { value: "referral", label: "Referral to Higher Authority" },
  { value: "blotter", label: "Blotter Entry Only" },
  { value: "restraining", label: "Restraining Order Issued" },
];

const OFFICER_OPTIONS = [
  { value: "cruz", label: "Off. Maria Cruz" },
  { value: "santos", label: "Off. Juan Santos" },
  { value: "reyes", label: "Off. Ana Reyes" },
];

const MOCK_DOCKET = [
  { label: "Docket Number", value: "2026-BLT-0016", hint: "(auto-generated)" },
  { label: "Date Reported", value: "02/19/2026", hint: "(today)" },
  { label: "Filing Officer", value: "Off. Maria Cruz", hint: "(logged in)" },
];

export default function NewBlotterEntryPage() {
  const [complaintType, setComplaintType] = useState<"formal" | "record">(
    "formal",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      alert("Entry recorded!");
    }, 1500);
  };

  return (
    <div className="min-h-screen ">
      <div className="px-3 sm:px-6 pt-4 sm:pt-5 pb-8 flex flex-col gap-4 sm:gap-5 max-w-6xl ml-4 mr-4">
        {/*notifacation banner*/}
        <NoticeBanner
          title="Privacy Notice:"
          message={
            <>
              In compliance with RA 9262 (Anti-VAWC Act) and the Data Privacy
              Act of 2012, all records display victim initials only. Full
              details are accessible only to authorized personnel.
            </>
          }
          variant="warning"
          dismissible={false}
        />

        {/* Complaint Type — RadioCard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <RadioCard
            name="complaint_type"
            value="formal"
            checked={complaintType === "formal"}
            onChange={() => setComplaintType("formal")}
            title="Formal Complaint"
            description="May Paanyaya at Salaysay – Ipapasa sa Lupon"
          />
          <RadioCard
            name="complaint_type"
            value="record"
            checked={complaintType === "record"}
            onChange={() => setComplaintType("record")}
            title="For the Record Only"
            description="Para sa record lang – Walang formal na aksyon"
          />
        </div>

        {/* A — Docket Info */}
        <SectionCard letter="A" title="Docket Information">
          <DocketInfoCard fields={MOCK_DOCKET} />
        </SectionCard>

        {/* B — Complainant Details */}
        <SectionCard letter="B" title="Complainant Details">
          <FormRow cols={3}>
            <FormInput label="Last Name" required placeholder="Dela Cruz" />
            <FormInput label="First Name" required placeholder="Maria" />
            <FormInput label="Middle Name" placeholder="Santos" />
          </FormRow>
          <FormRow cols={2}>
            <FormInput label="Suffix (Jr./Sr./III)" placeholder="Jr." />
            <FormInput label="Alias / Nickname" placeholder="(optional)" />
          </FormRow>
          <FormRow cols={4}>
            <FormInput label="Age" required type="number" placeholder="35" />
            <FormDatePicker label="Date of Birth" />
            <FormSelect label="Gender" required options={GENDER_OPTIONS} />
            <FormSelect
              label="Civil Status"
              required
              options={CIVIL_STATUS_OPTIONS}
            />
          </FormRow>
          <FormRow cols={2}>
            <FormInput
              label="Contact Number"
              required
              placeholder="09XXXXXXXXX"
            />
            <FormInput label="Occupation" placeholder="(optional)" />
          </FormRow>
          <SectionDivider label="Complete Address" />
          <FormInput
            label="House No. & Street"
            required
            placeholder="123 Rizal St."
          />
          <FormRow cols={3}>
            <FormInput label="Purok / Zone" placeholder="Purok 3" />
            <FormInput label="Barangay" defaultValue="Barangay 6" />
            <FormInput label="Municipality" defaultValue="Manila" />
          </FormRow>
        </SectionCard>

        {/* C — Respondent Details */}
        <SectionCard
          letter="C"
          title="Respondent Details"
          notice="Punan ang available na impormasyon. Kung hindi kilala ang respondent, ilagay ang 'Unknown'."
        >
          <FormRow cols={3}>
            <FormInput label="Last Name" placeholder="Unknown" />
            <FormInput label="First Name" placeholder="Unknown" />
            <FormInput label="Middle Name" />
          </FormRow>
          <FormRow cols={2}>
            <FormInput label="Suffix" />
            <FormInput label="Alias / Nickname" />
          </FormRow>
          <FormRow cols={4}>
            <FormInput label="Age (approx)" type="number" placeholder="~30" />
            <FormDatePicker label="Date of Birth" />
            <FormSelect label="Gender" options={GENDER_OPTIONS} />
            <FormSelect label="Civil Status" options={CIVIL_STATUS_OPTIONS} />
          </FormRow>
          <FormRow cols={2}>
            <FormInput label="Contact Number" placeholder="(if known)" />
            <FormInput label="Occupation" placeholder="(if known)" />
          </FormRow>
          <SectionDivider label="Address & Relationship" />
          <FormInput label="House No. & Street" />
          <FormRow cols={3}>
            <FormInput label="Purok / Zone" />
            <FormInput label="Barangay" />
            <FormInput label="Municipality" />
          </FormRow>
          <FormSelect
            label="Relationship to Complainant"
            required
            options={RELATIONSHIP_OPTIONS}
          />
        </SectionCard>

        {/* D — Incident Details */}
        <SectionCard letter="D" title="Incident Details">
          <FormRow cols={3}>
            <FormSelect
              label="Nature of Complaint"
              required
              options={NATURE_OPTIONS}
            />
            <FormDatePicker label="Date of Incident" required />
            <FormTimePicker label="Time of Incident" required />
          </FormRow>
          <FormInput
            label="Location / Place of Incident"
            required
            placeholder="Ex: Sa harap ng 123 Rizal St., Purok 3"
          />
          <FormTextarea
            label="Narrative / Statement of Facts"
            required
            placeholder="Ilagay ang buong salaysay ng pangyayari..."
            rows={5}
          />
        </SectionCard>

        {/* E — Action Taken */}
        <SectionCard letter="E" title="Action Taken / Aksyon Ginawa">
          <FormRow cols={2}>
            <FormSelect
              label="Assigned Officer"
              required
              options={OFFICER_OPTIONS}
              defaultValue="cruz"
            />
            <FormSelect
              label="Priority Level"
              options={PRIORITY_OPTIONS}
              defaultValue="normal"
            />
          </FormRow>
          <FormSelect
            label="Initial Action Taken"
            required
            options={ACTION_OPTIONS}
          />
          <FormTextarea
            label="Remarks / Karagdagang Puna"
            placeholder="(optional)"
            rows={3}
          />
          <FormRow cols={2}>
            <FormDatePicker label="Hearing Date (optional)" />
            <FormTimePicker label="Hearing Time (optional)" />
          </FormRow>
        </SectionCard>

        {/* Form Actions */}
        <FormActions
          onCancel={() => alert("Cancelled")}
          onSaveDraft={() => alert("Saved as draft!")}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
