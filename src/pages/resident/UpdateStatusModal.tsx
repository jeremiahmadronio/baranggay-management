import { StatusUpdateModal } from "../../reusable/StatusUpdateModal";
interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  residentName: string;
  currentStatus?: string;
  onSubmit: (status: string, reason: string, reasonDetail?: string) => void;
}
const REASONS = [
  {
    value: "RELOCATION",
    label: "Relocated",
  },
  {
    value: "DEATH_REPORT",
    label: "Reported Deceased",
  },
  {
    value: "ADMIN_CORRECTION",
    label: "Administrative Correction",
  },
  {
    value: "REQUESTED_CHANGE",
    label: "Requested by Resident/Family",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];
export function UpdateStatusModal({
  isOpen,
  onClose,
  residentName,
  currentStatus,
  onSubmit,
}: UpdateStatusModalProps) {
  return (
    <StatusUpdateModal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Resident Status"
      mode="status-and-reason"
      subjectName={residentName}
      subjectLabel="resident"
      initialStatus={currentStatus || "ACTIVE"}
      reasonOptions={REASONS}
      submitLabel="Update Status"
      onSubmit={({ status, reason }) => {
        onSubmit(status || "ACTIVE", reason, undefined);
      }}
    />
  );
}
