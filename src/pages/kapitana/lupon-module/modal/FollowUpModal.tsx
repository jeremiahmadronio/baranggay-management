import { useEffect, useState, useRef } from "react";
import { X, Send, AlertCircle, ShieldOffIcon } from "lucide-react";
import { recordHearingFollowUp } from "../../../../service/lupon-api/LuponCaseManagement-view-api-v2";
import { CircleLoader } from "../../../../hooks/LoadingStates";
export interface FollowUpModalProps {
  hearingId: number;
  caseNumber: string;
  hasPermission: boolean;
  onSuccess: () => void;
  onClose: () => void;
}
export function FollowUpModal({
  hearingId,
  caseNumber,
  hasPermission,
  onSuccess,
  onClose,
}: FollowUpModalProps) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (hasPermission) textAreaRef.current?.focus();
  }, [hasPermission]);
  const handlePost = async () => {
    const trimmedText = text.trim();
    if (!trimmedText || !hasPermission) return;
    setSaving(true);
    setError("");
    try {
      await recordHearingFollowUp(hearingId, {
        notes: trimmedText,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save follow-up.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-md flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">
            Add Follow-up — Conciliation {hearingNumber}
          </h3>
        </div>

        <div className="p-6">
          {!hasPermission && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 mb-4">
              <ShieldOffIcon className="w-4 h-4 shrink-0" />
              <p>You do not have permission to add follow-up records.</p>
            </div>
          )}

          <textarea
            ref={textAreaRef}
            value={text}
            onChange={(e) => setText(e.target.value.replace(/[^a-zA-Z0-9\s.,!?'-]/g, ''))}
            maxLength={500}
            placeholder={hasPermission ? "Follow-up notes or actions taken..." : "You do not have permission to add follow-ups."}
            rows={4}
            disabled={saving || !hasPermission}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-800 placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
          />
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-white">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 bg-white hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button autoFocus
            onClick={handlePost}
            disabled={!text.trim() || saving || !hasPermission}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
          >
            {saving ? "Saving..." : "Save Follow-up"}
          </button>
        </div>
      </div>
    </div>
  );
}
