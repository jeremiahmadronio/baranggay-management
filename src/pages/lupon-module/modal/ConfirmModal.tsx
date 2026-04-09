import React, { useState } from "react";
import { CircleLoader } from "../../../hooks/LoadingStates";
interface ConfirmModalProps {
  title: string;
  description: string;
  confirmLabel: string;
  confirmClass: string;
  icon?: React.ReactNode;
  loading: boolean;
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}
export function ConfirmModal({
  title,
  description,
  confirmLabel,
  confirmClass,
  icon,
  loading,
  requireReason = true,
  reasonLabel = "Reason *",
  reasonPlaceholder = "Provide a reason for this action...",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const handleSubmit = () => {
    if (requireReason && !reason.trim()) {
      setError("Please provide a reason.");
      return;
    }
    setError("");
    onConfirm(reason.trim());
  };
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full">
        <div className="p-6 pb-0">
          <div className="flex items-center gap-3 mb-3">
            {icon}
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
          <p className="text-sm text-gray-600 mb-5 leading-relaxed">
            {description}
          </p>

          <div className="mb-2">
            <label className="block text-xs font-bold text-gray-700 mb-2">
              {reasonLabel}
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              rows={3}
              placeholder={reasonPlaceholder}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none text-gray-900 shadow-sm"
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-red-500 mt-1">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-5 mt-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-semibold border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || (requireReason && !reason.trim())}
            className={`px-4 py-2.5 text-sm font-semibold text-white rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm ${confirmClass}`}
          >
            {loading && (
              <CircleLoader size="sm" tone="light" className="w-3.5 h-3.5" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
