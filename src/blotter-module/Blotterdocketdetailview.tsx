import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Calendar, FileText, Clock, CheckCircle,
  AlertCircle, X, User, MapPin, Hash, Clipboard,
  Plus, Send, ChevronLeft, ChevronRight, CalendarDays, AlertTriangle, Timer,
} from 'lucide-react';
import type {
  BlotterDocketViewDTO,
  MediationProcessDTO,
  HearingViewDTO,
  MediationHearingViewDTO,
  CaseNoteViewDTO,
  ScheduleHearingRequest,
  CalendarMarkerDTO,
  BusySlotDTO,
  RecordMinutesRequest,
} from '../blotter-api/DocketView';
import {
  getFullBlotterDocket,
  getMediationProcess,
  getHearingView,
  getMediationHearingView,
  getCaseNotes,
  addCaseNote,
  scheduleHearing,
  updateCaseStatus,
  getMarkers,
  getBusySlots,
  recordHearingMinutes,
} from '../blotter-api/DocketView';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  blotterNumber: string;
  onBack: () => void;
}

type TabKey = 'overview' | 'hearings' | 'notes' | 'timeline';

interface CaseTimelineDTO {
  id: number;
  timestamp: string;
  description: string;
  type?: string;
}

// ─── Status Config ────────────────────────────────────────────────────────────

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  ACTIVE:            { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500' },
  PENDING:           { bg: 'bg-gray-100',    text: 'text-gray-600',    dot: 'bg-gray-400' },
  UNSETTLED:         { bg: 'bg-red-100',     text: 'text-red-600',     dot: 'bg-red-500' },
  UNDER_MEDIATION:   { bg: 'bg-indigo-100',  text: 'text-indigo-700',  dot: 'bg-indigo-500' },
  REFERRED_TO_LUPON: { bg: 'bg-purple-100',  text: 'text-purple-700',  dot: 'bg-purple-500' },
  SUMMONED:          { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500' },
  RESOLVED:          { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  DISMISSED:         { bg: 'bg-gray-100',    text: 'text-gray-500',    dot: 'bg-gray-400' },
};

const hearingStatusLabel: Record<string, string> = {
  SCHEDULED:   'SCHEDULED',
  COMPLETED:   'SETTLED',
  NOT_SETTLED: 'NOT SETTLED',
  CANCELLED:   'CANCELLED',
  ONGOING:     'ONGOING',
};

const hearingStatusStyle: Record<string, string> = {
  SCHEDULED:   'bg-blue-100 text-blue-700',
  COMPLETED:   'bg-emerald-100 text-emerald-700',
  NOT_SETTLED: 'bg-red-100 text-red-600',
  CANCELLED:   'bg-gray-100 text-gray-500',
  ONGOING:     'bg-amber-100 text-amber-700',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDay   = (year: number, month: number) => new Date(year, month, 1).getDay();
const pad           = (n: number) => String(n).padStart(2, '0');
const toDateStr     = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

const getDurationLabel = (start: string, end: string): string => {
  if (!start || !end) return '';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff <= 0) return '';
  const hrs = Math.floor(diff / 60), mins = diff % 60;
  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs} hr`;
  return `${hrs} hr ${mins} min`;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
};

// ─── Parse saved hearingNotes string ─────────────────────────────────────────
// Stored format:
//   "Actual meeting time: HH:MM – HH:MM (Xhr)\n\n{hearingNotes}\n\n[Agreement/Extra Notes]: {agreementNotes}"

const parseHearingNotes = (raw: string | undefined): { notes: string; agreement: string } => {
  if (!raw) return { notes: '', agreement: '' };
  const MARKER = '[Agreement/Extra Notes]:';
  const markerIdx = raw.indexOf(MARKER);
  const agreement = markerIdx !== -1 ? raw.slice(markerIdx + MARKER.length).trim() : '';
  const withoutAgreement = markerIdx !== -1 ? raw.slice(0, markerIdx) : raw;
  const parts = withoutAgreement.split('\n\n');
  const notesOnly = parts
    .filter(p => !p.trim().startsWith('Actual meeting time:'))
    .join('\n\n')
    .trim();
  return { notes: notesOnly, agreement };
};

// ─── Reusable UI ──────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = statusConfig[status] ?? { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status.replace(/_/g, ' ')}
    </span>
  );
};

const InfoRow = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div>
    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
    <p className="text-sm text-gray-800 font-medium">{value ?? '—'}</p>
  </div>
);

const SectionCard = ({ title, icon, children, action }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; action?: React.ReactNode;
}) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">{icon}{title}</h3>
      {action}
    </div>
    {children}
  </div>
);

// ─── Generic Confirm Modal ────────────────────────────────────────────────────

interface ConfirmModalProps {
  title: string; description: string; confirmLabel: string;
  confirmClass: string; icon: React.ReactNode; loading: boolean;
  onConfirm: () => void; onCancel: () => void;
}

const ConfirmModal = ({ title, description, confirmLabel, confirmClass, icon, loading, onConfirm, onCancel }: ConfirmModalProps) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
      <div className="flex items-center gap-3 mb-3">{icon}<h3 className="text-base font-semibold text-gray-800">{title}</h3></div>
      <p className="text-sm text-gray-500 mb-5">{description}</p>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} disabled={loading}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
        <button onClick={onConfirm} disabled={loading}
          className={`px-4 py-2 text-sm text-white rounded-lg flex items-center gap-2 disabled:opacity-50 ${confirmClass}`}>
          {loading && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

// ─── Refer to Lupon Modal ─────────────────────────────────────────────────────

const POSITION_OPTIONS = [
  { label: 'Select position...', value: '' },
  { label: 'Punong Barangay',    value: 'PUNONG_BARANGAY' },
  { label: 'Pangkat Chairman',   value: 'PANGKAT_CHAIRMAN' },
  { label: 'Pangkat Member',     value: 'PANGKAT_MEMBER' },
  { label: 'Barangay Secretary', value: 'BARANGAY_SECRETARY' },
];

interface PangkatMember { firstName: string; lastName: string; position: string; }

interface ReferToLuponModalProps {
  blotterNumber: string; complainantName: string; loading: boolean;
  onConfirm: (members: PangkatMember[]) => void; onCancel: () => void;
}

const ReferToLuponModal = ({ blotterNumber, complainantName, loading, onConfirm, onCancel }: ReferToLuponModalProps) => {
  const [members, setMembers] = useState<PangkatMember[]>([
    { firstName: '', lastName: '', position: '' },
    { firstName: '', lastName: '', position: '' },
    { firstName: '', lastName: '', position: '' },
  ]);
  const [error, setError] = useState('');
  const updateMember = (idx: number, field: keyof PangkatMember, value: string) =>
    setMembers((prev) => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  const handleConfirm = () => {
    if (members.some((m) => !m.firstName.trim() || !m.lastName.trim() || !m.position)) {
      setError('Please complete all Pangkat Member fields.'); return;
    }
    setError(''); onConfirm(members);
  };
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-base font-semibold text-gray-800">Refer to Lupon</h3>
            <p className="text-xs text-gray-400 mt-0.5">{blotterNumber} • {complainantName}</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p className="text-xs text-blue-700 leading-relaxed">
              Ang case ay ilililpat sa Lupong Tagapamayapa. Ang 30-day mediation period ay magsisimula pagkatapos ma-assign ang Pangkat members.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Pangkat Members (3 Required)</p>
            <div className="space-y-3">
              {members.map((member, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</div>
                    <span className="text-sm font-semibold text-gray-700">Member {idx + 1}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">First name</label>
                      <input type="text" value={member.firstName} onChange={(e) => updateMember(idx, 'firstName', e.target.value)} placeholder="Juan"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Last name</label>
                      <input type="text" value={member.lastName} onChange={(e) => updateMember(idx, 'lastName', e.target.value)} placeholder="Dela Cruz"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Position</label>
                    <select value={member.position} onChange={(e) => updateMember(idx, 'position', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                      {POSITION_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onCancel} disabled={loading} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button onClick={handleConfirm} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {loading && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Confirm & Refer to Lupon
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Record Hearing Minutes Modal ─────────────────────────────────────────────

interface RecordMinutesModalProps {
  hearing: HearingViewDTO; blotterNumber: string;
  complainantName: string; respondentName: string;
  onSuccess: () => void; onCancel: () => void;
}

const getAttendanceWarning = (c: boolean, r: boolean) => {
  if (!c && !r) return { color: 'bg-red-50 border-red-200 text-red-700', message: 'Both parties failed to appear. The hearing will be automatically postponed and both parties will be re-summoned.' };
  if (c && !r)  return { color: 'bg-amber-50 border-amber-200 text-amber-700', message: 'Respondent failed to appear despite proper summons. This will be noted in the record. A second summon will be issued with a warning of default.' };
  if (!c && r)  return { color: 'bg-amber-50 border-amber-200 text-amber-700', message: 'Complainant failed to appear. The case may be dismissed or postponed at the discretion of the Punong Barangay. If the complainant fails to appear without valid reason, the complaint may be considered withdrawn.' };
  return null;
};

const RecordMinutesModal = ({ hearing, blotterNumber, complainantName, respondentName, onSuccess, onCancel }: RecordMinutesModalProps) => {
  const [complainantPresent, setComplainantPresent] = useState(true);
  const [respondentPresent,  setRespondentPresent]  = useState(true);
  const [hearingNotes,       setHearingNotes]       = useState('');
  const [agreementNotes,     setAgreementNotes]     = useState('');
  const [outcome,            setOutcome]            = useState<'SETTLED' | 'NOT_SETTLED' | ''>('');
  const [actualStart,        setActualStart]        = useState(hearing.startTime);
  const [actualEnd,          setActualEnd]          = useState(hearing.endTime);
  const [loading,            setLoading]            = useState(false);
  const [error,              setError]              = useState('');

  const duration = getDurationLabel(actualStart, actualEnd);
  const warning  = getAttendanceWarning(complainantPresent, respondentPresent);

  const handleSubmit = async () => {
    if (!outcome) { setError('Please select an outcome.'); return; }
    setLoading(true); setError('');
    try {
      // Combine all into one hearingNotes string — parsed back by parseHearingNotes() on display
      const timeNote = `Actual meeting time: ${actualStart} – ${actualEnd}${duration ? ` (${duration})` : ''}`;
      const withNotes = hearingNotes.trim() ? `${timeNote}\n\n${hearingNotes.trim()}` : timeNote;
      const fullNotes = agreementNotes.trim()
        ? `${withNotes}\n\n[Agreement/Extra Notes]: ${agreementNotes.trim()}`
        : withNotes;

      const body: RecordMinutesRequest = {
        hearingId: hearing.hearingId,
        complainantPresent,
        respondentPresent,
        hearingNotes: fullNotes,
        outcome,
      };
      await recordHearingMinutes(body);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save minutes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-6">
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Record Hearing Minutes — Hearing {hearing.hearingNumber}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{blotterNumber} · {complainantName} vs {respondentName}</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Hearing Info */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hearing Information</p>
            </div>
            <div className="grid grid-cols-4 gap-4 px-4 py-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Summon</p>
                <p className="text-sm font-semibold text-indigo-600">Summon {hearing.hearingNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Date</p>
                <p className="text-sm font-medium text-gray-800 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />{formatDate(hearing.date)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Scheduled Time</p>
                <p className="text-sm font-medium text-gray-800 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />{hearing.startTime} – {hearing.endTime}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Venue</p>
                <p className="text-sm font-medium text-gray-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />{hearing.venue}
                </p>
              </div>
            </div>
          </div>

          {/* 1. Actual Meeting Time */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">1 — Actual Meeting Time</p>
            </div>
            <div className="px-4 py-4">
              <p className="text-xs text-gray-500 mb-3">Record the actual time the hearing started and ended.</p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-400 mb-1 block">Start Time</label>
                  <input type="time" value={actualStart} onChange={(e) => setActualStart(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div className="pt-4 text-gray-400 text-sm">—</div>
                <div className="flex-1">
                  <label className="text-xs text-gray-400 mb-1 block">End Time</label>
                  <input type="time" value={actualEnd} onChange={(e) => setActualEnd(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                {duration && (
                  <div className="pt-4 shrink-0">
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg">
                      <Timer className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-xs font-semibold text-indigo-600">{duration}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Attendance */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">2 — Attendance</p>
            </div>
            <div className="px-4 py-4 space-y-4">
              {[
                { label: 'Complainant', name: complainantName, present: complainantPresent, setPresent: setComplainantPresent },
                { label: 'Respondent',  name: respondentName,  present: respondentPresent,  setPresent: setRespondentPresent },
              ].map((party) => (
                <div key={party.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{party.label}</p>
                    <p className="text-xs text-gray-400">{party.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => party.setPresent(true)}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${party.present ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      Present
                    </button>
                    <button onClick={() => party.setPresent(false)}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${!party.present ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      Absent
                    </button>
                  </div>
                </div>
              ))}
              {warning && (
                <div className={`flex items-start gap-2.5 px-3 py-3 rounded-lg border text-xs ${warning.color}`}>
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{warning.message}</p>
                </div>
              )}
            </div>
          </div>

          {/* 3. Hearing Notes */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">3 — Hearing Notes</p>
            </div>
            <div className="px-4 py-4">
              <textarea
                placeholder="Brief summary of what transpired during the hearing..."
                value={hearingNotes}
                onChange={(e) => setHearingNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>
          </div>

          {/* 4. Agreement / Extra Notes */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">4 — Agreement / Extra Notes</p>
            </div>
            <div className="px-4 py-4">
              <textarea
                placeholder="Any agreements reached, conditions, or additional notes..."
                value={agreementNotes}
                onChange={(e) => setAgreementNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>
          </div>

          {/* 5. Outcome */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">5 — Outcome</p>
            </div>
            <div className="px-4 py-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="outcome" checked={outcome === 'SETTLED'} onChange={() => setOutcome('SETTLED')} className="w-4 h-4 accent-indigo-600" />
                <div>
                  <span className="text-sm font-medium text-gray-800">Settled</span>
                  <span className="text-xs text-gray-400 ml-2">(proceed to close case)</span>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="outcome" checked={outcome === 'NOT_SETTLED'} onChange={() => setOutcome('NOT_SETTLED')} className="w-4 h-4 accent-indigo-600" />
                <div>
                  <span className="text-sm font-medium text-gray-800">Not Settled</span>
                  <span className="text-xs text-gray-400 ml-2">(mark unsettled — forward to Lupon)</span>
                </div>
              </label>
              {outcome === 'NOT_SETTLED' && (
                <div className="flex items-start gap-2.5 px-3 py-3 rounded-lg border border-red-200 bg-red-50 text-xs text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>This will mark the case as <strong>Unsettled</strong> and forward to the Lupon Tagapamayapa for further proceedings.</p>
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onCancel} disabled={loading}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !outcome}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {loading && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Save Minutes
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Schedule Hearing Modal ───────────────────────────────────────────────────

interface ScheduleModalProps {
  blotterNumber: string; hearingNumber: number;
  onSuccess: () => void; onCancel: () => void;
}

const ScheduleHearingModal = ({ blotterNumber, hearingNumber, onSuccess, onCancel }: ScheduleModalProps) => {
  const today = new Date();
  const [viewYear,     setViewYear]     = useState(today.getFullYear());
  const [viewMonth,    setViewMonth]    = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState('');
  const [markers,      setMarkers]      = useState<CalendarMarkerDTO[]>([]);
  const [busySlots,    setBusySlots]    = useState<BusySlotDTO[]>([]);
  const [startTime,    setStartTime]    = useState('09:00');
  const [endTime,      setEndTime]      = useState('10:00');
  const [venue,        setVenue]        = useState('');
  const [notes,        setNotes]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  useEffect(() => { getMarkers(viewYear, viewMonth + 1).then(setMarkers).catch(() => {}); }, [viewYear, viewMonth]);
  useEffect(() => { if (!selectedDate) return; getBusySlots(selectedDate).then(setBusySlots).catch(() => {}); }, [selectedDate]);

  const markerMap   = markers.reduce<Record<string, number>>((acc, m) => { acc[m.date] = m.totalHearings; return acc; }, {});
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay    = getFirstDay(viewYear, viewMonth);
  const todayStr    = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const prevMonth = () => { if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); } else setViewMonth(m => m + 1); };

  const handleSubmit = async () => {
    if (!selectedDate || !startTime || !endTime || !venue) { setError('Please fill in all required fields.'); return; }
    setLoading(true); setError('');
    try {
      const body: ScheduleHearingRequest = { blotterNumber, scheduledStart: `${selectedDate}T${startTime}`, scheduledEnd: `${selectedDate}T${endTime}`, venue, notes: notes || undefined };
      await scheduleHearing(body);
      onSuccess();
    } catch (err: any) { setError(err.message || 'Failed to schedule hearing.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-gray-800">Schedule Summon {hearingNumber}</h3>
            <p className="text-xs text-gray-400">Select a date on the calendar, then set the time range.</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-5 border-r border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronLeft className="w-4 h-4 text-gray-500" /></button>
              <span className="text-sm font-semibold text-gray-800">{MONTHS[viewMonth]} {viewYear}</span>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronRight className="w-4 h-4 text-gray-500" /></button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const dateStr = toDateStr(viewYear, viewMonth, day);
                const isToday = dateStr === todayStr, isSelected = dateStr === selectedDate;
                const hasMarker = markerMap[dateStr] > 0, isPast = dateStr < todayStr;
                return (
                  <button key={day} disabled={isPast} onClick={() => setSelectedDate(dateStr)}
                    className={`relative mx-auto w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center transition-colors
                      ${isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-indigo-50 cursor-pointer'}
                      ${isSelected ? 'bg-indigo-600 text-white hover:bg-indigo-600' : ''}
                      ${isToday && !isSelected ? 'border border-indigo-400 text-indigo-600' : ''}
                      ${!isSelected && !isToday && !isPast ? 'text-gray-700' : ''}`}>
                    {day}
                    {hasMarker && !isSelected && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-400" />}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="w-full md:w-72 p-5 space-y-4">
            {selectedDate ? (
              <div className="bg-indigo-50 rounded-lg p-3">
                <p className="text-xs text-indigo-400 font-medium mb-0.5">Selected Date</p>
                <p className="text-sm font-semibold text-indigo-700">{formatDate(selectedDate)}</p>
              </div>
            ) : <div className="bg-gray-50 rounded-lg p-3 text-center text-xs text-gray-400">No date selected</div>}
            {busySlots.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">Busy Time Slots</p>
                {busySlots.map((slot, i) => (
                  <div key={i} className="bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5 mb-1.5">
                    <p className="text-xs font-semibold text-red-600">{slot.startTime} – {slot.endTime}</p>
                    <p className="text-xs text-red-400 truncate">{slot.caseNumber} • {slot.natureOfComplaint}</p>
                  </div>
                ))}
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Start Time — End Time</p>
              <div className="flex items-center gap-2">
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <span className="text-gray-400 text-xs">—</span>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Venue *</p>
              <input type="text" placeholder="Barangay Hall" value={venue} onChange={(e) => setVenue(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Notes (optional)</p>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Additional instructions..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button onClick={handleSubmit} disabled={loading || !selectedDate}
              className="w-full py-2.5 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Confirm & Generate Panunumpa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Mediation Steps ──────────────────────────────────────────────────────────

const MEDIATION_STEPS = [
  { key: 'stepCaseReceived',     label: 'Case Received',                     sub: (p: MediationProcessDTO) => p.caseReceivedDate ? `Received from Barangay Blotter on ${p.caseReceivedDate}` : 'Awaiting receipt' },
  { key: 'stepSummonIssued',     label: 'Pangkat Assignment / Summon Issued', sub: (p: MediationProcessDTO) => p.summonStatus ?? 'Awaiting first summon' },
  { key: 'stepMediationOngoing', label: 'Mediation Hearings',                 sub: (p: MediationProcessDTO) => `${p.hearingsConducted} hearing(s) conducted` },
  { key: 'stepResolved',         label: 'Case Resolution',                    sub: (p: MediationProcessDTO) => p.resolutionStatus ?? 'Awaiting resolution' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

const BlotterDocketDetailView = ({ blotterNumber, onBack }: Props) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const [docket,         setDocket]         = useState<BlotterDocketViewDTO | null>(null);
  const [mediation,      setMediation]      = useState<MediationProcessDTO | null>(null);
  const [hearings,       setHearings]       = useState<HearingViewDTO[]>([]);
  const [hearingDetails, setHearingDetails] = useState<Record<number, MediationHearingViewDTO>>({});
  const [notes,          setNotes]          = useState<CaseNoteViewDTO[]>([]);
  const [timeline]                          = useState<CaseTimelineDTO[]>([]);

  const [loading,         setLoading]         = useState(true);
  const [hearingsLoading, setHearingsLoading] = useState(false);
  const [notesLoading,    setNotesLoading]    = useState(false);
  const [error,           setError]           = useState<string | null>(null);

  const [modal,           setModal]           = useState<'refer' | 'settle' | 'dismiss' | 'schedule' | null>(null);
  const [actionLoading,   setActionLoading]   = useState(false);
  const [selectedHearing, setSelectedHearing] = useState<HearingViewDTO | null>(null);

  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText,      setNoteText]      = useState('');
  const [noteLoading,   setNoteLoading]   = useState(false);
  const [noteError,     setNoteError]     = useState('');

  // ── Initial load ──
  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const [d, m] = await Promise.all([getFullBlotterDocket(blotterNumber), getMediationProcess(blotterNumber)]);
        setDocket(d); setMediation(m);
      } catch (err: any) { setError(err.message || 'Failed to load case details.'); }
      finally { setLoading(false); }
    };
    load();
  }, [blotterNumber]);

  // ── Hearings tab — also fetches minutes for completed hearings ──
  const loadHearings = useCallback(async () => {
    setHearingsLoading(true);
    try {
      const data = await getHearingView(blotterNumber);
      setHearings(data);
      const completed = data.filter(h => h.status !== 'SCHEDULED');
      if (completed.length > 0) {
        const details = await Promise.all(
          completed.map(h => getMediationHearingView(h.hearingId).catch(() => null))
        );
        const detailMap: Record<number, MediationHearingViewDTO> = {};
        completed.forEach((h, i) => { if (details[i]) detailMap[h.hearingId] = details[i]!; });
        setHearingDetails(detailMap);
      }
    } catch (err) { console.error(err); }
    finally { setHearingsLoading(false); }
  }, [blotterNumber]);

  useEffect(() => { if (activeTab !== 'hearings') return; loadHearings(); }, [activeTab, loadHearings]);

  // ── Notes tab ──
  const loadNotes = useCallback(async () => {
    setNotesLoading(true);
    try { setNotes(await getCaseNotes(blotterNumber)); }
    catch (err) { console.error(err); }
    finally { setNotesLoading(false); }
  }, [blotterNumber]);

  useEffect(() => { if (activeTab !== 'notes') return; loadNotes(); }, [activeTab, loadNotes]);

  // ── Status actions ──
  const handleAction = async (newStatus: string, reason: string) => {
    setActionLoading(true);
    try {
      await updateCaseStatus({ caseId: blotterNumber, newStatus, reason });
      setModal(null);
      const [d, m] = await Promise.all([getFullBlotterDocket(blotterNumber), getMediationProcess(blotterNumber)]);
      setDocket(d); setMediation(m);
    } catch (err: any) { alert(err.message || 'Action failed.'); }
    finally { setActionLoading(false); }
  };

  const handleReferConfirm = async (members: PangkatMember[]) => {
    setActionLoading(true);
    try {
      await updateCaseStatus({
        caseId: blotterNumber,
        newStatus: 'REFERRED_TO_LUPON',
        reason: `Referred to Lupon. Pangkat: ${members.map(m => `${m.firstName} ${m.lastName} (${m.position})`).join(', ')}`,
      });
      setModal(null);
      const [d, m] = await Promise.all([getFullBlotterDocket(blotterNumber), getMediationProcess(blotterNumber)]);
      setDocket(d); setMediation(m);
    } catch (err: any) { alert(err.message || 'Failed to refer case.'); }
    finally { setActionLoading(false); }
  };

  // ── Add note ──
  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setNoteLoading(true); setNoteError('');
    try {
      await addCaseNote({ blotterNumber, note: noteText.trim() });
      setNoteText(''); setShowNoteInput(false);
      await loadNotes();
    } catch (err: any) { setNoteError(err.message || 'Failed to add note.'); }
    finally { setNoteLoading(false); }
  };

  const mediationProgress = mediation
    ? [mediation.stepCaseReceived, mediation.stepSummonIssued, mediation.stepMediationOngoing, mediation.stepResolved]
    : [false, false, false, false];

  const tabDefs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'hearings', label: 'Hearings',   count: hearings.length },
    { key: 'notes',    label: 'Case Notes', count: notes.length },
    { key: 'timeline', label: 'Timeline' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <span className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading case details...</p>
      </div>
    </div>
  );

  if (error || !docket) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="w-8 h-8 text-red-400" />
      <p className="text-sm text-red-500">{error ?? 'Case not found.'}</p>
      <button onClick={onBack} className="text-sm text-indigo-500 hover:underline">Go Back</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-4">

        {/* ── Modals ── */}
        {modal === 'refer' && (
          <ReferToLuponModal blotterNumber={blotterNumber} complainantName={`${docket.firstName} ${docket.lastName}`}
            loading={actionLoading} onConfirm={handleReferConfirm} onCancel={() => setModal(null)} />
        )}
        {modal === 'settle' && (
          <ConfirmModal title="Mark as Settled" description="Are you sure you want to mark this case as settled? This will close the case."
            confirmLabel="Mark as Settled" confirmClass="bg-emerald-600 hover:bg-emerald-700"
            icon={<div className="bg-emerald-100 p-2 rounded-full"><CheckCircle className="w-4 h-4 text-emerald-600" /></div>}
            loading={actionLoading} onConfirm={() => handleAction('RESOLVED', 'Case marked as settled')} onCancel={() => setModal(null)} />
        )}
        {modal === 'dismiss' && (
          <ConfirmModal title="Dismiss Case" description="Are you sure you want to dismiss this case? This action cannot be undone."
            confirmLabel="Dismiss Case" confirmClass="bg-gray-600 hover:bg-gray-700"
            icon={<div className="bg-gray-100 p-2 rounded-full"><X className="w-4 h-4 text-gray-600" /></div>}
            loading={actionLoading} onConfirm={() => handleAction('DISMISSED', 'Case dismissed')} onCancel={() => setModal(null)} />
        )}
        {modal === 'schedule' && (
          <ScheduleHearingModal blotterNumber={blotterNumber} hearingNumber={hearings.length + 1}
            onSuccess={async () => {
              setModal(null); setActiveTab('hearings');
              const [h, m] = await Promise.all([getHearingView(blotterNumber), getMediationProcess(blotterNumber)]);
              setHearings(h); setMediation(m);
            }}
            onCancel={() => setModal(null)} />
        )}
        {selectedHearing && docket && (
          <RecordMinutesModal
            hearing={selectedHearing} blotterNumber={blotterNumber}
            complainantName={`${docket.firstName} ${docket.lastName}`}
            respondentName={`${docket.respondentFirstName} ${docket.respondentLastName}`}
            onSuccess={async () => {
              setSelectedHearing(null);
              const [_, m] = await Promise.all([loadHearings(), getMediationProcess(blotterNumber)]);
              setMediation(m);
            }}
            onCancel={() => setSelectedHearing(null)}
          />
        )}

        {/* ── Header ── */}
        <div>
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Docket
          </button>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{docket.caseNumber}</h1>
            <StatusBadge status={docket.caseStatus} />
          </div>
          <p className="text-sm text-gray-500">{docket.firstName} {docket.lastName} • {docket.natureOfComplaint}</p>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 border-b border-gray-200">
          {tabDefs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${activeTab === tab.key ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══════════ OVERVIEW TAB ══════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span className="font-medium">15-Day Mediation Period</span>
                </div>
                <span className={`text-sm font-semibold ${docket.daysRemaining <= 3 ? 'text-red-500' : 'text-indigo-600'}`}>
                  {docket.daysRemaining} days remaining
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, ((15 - docket.daysRemaining) / 15) * 100)}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Filed: {docket.dateFiled}</span>
                <span>Deadline: {docket.mediationDeadline}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Quick Actions</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Schedule Hearing', sub: 'Set mediation date',  icon: <Calendar className="w-4 h-4 text-indigo-600" />,    iconBg: 'bg-indigo-100',  textColor: 'text-indigo-600',  hover: 'hover:border-indigo-300 hover:bg-indigo-50',   onClick: () => setModal('schedule') },
                  { label: 'Mark as Settled',  sub: 'Close this case',     icon: <CheckCircle className="w-4 h-4 text-emerald-600" />, iconBg: 'bg-emerald-100', textColor: 'text-emerald-600', hover: 'hover:border-emerald-300 hover:bg-emerald-50', onClick: () => setModal('settle') },
                  { label: 'Refer to Lupon',   sub: 'Escalate case',       icon: <AlertCircle className="w-4 h-4 text-red-500" />,    iconBg: 'bg-red-100',     textColor: 'text-red-500',     hover: 'hover:border-red-300 hover:bg-red-50',         onClick: () => setModal('refer') },
                  { label: 'Dismiss Case',     sub: 'Case without action',  icon: <X className="w-4 h-4 text-gray-500" />,            iconBg: 'bg-gray-100',    textColor: 'text-gray-600',    hover: 'hover:border-gray-400 hover:bg-gray-50',       onClick: () => setModal('dismiss') },
                ].map((a) => (
                  <button key={a.label} onClick={a.onClick}
                    className={`flex flex-col items-start gap-1.5 p-4 bg-white border border-gray-200 rounded-xl transition-all text-left ${a.hover}`}>
                    <div className={`p-2 rounded-lg ${a.iconBg}`}>{a.icon}</div>
                    <span className={`text-sm font-semibold ${a.textColor}`}>{a.label}</span>
                    <span className="text-xs text-gray-400">{a.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <SectionCard title="Client Information" icon={<User className="w-4 h-4 text-gray-400" />}>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow label="Full Name" value={`${docket.firstName}${docket.middleName ? ' ' + docket.middleName : ''} ${docket.lastName}`} />
                    <InfoRow label="Contact Number" value={docket.contactNumber} />
                    <InfoRow label="Age" value={docket.age} />
                    <InfoRow label="Gender" value={docket.gender} />
                    <InfoRow label="Civil Status" value={docket.civilStatus} />
                    <InfoRow label="Email" value={docket.email} />
                    <div className="col-span-2"><InfoRow label="Current Address" value={docket.completeAddress} /></div>
                  </div>
                </SectionCard>
                <SectionCard title="Respondent Information" icon={<User className="w-4 h-4 text-gray-400" />}>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow label="Name" value={`${docket.respondentFirstName}${docket.respondentMiddleName ? ' ' + docket.respondentMiddleName : ''} ${docket.respondentLastName}`} />
                    <InfoRow label="Alias" value={docket.respondentAlias} />
                    <InfoRow label="Contact Number" value={docket.respondentContact} />
                    <InfoRow label="Age" value={docket.respondentAge} />
                    <InfoRow label="Gender" value={docket.respondentGender} />
                    <InfoRow label="Civil Status" value={docket.respondentCivilStatus} />
                    <InfoRow label="Occupation" value={docket.respondentOccupation} />
                    <InfoRow label="Relationship to Complainant" value={docket.relationshipToComplainant} />
                    <div className="col-span-2"><InfoRow label="Address" value={docket.respondentAddress} /></div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Living with Complainant</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${docket.livingWithComplainant ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                        {docket.livingWithComplainant ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </SectionCard>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 h-fit">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Clipboard className="w-4 h-4 text-gray-400" /> Case Information</h3>
                <InfoRow label="Case Number" value={docket.caseNumber} />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Status</p>
                  <StatusBadge status={docket.caseStatus} />
                </div>
                {docket.caseStatusRemarks && <InfoRow label="Remarks" value={docket.caseStatusRemarks} />}
                <InfoRow label="Date Filed" value={docket.dateFiled} />
                <InfoRow label="Nature of Complaint" value={docket.natureOfComplaint} />
                <InfoRow label="Incident Date" value={docket.incidentDate} />
                {docket.incidentTime && <InfoRow label="Incident Time" value={docket.incidentTime} />}
                <InfoRow label="Incident Place" value={docket.incidentLocation} />
                {docket.frequencyOfIncident && <InfoRow label="Frequency" value={docket.frequencyOfIncident} />}
              </div>
            </div>

            <SectionCard title="Incident Narrative" icon={<FileText className="w-4 h-4 text-gray-400" />}>
              <p className="text-sm text-gray-600 leading-relaxed">{docket.narrative}</p>
              {docket.descriptionOfInjuries && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Description of Injuries</p>
                  <p className="text-sm text-gray-600">{docket.descriptionOfInjuries}</p>
                </div>
              )}
            </SectionCard>

            {docket.witnesses?.length > 0 && (
              <SectionCard title={`Witnesses (${docket.witnesses.length})`} icon={<User className="w-4 h-4 text-gray-400" />}>
                <div className="space-y-3">
                  {docket.witnesses.map((w, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">{i + 1}</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 flex-1">
                        <InfoRow label="Name" value={`${w.firstName} ${w.lastName}`} />
                        <InfoRow label="Contact" value={w.contactNumber} />
                        {w.address && <div className="col-span-2"><InfoRow label="Address" value={w.address} /></div>}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {mediation && (
              <SectionCard title="Mediation Process" icon={<Hash className="w-4 h-4 text-gray-400" />}>
                <div className="space-y-0">
                  {MEDIATION_STEPS.map((step, idx) => {
                    const done = mediationProgress[idx], isLast = idx === MEDIATION_STEPS.length - 1;
                    return (
                      <div key={step.key} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${done ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400 border-2 border-gray-200'}`}>
                            {done ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                          </div>
                          {!isLast && <div className={`w-0.5 flex-1 my-1 ${done ? 'bg-emerald-300' : 'bg-gray-200'}`} />}
                        </div>
                        <div className="pb-5 flex-1 flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{step.label}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{step.sub(mediation)}</p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ml-4 ${done ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            {done ? 'COMPLETED' : 'PENDING'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            )}
          </div>
        )}

        {/* ══════════ HEARINGS TAB ══════════ */}
        {activeTab === 'hearings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">Mediation Hearings</h2>
              <button onClick={() => setModal('schedule')}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                <Plus className="w-4 h-4" /> Schedule New Hearing
              </button>
            </div>

            {hearingsLoading && (
              <div className="flex items-center justify-center py-10">
                <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!hearingsLoading && hearings.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-xl flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
                <CalendarDays className="w-8 h-8 text-gray-300" />
                <p className="text-sm">No hearings scheduled yet.</p>
              </div>
            )}

            {!hearingsLoading && hearings.map((h) => {
              const detail = hearingDetails[h.hearingId];
              // Parse notes saved from RecordMinutesModal
              const { notes: parsedNotes, agreement: parsedAgreement } = parseHearingNotes(detail?.hearingNotes);

              return (
                <div key={h.hearingId} className="bg-white border border-gray-200 rounded-xl overflow-hidden">

                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-800">Hearing {h.hearingNumber}</span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${hearingStatusStyle[h.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {hearingStatusLabel[h.status] ?? h.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(h.date)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{h.startTime} – {h.endTime}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{h.venue}</span>
                      {getDurationLabel(h.startTime, h.endTime) && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-medium">
                          <Timer className="w-3 h-3" />{getDurationLabel(h.startTime, h.endTime)}
                        </span>
                      )}
                    </div>
                    {h.status === 'SCHEDULED' && (
                      <button onClick={() => setSelectedHearing(h)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 bg-indigo-50 rounded-lg hover:bg-indigo-100 whitespace-nowrap">
                        Update Hearing <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Card Body — completed hearings */}
                  {h.status !== 'SCHEDULED' && (
                    <div className="px-5 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Attendance */}
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Attendance</p>
                          <div className="space-y-0">
                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                              <div>
                                <p className="text-sm font-medium text-gray-700">Complainant</p>
                                <p className="text-xs text-gray-400">{docket.firstName} {docket.lastName}</p>
                              </div>
                              <span className="px-3 py-1 text-xs font-bold rounded bg-emerald-500 text-white">PRESENT</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                              <div>
                                <p className="text-sm font-medium text-gray-700">Respondent</p>
                                <p className="text-xs text-gray-400">{docket.respondentFirstName} {docket.respondentLastName}</p>
                              </div>
                              <span className="px-3 py-1 text-xs font-bold rounded bg-emerald-500 text-white">PRESENT</span>
                            </div>
                          </div>
                        </div>

                        {/* Hearing Notes + Agreement */}
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Hearing Notes</p>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 min-h-[52px]">
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                {parsedNotes || '—'}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Agreement / Extra Notes</p>
                            <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2.5 min-h-[36px]">
                              <p className="text-sm text-gray-600">
                                {parsedAgreement || '—'}
                              </p>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════ CASE NOTES TAB ══════════ */}
        {activeTab === 'notes' && (
          <div className="space-y-3">
            <SectionCard title="Case Notes" icon={<FileText className="w-4 h-4 text-gray-400" />}
              action={
                !showNoteInput ? (
                  <button onClick={() => setShowNoteInput(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 border border-indigo-200 bg-indigo-50 rounded-lg hover:bg-indigo-100">
                    <Plus className="w-3.5 h-3.5" /> Add Note
                  </button>
                ) : undefined
              }>
              {showNoteInput && (
                <div className="mb-4 space-y-2">
                  <textarea autoFocus placeholder="Type your note here..." value={noteText}
                    onChange={(e) => setNoteText(e.target.value)} rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
                  {noteError && <p className="text-xs text-red-500">{noteError}</p>}
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setShowNoteInput(false); setNoteText(''); setNoteError(''); }}
                      className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
                    <button onClick={handleAddNote} disabled={noteLoading || !noteText.trim()}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                      {noteLoading ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Save Note
                    </button>
                  </div>
                </div>
              )}
              {notesLoading && <div className="flex items-center justify-center py-10"><span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}
              {!notesLoading && notes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                  <FileText className="w-8 h-8 text-gray-300" />
                  <p className="text-sm">No notes added yet.</p>
                </div>
              )}
              {!notesLoading && notes.map((note) => (
                <div key={note.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 mb-2">
                  <p className="text-sm text-gray-700 leading-relaxed">{note.note}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <User className="w-3.5 h-3.5" />
                    <span className="font-medium">{note.createdBy}</span>
                    <span>•</span>
                    <span>{note.createdAt}</span>
                  </div>
                </div>
              ))}
            </SectionCard>
          </div>
        )}

        {/* ══════════ TIMELINE TAB ══════════ */}
        {activeTab === 'timeline' && (
          <SectionCard title="Case Timeline" icon={<Clock className="w-4 h-4 text-gray-400" />}>
            {timeline.length === 0 && mediation ? (
              <div className="space-y-0">
                {[
                  { date: docket.dateFiled, description: 'Case filed', color: 'bg-red-400', icon: '📋' },
                  ...(mediation.stepSummonIssued ? [{ date: mediation.caseReceivedDate ?? '', description: mediation.summonStatus ?? 'Summon issued', color: 'bg-gray-400', icon: '📄' }] : []),
                  ...((mediation.hearingsConducted ?? 0) > 0 ? [{ date: '', description: `${mediation.hearingsConducted} hearing(s) conducted`, color: 'bg-indigo-400', icon: '🔷' }] : []),
                ].filter(t => t.date || t.description).map((item, idx, arr) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full ${item.color} flex items-center justify-center text-sm shrink-0`}>{item.icon}</div>
                      {idx < arr.length - 1 && <div className="w-0.5 flex-1 my-1 bg-gray-200" />}
                    </div>
                    <div className="pb-5">
                      {item.date && <p className="text-xs text-gray-400 mb-0.5">{item.date}</p>}
                      <p className="text-sm text-gray-700">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No timeline events yet.</p>
            )}
          </SectionCard>
        )}

      </div>
    </div>
  );
};

export default BlotterDocketDetailView;