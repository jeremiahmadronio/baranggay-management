import { useEffect, useState, useCallback } from 'react';
import { ChevronLeftIcon } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { OverviewTab } from './OverviewTab';
import { MediationTab } from './MediationTab';
import { InterventionTab } from './InterventionTab';
import { NotesTab } from './NotesTab';
import { ReferralsTab } from './ReferralsTab';
import { BpoTab } from './BpoTab';
import { TimelineTab } from './TimelineTab';
import { SkeletonBlock, formatDate } from './shared';
import type {
  ActiveTab,
} from './shared';

import {
  getCaseDetail,
  updateCaseStatus,
} from '../../../service/bcpc-api/CaseDetail';
import type { BcpcCaseDetailDTO } from '../../../service/bcpc-api/CaseDetail';

import {
  getCaseNotes,
  addCaseNote,
} from '../../../service/blotter-api/DocketView';
import type { CaseNoteViewDTO } from '../../../service/blotter-api/DocketView';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  ONGOING: 'Ongoing',
  UNDER_INTERVENTION: 'Under Intervention',
  UNDER_MEDIATION: 'Under Intervention', // Map it in case Blotter enum is used
  RESOLVED: 'Resolved',
  SETTLED: 'Resolved',
  REFERRED: 'Referred',
  CERTIFIED_TO_FILE_ACTION: 'Certified to File Action',
  WITHDRAWN: 'Withdrawn',
  DISMISSED: 'Dismissed',
};

const STATUS_PILL: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  ONGOING: 'bg-blue-50 text-blue-700 border border-blue-200',
  UNDER_INTERVENTION: 'bg-sky-50 text-sky-700 border border-sky-200',
  UNDER_MEDIATION: 'bg-sky-50 text-sky-700 border border-sky-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  SETTLED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  REFERRED: 'bg-violet-50 text-violet-700 border border-violet-200',
  CERTIFIED_TO_FILE_ACTION: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  WITHDRAWN: 'bg-gray-100 text-gray-600 border border-gray-200',
  DISMISSED: 'bg-rose-50 text-rose-700 border border-rose-200',
};

export default function BcpcCaseDetailsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawId = searchParams.get('id') || '1';
  const id: number = Number(rawId);

  const [caseData, setCaseData] = useState<BcpcCaseDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  const [notes, setNotes] = useState<CaseNoteViewDTO[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);

  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteError, setNoteError] = useState('');

  const [showWithdrawInput, setShowWithdrawInput] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // ── Fetch case ─────────────────────────────────────────────────────────────
  const fetchCase = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isNaN(id)) throw new Error('Invalid case ID');
      const data = await getCaseDetail(id);
      setCaseData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load case details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadNotes = useCallback(async () => {
    if (!caseData?.caseNumber) return;
    setNotesLoading(true);
    try {
      const data = await getCaseNotes(caseData.caseNumber);
      setNotes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setNotesLoading(false);
    }
  }, [caseData?.caseNumber]);



  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  useEffect(() => {
    if (activeTab === 'notes') loadNotes();
  }, [activeTab, loadNotes]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const childFullName = caseData
    ? [caseData.childFirstName, caseData.childMiddleName, caseData.childLastName]
        .filter(Boolean)
        .join(' ')
    : 'Case Record';

  const respondentFullName = caseData
    ? [
        caseData.respondentFirstName,
        caseData.respondentMiddleName,
        caseData.respondentLastName,
      ]
        .filter(Boolean)
        .join(' ')
    : '';

  const caseStatus = (caseData?.caseStatus || '').toUpperCase();
  const isReadOnly =
    caseStatus === 'WITHDRAWN' ||
    caseStatus === 'RESOLVED' ||
    caseStatus === 'SETTLED' ||
    caseStatus === 'DISMISSED' ||
    caseStatus === 'CERTIFIED_TO_FILE_ACTION' ||
    caseStatus === 'ISSUED_REFERRAL' ||
    caseStatus === 'REFERRED';

  // ── Note handler ───────────────────────────────────────────────────────────
  const handleAddNote = async () => {
    if (!noteText.trim() || !caseData) return;
    setNoteLoading(true);
    setNoteError('');
    try {
      await addCaseNote({
        blotterNumber: caseData.caseNumber,
        note: noteText.trim(),
        attachments: [], // if supported
      });
      setNoteText('');
      setShowNoteInput(false);
      loadNotes();
    } catch (err: any) {
      setNoteError(err.message || 'Failed to add note');
    } finally {
      setNoteLoading(false);
    }
  };

  // ── Withdraw handler ────────────────────────────────────────────────────────
  const handleWithdrawCase = async () => {
    if (!withdrawReason.trim() || !caseData) {
      setWithdrawError('Reason is required.');
      return;
    }
    setWithdrawLoading(true);
    setWithdrawError('');
    try {
      await updateCaseStatus(caseData.id, 'WITHDRAWN', withdrawReason);
      setShowWithdrawInput(false);
      setWithdrawReason('');
      fetchCase(); // Refresh case to get new status
    } catch (err: any) {
      setWithdrawError(err.message || 'Failed to withdraw case.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  // ── Tab definitions ────────────────────────────────────────────────────────
  const tabDefs: { key: ActiveTab; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'mediation', label: 'Mediation' },
    { key: 'notes', label: 'Case Notes', count: notes.length || undefined },
    { key: 'referrals', label: 'Referrals' },
    { key: 'bpo', label: 'BPO' },
    { key: 'timeline', label: 'Timeline' },
  ];

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto px-6 py-6 space-y-5">
          <div className="flex flex-col gap-2">
            <SkeletonBlock className="h-4 w-36" />
            <SkeletonBlock className="h-8 w-72" />
            <SkeletonBlock className="h-4 w-56" />
          </div>
          <div className="flex flex-col gap-5">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6"
              >
                <SkeletonBlock className="h-4 w-36" />
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="flex flex-col gap-1.5">
                      <SkeletonBlock className="h-3 w-20" />
                      <SkeletonBlock className="h-4 w-32" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error || !caseData) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto px-6 py-6 space-y-5">
          <button
            onClick={() => navigate('/bcpc/case-management')}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Back to Case Management
          </button>
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-24 text-red-500">
            <p className="text-sm font-medium">{error || 'Case not found.'}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <div className="mx-auto px-6 py-6 space-y-5">
        {/* ── HEADER ── */}
        <div>
          <button
            onClick={() => navigate('/bcpc/case-management')}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4" /> Back to Case Management
          </button>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {caseData.caseNumber}
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                STATUS_PILL[caseStatus] ?? 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}
            >
              {STATUS_LABEL[caseStatus] ?? caseStatus}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {caseData.natureOfComplaint || 'BCPC Case'} — {childFullName}
          </p>
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
          {tabDefs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                    activeTab === tab.key
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── TAB CONTENT ── */}
        {activeTab === 'overview' && (
          <OverviewTab
            caseData={caseData}
            childFullName={childFullName}
            respondentFullName={respondentFullName}
            caseStatus={caseStatus}
            isReadOnly={isReadOnly}
            showWithdrawInput={showWithdrawInput}
            withdrawReason={withdrawReason}
            withdrawError={withdrawError}
            withdrawLoading={withdrawLoading}
            onShowWithdrawInput={(show) => {
              setShowWithdrawInput(show);
              if (!show) { setWithdrawReason(''); setWithdrawError(''); }
            }}
            onWithdrawReasonChange={setWithdrawReason}
            onWithdrawCase={handleWithdrawCase}
            onGoToMediation={() => setActiveTab('mediation')}
            onGoToBpo={() => setActiveTab('bpo')}
            onGoToReferrals={() => setActiveTab('referrals')}
          />
        )}

        {activeTab === 'mediation' && (
          <MediationTab
            caseId={id}
            isReadOnly={isReadOnly}
            caseNumber={caseData.caseNumber}
            childName={childFullName}
            respondentName={respondentFullName}
            natureOfComplaint={caseData.natureOfComplaint}
          />
        )}



        {activeTab === 'notes' && (
          <NotesTab
            notes={notes as any}
            isReadOnly={isReadOnly}
            notesLoading={notesLoading}
            showNoteInput={showNoteInput}
            noteText={noteText}
            noteLoading={noteLoading}
            noteError={noteError}
            onShowNoteInput={(show) => {
              setShowNoteInput(show);
              if (!show) {
                setNoteText('');
                setNoteError('');
              }
            }}
            onNoteTextChange={setNoteText}
            onSaveNote={handleAddNote}
            formatDate={formatDate}
          />
        )}

        {activeTab === 'referrals' && (
          <ReferralsTab 
            caseId={id} 
            isReadOnly={isReadOnly}
            caseNumber={caseData.caseNumber}
            childName={childFullName}
            onRefresh={fetchCase}
          />
        )}

        {activeTab === 'bpo' && (
          <BpoTab
            caseData={caseData}
            childFullName={childFullName}
            respondentFullName={respondentFullName}
            isReadOnly={isReadOnly}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineTab caseNumber={caseData.caseNumber} />
        )}
      </div>
    </div>
  );
}
