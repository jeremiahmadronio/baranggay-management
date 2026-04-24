import { useEffect, useState, useRef } from "react";
import { X, Send, AlertCircle, ShieldOffIcon } from "lucide-react";
import { recordHearingFollowUp } from "../../../../service/blotter-api/DocketView";

export interface Props {
  hearingId: number;
  hearingNumber: number;
  caseNumber: string;
  hasPermission: boolean; // "Manage Hearings & Mediation"
  onSuccess: () => void;
  onClose: () => void;
}

export function FollowUpModal({
  hearingId,
  hearingNumber,
  caseNumber,
  hasPermission,
  onSuccess,
  onClose,
}: Props) {
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
      await recordHearingFollowUp(hearingId, { notes: trimmedText });
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
        className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Mediation Follow-up
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {caseNumber} · Mediation {hearingNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Permission warning */}
          {!hasPermission && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              <ShieldOffIcon className="w-4 h-4 shrink-0" />
              <p>You do not have permission to add follow-up records.</p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              1 Follow-up Notes
            </p>
            <textarea
              ref={textAreaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                hasPermission
                  ? "Add any important notes or remarks regarding this mediation. This will be visible in the case timeline."
                  : "You do not have permission to add follow-ups."
              }
              rows={5}
              disabled={saving || !hasPermission}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-800 placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
            />
            {error && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-md text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePost}
            disabled={!text.trim() || saving || !hasPermission}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {saving ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            {saving ? "Saving..." : "Save Follow-up"}
          </button>
        </div>
      </div>
    </div>
  );
}
