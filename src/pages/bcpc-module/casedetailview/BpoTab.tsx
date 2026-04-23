import { useState } from 'react';
import {
  ShieldIcon, PrinterIcon, PlusIcon, CalendarDaysIcon, ClockIcon,
  ChevronRightIcon, MessageSquarePlusIcon, XCircleIcon,
} from 'lucide-react';
import { InfoField, SectionCard, formatDate } from './shared';
import type { BcpcCaseDetailDTO } from './shared';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BcpcIntervention {
  id: number;
  activityType: string;
  details: string;
  interventionDate: string;
  duration: number;
  performedBy: string[];
  followUps: { id: number; notes: string; createdBy: string; createdAt: string }[];
}

// ─── Mock Data (only used after activation) ──────────────────────────────────

const MOCK_INTERVENTIONS: BcpcIntervention[] = [
  {
    id: 1, activityType: 'Assessment',
    details: 'Initial psychosocial assessment conducted with the child and guardian.',
    interventionDate: '2026-01-20T09:00:00', duration: 60,
    performedBy: ['MSW Joana Reyes'],
    followUps: [{ id: 1, notes: 'Guardian confirmed understanding of safety plan.', createdBy: 'MSW Joana Reyes', createdAt: '2026-01-21T10:00:00' }],
  },
  {
    id: 2, activityType: 'Home Visit',
    details: 'Follow-up home visit. Situation observed to be stable.',
    interventionDate: '2026-01-27T14:00:00', duration: 45,
    performedBy: ['MSW Joana Reyes', 'Off. Cruz'],
    followUps: [],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatShortDate(d: string) {
  try { return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return d; }
}
function formatTimeRange(d: string, dur: number) {
  try {
    const s = new Date(d), e = new Date(s.getTime() + dur * 60_000);
    const f = (dt: Date) => dt.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${f(s)} – ${f(e)}`;
  } catch { return '—'; }
}

// ─── Add Intervention Modal ───────────────────────────────────────────────────

const ACTIVITY_TYPES = ['Assessment', 'Home Visit', 'Counseling', 'Case Conference', 'Safety Planning', 'Others'];

function AddInterventionModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (data: Omit<BcpcIntervention, 'id' | 'followUps'>) => void;
}) {
  const [activityType, setActivityType] = useState('Assessment');
  const [customType, setCustomType] = useState('');
  const [details, setDetails] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [officer, setOfficer] = useState('MSW Joana Reyes');
  const [error, setError] = useState('');

  const handleSave = () => {
    const resolved = activityType === 'Others' ? customType.trim() : activityType;
    if (!resolved || !details.trim() || !date || !startTime || !endTime) { setError('All fields are required.'); return; }
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const dur = eh * 60 + em - (sh * 60 + sm);
    if (dur <= 0) { setError('End time must be after start time.'); return; }
    onSave({ activityType: resolved, details: details.trim(), interventionDate: `${date}T${startTime}:00`, duration: dur, performedBy: [officer] });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">Add Intervention Log</h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Activity Type *</label>
            <select value={activityType} onChange={e => setActivityType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              {ACTIVITY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          {activityType === 'Others' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Specify Activity *</label>
              <input type="text" value={customType} onChange={e => setCustomType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Details *</label>
            <textarea rows={3} value={details} onChange={e => setDetails(e.target.value)} placeholder="Describe the intervention..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Start *</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">End *</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Performed By *</label>
            <input type="text" value={officer} onChange={e => setOfficer(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Save Log</button>
        </div>
      </div>
    </div>
  );
}

// ─── Intervention Details Modal ───────────────────────────────────────────────

function InterventionDetailsModal({ intervention, onClose, onAddFollowUp }: {
  intervention: BcpcIntervention; onClose: () => void; onAddFollowUp: (text: string) => void;
}) {
  const [followUpText, setFollowUpText] = useState('');
  const [error, setError] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl max-h-[90vh] flex flex-col">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{intervention.activityType}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{formatShortDate(intervention.interventionDate)} · {formatTimeRange(intervention.interventionDate, intervention.duration)}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100"><XCircleIcon className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Details</p>
            <p className="text-sm text-gray-700 leading-relaxed">{intervention.details}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Performed By</p>
            <p className="text-sm text-gray-700">{intervention.performedBy.join(', ') || '—'}</p>
          </div>
          {intervention.followUps.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">Follow-up Notes</p>
              <div className="space-y-2">
                {intervention.followUps.map(fu => (
                  <div key={fu.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-700">{fu.notes}</p>
                    <p className="text-xs text-gray-400 mt-1">{fu.createdBy} · {formatShortDate(fu.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Add Follow-up</p>
            <textarea rows={2} value={followUpText} onChange={e => setFollowUpText(e.target.value)} placeholder="Enter follow-up notes..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            <div className="flex justify-end mt-2">
              <button onClick={() => {
                if (!followUpText.trim()) { setError('Required.'); return; }
                onAddFollowUp(followUpText.trim()); setFollowUpText(''); setError('');
              }} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">Save Follow-up</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main BpoTab ──────────────────────────────────────────────────────────────

type BpoTabProps = {
  caseData: BcpcCaseDetailDTO;
  childFullName: string;
  respondentFullName: string;
  isReadOnly: boolean;
};

export function BpoTab({ caseData, childFullName, respondentFullName, isReadOnly }: BpoTabProps) {
  const [isActive, setIsActive] = useState(false);
  const [bpoNumber, setBpoNumber] = useState('');
  const [bpoIssuedAt, setBpoIssuedAt] = useState('');
  const [bpoExpiredAt, setBpoExpiredAt] = useState('');
  const [activating, setActivating] = useState(false);

  const [interventions, setInterventions] = useState<BcpcIntervention[]>([]);
  const [showAddLog, setShowAddLog] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<BcpcIntervention | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

  const isExpiringSoon = (() => {
    if (!bpoExpiredAt) return false;
    return new Date(bpoExpiredAt).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;
  })();

  const handleActivate = () => {
    setActivating(true);
    setTimeout(() => {
      const now = new Date();
      const expiry = new Date(now.getTime() + 15 * 86400000);
      setBpoNumber(`BPO-BCPC-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`);
      setBpoIssuedAt(now.toISOString().slice(0, 10));
      setBpoExpiredAt(expiry.toISOString().slice(0, 10));
      setInterventions(MOCK_INTERVENTIONS);
      setIsActive(true);
      setActivating(false);
      showSuccess('BPO activated successfully. 15-day validity period has started.');
    }, 600);
  };

  const handleAddIntervention = (data: Omit<BcpcIntervention, 'id' | 'followUps'>) => {
    setInterventions(prev => [...prev, { id: Date.now(), followUps: [], ...data }]);
    setShowAddLog(false);
    showSuccess('Intervention log saved successfully.');
  };

  const handleAddFollowUp = (interventionId: number, notes: string) => {
    const fu = { id: Date.now(), notes, createdBy: 'Current User', createdAt: new Date().toISOString() };
    setInterventions(prev => prev.map(i => i.id === interventionId ? { ...i, followUps: [...i.followUps, fu] } : i));
    setSelectedIntervention(prev => prev?.id === interventionId ? { ...prev, followUps: [...prev.followUps, fu] } : prev);
    showSuccess('Follow-up saved successfully.');
  };

  return (
    <div className="space-y-5">
      {/* Modals */}
      {showAddLog && <AddInterventionModal onClose={() => setShowAddLog(false)} onSave={handleAddIntervention} />}
      {selectedIntervention && (
        <InterventionDetailsModal
          intervention={selectedIntervention}
          onClose={() => setSelectedIntervention(null)}
          onAddFollowUp={notes => handleAddFollowUp(selectedIntervention.id, notes)}
        />
      )}

      {/* Success */}
      {successMsg && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMsg}</div>}

      {/* ── BPO DETAILS CARD ── */}
      <SectionCard
        title="Barangay Protection Order Details"
        action={
          !isActive && !isReadOnly ? (
            <div className="flex items-center gap-2">
              <button onClick={() => showSuccess('BPO Request Letter generated.')}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5">
                <PrinterIcon className="w-3.5 h-3.5" /> Print BPO Request Letter
              </button>
              <button onClick={handleActivate} disabled={activating}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                {activating ? 'Activating...' : 'Activate BPO (Post-Signature)'}
              </button>
            </div>
          ) : undefined
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
          <InfoField label="Case Number" value={caseData.caseNumber} />
          <InfoField label="Child (Protected Party)" value={childFullName} />
          <InfoField label="Respondent" value={respondentFullName || undefined} />
          <InfoField label="Assigned Officer" value={caseData.assignedOfficer} />
        </div>

        {isActive && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">BPO Number</p>
                <p className="text-sm font-semibold text-blue-600">{bpoNumber}</p>
              </div>
              <InfoField label="Issue Date" value={formatDate(bpoIssuedAt)} />
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Expiry Date (15 Days)</p>
                <p className={`text-sm font-medium ${isExpiringSoon ? 'text-red-600' : 'text-gray-700'}`}>{formatDate(bpoExpiredAt)}</p>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── WORKFLOW INSTRUCTIONS (pre-activation only) ── */}
      {!isActive && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-5">
          <p className="text-sm font-semibold text-amber-800 mb-2">Workflow Instructions:</p>
          <ol className="list-decimal list-inside text-sm text-amber-700 space-y-1">
            <li>Print the BPO Request Letter using the button above.</li>
            <li>Have the Punong Barangay (Barangay Captain) sign the document.</li>
            <li>Once signed, click &quot;Activate BPO&quot; to officially issue the order and start the 15-day validity period.</li>
          </ol>
        </div>
      )}

      {/* ── INTERVENTION LOGS (post-activation only) ── */}
      {isActive && (
        <SectionCard
          title="Intervention Logs"
          action={
            !isReadOnly ? (
              <button onClick={() => setShowAddLog(true)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5">
                <PlusIcon className="w-3.5 h-3.5" /> Add Log
              </button>
            ) : undefined
          }
        >
          {interventions.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">No intervention logs recorded yet.</div>
          ) : (
            <div className="space-y-3">
              {interventions.map(log => (
                <div key={log.id} className="w-full rounded-lg border border-slate-200 bg-white p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <button type="button" onClick={() => setSelectedIntervention(log)} className="min-w-0 flex-1 text-left">
                      <p className="text-sm font-bold text-gray-900">{log.activityType}</p>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 flex-wrap">
                        <span className="inline-flex items-center gap-1"><CalendarDaysIcon className="w-3.5 h-3.5" />{formatShortDate(log.interventionDate)}</span>
                        <span className="inline-flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" />{formatTimeRange(log.interventionDate, log.duration)}</span>
                        {log.followUps.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-blue-500">
                            <MessageSquarePlusIcon className="w-3.5 h-3.5" />{log.followUps.length} follow-up{log.followUps.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </button>
                    <div className="flex items-center gap-4 shrink-0">
                      <button type="button" onClick={e => { e.stopPropagation(); setSelectedIntervention(log); }}
                        className="text-xs font-medium text-blue-600 inline-flex items-center gap-0.5">
                        View Details <ChevronRightIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
