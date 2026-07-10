import { useEffect, useState } from "react";
import {
  FormModalShell,
  FormFieldError,
  FormFieldLabel,
} from "../reusable/FormModalShell";

const REASON_LIMIT = 1000;

// eslint-disable-next-line react-refresh/only-export-components
export function useArchiveModal<T>() {
  const [target, setTarget] = useState<T | null>(null);

  const openArchiveModal = (item: T) => setTarget(item);
  const closeArchiveModal = () => setTarget(null);

  return {
    target,
    isOpen: !!target,
    openArchiveModal,
    closeArchiveModal,
  };
}

interface ArchiveReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void | Promise<void>;
  title?: string;
  subjectName?: string;
  subjectLabel?: string;
  submitLabel?: string;
  placeholder?: string;
}

export function ArchiveReasonModal({
  isOpen,
  onClose,
  onSubmit,
  title = "Archive Officer / Staff",
  subjectName,
  subjectLabel = "record",
  submitLabel = "Archive",
  placeholder = "Provide a reason for this status change...",
}: ArchiveReasonModalProps) {
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setReason("");
    setReasonError("");
    setSubmitError("");
    setSubmitting(false);
  }, [isOpen]);

  const handleSubmit = async () => {
    const trimmedReason = reason.trim();
    setSubmitError("");

    if (!trimmedReason) {
      setReasonError("Please provide a reason.");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(trimmedReason);
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to archive record.",
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
      maxWidthClass="max-w-3xl"
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
            {submitting ? "Archiving..." : submitLabel}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {subjectName ? (
          <p className="text-sm text-gray-600">
            Updating{" "}
            <span className="font-semibold text-gray-900">{subjectName}</span>{" "}
            <span className="text-gray-500">({subjectLabel})</span>
          </p>
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
            placeholder={placeholder}
            rows={5}
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
