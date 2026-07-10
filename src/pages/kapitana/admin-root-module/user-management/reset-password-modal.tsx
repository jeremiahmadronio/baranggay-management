import { useState } from "react";
import {
  FormFieldError,
  FormFieldLabel,
  FormModalShell,
} from "../../../../reusable/FormModalShell";
import {
  userManagementApi,
  type UserTable,
} from "../../../../service/admin-root-api/user-management";

interface ResetPasswordModalProps {
  user: UserTable;
  onClose: () => void;
  onSuccess?: () => void;
}

const REASON_LIMIT = 1000;

export function ResetPasswordModal({
  user,
  onClose,
  onSuccess,
}: ResetPasswordModalProps) {
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedReason = reason.trim();
    setSubmitError("");

    if (!trimmedReason) {
      setReasonError("Please provide a reason.");
      return;
    }

    try {
      setSubmitting(true);
      await userManagementApi.resetPassword(user.id, {
        reason: trimmedReason,
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to reset password.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModalShell
      isOpen
      onClose={onClose}
      title="Reset Password"
      maxWidthClass="max-w-xl"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button autoFocus
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? "Resetting..." : "Reset Password"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <p className="text-sm text-gray-600">
          You are about to reset password for{" "}
          <span className="font-semibold text-gray-900">{`${user.firstName} ${user.lastName}`}</span>
          .
        </p>

        <div>
          <FormFieldLabel label="Reason" required />
          <textarea
            value={reason}
            onChange={(e) => {
              const cleanedValue = e.target.value.replace(/[^a-zA-Z0-9ñÑ\s.,\-'()"\n]/g, "");
              if (cleanedValue.length <= REASON_LIMIT) {
                setReason(cleanedValue);
              }
              setReasonError("");
            }}
            placeholder="Provide a reason for resetting this account password..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <div className="flex items-start justify-between mt-1">
            <FormFieldError msg={reasonError} />
            <p className="text-xs text-gray-400 ml-auto shrink-0">
              {reason.length} / {REASON_LIMIT}
            </p>
          </div>
        </div>

        <FormFieldError msg={submitError} />
      </div>
    </FormModalShell>
  );
}
