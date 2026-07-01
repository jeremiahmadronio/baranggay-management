import {
  SectionCard,
  DocketInfoCard,
  FormRow,
  FormSelect,
} from "../reusable/FormComponents";
import { useUser } from "../../../context/UserContext";
import type { OfficerOptionDTO } from "../../../service/blotter-api/blotter-api";
interface DocketSectionProps {
  mode: "record" | "formal";
  blotterNumber: string;
  officerOptions: OfficerOptionDTO[];
  assignedOfficerId: string;
  onAssignedOfficerChange: (value: string) => void;
  errors: Record<string, string>;
  clearErr: (key: string) => void;
}
export const DocketSection = ({
  mode,
  blotterNumber,
  officerOptions,
  assignedOfficerId,
  onAssignedOfficerChange,
  errors,
  clearErr,
}: DocketSectionProps) => {
  const { user } = useUser();
  const getOfficerName = () => {
    if (user) {
      const first = (user.firstName || "").trim();
      const last = (user.lastName || "").trim();
      if (first || last) {
        return `${first} ${last}`.trim();
      }
      if (user.username) return user.username;
    }
    const storedFirstName = localStorage.getItem("firstName");
    const storedLastName = localStorage.getItem("lastName");
    const storedUsername = localStorage.getItem("username");
    const storedEmail = localStorage.getItem("userEmail");
    if (storedFirstName && storedLastName)
      return `${storedFirstName} ${storedLastName}`.trim();
    if (storedFirstName) return storedFirstName.trim();
    if (storedUsername) return storedUsername.trim();
    if (storedEmail) return storedEmail.split("@")[0];
    return "Unknown Officer";
  };
  const capitalize = (s: string) => {
    if (!s) return "";
    return s.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  };
  const officerName = capitalize(getOfficerName());
  const today = new Date();
  const formattedDate = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;
  const formattedTime = today
    .toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();
  return (
    <SectionCard
      letter="A"
      title={mode === "record" ? "Docket Information" : "Case Information"}
    >
      <DocketInfoCard
        fields={[
          {
            label:
              mode === "record" ? "Blotter Number" : "Case / Blotter Number",
            value: blotterNumber,
            hint: "(auto-generated)",
          },
          {
            label: mode === "record" ? "Date Reported" : "Date Filed",
            value: formattedDate,
            hint: "(today)",
          },
          {
            label: mode === "record" ? "Time Reported" : "Time Filed",
            value: formattedTime,
            hint: "(now)",
          },
          {
            label:
              mode === "record" ? "Reporting Officer" : "Receiving Officer",
            value: officerName,
            hint: "(logged in)",
          },
        ]}
      />

      {mode !== "record" && (
        <FormRow cols={2}>
          <FormSelect
            id="field-assignedOfficerId"
            label="Assigned Officer"
            options={officerOptions.map((officer) => ({
              value: String(officer.id),
              label:
                `${officer.name} ${officer.position ? `(${officer.position})` : ""}`.trim(),
            }))}
            placeholder="Select Officer"
            value={assignedOfficerId}
            onChange={(e) => {
              onAssignedOfficerChange(e.target.value);
              clearErr("assignedOfficerId");
            }}
            error={errors.assignedOfficerId}
            required
          />
        </FormRow>
      )}
    </SectionCard>
  );
};
