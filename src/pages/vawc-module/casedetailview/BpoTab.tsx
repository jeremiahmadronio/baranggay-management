import { ShieldAlertIcon, PrinterIcon, CalendarDaysIcon, PlusIcon, ClockIcon, ChevronRightIcon, MessageSquarePlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { AssignOfficerOptionDTO, BpoDetails, CaseViewDTO, InterventionViewDTO } from '../../../service/vawc-api/vawc-api';
import { InfoField, SectionCard, SkeletonBlock, formatDate } from './shared';
import { AddInterventionModal, type InterventionFormState } from './AddInterventionModal';
import { InterventionDetailsModal } from './InterventionDetailsModal';
import { InterventionFollowUpModal } from './InterventionFollowUpModal';

function formatTimeRange(dateStr: string, durationMinutes: number): string {
  try {
    const start = new Date(dateStr);
    const end = new Date(start.getTime() + durationMinutes * 60_000);
    const fmt = (d: Date) =>
      d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${fmt(start)} – ${fmt(end)}`;
  } catch {
    return '—';
  }
}

function formatShortDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

type BpoTabProps = {
  caseData: CaseViewDTO;
  isWithdrawn: boolean;
  victimFullName: string;
  respondentFullName: string;
  bpoDetails: BpoDetails | null;
  bpoLoading: boolean;
  bpoActionLoading: boolean;
  bpoActionMessage: string;
  assignOfficerOptions: AssignOfficerOptionDTO[];
  assignOfficerLoading: boolean;
  interventionLogs: InterventionViewDTO[];
  interventionLogsLoading: boolean;
  interventionForm: InterventionFormState;
  interventionLoading: boolean;
  interventionError: string;
  interventionMessage: string;
  interventionDetails: InterventionViewDTO | null;
  interventionDetailsLoading: boolean;
  interventionDetailsError: string;
  followUpText: string;
  followUpLoading: boolean;
  followUpError: string;
  followUpMessage: string;
  followUpSaveDisabled: boolean;
  onActivateBpo: () => void;
  onInterventionFormChange: (field: keyof InterventionFormState, value: string | number[]) => void;
  onAddIntervention: () => void;
  onViewIntervention: (id: number) => void;
  onFollowUpTextChange: (value: string) => void;
  onAddFollowUp: (interventionId: number) => void;
  onCloseInterventionDetails: () => void;
  onResetInterventionForm?: () => void;
};

export function BpoTab({
  caseData,
  isWithdrawn,
  victimFullName,
  respondentFullName,
  bpoDetails,
  bpoLoading,
  bpoActionLoading,
  bpoActionMessage,
  assignOfficerOptions,
  assignOfficerLoading,
  interventionLogs,
  interventionLogsLoading,
  interventionForm,
  interventionLoading,
  interventionError,
  interventionMessage,
  interventionDetails,
  interventionDetailsLoading,
  followUpText,
  followUpLoading,
  followUpError,
  followUpMessage,
  onActivateBpo,
  onInterventionFormChange,
  onAddIntervention,
  onViewIntervention,
  onFollowUpTextChange,
  onAddFollowUp,
  onCloseInterventionDetails,
  onResetInterventionForm,
}: BpoTabProps) {
  const isActive = !!bpoDetails?.bpoNumber;
  const [showAddLog, setShowAddLog] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const selectedLog = interventionLogs.find((log) => log.id === selectedLogId) ?? null;

  // Close the follow-up flow after save without reopening intervention details.
  useEffect(() => {
    if (followUpMessage && showFollowUpModal) {
      setSelectedLogId(null);
      setShowFollowUpModal(false);
      onCloseInterventionDetails();
    }
  }, [followUpMessage, onCloseInterventionDetails, showFollowUpModal]);

  const handleOpenAddLog = () => {
    onResetInterventionForm?.();
    setShowAddLog(true);
  };

  const handleCloseAddLog = () => {
    setShowAddLog(false);
  };

  useEffect(() => {
    if (interventionMessage && showAddLog) {
      setShowAddLog(false);
    }
  }, [interventionMessage]);

  const isExpiringSoon = (() => {
    if (!bpoDetails?.bpoExpiredAt) return false;
    const expiry = new Date(bpoDetails.bpoExpiredAt);
    const today = new Date();
    return expiry.getTime() - today.getTime() < 3 * 24 * 60 * 60 * 1000;
  })();

  const handleViewLog = (logId: number) => {
    setSelectedLogId(logId);
    onViewIntervention(logId);
  };

  const handleOpenFollowUp = (logId: number) => {
    setSelectedLogId(logId);
    setShowFollowUpModal(true);
  };

  const handleCloseDetails = () => {
    setSelectedLogId(null);
    setShowFollowUpModal(false);
    onCloseInterventionDetails();
  };

  if (bpoLoading) {
    return (
      <SectionCard title="BPO Management" icon={<ShieldAlertIcon className="w-4 h-4 text-gray-400" />}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-12 w-full" />
          ))}
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldAlertIcon className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">BPO Management</h2>
        </div>
        {isActive && (
          <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-green-100 text-green-700">
            Active
          </span>
        )}
      </div>

      {/* ── BPO DETAILS CARD ── */}
      <SectionCard title="Barangay Protection Order Details"
        action={
          !isActive && !isWithdrawn ? (
            <div className="flex items-center gap-2">
              <button
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 flex items-center gap-1.5"
              >
                <PrinterIcon className="w-3.5 h-3.5" /> Print BPO Request Letter
              </button>
              <button
                onClick={onActivateBpo}
                disabled={bpoActionLoading}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                {bpoActionLoading ? 'Activating...' : 'Activate BPO (Post-Signature)'}
              </button>
            </div>
          ) : undefined
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
          <InfoField label="Case Number" value={bpoDetails?.caseNumber ?? caseData.caseNumber} />
          <InfoField label="Victim (Protected Party)" value={bpoDetails?.complainant ?? victimFullName} />
          <InfoField label="Respondent" value={bpoDetails?.respondent ?? respondentFullName} />
          <InfoField label="Assigned Officer" value={bpoDetails?.assignOfficer ?? caseData.assignOfficer} />
        </div>

        {isActive && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">BPO Number</p>
                <p className="text-sm font-semibold text-blue-600">{bpoDetails.bpoNumber}</p>
              </div>
              <InfoField label="Issue Date" value={formatDate(bpoDetails.bpoIssuedAt)} />
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Expiry Date (15 Days)</p>
                <p className={`text-sm font-medium ${isExpiringSoon ? 'text-red-600' : 'text-gray-700'}`}>
                  {formatDate(bpoDetails.bpoExpiredAt)}
                </p>
              </div>
            </div>
          </div>
        )}

        {bpoActionMessage && (
          <p className={`mt-4 text-sm ${bpoActionMessage.toLowerCase().includes('failed') || bpoActionMessage.toLowerCase().includes('error') ? 'text-rose-600' : 'text-emerald-600'}`}>
            {bpoActionMessage}
          </p>
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
            <button
              onClick={handleOpenAddLog}
              disabled={isWithdrawn}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PlusIcon className="w-3.5 h-3.5" /> Add Log
            </button>
          }
        >
          {/* ── LOG LIST ── */}
          {interventionLogsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <SkeletonBlock key={i} className="h-16 w-full" />)}
            </div>
          ) : interventionLogs.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">
              No intervention logs recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {interventionLogs.map((log) => (
                <div
                  key={log.id}
                  className={`w-full rounded-lg border bg-white p-4 transition-colors hover:bg-gray-50 ${selectedLogId === log.id ? 'border-blue-300 ring-1 ring-blue-200' : 'border-slate-200'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left — info */}
                    <button
                      type="button"
                      onClick={() => handleViewLog(log.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-gray-900">{log.activityType}</p>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDaysIcon className="w-3.5 h-3.5" />
                          {formatShortDate(log.interventionDate)}
                        </span>
                        {log.duration > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <ClockIcon className="w-3.5 h-3.5" />
                            {formatTimeRange(log.interventionDate, log.duration)}
                          </span>
                        )}
                      </div>
                    </button>
                    {/* Right — actions */}
                    <div className="flex items-center gap-4 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenFollowUp(log.id);
                        }}
                        disabled={isWithdrawn}
                        className="text-xs font-medium text-gray-500 inline-flex items-center gap-1 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <MessageSquarePlusIcon className="w-3.5 h-3.5" /> Follow-up
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewLog(log.id);
                        }}
                        disabled={isWithdrawn}
                        className="text-xs font-medium text-blue-600 inline-flex items-center gap-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                      >
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

      {/* ── ADD INTERVENTION MODAL ── */}
      {showAddLog && (
        <AddInterventionModal
          form={interventionForm}
          loading={interventionLoading}
          error={interventionError}
          message={interventionMessage}
          assignOfficerOptions={assignOfficerOptions}
          assignOfficerLoading={assignOfficerLoading}
          onFormChange={onInterventionFormChange}
          onSave={onAddIntervention}
          onClose={handleCloseAddLog}
        />
      )}

      {selectedLogId && !showFollowUpModal && (
        <InterventionDetailsModal
          interventionDetails={interventionDetails}
          fallbackIntervention={selectedLog}
          loading={interventionDetailsLoading}
          onClose={handleCloseDetails}
        />
      )}

      {showFollowUpModal && (
        <InterventionFollowUpModal
          caseReference={bpoDetails?.caseNumber ?? caseData.caseNumber}
          followUpText={followUpText}
          followUpLoading={followUpLoading}
          followUpError={followUpError}
          followUpMessage={followUpMessage}
          saveDisabled={followUpLoading || !selectedLogId}
          onFollowUpTextChange={onFollowUpTextChange}
          onSave={() => {
            if (!selectedLogId) return;
            onAddFollowUp(selectedLogId);
          }}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
}