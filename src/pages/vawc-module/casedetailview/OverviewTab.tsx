import {
  FileTextIcon,
  ShieldAlertIcon,
  ClipboardPenIcon,
  FileOutputIcon,
  XCircleIcon,
  UserIcon,
} from "lucide-react";
import type { CaseViewDTO } from "../../../service/vawc-api/vawc-api";
import { InfoField, SectionCard, formatDate } from "./shared";

type OverviewTabProps = {
  caseData: CaseViewDTO;
  victimFullName: string;
  respondentFullName: string;
  caseStatus: string;
  isWithdrawn: boolean;
  violenceTypeLabel: string;
  canRecordIntervention: boolean;
  showWithdrawInput: boolean;
  withdrawReason: string;
  withdrawError: string;
  withdrawMessage: string;
  withdrawLoading: boolean;
  onShowWithdrawInput: (show: boolean) => void;
  onWithdrawReasonChange: (value: string) => void;
  onWithdrawCase: () => void;
  onIssueBpo: () => void;
  onRecordIntervention: () => void;
  onReferralLetter: () => void;
};

const STATUS_PILL: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  ONGOING: "bg-blue-100 text-blue-700",
  UNDER_MEDIATION: "bg-sky-100 text-sky-700",
  UNDER_INTERVENTION: "bg-sky-100 text-sky-700",
  RESOLVED: "bg-green-100 text-green-700",
  DISMISSED: "bg-red-100 text-red-600",
  REFERRED: "bg-blue-100 text-blue-700",
  CERTIFIED_TO_FILE_ACTION: "bg-indigo-100 text-indigo-700",
  WITHDRAWN: "bg-gray-100 text-gray-600",
};

const STATUS_LABEL_OVERRIDES: Record<string, string> = {
  UNDER_MEDIATION: "UNDER INTERVENTION",
};

export function OverviewTab({
  caseData,
  victimFullName,
  respondentFullName,
  caseStatus,
  isWithdrawn,
  violenceTypeLabel,
  canRecordIntervention,
  showWithdrawInput,
  withdrawReason,
  withdrawError,
  withdrawMessage,
  withdrawLoading,
  onShowWithdrawInput,
  onWithdrawReasonChange,
  onWithdrawCase,
  onIssueBpo,
  onRecordIntervention,
  onReferralLetter,
}: OverviewTabProps) {
  const pillClass = STATUS_PILL[caseStatus] ?? "bg-gray-100 text-gray-500";
  const isCertifiedToFileAction = caseStatus === "CERTIFIED_TO_FILE_ACTION";
  const startDate = caseData.dateFiled ? new Date(caseData.dateFiled) : null;
  const deadlineDate = caseData.bpoDeadline
    ? new Date(caseData.bpoDeadline)
    : startDate
      ? new Date(startDate.getTime() + 15 * 24 * 60 * 60 * 1000)
      : null;
  const totalDurationDays = 15;
  const elapsedDays = startDate
    ? Math.max(
        0,
        Math.floor((Date.now() - startDate.getTime()) / (24 * 60 * 60 * 1000)),
      )
    : 0;
  const progressPercent = Math.min(
    100,
    Math.max(0, (elapsedDays / totalDurationDays) * 100),
  );
  const remainingText = caseData.remainingTime
    ? caseData.remainingTime
    : deadlineDate
      ? `${Math.max(0, Math.ceil((deadlineDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))} days remaining`
      : "Pending timeline";

  return (
    <div className="space-y-5">
      <SectionCard
        title="15-Day Duration"
        icon={<FileTextIcon className="w-4 h-4 text-gray-400" />}
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-800">
                15-Day Monitoring Period
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Track the case duration based on the filed date and current
                deadline.
              </p>
            </div>
            <span className="text-sm font-medium text-blue-600">
              {remainingText}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Filed: {formatDate(caseData.dateFiled)}</span>
            <span>
              Deadline:{" "}
              {deadlineDate ? formatDate(deadlineDate.toISOString()) : "—"}
            </span>
          </div>
        </div>
      </SectionCard>

      {/* ── QUICK ACTIONS ── */}
      <div>
        <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-3">
          Quick Actions
        </p>
        {isWithdrawn && (
          <p className="mb-3 text-xs font-medium text-gray-500">
            This case is withdrawn and can no longer be changed.
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={onIssueBpo}
            disabled={isWithdrawn}
            className={`flex flex-col items-start gap-2 p-5 border shadow-sm rounded-xl text-left focus:outline-none ${
              isWithdrawn
                ? "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed"
                : "bg-white border-gray-200"
            }`}
          >
            <div
              className={`p-2.5 rounded-lg ${isWithdrawn ? "bg-gray-100" : "bg-blue-50"}`}
            >
              <ShieldAlertIcon
                className={`w-5 h-5 ${isWithdrawn ? "text-gray-400" : "text-blue-600"}`}
              />
            </div>
            <span
              className={`text-sm ${isWithdrawn ? "text-gray-500" : "text-blue-600"}`}
            >
              Issue BPO
            </span>
            <span className="text-xs text-gray-500">
              Barangay Protection Order
            </span>
          </button>

          <button
            onClick={onRecordIntervention}
            disabled={isWithdrawn || !canRecordIntervention}
            title={
              isWithdrawn
                ? "Withdrawn cases are read-only."
                : canRecordIntervention
                  ? "Open BPO intervention logs"
                  : "Activate the BPO first before recording an intervention."
            }
            className={`flex flex-col items-start gap-2 p-5 border shadow-sm rounded-xl text-left focus:outline-none ${
              !isWithdrawn && canRecordIntervention
                ? "bg-white border-gray-200"
                : "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed"
            }`}
          >
            <div
              className={`p-2.5 rounded-lg ${!isWithdrawn && canRecordIntervention ? "bg-emerald-50" : "bg-gray-100"}`}
            >
              <ClipboardPenIcon
                className={`w-5 h-5 ${!isWithdrawn && canRecordIntervention ? "text-emerald-600" : "text-gray-400"}`}
              />
            </div>
            <span
              className={`text-sm ${!isWithdrawn && canRecordIntervention ? "text-emerald-600" : "text-gray-500"}`}
            >
              Record Intervention
            </span>
            <span className="text-xs text-gray-500">
              {isWithdrawn
                ? "Case is read-only"
                : canRecordIntervention
                  ? "Log activity or visit"
                  : "Activate BPO first"}
            </span>
          </button>

          <button
            onClick={onReferralLetter}
            disabled={isWithdrawn}
            className={`flex flex-col items-start gap-2 p-5 border shadow-sm rounded-xl text-left focus:outline-none ${
              isWithdrawn
                ? "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="p-2.5 rounded-lg bg-gray-100">
              <FileOutputIcon
                className={`w-5 h-5 ${isWithdrawn ? "text-gray-400" : "text-gray-600"}`}
              />
            </div>
            <span
              className={`text-sm ${isWithdrawn ? "text-gray-500" : "text-gray-700"}`}
            >
              {isCertifiedToFileAction
                ? "Referral Letter"
                : "Referral / CFA Form"}
            </span>
            <span className="text-xs text-gray-500">
              {isWithdrawn
                ? "Case is read-only"
                : isCertifiedToFileAction
                  ? "View or export saved referral letter"
                  : "Complete grounds first before issuance"}
            </span>
          </button>

          <button
            onClick={() => onShowWithdrawInput(true)}
            disabled={isWithdrawn}
            className={`flex flex-col items-start gap-2 p-5 border shadow-sm rounded-xl text-left focus:outline-none ${
              isWithdrawn
                ? "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed"
                : "bg-white border-gray-200"
            }`}
          >
            <div
              className={`p-2.5 rounded-lg ${isWithdrawn ? "bg-gray-100" : "bg-rose-50"}`}
            >
              <XCircleIcon
                className={`w-5 h-5 ${isWithdrawn ? "text-gray-400" : "text-rose-600"}`}
              />
            </div>
            <span
              className={`text-sm ${isWithdrawn ? "text-gray-500" : "text-rose-600"}`}
            >
              Withdraw
            </span>
            <span className="text-xs text-gray-500">
              {isWithdrawn ? "Case already withdrawn" : "Withdraw this case"}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <SectionCard
            title="Victim Information"
            icon={<UserIcon className="w-4 h-4 text-gray-400" />}
          >
            <div className="grid grid-cols-2 gap-4">
              <InfoField label="Full Name" value={victimFullName} />
              <InfoField
                label="Contact Number"
                value={caseData.contactNumber}
              />
              <InfoField
                label="Age"
                value={caseData.age ? `${caseData.age} years old` : undefined}
              />
              <InfoField label="Gender" value={caseData.gender} />
              <InfoField label="Civil Status" value={caseData.civilStatus} />
              <InfoField label="Email" value={caseData.email} />
              <div className="col-span-2">
                <InfoField
                  label="Complete Address"
                  value={caseData.completeAddress}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Respondent Information"
            icon={<UserIcon className="w-4 h-4 text-gray-400" />}
          >
            <div className="grid grid-cols-2 gap-4">
              <InfoField
                label="Full Name"
                value={respondentFullName || undefined}
              />
              <InfoField label="Alias" value={caseData.respondentAlias} />
              <InfoField
                label="Contact Number"
                value={caseData.respondentContact}
              />
              <InfoField
                label="Age"
                value={
                  caseData.respondentAge
                    ? `${caseData.respondentAge} years old`
                    : undefined
                }
              />
              <InfoField label="Gender" value={caseData.respondentGender} />
              <InfoField
                label="Civil Status"
                value={caseData.respondentCivilStatus}
              />
              <InfoField
                label="Relationship to Complainant"
                value={caseData.relationshipToComplainant}
              />
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
                  Living with Complainant
                </p>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full ${caseData.livingWithComplainant ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-600"}`}
                >
                  {caseData.livingWithComplainant ? "Yes" : "No"}
                </span>
              </div>
              <div className="col-span-2">
                <InfoField label="Address" value={caseData.respondentAddress} />
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-5 h-fit">
          <h3 className="text-base font-medium text-gray-800 flex items-center gap-2">
            <FileTextIcon className="w-5 h-5 text-gray-400" /> Case Information
          </h3>
          <InfoField label="Case Number" value={caseData.caseNumber} />
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1.5">
              Status
            </p>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal ${pillClass}`}
            >
              {caseStatus
                ? (STATUS_LABEL_OVERRIDES[caseStatus] ??
                  caseStatus.replace(/_/g, " "))
                : "UNKNOWN"}
            </span>
          </div>
          <InfoField
            label="Date Filed"
            value={formatDate(caseData.dateFiled)}
          />
          <InfoField label="Assigned Officer" value={caseData.assignOfficer} />
          <InfoField
            label="Nature of Complaint"
            value={caseData.natureOfComplaint}
          />
          <InfoField label="Violence Type" value={violenceTypeLabel} />
          <InfoField
            label="Incident Date"
            value={formatDate(caseData.incidentDate)}
          />
          {caseData.incidentTime && (
            <InfoField label="Incident Time" value={caseData.incidentTime} />
          )}
          <InfoField label="Incident Place" value={caseData.incidentLocation} />
          {caseData.frequencyOfIncident && (
            <InfoField label="Frequency" value={caseData.frequencyOfIncident} />
          )}
          {caseData.evidenceNames && caseData.evidenceNames.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1.5">
                Evidence Submitted
              </p>
              <div className="flex flex-wrap gap-2">
                {caseData.evidenceNames.map((name, i) => (
                  <span
                    key={i}
                    className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showWithdrawInput && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900">
                Withdraw Case
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Provide the reason for withdrawing this VAWC case.
              </p>
            </div>
            <div className="space-y-3 px-6 py-5">
              <textarea
                value={withdrawReason}
                onChange={(event) => onWithdrawReasonChange(event.target.value)}
                rows={4}
                placeholder="Reason for withdrawal"
                className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
              {withdrawError && (
                <p className="text-xs text-rose-600">{withdrawError}</p>
              )}
              {withdrawMessage && (
                <p className="text-xs text-emerald-600">{withdrawMessage}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => {
                  onShowWithdrawInput(false);
                  onWithdrawReasonChange("");
                }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-white"
              >
                Cancel
              </button>
              <button
                onClick={onWithdrawCase}
                disabled={withdrawLoading}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
              >
                {withdrawLoading ? "Saving..." : "Confirm Withdraw"}
              </button>
            </div>
          </div>
        </div>
      )}

      <SectionCard
        title="Incident Details"
        icon={<FileTextIcon className="w-4 h-4 text-gray-400" />}
      >
        <p className="text-sm text-gray-900 leading-relaxed">
          {caseData.narrative || "\u2014"}
        </p>
        {caseData.descriptionOfInjuries && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1.5">
              Description of Injuries
            </p>
            <p className="text-sm text-gray-900">
              {caseData.descriptionOfInjuries}
            </p>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
