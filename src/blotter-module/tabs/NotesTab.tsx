import  { useState } from 'react'
import { FileTextIcon, PlusIcon, SendIcon, UserIcon } from 'lucide-react'
import type { CaseNoteViewDTO } from '../../blotter-api/DocketView'
import { addCaseNote } from '../../blotter-api/DocketView'
import { isTerminalStatus } from '../shared/StatusBadge'
import { SectionCard } from '../shared/SectionCard'
import { formatDateTime } from '../shared/utils'
interface NotesTabProps {
  notes: CaseNoteViewDTO[]
  notesLoading: boolean
  blotterNumber: string
  caseStatus: string
  onNoteAdded: () => void
}
export function NotesTab({
  notes,
  notesLoading,
  blotterNumber,
  caseStatus,
  onNoteAdded,
}: NotesTabProps) {
  const isTerminal = isTerminalStatus(caseStatus)
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteLoading, setNoteLoading] = useState(false)
  const [noteError, setNoteError] = useState('')
  const handleAddNote = async () => {
    if (!noteText.trim()) return
    setNoteLoading(true)
    setNoteError('')
    try {
      await addCaseNote({
        blotterNumber,
        note: noteText.trim(),
      })
      setNoteText('')
      setShowNoteInput(false)
      // toast.success('Note added successfully')
      onNoteAdded()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add note.'
      setNoteError(message)
      // toast.error('Failed to add note')
    } finally {
      setNoteLoading(false)
    }
  }
  return (
    <div className="space-y-3">
      <SectionCard
        title="Case Notes"
        icon={<FileTextIcon className="w-4 h-4 text-gray-400" />}
        action={
          !isTerminal && !showNoteInput ? (
            <button
              onClick={() => setShowNoteInput(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5" /> Add Note
            </button>
          ) : undefined
        }
      >
        {showNoteInput && (
          <div className="mb-4 space-y-2">
            <textarea
              autoFocus
              placeholder="Type your note here..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none text-gray-900"
            />
            {noteError && <p className="text-xs text-red-500">{noteError}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNoteInput(false)
                  setNoteText('')
                  setNoteError('')
                }}
                className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
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

        {notesLoading && (
          <div className="flex items-center justify-center py-10">
            <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!notesLoading && notes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-2">
            <FileTextIcon className="w-8 h-8 text-gray-300" />
            <p className="text-sm">No notes added yet.</p>
          </div>
        )}

        {!notesLoading && notes.length > 0 && (
          <div className="space-y-2">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-4 bg-gray-50/80 rounded-xl border border-gray-100"
              >
                <p className="text-sm text-gray-900 leading-relaxed">
                  {note.note}
                </p>
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                  <UserIcon className="w-4 h-4" />
                  <span className="font-bold">{note.createdBy}</span>
                  <span>•</span>
                  <span>
                    {formatDateTime(
                      note.createdAt.split('T')[0],
                      note.createdAt.split('T')[1],
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
