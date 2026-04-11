'use client';

import { useEffect, useState } from 'react';
import { ChevronLeftIcon } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  activateBpo,
  addCaseNote,
  addFollowUp,
  addIntervention,
  getAssignOfficerOptions,
  getBpoDetails,
  getCaseNotes,
  getCaseTimeline,
  getInterventionDetails,
  getInterventionLogs,
  getVawcCaseDetails,
  withdrawVawcCase,
  type AssignOfficerOptionDTO,
  type BpoDetails,
  type CaseNoteViewDTO,
  type CaseTimeLineDTO,
  type CaseViewDTO,
  type FollowUpViewDTO,
  type InterventionViewDTO,
} from '../../../service/vawc-api/vawc-api';
import { ActionModal } from '../../../hooks/SuccessModal';
import { BpoTab } from './BpoTab';
import { CfaTab } from './CfaTab';
import { NotesTab } from './NotesTab';
import { OverviewTab } from './OverviewTab';
import { TimelineTab } from './TimelineTab';
import { SkeletonBlock, formatDate } from './shared';
import type { ActiveTab } from './shared';

type LocalFollowUpViewDTO = FollowUpViewDTO & {
  pendingSync?: boolean;
};

type LocalInterventionViewDTO = InterventionViewDTO & {
  followUps: LocalFollowUpViewDTO[];
  pendingSync?: boolean;
};

export default function CaseDetailsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = Number(searchParams.get('id') || '1');

  const [caseData, setCaseData] = useState<CaseViewDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  const [bpoDetails, setBpoDetails] = useState<BpoDetails | null>(null);
  const [bpoLoading, setBpoLoading] = useState(false);
  const [notes, setNotes] = useState<CaseNoteViewDTO[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [timeline, setTimeline] = useState<CaseTimeLineDTO[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteError, setNoteError] = useState('');

  const [bpoActionLoading, setBpoActionLoading] = useState(false);
  const [bpoActionMessage, setBpoActionMessage] = useState('');
  const [assignOfficerOptions, setAssignOfficerOptions] = useState<AssignOfficerOptionDTO[]>([]);
  const [assignOfficerLoading, setAssignOfficerLoading] = useState(false);
  const [interventionForm, setInterventionForm] = useState({
    activityType: 'Assessment',
    customActivityType: '',
    interventionDetails: '',
    interventionDate: '',
    startTime: '',
    endTime: '',
    performedByEmployeeIds: [] as number[],
  });
  const [interventionLoading, setInterventionLoading] = useState(false);
  const [interventionError, setInterventionError] = useState('');
  const [interventionMessage, setInterventionMessage] = useState('');
  const [selectedInterventionId, setSelectedInterventionId] = useState<number | null>(null);
  const [interventionDetails, setInterventionDetails] = useState<LocalInterventionViewDTO | null>(null);
  const [interventionDetailsLoading, setInterventionDetailsLoading] = useState(false);
  const [interventionDetailsError, setInterventionDetailsError] = useState('');
  const [interventionLogs, setInterventionLogs] = useState<LocalInterventionViewDTO[]>([]);
  const [interventionLogsLoading, setInterventionLogsLoading] = useState(false);
  const [followUpText, setFollowUpText] = useState('');
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpError, setFollowUpError] = useState('');
  const [followUpMessage, setFollowUpMessage] = useState('');
  const [showFollowUpSuccess, setShowFollowUpSuccess] = useState(false);

  const [showWithdrawInput, setShowWithdrawInput] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawMessage, setWithdrawMessage] = useState('');


  const activeUserId = localStorage.getItem('userId') || 'anonymous';
  const interventionCacheKey = `vawc:intervention-logs:${activeUserId}:${id}`;

  const readCachedInterventionLogs = (): LocalInterventionViewDTO[] => {
    try {
      const raw = localStorage.getItem(interventionCacheKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as LocalInterventionViewDTO[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeCachedInterventionLogs = (logs: LocalInterventionViewDTO[]) => {
    try {
      localStorage.setItem(interventionCacheKey, JSON.stringify(logs));
    } catch {
      // Ignore cache write failures (quota/private mode).
    }
  };

  const updateInterventionLog = (
    interventionId: number,
    updater: (current: LocalInterventionViewDTO) => LocalInterventionViewDTO,
  ) => {
    setInterventionLogs((currentLogs) => {
      const nextLogs = currentLogs.map((log) => (
        log.id === interventionId ? updater(log) : log
      ));
      writeCachedInterventionLogs(nextLogs);
      return nextLogs;
    });
  };

  const fetchCase = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getVawcCaseDetails(id);
      setCaseData(data);
    } catch (err) {
      console.error('Error fetching case details:', err);
      setError('Failed to load case details.');
    } finally {
      setLoading(false);
    }
  };

  const loadBpoDetails = async () => {
    try {
      setBpoLoading(true);
      const data = await getBpoDetails(id);
      setBpoDetails(data);
    } catch (err) {
      console.error('Failed to load BPO details:', err);
    } finally {
      setBpoLoading(false);
    }
  };

  const loadNotes = async () => {
    try {
      setNotesLoading(true);
      const data = await getCaseNotes(id);
      setNotes(data);
    } catch (err) {
      console.error('Failed to load case notes:', err);
    } finally {
      setNotesLoading(false);
    }
  };

  const loadTimeline = async () => {
    try {
      setTimelineLoading(true);
      const data = await getCaseTimeline(String(id));
      setTimeline(data);
    } catch (err) {
      console.error('Failed to load timeline:', err);
    } finally {
      setTimelineLoading(false);
    }
  };

  const loadAssignOfficerOptions = async () => {
    try {
      setAssignOfficerLoading(true);
      const data = await getAssignOfficerOptions();
      setAssignOfficerOptions(data);
    } catch (err) {
      console.error('Failed to load assign officer options:', err);
      setAssignOfficerOptions([]);
    } finally {
      setAssignOfficerLoading(false);
    }
  };

  const loadInterventionLogs = async (bpoId: number): Promise<LocalInterventionViewDTO[]> => {
    const cachedLogs = readCachedInterventionLogs();
    try {
      setInterventionLogsLoading(true);
      const data = await getInterventionLogs(bpoId);

      if (Array.isArray(data) && data.length > 0) {
        const normalizedLogs = data.map((log) => ({ ...log, pendingSync: false }));
        setInterventionLogs(normalizedLogs);
        writeCachedInterventionLogs(normalizedLogs);
        return normalizedLogs;
      }

      // API returned empty — keep current in-memory logs if we have any (e.g. optimistic entries)
      // Only fall back to cache or empty if there's nothing in state either
      const currentLogs = interventionLogs;
      if (currentLogs.length > 0) {
        return currentLogs;
      }
      if (cachedLogs.length > 0) {
        setInterventionLogs(cachedLogs);
        return cachedLogs;
      }

      setInterventionLogs([]);
      return [];
    } catch (err) {
      console.error('Failed to load intervention logs:', err);
      if (interventionLogs.length > 0) {
        return interventionLogs;
      }
      if (cachedLogs.length > 0) {
        setInterventionLogs(cachedLogs);
        return cachedLogs;
      }
      return [];
    } finally {
      setInterventionLogsLoading(false);
    }
  };

  useEffect(() => {
    void fetchCase();
    void loadBpoDetails();
  }, [id]);

  const victimFullName = [caseData?.firstName, caseData?.middleName, caseData?.lastName]
    .filter(Boolean)
    .join(' ') || 'Case Record';

  const respondentFullName = [
    caseData?.respondentFirstName,
    caseData?.respondentMiddleName,
    caseData?.respondentLastName,
  ]
    .filter(Boolean)
    .join(' ');

  const bpoTimelineEntries: CaseTimeLineDTO[] = bpoDetails?.bpoIssuedAt ? [
    {
      id: -1000,
      eventType: 'BPO_ISSUED',
      title: 'BPO Issued',
      description: `Barangay Protection Order ${bpoDetails.bpoNumber || ''} was recorded for this case.`.trim(),
      performedBy: bpoDetails.assignOfficer || 'System',
      eventDate: bpoDetails.bpoIssuedAt,
    },
  ] : [];

  const filedTimelineEntries: CaseTimeLineDTO[] = caseData ? [
    {
      id: -5000,
      eventType: 'CASE_FILED',
      title: 'Case Filed',
      description: `${victimFullName} filed a ${caseData.natureOfComplaint || 'VAWC'} complaint against ${respondentFullName || 'the respondent'} regarding an incident at ${caseData.incidentLocation || 'the recorded location'}. Assigned officer: ${caseData.assignOfficer || 'Unassigned'}.`,
      performedBy: caseData.caseFiledBy || victimFullName || 'System',
      eventDate: caseData.dateFiled,
    },
  ] : [];

  const interventionTimelineEntries: CaseTimeLineDTO[] = interventionLogs.flatMap((log) => {
    const interventionEvent: CaseTimeLineDTO = {
      id: -(log.id * 1000 + 1),
      eventType: 'INTERVENTION_LOG',
      title: `${log.activityType} intervention logged`,
      description: log.details || 'An intervention activity was recorded under BPO management.',
      performedBy: log.performedBy.join(', ') || log.createdBy || 'System',
      eventDate: log.interventionDate,
    };

    const followUpEvents = ((log.followUps ?? []) as LocalFollowUpViewDTO[]).map((followUp, index) => ({
      id: -(log.id * 1000 + 100 + index),
      eventType: followUp.pendingSync ? 'FOLLOW_UP_PENDING' : 'FOLLOW_UP_LOG',
      title: 'Intervention follow-up recorded',
      description: followUp.notes || 'A follow-up note was added to the intervention log.',
      performedBy: followUp.createdBy || 'System',
      eventDate: followUp.createdAt,
    }));

    return [interventionEvent, ...followUpEvents];
  });

  const displayTimeline = [...timeline, ...filedTimelineEntries, ...bpoTimelineEntries, ...interventionTimelineEntries]
    .filter((entry, index, items) => {
      const dedupeKey = [entry.eventType, entry.title, entry.eventDate, entry.description].join('|');
      return items.findIndex((item) => [item.eventType, item.title, item.eventDate, item.description].join('|') === dedupeKey) === index;
    })
    .sort((left, right) => new Date(right.eventDate).getTime() - new Date(left.eventDate).getTime());

  useEffect(() => {
    if (activeTab !== 'bpo' || bpoDetails) return;
    void loadBpoDetails();
  }, [activeTab, bpoDetails, id]);

  useEffect(() => {
    if (activeTab !== 'bpo' || assignOfficerOptions.length > 0) return;
    void loadAssignOfficerOptions();
  }, [activeTab, assignOfficerOptions.length]);

  useEffect(() => {
    if (activeTab !== 'bpo' || !bpoDetails?.id || !bpoDetails?.bpoNumber) return;
    // Only load from API if we don't already have logs in state
    if (interventionLogs.length === 0) {
      void loadInterventionLogs(bpoDetails.id);
    }
  }, [activeTab, bpoDetails?.id]);

  useEffect(() => {
    if (activeTab !== 'notes') return;
    void loadNotes();
  }, [activeTab, id]);

  useEffect(() => {
    if (activeTab !== 'timeline' || timeline.length > 0) return;

    void loadTimeline();
  }, [activeTab, id, timeline.length]);

  const handleAddNote = async () => {
    if ((caseData?.caseStatus || '').toUpperCase() === 'WITHDRAWN') {
      setNoteError('Withdrawn cases are read-only.');
      return;
    }

    if (!caseData?.caseNumber || !noteText.trim()) return;

    try {
      setNoteLoading(true);
      setNoteError('');
      await addCaseNote({
        blotterNumber: caseData.caseNumber,
        note: noteText.trim(),
      });
      setNoteText('');
      setShowNoteInput(false);
      await Promise.all([loadNotes(), loadTimeline()]);
    } catch (err) {
      setNoteError(err instanceof Error ? err.message : 'Failed to add note.');
    } finally {
      setNoteLoading(false);
    }
  };

  const handleActivateBpo = async () => {
    if ((caseData?.caseStatus || '').toUpperCase() === 'WITHDRAWN') {
      setBpoActionMessage('Withdrawn cases are read-only.');
      return;
    }

    try {
      setBpoActionLoading(true);
      setBpoActionMessage('');
      await activateBpo(id);
      setBpoActionMessage('BPO activated successfully.');
      setBpoDetails(null);
      await Promise.all([loadBpoDetails(), fetchCase(), loadTimeline()]);
    } catch (err) {
      setBpoActionMessage(err instanceof Error ? err.message : 'Failed to activate BPO.');
    } finally {
      setBpoActionLoading(false);
    }
  };

  const handleInterventionFormChange = (
    field: keyof typeof interventionForm,
    value: string | number[],
  ) => {
    setInterventionForm((current) => ({ ...current, [field]: value }));
  };

  const handleResetInterventionForm = () => {
    setInterventionError('');
    setInterventionMessage('');
    setInterventionForm({
      activityType: 'Assessment',
      customActivityType: '',
      interventionDetails: '',
      interventionDate: '',
      startTime: '',
      endTime: '',
      performedByEmployeeIds: [],
    });
  };

  const handleAddIntervention = async () => {
    if ((caseData?.caseStatus || '').toUpperCase() === 'WITHDRAWN') {
      setInterventionError('Withdrawn cases are read-only.');
      return;
    }

    const resolvedActivityType = interventionForm.activityType === 'Others'
      ? interventionForm.customActivityType.trim()
      : interventionForm.activityType;

    if (
      !id ||
      !resolvedActivityType ||
      !interventionForm.interventionDetails.trim() ||
      !interventionForm.interventionDate ||
      !interventionForm.startTime ||
      !interventionForm.endTime ||
      interventionForm.performedByEmployeeIds.length === 0
    ) {
      setInterventionError('Please fill in all required fields.');
      return;
    }

    const [sh, sm] = interventionForm.startTime.split(':').map(Number);
    const [eh, em] = interventionForm.endTime.split(':').map(Number);
    let durationMinutes = (eh * 60 + em) - (sh * 60 + sm);
    // Handle overnight sessions (e.g. 11 PM → 12 AM)
    if (durationMinutes < 0) durationMinutes += 1440;
    if (durationMinutes < 1) {
      setInterventionError('Start time and end time cannot be the same.');
      return;
    }

    try {
      setInterventionLoading(true);
      setInterventionError('');
      setInterventionMessage('');
      const interventionDateTime = `${interventionForm.interventionDate}T${interventionForm.startTime}:00`;
      await addIntervention({
        bpoId: bpoDetails!.id,
        activityType: resolvedActivityType,
        interventionDetails: interventionForm.interventionDetails.trim(),
        interventionDate: interventionDateTime,
        interventionDuration: durationMinutes,
        performedByEmployeeIds: interventionForm.performedByEmployeeIds,
      });
      // Optimistically add the new intervention to the list so it appears immediately
      // pendingSync is false because the API call above already succeeded
      const optimisticLog: LocalInterventionViewDTO = {
        id: -Date.now(),
        activityType: resolvedActivityType,
        details: interventionForm.interventionDetails.trim(),
        interventionDate: interventionDateTime,
        duration: durationMinutes,
        createdBy: 'You',
        performedBy: assignOfficerOptions
          .filter((o) => interventionForm.performedByEmployeeIds.includes(o.id))
          .map((o) => o.name),
        followUps: [],
        pendingSync: false,
      };
      setInterventionLogs((prev) => [...prev, optimisticLog]);
      setInterventionMessage('Intervention saved successfully.');

      setInterventionForm({
        activityType: 'Assessment',
        customActivityType: '',
        interventionDetails: '',
        interventionDate: '',
        startTime: '',
        endTime: '',
        performedByEmployeeIds: [],
      });

      // Refresh logs from API in background (replaces optimistic entry with real data)
      try {
        await loadInterventionLogs(bpoDetails!.id);
      } catch {
        // Keep optimistic entry if refresh fails
      }
      void loadTimeline();
    } catch (err) {
      setInterventionError(err instanceof Error ? err.message : 'Failed to add intervention.');
    } finally {
      setInterventionLoading(false);
    }
  };

  const handleViewIntervention = async (interventionId: number) => {
    setSelectedInterventionId(interventionId);
    setInterventionDetailsError('');
    setFollowUpError('');
    setFollowUpMessage('');
    const selectedLog = interventionLogs.find((log) => log.id === interventionId) ?? null;
    setInterventionDetails(selectedLog);

    if (!interventionId) return;

    try {
      setInterventionDetailsLoading(true);
      const data = await getInterventionDetails(interventionId);
      setInterventionDetails({
        ...data,
        pendingSync: false,
        followUps: (data.followUps ?? []).map((followUp) => ({ ...followUp, pendingSync: false })),
      });
    } catch (err) {
      setInterventionDetailsError(err instanceof Error ? err.message : 'Failed to load intervention details.');
    } finally {
      setInterventionDetailsLoading(false);
    }
  };

  const handleAddFollowUp = async (targetInterventionId?: number) => {
    if ((caseData?.caseStatus || '').toUpperCase() === 'WITHDRAWN') {
      setFollowUpError('Withdrawn cases are read-only.');
      return;
    }

    const resolvedInterventionId = targetInterventionId ?? selectedInterventionId;

    if (!resolvedInterventionId || !followUpText.trim()) {
      setFollowUpError('Load an intervention and enter follow-up notes first.');
      return;
    }

    const activeIntervention = interventionLogs.find((log) => log.id === resolvedInterventionId) ?? null;

    try {
      setFollowUpLoading(true);
      setFollowUpError('');
      setFollowUpMessage('');
      const savedNotes = followUpText.trim();
      await addFollowUp({
        interventionId: resolvedInterventionId,
        bpoId: bpoDetails?.id,
        notes: savedNotes,
      });

      // Optimistically add the follow-up so it appears immediately
      const optimisticFollowUp: LocalFollowUpViewDTO = {
        id: -Date.now(),
        notes: savedNotes,
        createdBy: 'You',
        createdAt: new Date().toISOString(),
        pendingSync: false,
      };
      if (activeIntervention) {
        const updated = {
          ...activeIntervention,
          followUps: [...(activeIntervention.followUps ?? []), optimisticFollowUp],
        };
        setInterventionDetails(updated);
        updateInterventionLog(resolvedInterventionId, (current) => ({
          ...current,
          followUps: [...(current.followUps ?? []), optimisticFollowUp],
        }));
      }

      setFollowUpText('');
      setFollowUpMessage('Follow-up saved successfully.');
      setShowFollowUpSuccess(true);

      // Refresh from API in background (replaces optimistic data with real data)
      try {
        const freshDetails = await getInterventionDetails(resolvedInterventionId);
        setInterventionDetails({
          ...freshDetails,
          pendingSync: false,
          followUps: (freshDetails.followUps ?? []).map((fu) => ({ ...fu, pendingSync: false })),
        });
      } catch {
        // Keep optimistic data if refresh fails
      }
      if (bpoDetails?.id) {
        try {
          await loadInterventionLogs(bpoDetails.id);
        } catch {
          // Keep optimistic data if refresh fails
        }
      }
      void loadTimeline();
    } catch (err) {
      const pendingFollowUp: LocalFollowUpViewDTO = {
        id: Date.now(),
        notes: followUpText.trim(),
        createdBy: 'You',
        createdAt: new Date().toISOString(),
        pendingSync: true,
      };
      const updatedIntervention = activeIntervention
        ? {
            ...activeIntervention,
            followUps: [...(activeIntervention.followUps ?? []), pendingFollowUp],
          }
        : null;

      if (updatedIntervention) {
        setInterventionDetails(updatedIntervention);
      }
      updateInterventionLog(resolvedInterventionId, (current) => ({
        ...current,
        followUps: [...(current.followUps ?? []), pendingFollowUp],
      }));
      setFollowUpText('');
      setFollowUpError('');
      setFollowUpMessage('Server unavailable. Your follow-up was kept locally and marked as pending sync.');
      setShowFollowUpSuccess(true);
    } finally {
      setFollowUpLoading(false);
    }
  };

  const handleCloseInterventionDetails = () => {
    setSelectedInterventionId(null);
    setInterventionDetails(null);
    setInterventionDetailsLoading(false);
    setInterventionDetailsError('');
    setFollowUpText('');
    setFollowUpError('');
    setFollowUpMessage('');
  };

  const handleWithdrawCase = async () => {
    if ((caseData?.caseStatus || '').toUpperCase() === 'WITHDRAWN') {
      setWithdrawError('This case is already withdrawn.');
      return;
    }

    if (!withdrawReason.trim()) {
      setWithdrawError('Enter a withdrawal reason first.');
      return;
    }

    try {
      setWithdrawLoading(true);
      setWithdrawError('');
      setWithdrawMessage('');
      await withdrawVawcCase(id, {
        reason: withdrawReason.trim(),
        caseNumber: caseData?.caseNumber,
      });
      setWithdrawMessage('Case withdrawn successfully.');
      setShowWithdrawInput(false);
      setWithdrawReason('');
      await Promise.all([fetchCase(), loadTimeline()]);
    } catch (err) {
      setWithdrawError(err instanceof Error ? err.message : 'Failed to withdraw case.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const caseStatus = (caseData?.caseStatus || '').toUpperCase();
  const isWithdrawn = caseStatus === 'WITHDRAWN';
  const violenceTypeLabel = caseData?.violenceTypes?.map((item) => item.type).join(', ') || '—';
  const tabDefs: { key: ActiveTab; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'bpo', label: 'BPO Management' },
    { key: 'notes', label: 'Case Notes', count: notes.length },
    { key: 'timeline', label: 'Timeline' },
    { key: 'cfa', label: 'Referral / CFA' },
  ];

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
              <div key={item} className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6">
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

  if (error || !caseData) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto px-6 py-6 space-y-5">
          <button
            onClick={() => navigate('/vawc/cases')}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Back to Complaints
          </button>
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-24 text-red-500">
            <p className="text-sm font-medium">{error || 'Case not found.'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto px-6 py-6 space-y-5">
        {/* ── HEADER ── */}
        <div>
          <button
            onClick={() => navigate('/vawc/cases')}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4" /> Back to Complaints
          </button>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {caseData.caseNumber}
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            {caseData.natureOfComplaint || 'VAWC Case'}
          </p>
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-1 border-b border-gray-200">
          {tabDefs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
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
                victimFullName={victimFullName}
                respondentFullName={respondentFullName}
                caseStatus={caseStatus}
                isWithdrawn={isWithdrawn}
                violenceTypeLabel={violenceTypeLabel}
                canRecordIntervention={!!bpoDetails?.bpoNumber}
                showWithdrawInput={showWithdrawInput}
                withdrawReason={withdrawReason}
                withdrawError={withdrawError}
                withdrawMessage={withdrawMessage}
                withdrawLoading={withdrawLoading}
                onShowWithdrawInput={(show) => {
                  setShowWithdrawInput(show);
                  if (!show) {
                    setWithdrawReason('');
                    setWithdrawError('');
                    setWithdrawMessage('');
                  }
                }}
                onWithdrawReasonChange={setWithdrawReason}
                onWithdrawCase={handleWithdrawCase}
                onIssueBpo={() => setActiveTab('bpo')}
                onRecordIntervention={() => setActiveTab('bpo')}
                onReferralLetter={() => setActiveTab('cfa')}
              />
            )}

            {activeTab === 'bpo' && (
              <BpoTab
                caseData={caseData}
                isWithdrawn={isWithdrawn}
                victimFullName={victimFullName}
                respondentFullName={respondentFullName}
                bpoDetails={bpoDetails}
                bpoLoading={bpoLoading}
                bpoActionLoading={bpoActionLoading}
                bpoActionMessage={bpoActionMessage}
                assignOfficerOptions={assignOfficerOptions}
                assignOfficerLoading={assignOfficerLoading}
                interventionLogs={interventionLogs}
                interventionLogsLoading={interventionLogsLoading}
                interventionForm={interventionForm}
                interventionLoading={interventionLoading}
                interventionError={interventionError}
                interventionMessage={interventionMessage}
                interventionDetails={interventionDetails}
                interventionDetailsLoading={interventionDetailsLoading}
                interventionDetailsError={interventionDetailsError}
                followUpText={followUpText}
                followUpLoading={followUpLoading}
                followUpError={followUpError}
                followUpMessage={followUpMessage}
                followUpSaveDisabled={interventionDetailsLoading || interventionDetails?.pendingSync === true}
                onActivateBpo={handleActivateBpo}
                onInterventionFormChange={handleInterventionFormChange}
                onAddIntervention={handleAddIntervention}
                onViewIntervention={handleViewIntervention}
                onFollowUpTextChange={setFollowUpText}
                onAddFollowUp={handleAddFollowUp}
                onCloseInterventionDetails={handleCloseInterventionDetails}
                onResetInterventionForm={handleResetInterventionForm}
              />
            )}

            {activeTab === 'notes' && (
              <NotesTab
                notes={notes}
                isWithdrawn={isWithdrawn}
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

            {activeTab === 'timeline' && (
              <TimelineTab
                timeline={displayTimeline}
                timelineLoading={timelineLoading}
                formatDate={formatDate}
              />
            )}

            {activeTab === 'cfa' && (
              <CfaTab
                caseId={id}
                caseData={caseData}
                isWithdrawn={isWithdrawn}
              />
            )}
      </div>

      {/* Follow-up success modal */}
      <ActionModal
        isOpen={showFollowUpSuccess}
        onClose={() => setShowFollowUpSuccess(false)}
        title="Follow-up Saved"
        type="success"
      >
        Your follow-up has been saved successfully.
      </ActionModal>
    </div>
  );
}