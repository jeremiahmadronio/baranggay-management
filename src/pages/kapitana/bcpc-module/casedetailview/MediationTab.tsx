import { useState } from 'react';
import {
  CalendarDaysIcon, PlusIcon, CalendarIcon, ClockIcon,
  MapPinIcon, ChevronRightIcon, LockIcon, MessageSquarePlusIcon,
  XCircleIcon, PrinterIcon,
} from 'lucide-react';
import { SectionCard, formatDate } from './shared';
import { ScheduleSessionModal } from './ScheduleSessionModal';
import { RecordSessionMinutesModal } from './RecordSessionMinutesModal';

// ─── Types (exported for RecordSessionMinutesModal) ───────────────────────────

export type HearingStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'PENDING_MINUTES';

export interface BcpcHearing {
  id: number;
  hearingNumber: number;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  status: HearingStatus;
  minutesSummary?: string;
  followUpNotes?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_HEARINGS: BcpcHearing[] = [
  {
    id: 1, hearingNumber: 1, date: '2026-01-15', startTime: '09:00', endTime: '10:00',
    venue: 'BCPC Conference Room', status: 'COMPLETED',
    minutesSummary: 'Initial session conducted. Child welfare assessed. No agreement reached.',
  },
  {
    id: 2, hearingNumber: 2, date: '2026-01-22', startTime: '14:00', endTime: '15:30',
    venue: 'Barangay Hall Room 2', status: 'PENDING_MINUTES',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_PILL: Record<HearingStatus, string> = {
  SCHEDULED: 'bg-blue-50 text-blue-700 border border-blue-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-600 border border-red-200',
  PENDING_MINUTES: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
};

const STATUS_LABEL: Record<HearingStatus, string> = {
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  PENDING_MINUTES: 'Pending Minutes',
};

function formatTime(time: string) {
  try { const [h,m]=time.split(':').map(Number); return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`; }
  catch { return time; }
}

function isHearingInFuture(date: string, time: string) {
  return new Date(`${date}T${time}`) > new Date();
}

// ─── Inline ViewMinutes Modal ─────────────────────────────────────────────────

function ViewMinutesModal({ hearing, onClose }: { hearing: BcpcHearing; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Minutes — Mediation {hearing.hearingNumber}</h3>
            <p className="mt-0.5 text-xs text-gray-500">{formatDate(hearing.date)} · {formatTime(hearing.startTime)} – {formatTime(hearing.endTime)} · {hearing.venue}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <XCircleIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{hearing.minutesSummary || '— No minutes recorded —'}</p>
          {hearing.followUpNotes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Follow-up Notes</p>
              <p className="text-sm text-gray-700 leading-relaxed">{hearing.followUpNotes}</p>
            </div>
          )}
        </div>
        <div className="flex justify-end px-6 py-4 border-t border-gray-200">
          <button onClick={onClose} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Inline FollowUp Modal ────────────────────────────────────────────────────

function FollowUpModal({ hearing, onClose, onSave }: { hearing: BcpcHearing; onClose: () => void; onSave: (notes: string) => void }) {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">Add Follow-up — Mediation {hearing.hearingNumber}</h3>
        </div>
        <div className="px-6 py-5">
          <textarea autoFocus rows={4} value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Follow-up notes or actions taken..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => { if (!notes.trim()) { setError('Required.'); return; } onSave(notes.trim()); }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Save Follow-up</button>
        </div>
      </div>
    </div>
  );
}

// ─── Inline Cancel Modal ──────────────────────────────────────────────────────

function CancelModal({ hearing, onClose, onConfirm }: { hearing: BcpcHearing; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">Cancel Mediation {hearing.hearingNumber}</h3>
          <p className="mt-1 text-sm text-gray-500">Provide the reason for cancelling this session.</p>
        </div>
        <div className="px-6 py-5">
          <textarea autoFocus rows={3} value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Enter cancellation reason here..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none" />
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Back</button>
          <button onClick={() => { if (!reason.trim()) { setError('Required.'); return; } onConfirm(reason.trim()); }}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Confirm Cancellation</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main MediationTab ────────────────────────────────────────────────────────

type ModalType = 'schedule' | 'recordMinutes' | 'viewMinutes' | 'followUp' | 'cancel' | null;

type MediationTabProps = {
  caseId: number;
  isReadOnly: boolean;
  caseNumber: string;
  childName: string;
  respondentName: string;
  natureOfComplaint: string;
};

export function MediationTab({ caseId: _caseId, isReadOnly, caseNumber, childName, respondentName, natureOfComplaint }: MediationTabProps) {
  const [hearings, setHearings] = useState<BcpcHearing[]>(MOCK_HEARINGS);
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedHearing, setSelectedHearing] = useState<BcpcHearing | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const hasScheduled = hearings.some(h => h.status === 'SCHEDULED');

  const showSuccess = (msg: string) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(''), 3000); };

  const closeModal = () => { setModal(null); setSelectedHearing(null); };

  // ── Handlers ──

  const handleScheduleSave = (data: { date: string; startTime: string; endTime: string; venue: string; notes: string }) => {
    const newH: BcpcHearing = {
      id: Date.now(), hearingNumber: hearings.length + 1, status: 'SCHEDULED',
      date: data.date, startTime: data.startTime, endTime: data.endTime, venue: data.venue,
    };
    setHearings(prev => [...prev, newH]);
    closeModal();
    showSuccess('Mediation session scheduled successfully.');
  };

  const handleRecordMinutes = (data: { childPresent: boolean; respondentPresent: boolean; notes: string; outcome: 'SETTLED'|'NOT_SETTLED'; settlementTerms: string }) => {
    if (!selectedHearing) return;
    setHearings(prev => prev.map(h =>
      h.id === selectedHearing.id ? { ...h, status: 'COMPLETED' as const, minutesSummary: data.notes || `Outcome: ${data.outcome}${data.settlementTerms ? ` — ${data.settlementTerms}` : ''}` } : h
    ));
    closeModal();
    showSuccess('Minutes recorded successfully.');
  };

  const handleFollowUpSave = (notes: string) => {
    if (!selectedHearing) return;
    setHearings(prev => prev.map(h => h.id === selectedHearing.id ? { ...h, followUpNotes: notes } : h));
    closeModal();
    showSuccess('Follow-up saved successfully.');
  };

  const handleCancelConfirm = (_reason: string) => {
    if (!selectedHearing) return;
    setHearings(prev => prev.map(h => h.id === selectedHearing.id ? { ...h, status: 'CANCELLED' as const } : h));
    closeModal();
    showSuccess('Mediation session cancelled.');
  };

  return (
    <div className="space-y-3">
      {/* ── Modals ── */}
      {modal === 'schedule' && (
        <ScheduleSessionModal
          sessionNumber={hearings.length + 1}
          childName={childName}
          respondentName={respondentName}
          caseNumber={caseNumber}
          onSave={handleScheduleSave}
          onCancel={closeModal}
        />
      )}
      {modal === 'recordMinutes' && selectedHearing && (
        <RecordSessionMinutesModal
          hearing={selectedHearing}
          caseNumber={caseNumber}
          natureOfComplaint={natureOfComplaint}
          childName={childName}
          respondentName={respondentName}
          onSave={handleRecordMinutes}
          onCancel={closeModal}
        />
      )}
      {modal === 'viewMinutes' && selectedHearing && (
        <ViewMinutesModal hearing={selectedHearing} onClose={closeModal} />
      )}
      {modal === 'followUp' && selectedHearing && (
        <FollowUpModal hearing={selectedHearing} onClose={closeModal} onSave={handleFollowUpSave} />
      )}
      {modal === 'cancel' && selectedHearing && (
        <CancelModal hearing={selectedHearing} onClose={closeModal} onConfirm={handleCancelConfirm} />
      )}

      {/* ── Success Banner ── */}
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>
      )}

      <SectionCard
        title="Mediation Sessions"
        icon={<CalendarDaysIcon className="w-4 h-4 text-gray-400" />}
        action={
          !isReadOnly && !hasScheduled ? (
            <button onClick={() => setModal('schedule')}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              <PlusIcon className="w-4 h-4" /> Schedule New Mediation
            </button>
          ) : undefined
        }
      >
        {hearings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-3">
            <CalendarDaysIcon className="w-8 h-8 text-gray-300" />
            <p className="text-sm">No mediation sessions scheduled yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...hearings].sort((a, b) => b.hearingNumber - a.hearingNumber).map(h => {
              const isCompleted = h.status === 'COMPLETED';
              const isCancelled = h.status === 'CANCELLED';
              const isPendingMinutes = h.status === 'PENDING_MINUTES';
              const isScheduled = h.status === 'SCHEDULED';
              const timeLocked = isHearingInFuture(h.date, h.startTime);

              return (
                <div key={h.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/80 rounded-xl border border-gray-100 gap-4">
                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-base font-bold text-gray-900">Mediation Session {h.hearingNumber}</span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-tight ${STATUS_PILL[h.status]}`}>
                        {STATUS_LABEL[h.status]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><CalendarIcon className="w-3.5 h-3.5 text-blue-400" />{formatDate(h.date)}</span>
                      <span className="flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5 text-blue-400" />{formatTime(h.startTime)} – {formatTime(h.endTime)}</span>
                      <span className="flex items-center gap-1"><MapPinIcon className="w-3.5 h-3.5 text-blue-400" />{h.venue}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 flex-wrap">
                    {/* Paanyaya + Cancel for non-terminal scheduled hearings */}
                    {!isReadOnly && !isCancelled && !isCompleted && (
                      <>
                        <button onClick={() => showSuccess('Paanyaya (summons) document generated.')}
                          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors">
                          <PrinterIcon className="w-3.5 h-3.5" /> Paanyaya
                        </button>
                        <div className="w-px h-4 bg-gray-200 hidden sm:block" />
                        <button onClick={() => { setSelectedHearing(h); setModal('cancel'); }}
                          className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 transition-colors">
                          <XCircleIcon className="w-3.5 h-3.5" /> Cancel Mediation
                        </button>
                        <div className="w-px h-4 bg-gray-200 hidden sm:block" />
                      </>
                    )}

                    {/* Completed → View Minutes + Follow-up */}
                    {isCompleted && (
                      <div className="flex items-center gap-3">
                        <button onClick={() => { setSelectedHearing(h); setModal('viewMinutes'); }}
                          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                          View Minutes <ChevronRightIcon className="w-4 h-4" />
                        </button>
                        {!isReadOnly && (
                          <>
                            <div className="w-px h-4 bg-gray-300 hidden sm:block" />
                            <button onClick={() => { setSelectedHearing(h); setModal('followUp'); }}
                              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors">
                              <MessageSquarePlusIcon className="w-3.5 h-3.5" /> Follow-up
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Pending Minutes or Scheduled (time not locked) → Record Minutes */}
                    {(isPendingMinutes || (isScheduled && !timeLocked)) && !isReadOnly && (
                      <button onClick={() => { setSelectedHearing(h); setModal('recordMinutes'); }}
                        className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                        Update Session <ChevronRightIcon className="w-4 h-4" />
                      </button>
                    )}

                    {/* Scheduled but time-locked */}
                    {isScheduled && timeLocked && (
                      <span className="flex items-center gap-1 text-sm text-gray-400">
                        <LockIcon className="w-3.5 h-3.5" /> Scheduled
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
