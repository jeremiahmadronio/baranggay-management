import {
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  XIcon,
  UserIcon,
  ClipboardIcon,
  FileTextIcon,
  HashIcon,
} from "lucide-react";

import type {
  BlotterDocketViewDTO,
  MediationProcessDTO,
} from "../../../service/blotter-api/DocketView";
import { isTerminalStatus } from "../shared/StatusBadge";
import { InfoRow } from "../shared/InfoRow";
import { SectionCard } from "../shared/SectionCard";
import { formatDate, formatTime } from "../shared/utils";
// ── Helpers ──
const getMediationProgress = (
  dateFiled: string,
  mediationDeadline: string,
  displayDaysRemaining: number,
) => {
  const filed = new Date(dateFiled);
  const deadline = new Date(mediationDeadline);
  const today = new Date();
  const totalMs = deadline.getTime() - filed.getTime();
  const elapsedMs = today.getTime() - filed.getTime();
  const percent = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
  const isUrgent = displayDaysRemaining <= 3;
  return {
    percent,
    isUrgent,
  };
};
// ── Types ──
interface OverviewTabProps {
  docket: BlotterDocketViewDTO;
  mediation: MediationProcessDTO | null;
  hasMediationPerm: boolean;
  hasResolvePerm: boolean;
  hasEscalationPerm: boolean;
  onScheduleHearing: () => void;
  onMarkSettled: () => void;
  onReferToLupon: () => void;
  onDismissCase: () => void;
  onIssueCFA: () => void;
}
const MEDIATION_STEPS = [
  {
    key: "stepCaseReceived",
    label: "Case Received",
    sub: (p: MediationProcessDTO) =>
      p.caseReceivedDate
        ? `Received from Barangay Blotter on ${formatDate(p.caseReceivedDate)}`
        : "Awaiting receipt",
  },
  {
    key: "stepSummonIssued",
    label: "Pangkat Assignment / Mediation Issued",
    sub: (p: MediationProcessDTO) => p.summonStatus ?? "Awaiting first summon",
  },
  {
    key: "stepMediationOngoing",
    label: "Mediation Process",
    sub: (p: MediationProcessDTO) =>
      `${p.hearingsConducted} mediation(s) conducted`,
  },
  {
    key: "stepResolved",
    label: "Case Resolution",
    sub: (p: MediationProcessDTO) =>
      p.resolutionStatus ?? "Awaiting resolution",
  },
];
// ── Component ──
export function OverviewTab({
  docket,
  mediation,
  hasMediationPerm,
  hasResolvePerm,
  hasEscalationPerm,
  onScheduleHearing,
  onMarkSettled,
  onReferToLupon,
  onDismissCase,
}: OverviewTabProps) {
  const status = docket.caseStatus;
  const isTerminal =
    isTerminalStatus(docket.caseStatus) || status === "UNDER_CONCILIATION";

  // Backend may include the current date in daysRemaining.
  // For UI counting, exclude "today" as requested.
  const displayDaysRemaining =
    docket.daysRemaining > 0 ? docket.daysRemaining - 1 : docket.daysRemaining;

  const { percent, isUrgent } = getMediationProgress(
    docket.dateFiled,
    docket.mediationDeadline,
    displayDaysRemaining,
  );
  const mediationProgress = mediation
    ? [
        mediation.stepCaseReceived,
        mediation.stepSummonIssued,
        mediation.stepMediationOngoing,
        mediation.stepResolved,
      ]
    : [false, false, false, false];
  // Debug log for settlement agreement fields
  console.log(
    "[OverviewTab] agreementsTerm:",
    docket.agreementsTerm,
    "agreementDate:",
    docket.agreementDate,
  );

  const docketStatus = String(docket.caseStatus || "")
    .toUpperCase()
    .trim();

  const statusPillClass =
    docketStatus === "SETTLED"
      ? "bg-green-100 text-green-700"
      : docketStatus === "DISMISSED"
        ? "bg-red-100 text-red-600"
        : docketStatus === "PENDING" || docketStatus === "UNDER_MEDIATION"
          ? "bg-yellow-100 text-yellow-700"
          : docketStatus === "REFERRED_TO_LUPON"
            ? "bg-blue-100 text-blue-700"
            : "bg-gray-100 text-gray-500";

  return (
    <div className="space-y-5">
      {isTerminal ? (
        <div
          className={`border shadow-sm rounded-xl p-4 flex items-start gap-3 ${
            status === "SETTLED"
              ? "bg-emerald-50 border-emerald-200"
              : status === "DISMISSED"
                ? "bg-red-50 border-red-200"
                : status === "UNDER_CONCILIATION"
                  ? "bg-blue-50 border-blue-200"
                  : "bg-amber-50 border-amber-200"
          }`}
        >
          <div
            className={`mt-0.5 shrink-0 ${
              status === "SETTLED"
                ? "text-emerald-500"
                : status === "DISMISSED"
                  ? "text-red-500"
                  : status === "UNDER_CONCILIATION"
                    ? "text-blue-500"
                    : "text-amber-500"
            }`}
          >
            {status === "SETTLED" ? (
              <CheckCircleIcon className="w-5 h-5" />
            ) : status === "DISMISSED" ? (
              <XIcon className="w-5 h-5" />
            ) : (
              <AlertCircleIcon className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p
                className={`text-sm font-normal ${
                  status === "SETTLED"
                    ? "text-emerald-700"
                    : status === "DISMISSED"
                      ? "text-red-700"
                      : status === "UNDER_CONCILIATION"
                        ? "text-blue-700"
                        : "text-amber-700"
                }`}
              >
                {status === "SETTLED"
                  ? docket.agreementsTerm
                    ? "Case Settled – Both parties have an agreement"
                    : "Case Settled"
                  : status === "DISMISSED"
                    ? "Case Dismissed"
                    : status === "UNDER_CONCILIATION"
                      ? "Under Conciliation"
                      : "Case Closed"}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-2">
              <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Reason:
              </span>

              {docket.caseStatusRemarks ? (
                <span
                  className={`text-sm ${
                    status === "SETTLED"
                      ? "text-emerald-700"
                      : status === "DISMISSED"
                        ? "text-red-700"
                        : "text-blue-700"
                  }`}
                >
                  {docket.caseStatusRemarks}
                </span>
              ) : docket.agreementsTerm && status === "SETTLED" ? (
                <span className="text-sm text-emerald-700">
                  Both parties have an agreement.
                </span>
              ) : (
                <span className="text-sm text-gray-400 italic">
                  No remarks provided.
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ClockIcon className="w-4 h-4 text-blue-500" />
              <span className="text-gray-700">15-Day Mediation Period</span>
            </div>
            <span
              className={`text-sm ${isUrgent ? "text-red-500" : "text-blue-600"}`}
            >
              {displayDaysRemaining <= 0
                ? "Overdue"
                : `${displayDaysRemaining} day${displayDaysRemaining === 1 ? "" : "s"} remaining`}
            </span>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-700 ${isUrgent ? "bg-red-500" : "bg-blue-500"}`}
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-gray-500">
            <span>Filed: {formatDate(docket.dateFiled)}</span>
            <span>Deadline: {formatDate(docket.mediationDeadline)}</span>
          </div>
        </div>
      )}

      {!isTerminal && (
        <div>
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-3">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              onClick={onScheduleHearing}
              disabled={!hasMediationPerm}
              className={`flex flex-col items-start gap-2 p-5 bg-white border border-gray-200 shadow-sm rounded-xl transition-none text-left focus:outline-none focus-visible:outline-none active:bg-white ${!hasMediationPerm ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="p-2.5 rounded-lg bg-blue-50">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-blue-600">Schedule Hearing</span>
              <span className="text-xs text-gray-500">Set mediation date</span>
            </button>

            <button
              onClick={onMarkSettled}
              disabled={!hasResolvePerm}
              className={`flex flex-col items-start gap-2 p-5 bg-white border border-gray-200 shadow-sm rounded-xl transition-none text-left focus:outline-none focus-visible:outline-none active:bg-white ${!hasResolvePerm ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="p-2.5 rounded-lg bg-emerald-50">
                <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm text-emerald-600">Mark as Settled</span>
              <span className="text-xs text-gray-500">Amicable settlement</span>
            </button>

            {(status === "UNDER_MEDIATION" ||
              status === "MEDIATION" ||
              status === "PENDING" ||
              status === "ACTIVE") && (
              <button
                onClick={onReferToLupon}
                disabled={!hasEscalationPerm}
                className={`flex flex-col items-start gap-2 p-5 bg-white border border-gray-200 shadow-sm rounded-xl transition-none text-left focus:outline-none focus-visible:outline-none active:bg-white ${!hasEscalationPerm ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="p-2.5 rounded-lg bg-violet-50">
                  <AlertCircleIcon className="w-5 h-5 text-violet-600" />
                </div>
                <span className="text-sm text-violet-600">
                  Escalate to Lupon
                </span>
                <span className="text-xs text-gray-500">
                  {" "}
                  escalation process
                </span>
              </button>
            )}

            {/* Issue CFA button removed as requested */}

            <button
              onClick={onDismissCase}
              disabled={!hasResolvePerm}
              className={`flex flex-col items-start gap-2 p-5 bg-white border border-gray-200 shadow-sm rounded-xl transition-none text-left focus:outline-none focus-visible:outline-none active:bg-white ${!hasResolvePerm ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="p-2.5 rounded-lg bg-gray-100">
                <XIcon className="w-5 h-5 text-gray-600" />
              </div>
              <span className="text-sm text-gray-700">Dismiss Case</span>
              <span className="text-xs text-gray-500">
                Complainant withdrew
              </span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <SectionCard
            title="Complainant Information"
            icon={<UserIcon className="w-4 h-4 text-gray-400" />}
          >
            <div className="grid grid-cols-2 gap-4">
              <InfoRow
                label="Full Name"
                value={`${docket.firstName}${docket.middleName ? " " + docket.middleName : ""} ${docket.lastName}`}
              />
              <InfoRow label="Contact Number" value={docket.contactNumber} />
              <InfoRow label="Age" value={docket.age} />
              <InfoRow label="Gender" value={docket.gender} />
              <InfoRow label="Civil Status" value={docket.civilStatus} />
              <InfoRow label="Email" value={docket.email} />
              <div className="col-span-2">
                <InfoRow
                  label="Current Address"
                  value={docket.completeAddress}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Respondent Information"
            icon={<UserIcon className="w-4 h-4 text-gray-400" />}
          >
            <div className="grid grid-cols-2 gap-4">
              <InfoRow
                label="Name"
                value={`${docket.respondentFirstName}${docket.respondentMiddleName ? " " + docket.respondentMiddleName : ""} ${docket.respondentLastName}`}
              />
              <InfoRow label="Alias" value={docket.respondentAlias} />
              <InfoRow
                label="Contact Number"
                value={docket.respondentContact}
              />
              <InfoRow label="Age" value={docket.respondentAge} />
              <InfoRow label="Gender" value={docket.respondentGender} />
              <InfoRow
                label="Civil Status"
                value={docket.respondentCivilStatus}
              />
              <InfoRow label="Occupation" value={docket.respondentOccupation} />
              <InfoRow
                label="Relationship to Complainant"
                value={docket.relationshipToComplainant}
              />
              <div className="col-span-2">
                <InfoRow label="Address" value={docket.respondentAddress} />
              </div>
              <div className="col-span-2">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
                  Living with Complainant
                </p>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full ${docket.livingWithComplainant ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-600"}`}
                >
                  {docket.livingWithComplainant ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-5 h-fit">
          <h3 className="text-base font-medium text-gray-800 flex items-center gap-2">
            <ClipboardIcon className="w-5 h-5 text-gray-400" /> Case Information
          </h3>
          <InfoRow label="Case Number" value={docket.caseNumber} />
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1.5">
              Status
            </p>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal ${statusPillClass}`}
            >
              {docketStatus ? docketStatus.replace(/_/g, " ") : "UNKNOWN"}
            </span>
          </div>
          {docket.caseStatusRemarks && (
            <InfoRow label="Remarks" value={docket.caseStatusRemarks} />
          )}
          <InfoRow label="Date Filed" value={formatDate(docket.dateFiled)} />
          <InfoRow
            label="Assigned Officer"
            value={docket.assignOfficer || "—"}
          />
          <InfoRow
            label="Nature of Complaint"
            value={docket.natureOfComplaint}
          />
          <InfoRow
            label="Incident Date"
            value={formatDate(docket.incidentDate)}
          />
          {docket.incidentTime && (
            <InfoRow
              label="Incident Time"
              value={formatTime(docket.incidentTime)}
            />
          )}
          <InfoRow label="Incident Place" value={docket.incidentLocation} />
          {docket.frequencyOfIncident && (
            <InfoRow label="Frequency" value={docket.frequencyOfIncident} />
          )}
          {docket.evidenceTypeIds && docket.evidenceTypeIds.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1.5">
                Evidence Submitted
              </p>
              <div className="flex flex-wrap gap-2">
                {docket.evidenceTypeIds.map((id) => (
                  <span
                    key={id}
                    className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full"
                  >
                    Evidence #{id}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <SectionCard
        title="Incident Details"
        icon={<FileTextIcon className="w-4 h-4 text-gray-400" />}
      >
        <p className="text-sm text-gray-900 leading-relaxed">
          {docket.narrative}
        </p>
        {docket.descriptionOfInjuries && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1.5">
              Description of Injuries
            </p>
            <p className="text-sm text-gray-900">
              {docket.descriptionOfInjuries}
            </p>
          </div>
        )}
      </SectionCard>

      {docket.agreementsTerm && (
        <SectionCard
          title="Settlement Agreement"
          icon={<CheckCircleIcon className="w-4 h-4 text-emerald-400" />}
        >
          <p className="text-sm text-gray-900 whitespace-pre-line">
            {docket.agreementsTerm}
          </p>
          {docket.agreementDate && (
            <p className="text-xs text-gray-500 mt-2">
              Date of Agreement: <span>{formatDate(docket.agreementDate)}</span>
            </p>
          )}
        </SectionCard>
      )}

      <SectionCard
        title={`Witnesses (${docket.witnesses?.length ?? 0})`}
        icon={<UserIcon className="w-4 h-4 text-gray-400" />}
      >
        {!docket.witnesses || docket.witnesses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500 gap-2">
            <UserIcon className="w-7 h-7 text-gray-300" />
            <p className="text-sm">No witnesses recorded for this case.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {docket.witnesses.map((w, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 bg-gray-50/80 rounded-lg border border-gray-100"
              >
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                  {i + 1}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 flex-1">
                  <InfoRow label="Name" value={w.fullName} />

                  <InfoRow label="Contact" value={w.contactNumber} />
                  {w.address && (
                    <div className="col-span-2">
                      <InfoRow label="Address" value={w.address} />
                    </div>
                  )}
                  {w.testimony && (
                    <div className="col-span-2">
                      <InfoRow label="Testimony" value={w.testimony} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Lupon Management Section - display if may laman */}
      {Array.isArray(docket.luponManagement) &&
        docket.luponManagement.length > 0 && (
          <SectionCard
            title={`Case Handled By (${docket.luponManagement.length})`}
            icon={<UserIcon className="w-4 h-4 text-gray-400" />}
          >
            <div className="space-y-2">
              {docket.luponManagement.map((lupon, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-lg border border-gray-100"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">
                      {lupon.firstName} {lupon.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{lupon.position}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

      {mediation && (
        <SectionCard
          title="Mediation Process"
          icon={<HashIcon className="w-4 h-4 text-gray-400" />}
        >
          <div className="space-y-0">
            {MEDIATION_STEPS.map((step, idx) => {
              const done = mediationProgress[idx];
              const isLast = idx === MEDIATION_STEPS.length - 1;
              return (
                <div key={step.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${done ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400 border-2 border-gray-200"}`}
                    >
                      {done ? <CheckCircleIcon className="w-4 h-4" /> : idx + 1}
                    </div>
                    {!isLast && (
                      <div
                        className={`w-0.5 flex-1 my-1 ${done ? "bg-emerald-300" : "bg-gray-200"}`}
                      />
                    )}
                  </div>
                  <div className="pb-5 flex-1 flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-700">{step.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {step.sub(mediation)}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ml-4 ${done ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {done ? "COMPLETED" : "PENDING"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
