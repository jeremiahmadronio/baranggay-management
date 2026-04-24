import React, { useState } from "react";
import { X, Lock, LockOpen, Loader2 } from "lucide-react";
import {
  toggleUserLock,
  type AdminTable,
} from "../../../service/admin-root-api/admin-management";

interface LockUserModalProps {
  admin: AdminTable;
  onClose: () => void;
}

export function LockUserModal({ admin, onClose }: LockUserModalProps) {
  const isCurrentlyLocked = admin.isLocked;
  const willLock = !isCurrentlyLocked;

  const [reason, setReason] = useState("");
  const [lockUntil, setLockUntil] = useState<string>("");
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
      await toggleUserLock(admin.id, willLock, {
        reason,
        lockUntil: lockUntil ? lockUntil : null,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Action failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const isLockAction = willLock;
  const IconComponent = isLockAction ? Lock : LockOpen;
  const actionLabel = isLockAction ? "Lock" : "Unlock";

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {actionLabel} User Account
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
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isLockAction ? "bg-orange-100" : "bg-blue-100"}`}
          >
            <IconComponent
              className={`w-5 h-5 ${isLockAction ? "text-orange-500" : "text-blue-500"}`}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              Are you sure you want to {actionLabel.toLowerCase()}{" "}
              <span className="font-semibold">
                {admin.firstName} {admin.lastName}
              </span>
              's account?
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {isLockAction
                ? "They will no longer be able to log in until the account is unlocked."
                : "They will regain access to the system immediately."}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={`Enter reason for ${actionLabel.toLowerCase()}ing this account...`}
            rows={3}
            className={`w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none focus:border-transparent ${isLockAction ? "focus:ring-orange-500" : "focus:ring-blue-500"}`}
          />
        </div>

        {isLockAction && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Lock Until{" "}
              <span className="text-xs text-gray-400 font-normal">
                (leave empty for permanent)
              </span>
            </label>
            <input
              type="datetime-local"
              value={lockUntil}
              onChange={(e) => setLockUntil(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        )}

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
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2 ${isLockAction ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Processing..." : `Confirm ${actionLabel}`}
          </button>
        </div>
      </div>
    </div>
  );
}
