import { useState, useEffect } from 'react';
import {
  PrinterIcon, PlusIcon, CalendarDaysIcon,
  ChevronRightIcon, XCircleIcon, Loader2Icon
} from 'lucide-react';
import { InfoField, SectionCard, formatDate } from './shared';
import type { BcpcCaseDetailDTO, BcpcInterventionDTO } from '../../../service/bcpc-api/CaseDetail';
import { activateBpo, getInterventions, scheduleIntervention } from '../../../service/bcpc-api/CaseDetail';
import { getCaseTimeline } from '../../../service/blotter-api/DocketView';
import { ActionModal } from '../../../hooks/SuccessModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function printBpoRequestLetter(data: { caseNumber: string; childName: string; respondentName: string; officer: string }) {
  const formattedDate = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>BPO Request Letter — ${data.caseNumber}</title>
<style>
  @media print { @page { size: A4; margin: 25mm 20mm; } }
  body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; margin: 0; padding: 0; }
  .page { max-width: 680px; margin: 0 auto; padding: 40px; }
  .header { text-align: center; margin-bottom: 24px; }
  .header .brgy { font-size: 10pt; text-transform: uppercase; letter-spacing: 1px; color: #555; }
  .header .title { font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 8px 0 4px; }
  .header .sub { font-size: 10pt; color: #444; }
  hr { border: 2px solid #000; margin: 16px 0; }
  .ref-number { font-size: 10pt; margin-bottom: 20px; }
  .date-line { text-align: right; margin-bottom: 24px; }
  .addressee { margin-bottom: 20px; font-weight: bold; }
  .body-text { line-height: 1.8; margin-bottom: 14px; text-align: justify; }
  .indent { margin-left: 40px; }
  .signatory { margin-top: 48px; }
  .signatory .name { font-weight: bold; text-transform: uppercase; margin-top: 48px; }
  .signatory .title-label { font-size: 10pt; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="brgy">Republic of the Philippines</div>
    <div class="title">Barangay Child Protection Council</div>
    <div class="sub">Barangay Protection Order (BPO) Request</div>
  </div>
  <hr/>

  <p class="ref-number">Ref. Case No.: <strong>${data.caseNumber}</strong></p>
  <p class="date-line">${formattedDate}</p>

  <div class="addressee">
    To the Punong Barangay,<br/>
  </div>

  <p class="body-text">Greetings!</p>

  <p class="body-text">
    This is to formally request the issuance of a Barangay Protection Order (BPO) for the protection of 
    <strong>${data.childName}</strong> against the respondent <strong>${data.respondentName || '______________'}</strong>.
  </p>

  <p class="body-text indent">
    Following the initial assessment and mediation efforts conducted by the BCPC, it has been determined that the issuance of a BPO is necessary to ensure the immediate safety and welfare of the child.
  </p>

  <p class="body-text">
    Attached herewith are the preliminary case notes and assessments for your review and approval.
  </p>

  <div class="signatory">
    <p>Requested by,</p>
    <p class="name">${data.officer}</p>
    <p class="title-label">BCPC Assigned Officer / Social Worker</p>
  </div>
  
  <div class="signatory" style="margin-top: 80px;">
    <p>Approved and Issued by,</p>
    <p class="name">_________________________________</p>
    <p class="title-label">Punong Barangay</p>
  </div>
</div>
<script>window.onload = () => { window.print(); };</script>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=800,height=900');
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatShortDate(d: string) {
  try { return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return d; }
}

// ─── Add Intervention Modal ───────────────────────────────────────────────────

import { getBcpcOfficerOptions, type BcpcOfficerOptionDTO } from '../../../service/bcpc-api/BcpcFormService';

const ACTIVITY_TYPES = ['Assessment', 'Home Visit', 'Counseling', 'Case Conference', 'Safety Planning', 'Others'];

function AddInterventionModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (data: Omit<BcpcInterventionDTO, 'id'>) => void;
}) {
  const [activityType, setActivityType] = useState('Assessment');
  const [customType, setCustomType] = useState('');
  const [details, setDetails] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [officer, setOfficer] = useState('');
  const [error, setError] = useState('');
  
  // Officer dropdown state
  const [officers, setOfficers] = useState<BcpcOfficerOptionDTO[]>([]);
  const [officersLoading, setOfficersLoading] = useState(true);

  useEffect(() => {
    getBcpcOfficerOptions()
      .then(setOfficers)
      .catch(() => setOfficers([]))
      .finally(() => setOfficersLoading(false));
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const resolved = activityType === 'Others' ? customType.trim() : activityType;
    if (!resolved || !details.trim() || !date || !startTime || !officer) { 
      setError('Please fill in all required fields.'); 
      return; 
    }
    onSave({ 
      sessionType: resolved, 
      remarks: details.trim(), 
      scheduledDate: `${date}T${startTime}:00`, 
      conductedBy: officer,
      status: 'COMPLETED'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Intervention Log</h3>
        </div>
        <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
          {error && <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Intervention Type</label>
            <select value={activityType} onChange={e => setActivityType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
              {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          
          {activityType === 'Others' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specify Activity <span className="text-red-500">*</span></label>
              <input type="text" value={customType} onChange={e => setCustomType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Details <span className="text-red-500">*</span></label>
            <textarea rows={3} value={details} onChange={e => setDetails(e.target.value)} placeholder="Describe the intervention..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time <span className="text-red-500">*</span></label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Worker / Officer <span className="text-red-500">*</span></label>
            <select
              value={officer}
              onChange={(e) => setOfficer(e.target.value)}
              disabled={officersLoading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">
                {officersLoading ? 'Loading officers...' : '— Select Officer / Social Worker —'}
              </option>
              {officers.map((o) => (
                <option key={o.id} value={o.name}>
                  {o.name}{o.position ? ` — ${o.position}` : ''}
                </option>
              ))}
            </select>
          </div>
        </form>
        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-xl">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Save Log</button>
        </div>
      </div>
    </div>
  );
}

// ─── Intervention Details Modal ───────────────────────────────────────────────

function InterventionDetailsModal({ intervention, onClose }: {
  intervention: BcpcInterventionDTO; onClose: () => void;
}) {

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl max-h-[90vh] flex flex-col">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{intervention.sessionType}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{formatShortDate(intervention.scheduledDate)}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100"><XCircleIcon className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Details</p>
            <p className="text-sm text-gray-700 leading-relaxed">{intervention.remarks}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Performed By</p>
            <p className="text-sm text-gray-700">{intervention.conductedBy || '—'}</p>
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
  const [hasPrinted, setHasPrinted] = useState(false);
  const [bpoNumber, setBpoNumber] = useState('');
  const [bpoIssuedAt, setBpoIssuedAt] = useState('');
  const [bpoExpiredAt, setBpoExpiredAt] = useState('');
  const [activating, setActivating] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchInterventions = async () => {
    try {
      const data = await getInterventions(caseData.id);
      setInterventions(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getCaseTimeline(caseData.caseNumber).then(timeline => {
      const bpoEvent = timeline.find(e => e.eventType === 'BPO_ISSUED');
      if (bpoEvent) {
        setIsActive(true);
        // The description is like: "Barangay Protection Order BPO-BCPC-2026-0707 has been activated and is valid for 15 days."
        const match = bpoEvent.description.match(/BPO-BCPC-[0-9-]+/);
        if (match) setBpoNumber(match[0]);
        else setBpoNumber('BPO-ACTIVATED');
        
        const issuedDate = new Date(bpoEvent.eventDate);
        setBpoIssuedAt(issuedDate.toISOString().slice(0, 10));
        
        const expiryDate = new Date(issuedDate.getTime() + 15 * 86400000);
        setBpoExpiredAt(expiryDate.toISOString().slice(0, 10));
        
        
        fetchInterventions(); // load actual interventions from backend
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [caseData.caseNumber]);

  const [interventions, setInterventions] = useState<BcpcInterventionDTO[]>([]);
  const [showAddLog, setShowAddLog] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<BcpcInterventionDTO | null>(null);
  const [successModal, setSuccessModal] = useState<{ open: boolean; msg: string }>({ open: false, msg: '' });

  const showSuccess = (msg: string) => setSuccessModal({ open: true, msg });

  const isExpiringSoon = (() => {
    if (!bpoExpiredAt) return false;
    // eslint-disable-next-line react-hooks/purity
    return new Date(bpoExpiredAt).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;
  })();

  const handleActivate = async () => {
    setActivating(true);
    const now = new Date();
    const expiry = new Date(now.getTime() + 15 * 86400000);
    const newBpoNum = `BPO-BCPC-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    
    try {
      await activateBpo(caseData.id, newBpoNum);
      setBpoNumber(newBpoNum);
      setBpoIssuedAt(now.toISOString().slice(0, 10));
      setBpoExpiredAt(expiry.toISOString().slice(0, 10));
      fetchInterventions();
      setIsActive(true);
      setActivating(false);
      showSuccess('BPO activated successfully. 15-day validity period has started.');
    } catch (err: any) {
      console.error(err);
      setActivating(false);
      alert('Failed to activate BPO. Please check the backend connection.');
    }
  };

  const handleAddIntervention = async (data: Omit<BcpcInterventionDTO, 'id'>) => {
    try {
      await scheduleIntervention(caseData.id, data);
      setShowAddLog(false);
      showSuccess('Intervention log saved successfully.');
      fetchInterventions();
    } catch (err) {
      console.error(err);
      alert('Failed to save intervention log.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Modals */}
      {showAddLog && <AddInterventionModal onClose={() => setShowAddLog(false)} onSave={handleAddIntervention} />}
      {selectedIntervention && (
        <InterventionDetailsModal
          intervention={selectedIntervention}
          onClose={() => setSelectedIntervention(null)}
        />
      )}

      {/* Success Modal */}
      <ActionModal
        isOpen={successModal.open}
        onClose={() => setSuccessModal({ open: false, msg: '' })}
        title="Success"
        type="success"
      >
        {successModal.msg}
      </ActionModal>

      {/* ── BPO DETAILS CARD ── */}
      {loading ? (
        <div className="flex justify-center items-center py-12 text-gray-400">
          <Loader2Icon className="w-8 h-8 animate-spin" />
        </div>
      ) : (
      <>
      <SectionCard
        title="Barangay Protection Order Details"
        action={
          !isActive && !isReadOnly ? (
            <div className="flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    printBpoRequestLetter({
                      caseNumber: caseData.caseNumber,
                      childName: childFullName,
                      respondentName: respondentFullName,
                      officer: caseData.assignedOfficer || 'BCPC Officer',
                    });
                    setHasPrinted(true);
                    showSuccess('BPO Request Letter generated. Please have the Punong Barangay sign it before activating.');
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
                >
                  <PrinterIcon className="w-3.5 h-3.5" /> Print BPO Request Letter
                </button>
                <div className="relative group">
                  <button
                    onClick={handleActivate}
                    disabled={activating || !hasPrinted}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {activating ? 'Activating...' : 'Activate BPO (Post-Signature)'}
                  </button>
                  {!hasPrinted && (
                    <div className="absolute right-0 top-full mt-1.5 w-60 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                      Print the BPO Request Letter first and have the Punong Barangay sign it before activating.
                    </div>
                  )}
                </div>
              </div>
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
                      <p className="text-sm font-bold text-gray-900">{log.sessionType}</p>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 flex-wrap">
                        <span className="inline-flex items-center gap-1"><CalendarDaysIcon className="w-3.5 h-3.5" />{formatShortDate(log.scheduledDate)}</span>
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
      </>
      )}
    </div>
  );
}
