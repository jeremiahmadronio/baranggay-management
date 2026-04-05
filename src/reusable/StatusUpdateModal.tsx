import { useEffect, useMemo, useState } from "react";
import {
  FormModalShell,
  FormFieldError,
  FormFieldLabel,
} from "./FormModalShell";

export type StatusReasonMode = "status-and-reason" | "reason-only";

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
  submitLabel?: string;
  onSubmit: (payload: {
    status?: string;
    reason: string;
  }) => void;
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
  submitLabel = "Update Status",
  onSubmit,
}: StatusUpdateModalProps) {
  const defaultStatus = useMemo(
    () => initialStatus || statusOptions[0]?.value || "",
    [initialStatus, statusOptions],
  );

  const [selectedStatus, setSelectedStatus] = useState(defaultStatus);
  const [reason, setReason] = useState(initialReason || "");
  const [statusError, setStatusError] = useState("");
  const [reasonError, setReasonError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setSelectedStatus(defaultStatus);
    setReason(initialReason || "");
    setStatusError("");
    setReasonError("");
  }, [isOpen, defaultStatus, initialReason]);

  const handleSubmit = () => {
    let hasError = false;

    if (mode === "status-and-reason" && !selectedStatus) {
      setStatusError("Please select a status.");
      hasError = true;
    }

    if (!reason.trim()) {
      setReasonError("Please provide a reason.");
      hasError = true;
    }

    if (hasError) return;

    onSubmit({
      status: mode === "status-and-reason" ? selectedStatus : undefined,
      reason: reason.trim(),
    });
    onClose();
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
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            {submitLabel}
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
              if (e.target.value.length <= REASON_LIMIT) {
                setReason(e.target.value);
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
      </div>
    </FormModalShell>
  );
}