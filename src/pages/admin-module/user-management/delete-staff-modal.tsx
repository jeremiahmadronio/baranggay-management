import { StatusUpdateModal } from "../../../reusable/StatusUpdateModal";
import {
  userManagementApi,
  type UserTable,
} from "../../../service/admin-module-api/user-management";

interface DeleteStaffModalProps {
  user: UserTable;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteStaffModal({
  user,
  onClose,
  onSuccess,
}: DeleteStaffModalProps) {
  return (
    <StatusUpdateModal
      isOpen
      onClose={onClose}
      title="Archive Staff Account"
      mode="reason-only"
      subjectName={`${user.firstName} ${user.lastName}`}
      subjectLabel="staff account"
      submitLabel="Archive"
      onSubmit={async ({ reason }) => {
        await userManagementApi.updateStatus(user.id, {
          newStatus: "ARCHIVED",
          remarks: reason,
        });
        onSuccess?.();
      }}
    />
  );
}
