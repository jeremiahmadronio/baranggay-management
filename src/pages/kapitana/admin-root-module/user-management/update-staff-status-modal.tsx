import { useEffect, useMemo, useState } from "react";
import {
  FormFieldError,
  FormFieldLabel,
  FormModalShell,
} from "../../../../reusable/FormModalShell";
import { ActionModal } from "../../../../reusable";
import {
  userManagementApi,
  type UserTable,
} from "../../../../service/admin-root-api/user-management";

interface UpdateStaffStatusModalProps {
  user: UserTable;
  onClose: () => void;
  onSuccess?: () => void;
}

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active (fully operational)" },
  { value: "INACTIVE", label: "Inactive (user not available)" },
  { value: "LOCK", label: "Locked (temporary restriction)" },
] as const;

const REASON_LIMIT = 1000;

export function UpdateStaffStatusModal({
  user,
  onClose,
  onSuccess,
}: UpdateStaffStatusModalProps) {
  const currentStatus = user.isLocked
    ? "LOCK"
    : String(user.status || "ACTIVE").toUpperCase();

  const availableStatusOptions = useMemo(
    () => STATUS_OPTIONS.filter((opt) => opt.value !== currentStatus),
    [currentStatus],
  );

  const [selectedStatus, setSelectedStatus] = useState("");
  const [reason, setReason] = useState("");
  const [lockUntil, setLockUntil] = useState("");
  const [statusError, setStatusError] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setSelectedStatus("");
    setReason("");
    setLockUntil("");
    setStatusError("");
    setReasonError("");
    setSubmitError("");
    setSubmitting(false);
    setShowSuccessModal(false);
    setSuccessMessage("");
  }, [availableStatusOptions]);

  const toLocalDateTime = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;
    return trimmed.length === 16 ? `${trimmed}:00` : trimmed;
  };

  const handleSubmit = async () => {
    let hasError = false;
    setSubmitError("");

    if (!selectedStatus) {
      setStatusError("Please select a status.");
      hasError = true;
    }

    if (!reason.trim()) {
      setReasonError("Please provide a reason.");
      hasError = true;
    }

    if (hasError) return;

    try {
      setSubmitting(true);

      if (selectedStatus === "LOCK") {
        const fallbackLockUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 19);

        await userManagementApi.lockAccount(user.id, {
          lockUntil: lockUntil ? toLocalDateTime(lockUntil) : fallbackLockUntil,
          reason: reason.trim(),
        });
        setSuccessMessage("Staff account has been locked successfully.");
        setShowSuccessModal(true);
        return;
      }

      if (user.isLocked) {
        try {
          await userManagementApi.unlockAccount(user.id);
        } catch {
          // Some environments may auto-unlock during status change.
        }
      }

      await userManagementApi.updateStatus(user.id, {
        newStatus: selectedStatus,
        remarks: reason.trim(),
      });
      setSuccessMessage("Staff status has been updated successfully.");
      setShowSuccessModal(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to update status.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModalShell
      isOpen
      onClose={onClose}
      title="Update Staff Status"
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
            disabled={submitting || availableStatusOptions.length === 0}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Update Status"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <p className="text-sm text-gray-600">
          Updating{" "}
          <span className="font-semibold text-gray-900">{`${user.firstName} ${user.lastName}`}</span>{" "}
          <span className="text-gray-500">(staff account)</span>
        </p>

        <div>
          <FormFieldLabel label="Select New Status" required />
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setStatusError("");
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a status</option>
            {availableStatusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <FormFieldError msg={statusError} />
        </div>

        {selectedStatus === "LOCK" ? (
          <div>
            <FormFieldLabel label="Lock Until (optional)" />
            <input
              type="datetime-local"
              value={lockUntil}
              onChange={(e) => setLockUntil(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              If empty, default lock period will be used.
            </p>
          </div>
        ) : null}

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
            placeholder="Provide a reason for this status change..."
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

      <ActionModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          onSuccess?.();
          onClose();
        }}
        title="Update Successful"
        type="success"
      >
        <p>{successMessage}</p>
      </ActionModal>
    </FormModalShell>
  );
}
