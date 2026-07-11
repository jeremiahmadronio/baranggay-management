import {
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  XIcon,
  UserIcon,
  ClipboardIcon,
  FileTextIcon,
  RotateCcwIcon,
  DownloadIcon,
  LinkIcon,
  ArrowRightIcon,
} from "lucide-react";

import type {
  BlotterDocketViewDTO,
  MediationProcessDTO,
} from "../../../service/blotter-api/DocketView";
import { isTerminalStatus } from "../shared/StatusBadge";
import { InfoRow } from "../shared/InfoRow";
import { SectionCard } from "../shared/SectionCard";
import { NarrativeViewer } from "../shared/NarrativeViewer";
import { EvidenceViewer } from "../shared/EvidenceViewer";
import { formatDate, formatTime } from "../shared/utils";
import { viewOrDownloadFile } from "../../../utils/fileViewer";
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
  onReopenCase: () => void;
  onNavigateLinkedCase: (caseNumber: string) => void;
}
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
  onReopenCase,
  onNavigateLinkedCase,
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
      {docket.caseHistory && docket.caseHistory.length > 1 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-slate-800">Case History</h3>
          </div>
          <div className="space-y-3">
            {docket.caseHistory.map((history, idx) => {
              const isCurrent = history.caseNumber === docket.caseNumber;
              const isLatestActive = idx === docket.caseHistory!.length - 1;
              
              return (
                <div 
                  key={history.caseNumber}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isLatestActive 
                      ? "bg-emerald-50 border-emerald-300 shadow-sm ring-1 ring-emerald-200" 
                      : isCurrent 
                        ? "bg-white border-blue-200 shadow-sm ring-1 ring-blue-100" 
                        : "bg-slate-100/50 border-slate-200 hover:bg-slate-100 transition-colors"
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isLatestActive ? "text-emerald-800" : isCurrent ? "text-blue-700" : "text-slate-700"}`}>
                        {history.caseNumber}
                      </span>
                      {isLatestActive && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider rounded-full">
                          Latest Active Case
                        </span>
                      )}
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                          Current View
                        </span>
                      )}
                      {!isLatestActive && history.relationshipType !== "Current" && (
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-medium uppercase tracking-wider rounded-full">
                          {history.relationshipType}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                      <span>Filed: {new Date(history.dateFiled).toLocaleDateString()}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span>Status: {history.status}</span>
                    </div>
                  </div>
                  {!isCurrent && (
                    <button
                      onClick={() => onNavigateLinkedCase(history.caseNumber)}
                      className="shrink-0 flex items-center gap-2 text-xs font-medium bg-white hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors shadow-sm"
                    >
                      View Record
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                <div className="mt-1">
                  {(() => {
                    const remark = docket.caseStatusRemarks!;
                    const isBase64ImageOrDoc = remark.length > 1000 && !remark.includes(' ');
                    
                    if (!isBase64ImageOrDoc) {
                      return (
                        <span
                          className={`text-sm ${
                            status === "SETTLED"
                              ? "text-emerald-700"
                              : status === "DISMISSED"
                                ? "text-red-700"
                                : "text-blue-700"
                          }`}
                        >
                          {remark}
                        </span>
                      );
                    }
                    
                    // It's a file
                    const isPng = remark.startsWith('iVBORw0KGgo');
                    const isJpeg = remark.startsWith('/9j/');
                    const isPdf = remark.startsWith('JVBERi0');
                    const isDocx = remark.startsWith('UEsDBBQ');
                    
                    let mime = 'application/octet-stream';
                    let ext = 'file';
                    
                    if (isPng) { mime = 'image/png'; ext = 'png'; }
                    else if (isJpeg) { mime = 'image/jpeg'; ext = 'jpg'; }
                    else if (isPdf) { mime = 'application/pdf'; ext = 'pdf'; }
                    else if (isDocx) { mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; ext = 'docx'; }
                    else if (remark.startsWith('0M8R4KGxGuE')) { mime = 'application/msword'; ext = 'doc'; }
                    
                    const dataUrl = `data:${mime};base64,${remark}`;
                    
                    return (
                      <a
                        href={dataUrl}
                        download={`Dismissal_${docket.caseNumber}.${ext}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-gray-50 hover:text-blue-700 mt-1"
                      >
                        <DownloadIcon className="h-3.5 w-3.5" />
                        Download Attached Document
                      </a>
                    );
                  })()}
                </div>
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

      {(true) && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
            Quick Actions
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {!isTerminal ? (
              <>
                <button
                  onClick={onScheduleHearing}
                  disabled={!hasMediationPerm}
                  className={`flex flex-col items-start gap-2 p-5 bg-white border border-gray-200 shadow-sm rounded-xl transition-none text-left focus:outline-none focus-visible:outline-none active:bg-white ${!hasMediationPerm ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="p-2.5 rounded-lg bg-blue-50">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm text-blue-600 font-medium">Schedule Mediation</span>
                  <span className="text-xs text-gray-500">Set mediation date</span>
                </button>

                {(status === "UNDER_MEDIATION" ||
                  status === "MEDIATION" ||
                  status === "PENDING" ||
                  status === "ACTIVE") && (() => {
                  const completedSessions = mediation?.hearingsConducted ?? 0;
                  const periodExpired = displayDaysRemaining <= 0;
                  const canEscalate = completedSessions >= 3 || periodExpired;
                  const disableEscalate = !hasEscalationPerm || !canEscalate;
                  const escalateTitle = !canEscalate
                    ? periodExpired
                      ? "Mediation period has expired — escalation allowed"
                      : `${completedSessions}/3 sessions complete — escalation available after 3 sessions or when the 15-day period expires`
                    : "";
                  return (
                    <button
                      onClick={onReferToLupon}
                      disabled={disableEscalate}
                      title={escalateTitle}
                      className={`flex flex-col items-start gap-2 p-5 bg-white border border-gray-200 shadow-sm rounded-xl transition-none text-left focus:outline-none focus-visible:outline-none active:bg-white ${disableEscalate ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="p-2.5 rounded-lg bg-violet-50">
                        <AlertCircleIcon className="w-5 h-5 text-violet-600" />
                      </div>
                      <span className="text-sm text-violet-600 font-medium">Escalate to Lupon</span>
                      <span className="text-xs text-gray-500">
                        {canEscalate ? "Escalation available" : `${completedSessions}/3 sessions or period expired`}
                      </span>
                    </button>
                  );
                })()}

                <button
                  onClick={onDismissCase}
                  disabled={!hasResolvePerm}
                  className={`flex flex-col items-start gap-2 p-5 bg-white border border-gray-200 shadow-sm rounded-xl transition-none text-left focus:outline-none focus-visible:outline-none active:bg-white ${!hasResolvePerm ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="p-2.5 rounded-lg bg-red-50">
                    <XIcon className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="text-sm text-red-600 font-medium">Dismiss Case</span>
                  <span className="text-xs text-gray-500">Complainant withdrew</span>
                </button>
              </>
            ) : (
              <button
                onClick={onReopenCase}
                disabled={!hasResolvePerm}
                className={`flex flex-col items-start gap-2 p-5 bg-white border border-gray-200 shadow-sm rounded-xl transition-none text-left focus:outline-none focus-visible:outline-none active:bg-white ${!hasResolvePerm ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="p-2.5 rounded-lg bg-blue-50">
                  <RotateCcwIcon className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm text-blue-600 font-medium">Re-open Case</span>
                <span className="text-xs text-gray-500">Restore case to active</span>
              </button>
            )}
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
        </div>
      </div>

      <SectionCard
        title="Incident Details"
        icon={<FileTextIcon className="w-4 h-4 text-gray-400" />}
      >
        <NarrativeViewer caseNumber={docket.caseNumber} />
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
        {docket.evidences && docket.evidences.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
              Evidence Submitted
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {docket.evidences.map((ev) => (
                <div
                  key={ev.recordId}
                  className="flex flex-col gap-1 p-3 rounded-lg border border-gray-200 bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">
                      {ev.customDescription || ev.typeName}
                    </span>
                    {ev.hasFile && (
                      <EvidenceViewer
                        recordId={ev.recordId}
                        fileName={ev.customDescription || ev.typeName}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
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
                  <div className="col-span-2">
                    <InfoRow label="Address" value={w.address} />
                  </div>
                  {w.testimonyFile && (
                    <div className="col-span-2 mt-2">
                      <button
                        onClick={() => {
                          const raw = w.testimonyFile || "";
                          const isPdf = raw.startsWith("JVBERi0");
                          const isPng = raw.startsWith("iVBORw0KGgo");
                          const isJpeg = raw.startsWith("/9j/");
                          const isDocx = raw.startsWith("UEsDBBQ");
                          const isMp4 = raw.startsWith("AAAA") && raw.substring(0, 20).includes("Z0eXB");
                          const isWebm = raw.startsWith("GkXfo");
                          const isAvi = raw.startsWith("UklGR");

                          let mime = "application/octet-stream";
                          let ext = "bin";

                          if (isPdf) {
                            mime = "application/pdf";
                            ext = "pdf";
                          } else if (isPng) {
                            mime = "image/png";
                            ext = "png";
                          } else if (isJpeg) {
                            mime = "image/jpeg";
                            ext = "jpg";
                          } else if (isDocx) {
                            mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                            ext = "docx";
                          } else if (isMp4) {
                            mime = "video/mp4";
                            ext = "mp4";
                          } else if (isWebm) {
                            mime = "video/webm";
                            ext = "webm";
                          } else if (isAvi) {
                            mime = "video/x-msvideo";
                            ext = "avi";
                          } else if (raw.startsWith("0M8R4KGxGuE")) {
                            mime = "application/msword";
                            ext = "doc";
                          } else if (raw.length < 50000 && !raw.includes("AAB")) {
                            mime = "text/plain";
                            ext = "txt";
                          }

                          viewOrDownloadFile(raw, mime, ext, `Testimony_${w.fullName.replace(/\s+/g, "_")}`);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                        title="View Testimony"
                      >
                        <FileTextIcon className="w-3.5 h-3.5" />
                        View Testimony
                      </button>
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


    </div>
  );
}
