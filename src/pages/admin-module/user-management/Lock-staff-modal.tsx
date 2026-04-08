import { StatusUpdateModal } from "../../../reusable/StatusUpdateModal";
import {
  userManagementApi,
  type UserTable,
} from "../../../service/admin-module-api/user-management";

interface LockStaffModalProps {
  user: UserTable;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LockStaffModal({
  user,
  onClose,
  onSuccess,
}: LockStaffModalProps) {
  const isCurrentlyLocked = Boolean(user.isLocked);
  const willLock = !isCurrentlyLocked;
  const isStatusActive = String(user.status || "").toUpperCase() === "ACTIVE";

  const toLocalDateTime = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;
    return trimmed.length === 16 ? `${trimmed}:00` : trimmed;
  };

  return (
    <StatusUpdateModal
      isOpen
      onClose={onClose}
      title={willLock ? "Lock Staff Account" : "Unlock Staff Account"}
      mode={willLock ? "reason-and-lock-until" : "reason-only"}
      subjectName={`${user.firstName} ${user.lastName}`}
      subjectLabel="staff account"
      submitLabel={willLock ? "Lock" : "Unlock"}
      onSubmit={async ({ reason, lockUntil }) => {
        if (willLock) {
          if (!isStatusActive) {
            throw new Error("Only ACTIVE accounts can be locked.");
          }

          const fallbackLockUntil = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          )
            .toISOString()
            .slice(0, 19);

          await userManagementApi.lockAccount(user.id, {
            lockUntil: lockUntil
              ? toLocalDateTime(lockUntil)
              : fallbackLockUntil,
            reason,
          });
        } else {
          await userManagementApi.unlockAccount(user.id);
        }
        onSuccess?.();
      }}
    />
  );
}
