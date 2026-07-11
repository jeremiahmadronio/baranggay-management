import { useEffect, useMemo, useState } from "react";
import {
  FormModalShell,
  FormFieldError,
  FormFieldLabel,
} from "./FormModalShell";

export type StatusReasonMode =
  | "status-and-reason"
  | "reason-only"
  | "reason-and-lock-until";

export interface StatusOption {
  value: string;
  label: string;
}

export interface ReasonOption {
  value: string;
  label: string;
}

interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  mode?: StatusReasonMode;
  subjectName?: string;
  subjectLabel?: string;
  statusOptions?: StatusOption[];
  reasonOptions?: ReasonOption[];
  initialStatus?: string;
  initialReason?: string;
  initialLockUntil?: string;
  submitLabel?: string;
  onSubmit: (payload: {
    status?: string;
    reason: string;
    lockUntil?: string | null;
  }) => void | Promise<void>;
}

const DEFAULT_STATUSES: StatusOption[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "DECEASED", label: "Deceased" },
  { value: "TRANSFERRED", label: "Transferred" },
];

const REASON_LIMIT = 1000;

export function StatusUpdateModal({
  isOpen,
  onClose,
  title,
  mode = "status-and-reason",
  subjectName,
  subjectLabel = "record",
  statusOptions = DEFAULT_STATUSES,
  initialStatus,
  initialReason,
  initialLockUntil,
  submitLabel = "Update Status",
  onSubmit,
}: StatusUpdateModalProps) {
  const defaultStatus = useMemo(
    () => initialStatus || statusOptions[0]?.value || "",
    [initialStatus, statusOptions],
  );

  const [selectedStatus, setSelectedStatus] = useState(defaultStatus);
  const [reason, setReason] = useState(initialReason || "");
  const [lockUntil, setLockUntil] = useState(initialLockUntil || "");
  const [statusError, setStatusError] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedStatus(defaultStatus);
    setReason(initialReason || "");
    setLockUntil(initialLockUntil || "");
    setStatusError("");
    setReasonError("");
    setSubmitError("");
    setSubmitting(false);
  }, [isOpen, defaultStatus, initialReason, initialLockUntil]);

  const handleSubmit = async () => {
    let hasError = false;
    setSubmitError("");

    if (mode === "status-and-reason" && !selectedStatus) {
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
      await onSubmit({
        status: mode === "status-and-reason" ? selectedStatus : undefined,
        reason: reason.trim(),
        lockUntil:
          mode === "reason-and-lock-until" ? lockUntil.trim() || null : null,
      });
      onClose();
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
      isOpen={isOpen}
      title={title}
      onClose={onClose}
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
            {submitting ? "Saving..." : submitLabel}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {subjectName ? (
          <p className="text-sm text-gray-600">
            Updating{" "}
            <span className="font-semibold text-gray-900">{subjectName}</span>{" "}
            <span className="text-gray-500">({subjectLabel})</span>
          </p>
        ) : null}

        {mode === "reason-and-lock-until" ? (
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

        {mode === "status-and-reason" ? (
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
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <FormFieldError msg={statusError} />
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
    </FormModalShell>
  );
}
