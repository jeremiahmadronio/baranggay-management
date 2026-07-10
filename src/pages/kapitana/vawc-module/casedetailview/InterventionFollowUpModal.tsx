import { SendIcon, XIcon } from 'lucide-react';

type InterventionFollowUpModalProps = {
  caseReference: string;
  followUpText: string;
  followUpLoading: boolean;
  followUpError: string;
  followUpMessage: string;
  saveDisabled?: boolean;
  onFollowUpTextChange: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
};

export function InterventionFollowUpModal({
  caseReference,
  followUpText,
  followUpLoading,
  followUpError: _followUpError,
  followUpMessage: _followUpMessage,
  saveDisabled = false,
  onFollowUpTextChange,
  onSave,
  onClose,
}: InterventionFollowUpModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-lg">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Intervention Follow-up</h3>
            <p className="mt-1 text-sm text-gray-500">{caseReference}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">1 Follow-up Notes</p>
          <textarea
            value={followUpText}
            onChange={(event) => onFollowUpTextChange(event.target.value)}
            rows={5}
            placeholder="Add any important notes or remarks regarding this intervention. This will be visible in the case timeline."
            className="min-h-[150px] w-full resize-none rounded-lg border border-blue-400 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button autoFocus
            type="button"
            onClick={onSave}
            disabled={followUpLoading || saveDisabled}
            className="inline-flex items-center gap-2 rounded-md bg-blue-400 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <SendIcon className="h-4 w-4" />
            {followUpLoading ? 'Saving...' : 'Save Follow-up'}
          </button>
        </div>
      </div>
    </div>
  );
}