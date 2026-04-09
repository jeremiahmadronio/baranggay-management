import React, { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import {
  type HearingScheduleDTO,
  updateHearingStatus,
} from "../../../service/lupon-api/Hearing";
interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  hearing: HearingScheduleDTO | null;
  onSuccess: () => void;
}
const STATUS_OPTIONS = [
  "Scheduled",
  "Completed",
  "Cancelled",
  "Postponed",
  "Rescheduled",
  "Certified to File Action",
];
export function UpdateStatusModal({
  isOpen,
  onClose,
  hearing,
  onSuccess,
}: UpdateStatusModalProps) {
  const [status, setStatus] = useState(hearing?.status || "Scheduled");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (hearing) {
      setStatus(hearing.status);
      setRemarks("");
      setError(null);
    }
  }, [hearing, isOpen]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hearing) return;
    if (!remarks.trim()) {
      setError("Remarks/Reason is required.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await updateHearingStatus(hearing.hearingId, {
        newStatus: status,
        remarks: remarks,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setIsSubmitting(false);
    }
  };
  if (!hearing) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Hearing Status">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Blotter No.
          </label>
          <div className="text-sm text-gray-900 font-medium px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
            {hearing.blotterNumber}
          </div>
        </div>

        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            New Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="block w-full rounded-lg border-gray-300 py-2.5 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 border bg-white shadow-sm transition-colors"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="remarks"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Remarks / Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            id="remarks"
            rows={4}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Enter reason for status change..."
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 sm:text-sm border p-3 transition-colors resize-none"
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 flex items-start">
            <span className="block">{error}</span>
          </div>
        )}

        <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
