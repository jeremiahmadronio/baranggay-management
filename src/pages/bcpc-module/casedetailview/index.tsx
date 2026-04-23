import { useEffect, useState } from 'react';
import { ChevronLeftIcon } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { OverviewTab } from './OverviewTab';
import { MediationTab } from './MediationTab';
import { NotesTab } from './NotesTab';
import { ReferralsTab } from './ReferralsTab';
import { BpoTab } from './BpoTab';
import { TimelineTab } from './TimelineTab';
import { SkeletonBlock, formatDate } from './shared';
import type {
  ActiveTab,
  BcpcCaseDetailDTO,
  BcpcCaseNote,
  BcpcTimelineEvent,
} from './shared';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CASES: BcpcCaseDetailDTO[] = [
  {
    id: 1,
    caseNumber: 'BCPC-2026-0001',
    childFirstName: 'Maria',
    childMiddleName: 'Santos',
    childLastName: 'Dela Cruz',
    childAge: 10,
    childGender: 'Female',
    childAddress: '123 Sampaguita St., Brgy. Poblacion, Valenzuela City',
    childContact: '09171234567',
    respondentFirstName: 'Jose',
    respondentLastName: 'Dela Cruz',
    respondentRelationship: 'Parent',
    respondentAddress: '123 Sampaguita St., Brgy. Poblacion, Valenzuela City',
    respondentContact: '09181234567',
    caseStatus: 'PENDING',
    caseType: 'Physical Abuse',
    violenceTypes: 'Physical, Psychological',
    dateFiled: '2026-01-05',
    incidentDate: '2026-01-03',
    incidentTime: '14:30',
    incidentLocation: 'Residence of the respondent',
    narrative:
      'The child reported recurring physical abuse by her father. Multiple bruises were noted during initial assessment by the BCPC desk officer.',
    assignedOfficer: 'Off. Reyes',
    natureOfComplaint: 'Child Abuse',
  },
  {
    id: 2,
    caseNumber: 'BCPC-2026-0002',
    childFirstName: 'Juan',
    childLastName: 'Santos',
    childAge: 8,
    childGender: 'Male',
    childAddress: '456 Rosal St., Brgy. Lingunan, Valenzuela City',
    respondentFirstName: 'Ana',
    respondentLastName: 'Santos',
    respondentRelationship: 'Parent',
    caseStatus: 'ONGOING',
    caseType: 'Neglect',
    violenceTypes: 'Neglect',
    dateFiled: '2026-01-10',
    incidentDate: '2026-01-08',
    incidentLocation: 'Home',
    narrative: 'Child found unsupervised for extended periods without adequate food and care.',
    assignedOfficer: 'Off. Mendoza',
    natureOfComplaint: 'Child Neglect',
  },
  {
    id: 3, caseNumber: 'BCPC-2026-0003', childFirstName: 'Luz', childLastName: 'Garcia', childAge: 12, childGender: 'Female', caseStatus: 'RESOLVED', dateFiled: '2026-01-14', assignedOfficer: 'Off. Reyes', natureOfComplaint: 'Child Labor',
  },
  {
    id: 4, caseNumber: 'BCPC-2026-0004', childFirstName: 'Rosa', childLastName: 'Villanueva', childAge: 9, childGender: 'Female', caseStatus: 'UNDER_INTERVENTION', dateFiled: '2026-01-18', assignedOfficer: 'Off. Cruz', natureOfComplaint: 'Physical Abuse',
  },
  {
    id: 5, caseNumber: 'BCPC-2026-0005', childFirstName: 'Elena', childLastName: 'Bautista', childAge: 11, childGender: 'Female', caseStatus: 'REFERRED', dateFiled: '2026-01-22', assignedOfficer: 'Off. Mendoza', natureOfComplaint: 'Psychological Abuse',
  },
  {
    id: 6, caseNumber: 'BCPC-2026-0006', childFirstName: 'Carmen', childLastName: 'Lopez', childAge: 7, childGender: 'Female', caseStatus: 'CERTIFIED_TO_FILE_ACTION', dateFiled: '2026-02-01', assignedOfficer: 'Off. Cruz', natureOfComplaint: 'Sexual Abuse',
  },
  {
    id: 7, caseNumber: 'BCPC-2026-0007', childFirstName: 'Imelda', childLastName: 'Torres', childAge: 13, childGender: 'Female', caseStatus: 'DISMISSED', dateFiled: '2026-02-05', assignedOfficer: 'Off. Reyes', natureOfComplaint: 'Economic Abuse',
  },
  {
    id: 8, caseNumber: 'BCPC-2026-0008', childFirstName: 'Norma', childLastName: 'Aquino', childAge: 6, childGender: 'Female', caseStatus: 'WITHDRAWN', dateFiled: '2026-02-09', assignedOfficer: 'Off. Mendoza', natureOfComplaint: 'Child Neglect',
  },
  {
    id: 9, caseNumber: 'BCPC-2026-0009', childFirstName: 'Gloria', childLastName: 'Ramos', childAge: 14, childGender: 'Female', caseStatus: 'PENDING', dateFiled: '2026-02-14', assignedOfficer: 'Off. Cruz', natureOfComplaint: 'Psychological Abuse',
  },
  {
    id: 10, caseNumber: 'BCPC-2026-0010', childFirstName: 'Perla', childLastName: 'Castillo', childAge: 5, childGender: 'Female', caseStatus: 'ONGOING', dateFiled: '2026-02-18', assignedOfficer: 'Off. Reyes', natureOfComplaint: 'Sexual Abuse',
  },
  {
    id: 11, caseNumber: 'BCPC-2026-0011', childFirstName: 'Josefa', childLastName: 'Navarro', childAge: 10, childGender: 'Female', caseStatus: 'RESOLVED', dateFiled: '2026-02-22', assignedOfficer: 'Off. Cruz', natureOfComplaint: 'Physical Abuse',
  },
  {
    id: 12, caseNumber: 'BCPC-2026-0012', childFirstName: 'Teresita', childLastName: 'Soriano', childAge: 8, childGender: 'Female', caseStatus: 'PENDING', dateFiled: '2026-03-01', assignedOfficer: 'Off. Mendoza', natureOfComplaint: 'Child Labor',
  },
  {
    id: 13, caseNumber: 'BCPC-2026-0013', childFirstName: 'Maribel', childLastName: 'Abad', childAge: 11, childGender: 'Female', caseStatus: 'UNDER_INTERVENTION', dateFiled: '2026-03-05', assignedOfficer: 'Off. Reyes', natureOfComplaint: 'Psychological Abuse',
  },
  {
    id: 14, caseNumber: 'BCPC-2026-0014', childFirstName: 'Corazon', childLastName: 'Manalang', childAge: 9, childGender: 'Female', caseStatus: 'REFERRED', dateFiled: '2026-03-09', assignedOfficer: 'Off. Cruz', natureOfComplaint: 'Sexual Abuse',
  },
  {
    id: 15, caseNumber: 'BCPC-2026-0015', childFirstName: 'Florencia', childLastName: 'Padilla', childAge: 7, childGender: 'Female', caseStatus: 'ONGOING', dateFiled: '2026-03-14', assignedOfficer: 'Off. Mendoza', natureOfComplaint: 'Physical Abuse',
  },
];

const MOCK_NOTES: BcpcCaseNote[] = [
  {
    id: 1,
    note: 'Initial assessment conducted. Child is currently residing with maternal grandmother.',
    createdBy: 'MSW Joana Reyes',
    createdAt: '2026-01-06T09:00:00',
  },
  {
    id: 2,
    note: 'Follow-up home visit completed. No signs of further abuse observed.',
    createdBy: 'MSW Joana Reyes',
    createdAt: '2026-01-12T14:30:00',
  },
];

const MOCK_TIMELINE: BcpcTimelineEvent[] = [
  {
    id: 1,
    eventType: 'CASE_FILED',
    title: 'Case Filed',
    description: 'BCPC case was filed and assigned to Off. Reyes.',
    performedBy: 'Off. Reyes',
    eventDate: '2026-01-05T08:00:00',
  },
  {
    id: 2,
    eventType: 'ASSESSMENT',
    title: 'Initial Assessment Conducted',
    description:
      'Social worker conducted initial assessment of the child. Child is currently in a safe environment.',
    performedBy: 'MSW Joana Reyes',
    eventDate: '2026-01-06T09:30:00',
  },
  {
    id: 3,
    eventType: 'HOME_VISIT',
    title: 'Home Visit',
    description: 'Follow-up home visit completed. Situation is stable.',
    performedBy: 'MSW Joana Reyes',
    eventDate: '2026-01-12T14:30:00',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  ONGOING: 'Ongoing',
  UNDER_INTERVENTION: 'Under Intervention',
  RESOLVED: 'Resolved',
  REFERRED: 'Referred',
  CERTIFIED_TO_FILE_ACTION: 'Certified to File Action',
  WITHDRAWN: 'Withdrawn',
  DISMISSED: 'Dismissed',
};

const STATUS_PILL: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  ONGOING: 'bg-blue-50 text-blue-700 border border-blue-200',
  UNDER_INTERVENTION: 'bg-sky-50 text-sky-700 border border-sky-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  REFERRED: 'bg-violet-50 text-violet-700 border border-violet-200',
  CERTIFIED_TO_FILE_ACTION: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  WITHDRAWN: 'bg-gray-100 text-gray-600 border border-gray-200',
  DISMISSED: 'bg-rose-50 text-rose-700 border border-rose-200',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function BcpcCaseDetailsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = Number(searchParams.get('id') || '1');

  const [caseData, setCaseData] = useState<BcpcCaseDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  const [notes, setNotes] = useState<BcpcCaseNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);

  const [timeline, setTimeline] = useState<BcpcTimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteError, setNoteError] = useState('');

  const [showWithdrawInput, setShowWithdrawInput] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // ── Fetch case ─────────────────────────────────────────────────────────────
  const fetchCase = () => {
    setLoading(true);
    setError(null);
    try {
      const found = MOCK_CASES.find((c) => c.id === id) ?? null;
      if (!found) {
        setError('Case not found.');
      }
      setCaseData(found);
    } catch {
      setError('Failed to load case details.');
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = () => {
    setNotesLoading(true);
    setTimeout(() => {
      setNotes(MOCK_NOTES);
      setNotesLoading(false);
    }, 300);
  };

  const loadTimeline = () => {
    setTimelineLoading(true);
    setTimeout(() => {
      setTimeline(MOCK_TIMELINE);
      setTimelineLoading(false);
    }, 300);
  };

  useEffect(() => {
    fetchCase();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'notes') loadNotes();
  }, [activeTab, id]);

  useEffect(() => {
    if (activeTab === 'timeline' && timeline.length === 0) loadTimeline();
  }, [activeTab, id]);

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
    caseStatus === 'DISMISSED' ||
    caseStatus === 'CERTIFIED_TO_FILE_ACTION';

  // ── Note handler ───────────────────────────────────────────────────────────
  const handleAddNote = () => {
    if (!noteText.trim()) return;
    setNoteLoading(true);
    setNoteError('');
    setTimeout(() => {
      const newNote: BcpcCaseNote = {
        id: Date.now(),
        note: noteText.trim(),
        createdBy: 'Current User',
        createdAt: new Date().toISOString(),
      };
      setNotes((prev) => [newNote, ...prev]);
      setNoteText('');
      setShowNoteInput(false);
      setNoteLoading(false);
    }, 500);
  };

  // ── Withdraw handler ────────────────────────────────────────────────────────
  const handleWithdrawCase = () => {
    if (!withdrawReason.trim()) {
      setWithdrawError('Reason is required.');
      return;
    }
    setWithdrawLoading(true);
    setWithdrawError('');
    setTimeout(() => {
      setCaseData((prev) => prev ? { ...prev, caseStatus: 'WITHDRAWN' } : prev);
      setShowWithdrawInput(false);
      setWithdrawReason('');
      setWithdrawLoading(false);
    }, 600);
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
            caseNumber={caseData.caseNumber || ''}
            childName={childFullName}
            respondentName={respondentFullName}
            natureOfComplaint={caseData.natureOfComplaint || ''}
          />
        )}

        {activeTab === 'notes' && (
          <NotesTab
            notes={notes}
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
          <ReferralsTab caseId={id} isReadOnly={isReadOnly} />
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
          <TimelineTab
            timeline={timeline}
            timelineLoading={timelineLoading}
            formatDate={formatDate}
          />
        )}
      </div>
    </div>
  );
}
