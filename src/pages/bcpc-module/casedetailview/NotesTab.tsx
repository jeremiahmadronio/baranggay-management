import { FileTextIcon, PlusIcon, SendIcon, UserCircle2Icon } from 'lucide-react';
import { SectionCard } from './shared';
import type { BcpcCaseNote } from './shared';

type NotesTabProps = {
  notes: BcpcCaseNote[];
  isReadOnly: boolean;
  notesLoading: boolean;
  showNoteInput: boolean;
  noteText: string;
  noteLoading: boolean;
  noteError: string;
  onShowNoteInput: (show: boolean) => void;
  onNoteTextChange: (value: string) => void;
  onSaveNote: () => void;
  formatDate: (date?: string) => string;
};

export function NotesTab({
  notes,
  isReadOnly,
  notesLoading,
  showNoteInput,
  noteText,
  noteLoading,
  noteError,
  onShowNoteInput,
  onNoteTextChange,
  onSaveNote,
  formatDate,
}: NotesTabProps) {
  return (
    <SectionCard
      title="Case Notes"
      icon={<FileTextIcon className="w-4 h-4 text-gray-400" />}
      action={
        !showNoteInput && !isReadOnly ? (
          <button
            onClick={() => onShowNoteInput(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <PlusIcon className="w-3.5 h-3.5" /> Add Note
          </button>
        ) : null
      }
    >
      {isReadOnly && (
        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          This case is read-only. Notes can no longer be edited.
        </div>
      )}

      {showNoteInput && !isReadOnly && (
        <div className="mb-4 space-y-2">
          <textarea
            autoFocus
            placeholder="Type your note here..."
            value={noteText}
            maxLength={500}
            onChange={(event) => {
              const sanitized = event.target.value.replace(/[^a-zA-Z0-9\s.,\-ñÑ/?()]/g, "");
              if (sanitized.length <= 500) {
                onNoteTextChange(sanitized);
              }
            }}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none text-gray-900"
          />
          <div className="flex justify-end text-xs text-gray-400 mt-1">
            <span className="tabular-nums">{noteText.length} / 500</span>
          </div>
          {noteError && <p className="text-xs text-red-500">{noteError}</p>}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                onShowNoteInput(false);
                onNoteTextChange('');
              }}
              className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSaveNote}
              disabled={noteLoading || !noteText.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {noteLoading ? (
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <SendIcon className="w-3.5 h-3.5" />
              )}
              Save Note
            </button>
          </div>
        </div>
      )}

      {notesLoading ? (
        <div className="flex items-center justify-center py-10">
          <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-2">
          <FileTextIcon className="w-8 h-8 text-gray-300" />
          <p className="text-sm">No notes added yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="p-4 bg-gray-50/80 rounded-xl border border-gray-100">
              <p className="text-sm text-gray-900 leading-relaxed break-words whitespace-pre-wrap">{note.note}</p>
              <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                <UserCircle2Icon className="w-4 h-4" />
                <span className="font-bold">{note.createdBy}</span>
                <span>•</span>
                <span>{formatDate(note.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
