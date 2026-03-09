import React, { useState } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import {
  updateUserStatus,
  Statuses,
  type UserTable,
} from "../admin-module-api/user-management";

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
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleConfirm = async () => {
    setError(null);
    if (!reason.trim()) {
      setError("Reason is required for accountability.");
      return;
    }
    try {
      setLoading(true);
      await updateUserStatus(user.id, Statuses.INACTIVE, {
        reason,
        lockUntil: null,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to deactivate account. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Deactivate Staff Account
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              Deactivate{" "}
              <span className="font-semibold">
                {user.firstName} {user.lastName}
              </span>
              's account?
            </p>
            <p className="text-sm text-red-500 mt-1">
              Their account will be set to <strong>Inactive</strong>. They will
              lose access immediately. An Admin can restore their account later.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-red-600 mb-1.5">
            Reason for deactivation <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for deactivating this account..."
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Processing..." : "Confirm Deactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}
