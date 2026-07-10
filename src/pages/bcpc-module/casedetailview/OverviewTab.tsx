import {
  FileTextIcon,
  UserIcon,
  ClockIcon,
  XCircleIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ShieldIcon,
  ClipboardPenIcon,
  FileOutputIcon,
  ActivityIcon,
} from 'lucide-react';
import { InfoField, SectionCard, formatDate, CASE_STATUS_COLORS } from './shared';
import type { BcpcCaseDetailDTO } from './shared';

const STATUS_LABEL_OVERRIDES: Record<string, string> = {
  UNDER_INTERVENTION: 'Under Intervention',
  CERTIFIED_TO_FILE_ACTION: 'Certified to File Action',
};

const formatStatus = (status: string) =>
  STATUS_LABEL_OVERRIDES[status] ??
  status.toLowerCase().split('_').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

type OverviewTabProps = {
  caseData: BcpcCaseDetailDTO;
  childFullName: string;
  respondentFullName: string;
  caseStatus: string;
  isReadOnly: boolean;
  showWithdrawInput: boolean;
  withdrawReason: string;
  withdrawError: string;
  withdrawLoading: boolean;
  onShowWithdrawInput: (show: boolean) => void;
  onWithdrawReasonChange: (value: string) => void;
  onWithdrawCase: () => void;
  onGoToMediation: () => void;
  onGoToBpo: () => void;
  onGoToReferrals: () => void;
};

export function OverviewTab({
  caseData,
  childFullName,
  respondentFullName,
  caseStatus,
  isReadOnly,
  showWithdrawInput,
  withdrawReason,
  withdrawError,
  withdrawLoading,
  onShowWithdrawInput,
  onWithdrawReasonChange,
  onWithdrawCase,
  onGoToMediation,
  onGoToBpo,
  onGoToReferrals,
}: OverviewTabProps) {
  const pillClass =
    CASE_STATUS_COLORS[caseStatus] ?? 'bg-gray-100 text-gray-600 border border-gray-200';

  const isWithdrawn = caseStatus === 'WITHDRAWN';
  const isDismissed = caseStatus === 'DISMISSED';
  const isResolved = caseStatus === 'RESOLVED';
  const isReferred = caseStatus === 'ISSUED_REFERRAL' || caseStatus === 'REFERRED';
  const isTerminal = isReadOnly;

  const startDate = caseData.dateFiled ? new Date(caseData.dateFiled) : null;
  const deadlineDate = caseData.bpoDeadline
    ? new Date(caseData.bpoDeadline)
    : startDate
      ? new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)
      : null;
  const totalDays = 30;
  const elapsedDays = startDate
    ? Math.max(0, Math.floor((Date.now() - startDate.getTime()) / (24 * 60 * 60 * 1000)))
    : 0;
  const progressPercent = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
  const isUrgent = progressPercent >= 80;
  const remainingDays = deadlineDate
    ? Math.max(0, Math.ceil((deadlineDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;
  const remainingText = caseData.remainingTime
    ? caseData.remainingTime
    : remainingDays !== null
      ? `${remainingDays} day${remainingDays === 1 ? '' : 's'} remaining`
      : 'Pending';

  const childGradeParts = caseData.childGradeSchool?.split(' - ') || [];
  const childGuardianParts = caseData.childGuardianName?.split(' - ') || [];

  const resGradeParts = caseData.respondentGradeSchool?.split(' - ') || [];
  const resGuardianParts = caseData.respondentGuardianName?.split(' - ') || [];

  return (
    <div className="space-y-5">
      {/* ── Terminal Status Banner ── */}
      {isTerminal && (
        <div
          className={`border shadow-sm rounded-xl p-4 flex items-start gap-3 ${
            isResolved
              ? 'bg-emerald-50 border-emerald-200'
              : isDismissed || isWithdrawn
                ? 'bg-rose-50 border-rose-200'
                : isReferred
                  ? 'bg-violet-50 border-violet-200'
                  : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div
            className={`mt-0.5 shrink-0 ${
              isResolved ? 'text-emerald-500' : isDismissed || isWithdrawn ? 'text-rose-500' : isReferred ? 'text-violet-500' : 'text-gray-400'
            }`}
          >
            {isResolved ? (
              <CheckCircleIcon className="w-5 h-5" />
            ) : isDismissed || isWithdrawn ? (
              <XCircleIcon className="w-5 h-5" />
            ) : (
              <AlertCircleIcon className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1">
            <p className={`text-sm font-medium ${isResolved ? 'text-emerald-700' : isDismissed || isWithdrawn ? 'text-rose-700' : isReferred ? 'text-violet-700' : 'text-gray-700'}`}>
              {isResolved ? 'Case Resolved' : isWithdrawn ? 'Case Withdrawn' : isDismissed ? 'Case Dismissed' : 'Case Closed'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              This case is read-only. No further changes can be made.
            </p>
          </div>
        </div>
      )}

      {/* ── Case Duration ── */}
      {!isTerminal && (
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ClockIcon className="w-4 h-4 text-blue-500" />
              <span className="text-gray-700">30-Day Monitoring Period</span>
            </div>
            <span className={`text-sm ${isUrgent ? 'text-red-500' : 'text-blue-600'}`}>
              {remainingDays === 0 ? 'Overdue' : remainingText}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-700 ${isUrgent ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Filed: {formatDate(caseData.dateFiled)}</span>
            <span>Deadline: {deadlineDate ? formatDate(deadlineDate.toISOString()) : '—'}</span>
          </div>
        </div>
      )}

      {/* ── Quick Actions (4 buttons) ── */}
      <div>
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Mediation */}
            <button
              onClick={onGoToMediation}
              disabled={isTerminal}
              className={`flex flex-col items-start gap-2 p-5 bg-white border border-gray-200 shadow-sm rounded-xl transition-none text-left focus:outline-none ${
                isTerminal ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-200 hover:bg-blue-50/30'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-blue-50">
                <ShieldIcon className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-blue-600">Mediation</span>
              <span className="text-xs text-gray-500">Schedule a mediation session</span>
            </button>

            {/* BPO */}
            <button
              onClick={onGoToBpo}
              disabled={isTerminal}
              className={`flex flex-col items-start gap-2 p-5 bg-white border border-gray-200 shadow-sm rounded-xl transition-none text-left focus:outline-none ${
                isTerminal ? 'opacity-50 cursor-not-allowed' : 'hover:border-emerald-200 hover:bg-emerald-50/30'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-emerald-50">
                <ClipboardPenIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm text-emerald-600">BPO</span>
              <span className="text-xs text-gray-500">Barangay Protection Order</span>
            </button>

            {/* Referrals */}
            <button
              onClick={onGoToReferrals}
              disabled={isTerminal}
              className={`flex flex-col items-start gap-2 p-5 bg-white border border-gray-200 shadow-sm rounded-xl transition-none text-left focus:outline-none ${
                isTerminal ? 'opacity-50 cursor-not-allowed' : 'hover:border-violet-200 hover:bg-violet-50/30'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-violet-50">
                <FileOutputIcon className="w-5 h-5 text-violet-600" />
              </div>
              <span className="text-sm text-violet-600">Referrals</span>
              <span className="text-xs text-gray-500">Issue a referral letter</span>
            </button>

            {/* Withdraw */}
            <button
              onClick={() => onShowWithdrawInput(true)}
              disabled={isTerminal}
              className={`flex flex-col items-start gap-2 p-5 bg-white border border-gray-200 shadow-sm rounded-xl transition-none text-left focus:outline-none ${
                isTerminal ? 'opacity-50 cursor-not-allowed' : 'hover:border-rose-200 hover:bg-rose-50/30'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-rose-50">
                <XCircleIcon className="w-5 h-5 text-rose-600" />
              </div>
              <span className="text-sm text-rose-600">Withdraw Case</span>
              <span className="text-xs text-gray-500">Complainant withdrew</span>
            </button>
          </div>
        </div>

      {/* ── Main Info Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <SectionCard title="Child / Complainant Information" icon={<UserIcon className="w-4 h-4 text-gray-400" />}>
            <div className="grid grid-cols-2 gap-4">
              <InfoField label="Full Name" value={childFullName} />
              <InfoField label="Age" value={caseData.childAge ? `${caseData.childAge} years old` : undefined} />
              <InfoField label="Birthday" value={caseData.childBirthday ? formatDate(caseData.childBirthday) : undefined} />
              <InfoField label="Gender" value={caseData.childGender} />
              <InfoField label="Grade" value={childGradeParts[0]} />
              <InfoField label="School Name" value={childGradeParts[1]} />
              <InfoField label="Parent Name" value={childGuardianParts[0]} />
              <InfoField label="Guardian Name" value={childGuardianParts[1]} />
              {caseData.childRelationship && (
                <InfoField label="Relationship to Child" value={caseData.childRelationship} />
              )}
              <InfoField label="Contact Number" value={caseData.childContact} />
              <div className="col-span-2">
                <InfoField label="Complete Address" value={caseData.childAddress} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Respondent / Guardian Information" icon={<UserIcon className="w-4 h-4 text-gray-400" />}>
            <div className="grid grid-cols-2 gap-4">
              <InfoField label="Full Name" value={respondentFullName || undefined} />
              <InfoField label="Age" value={caseData.respondentAge ? `${caseData.respondentAge} years old` : undefined} />
              <InfoField label="Birthday" value={caseData.respondentBirthday ? formatDate(caseData.respondentBirthday) : undefined} />
              <InfoField label="Gender" value={caseData.respondentGender} />
              <InfoField label="Grade" value={resGradeParts[0]} />
              <InfoField label="School Name" value={resGradeParts[1]} />
              <InfoField label="Parent Name" value={resGuardianParts[0]} />
              <InfoField label="Guardian Name" value={resGuardianParts[1]} />
              <InfoField label="Relationship to Child" value={caseData.relationshipToChild || caseData.respondentRelationship} />
              <InfoField label="Contact Number" value={caseData.respondentContact} />
              <div className="col-span-2">
                <InfoField label="Address" value={caseData.respondentAddress} />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Case Information Sidebar */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-5 h-fit">
          <h3 className="text-base font-medium text-gray-800 flex items-center gap-2">
            <FileTextIcon className="w-5 h-5 text-gray-400" /> Case Information
          </h3>
          <InfoField label="Case Number" value={caseData.caseNumber} />
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1.5">Status</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal ${pillClass}`}>
              {formatStatus(caseStatus)}
            </span>
          </div>
          <InfoField label="Date Filed" value={formatDate(caseData.dateFiled)} />
          <InfoField label="Assigned Officer" value={caseData.assignedOfficer} />
          <InfoField label="Nature of Complaint" value={caseData.natureOfComplaint} />
          {caseData.violenceType && <InfoField label="Violence Type" value={caseData.violenceType} />}
          <InfoField label="Incident Date" value={formatDate(caseData.incidentDate)} />
          {caseData.incidentTime && <InfoField label="Incident Time" value={caseData.incidentTime} />}
          <InfoField label="Incident Location" value={caseData.incidentLocation} />
        </div>
      </div>

      {/* Incident Narrative */}
      <SectionCard title="Incident Details / Narrative" icon={<FileTextIcon className="w-4 h-4 text-gray-400" />}>
        {caseData.narrative ? (
          (() => {
            const isPdf = caseData.narrative.startsWith('JVBERi0');
            const isPng = caseData.narrative.startsWith('iVBORw0KGgo');
            const isJpeg = caseData.narrative.startsWith('/9j/');
            const isDocx = caseData.narrative.startsWith('UEsDBBQ');
            
            const isImage = isPng || isJpeg;
            
            if (isImage) {
              const mime = isPng ? 'image/png' : 'image/jpeg';
              const dataUrl = `data:${mime};base64,${caseData.narrative}`;
              const ext = isPng ? 'png' : 'jpg';
              return (
                <div className="flex flex-col gap-3">
                  <img
                    src={dataUrl}
                    alt="Incident Narrative"
                    className="mt-2 max-h-[600px] rounded-lg border border-gray-200 object-contain"
                  />
                  <a
                    href={dataUrl}
                    download={`Narrative_${caseData.caseNumber}.${ext}`}
                    className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-gray-50 hover:text-blue-700"
                  >
                    <FileOutputIcon className="h-4 w-4" />
                    Download Image
                  </a>
                </div>
              );
            }

            let mime = 'application/octet-stream';
            let ext = 'file';
            
            if (isPdf) {
              mime = 'application/pdf';
              ext = 'pdf';
            } else if (isDocx) {
              mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
              ext = 'docx';
            } else {
              // fallback to .doc if starts with generic Microsoft Office ole magic
              if (caseData.narrative.startsWith('0M8R4KGxGuE')) {
                mime = 'application/msword';
                ext = 'doc';
              } else {
                // If it's short, it might just be text or a txt file
                if (caseData.narrative.length < 50000 && !caseData.narrative.includes('AAB')) {
                   mime = 'text/plain';
                   ext = 'txt';
                }
              }
            }

            const dataUrl = `data:${mime};base64,${caseData.narrative}`;
            
            return (
              <a
                href={dataUrl}
                download={`Narrative_${caseData.caseNumber}.${ext}`}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-gray-50 hover:text-blue-700"
              >
                <FileOutputIcon className="h-4 w-4" />
                Download Narrative File
              </a>
            );
          })()
        ) : (
          <p className="text-sm text-gray-500 italic">— No narrative attached —</p>
        )}
      </SectionCard>

      {/* ── Withdraw Modal ── */}
      {showWithdrawInput && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900">Withdraw Case</h3>
              <p className="mt-1 text-sm text-gray-500">Provide the reason for withdrawing this BCPC case.</p>
            </div>
            <div className="space-y-3 px-6 py-5">
              <textarea
                value={withdrawReason}
                maxLength={500}
                onChange={(e) => {
                  const sanitized = e.target.value.replace(/[^a-zA-Z0-9\s.,\-ñÑ/?()]/g, "");
                  if (sanitized.length <= 500) {
                    onWithdrawReasonChange(sanitized);
                  }
                }}
                rows={4}
                placeholder="Reason for withdrawal..."
                className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
              />
              {withdrawError && <p className="text-xs text-rose-600">{withdrawError}</p>}
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => { onShowWithdrawInput(false); onWithdrawReasonChange(''); }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={onWithdrawCase}
                disabled={withdrawLoading || !withdrawReason.trim()}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {withdrawLoading ? 'Saving...' : 'Confirm Withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
