import { StatusUpdateModal } from "../../../reusable/StatusUpdateModal";
import {
  userManagementApi,
  type UserTable,
} from "../../../service/admin-root-api/user-management";

interface RestoreStaffModalProps {
  user: UserTable;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RestoreStaffModal({
  user,
  onClose,
  onSuccess,
}: RestoreStaffModalProps) {
  return (
    <StatusUpdateModal
      isOpen
      onClose={onClose}
      title="Restore Staff Account"
      mode="reason-only"
      subjectName={`${user.firstName} ${user.lastName}`}
      subjectLabel="staff account"
      submitLabel="Restore"
      onSubmit={async ({ reason }) => {
        await userManagementApi.updateStatus(user.id, {
          newStatus: "ACTIVE",
          remarks: reason,
        });
        onSuccess?.();
      }}
    />
  );
}
