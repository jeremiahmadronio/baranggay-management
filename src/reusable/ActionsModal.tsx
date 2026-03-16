import { useState } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  // ── optional reason field ──
  reasonLabel?: string;
  reasonPlaceholder?: string;
  reasonRequired?: boolean;
}

export const ConfirmModal = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info",
  reasonLabel,
  reasonPlaceholder = "Enter reason...",
  reasonRequired = false,
}: ConfirmModalProps) => {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (reasonRequired && !reason.trim()) return;
    onConfirm(reason.trim() || undefined);
    setReason(""); // reset after confirm
  };

  const handleCancel = () => {
    setReason(""); // reset on cancel too
    onCancel();
  };

  const config = {
    danger: {
      iconBg: "bg-red-500",
      confirmBtn: "border-2 border-red-500 text-red-500 hover:bg-red-50",
      icon: (
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
    },
    warning: {
      iconBg: "bg-yellow-500",
      confirmBtn: "border-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50",
      icon: (
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    info: {
      iconBg: "bg-blue-500",
      confirmBtn: "border-2 border-blue-500 text-blue-500 hover:bg-blue-50",
      icon: (
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const { iconBg, confirmBtn, icon } = config[type];
  const isDisabled = reasonRequired && !reason.trim();

  return (
    <div className="fixed inset-0 bg-gray-500/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm py-8 px-6 text-center">
        {/* Icon Circle */}
        <div className={`w-20 h-20 ${iconBg} rounded-full flex items-center justify-center mx-auto mb-5`}>
          {icon}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">{title}</h2>

        {/* Message */}
        <p className="text-gray-500 text-sm mb-4">{message}</p>

        {/* Optional Reason Textarea */}
        {reasonLabel && (
          <div className="text-left mb-5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
              {reasonLabel}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none text-gray-800"
            />
            {reasonRequired && !reason.trim() && (
              <p className="text-xs text-red-500 mt-1">This field is required.</p>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 py-2.5 font-medium rounded border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDisabled}
            className={`flex-1 py-2.5 font-medium rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${confirmBtn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};