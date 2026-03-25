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
  UsersIcon,
  CalendarClockIcon,
} from 'lucide-react'
import {  type MediationProcessDTO } from '../../lupong-tagapamayapa-api/LuponCaseManagement-view-api-v2'
import {type LuponViewDTO } from '../../lupong-tagapamayapa-api/Lupong-tagapamayapa-view-api'
import { StatusBadge, isTerminalStatus } from '../shared/StatusBadge'
import { InfoRow } from '../shared/InfoRow'
import { SectionCard } from '../shared/SectionCard'
import { formatDate, formatTime } from '../lib/Utils'
interface OverviewTabProps {
  luponData: LuponViewDTO
  mediation: MediationProcessDTO | null
  hasStatusPerm: boolean
  onScheduleHearing: () => void
  onMarkSettled: () => void
  onDismissCase: () => void
  onIssueCFA: () => void
  onExtendMediation: () => void
}
const MEDIATION_STEPS = [
  {
    key: 'stepCaseReceived',
    label: 'Case Received by Lupon',
    sub: (p: MediationProcessDTO) =>
      p.caseReceivedDate
        ? `Received on ${formatDate(p.caseReceivedDate)}`
        : 'Awaiting receipt',
  },
  {
    key: 'stepSummonIssued',
    label: 'Pangkat Assignment / Summon Issued',
    sub: (p: MediationProcessDTO) => p.summonStatus ?? 'Awaiting first summon',
  },
  {
    key: 'stepMediationOngoing',
    label: 'Mediation Hearings',
    sub: (p: MediationProcessDTO) =>
      `${p.hearingsConducted} hearing(s) conducted`,
  },
  {
    key: 'stepResolved',
    label: 'Case Resolution',
    sub: (p: MediationProcessDTO) =>
      p.resolutionStatus ?? 'Awaiting resolution',
  },
]
export function OverviewTab({
  luponData,
  mediation,
  hasStatusPerm,
  onScheduleHearing,
  onMarkSettled,
  onDismissCase,
  onIssueCFA,
  onExtendMediation,
}: OverviewTabProps) {
  const isTerminal = isTerminalStatus(luponData.caseStatus)
  const status = luponData.caseStatus
  const { luponDeadline, daysRemaining, extensionCount } =
    luponData.mediationInfo
  const percent = Math.min(100, Math.max(0, ((15 - daysRemaining) / 15) * 100))
  const isUrgent = daysRemaining <= 3
  const mediationProgress = mediation
    ? [
        mediation.stepCaseReceived,
        mediation.stepSummonIssued,
        mediation.stepMediationOngoing,
        mediation.stepResolved,
      ]
    : [false, false, false, false]
  return (
    <div className="space-y-5">
      {isTerminal ? (
        <div
          className={`border shadow-sm rounded-xl p-4 flex items-start gap-3 ${status === 'SETTLED' ? 'bg-emerald-50 border-emerald-200' : status === 'DISMISSED' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}
        >
          <div
            className={`mt-0.5 shrink-0 ${status === 'SETTLED' ? 'text-emerald-500' : status === 'DISMISSED' ? 'text-red-500' : 'text-amber-500'}`}
          >
            {status === 'SETTLED' ? (
              <CheckCircleIcon className="w-5 h-5" />
            ) : status === 'DISMISSED' ? (
              <XIcon className="w-5 h-5" />
            ) : (
              <AlertCircleIcon className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p
                className={`text-sm font-bold ${status === 'SETTLED' ? 'text-emerald-700' : status === 'DISMISSED' ? 'text-red-700' : 'text-amber-700'}`}
              >
                {status === 'SETTLED'
                  ? 'Case Settled'
                  : status === 'DISMISSED'
                    ? 'Case Dismissed'
                    : 'Case Closed'}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Remarks:
              </span>
              {luponData.caseStatusRemarks ? (
                <span
                  className={`text-sm font-medium ${status === 'SETTLED' ? 'text-emerald-700' : status === 'DISMISSED' ? 'text-red-700' : 'text-amber-700'}`}
                >
                  {luponData.caseStatusRemarks}
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
              <span className="font-medium text-gray-900">
                15-Day Lupon Mediation Period
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-semibold ${isUrgent ? 'text-red-500' : 'text-blue-600'}`}
              >
                {daysRemaining <= 0
                  ? 'Overdue'
                  : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining`}
              </span>
              {extensionCount === 0 && hasStatusPerm && (
                <button
                  onClick={onExtendMediation}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <CalendarClockIcon className="w-3.5 h-3.5" /> Extend
                </button>
              )}
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-700 ${isUrgent ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{
                width: `${percent}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Referred: {formatDate(luponData.referredToLuponAt)}</span>
            <span>Deadline: {formatDate(luponDeadline)}</span>
          </div>
          {extensionCount > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-start gap-2 text-xs text-gray-600">
              <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
              <p>
                Mediation period was extended on{' '}
                <span className="font-semibold">
                  {formatDate(luponData.mediationInfo.extensionDate)}
                </span>
                . Reason: {luponData.mediationInfo.extensionReason}
              </p>
            </div>
          )}
        </div>
      )}

      {!isTerminal && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              onClick={onScheduleHearing}
              className="flex flex-col items-start gap-2 p-5 bg-white border border-gray-200 shadow-sm rounded-xl transition-all text-left hover:border-blue-300 hover:shadow-md"
            >
              <div className="p-2.5 rounded-lg bg-blue-50">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-bold text-blue-600">
                Schedule Hearing
              </span>
              <span className="text-xs text-gray-500">Set mediation date</span>
            </button>

            <button
              onClick={onMarkSettled}
              disabled={!hasStatusPerm}
              className={`flex flex-col items-start gap-2 p-5 bg-white border border-gray-200 shadow-sm rounded-xl transition-all text-left hover:border-emerald-300 hover:shadow-md ${!hasStatusPerm ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="p-2.5 rounded-lg bg-emerald-50">
                <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm font-bold text-emerald-600">
                Mark as Settled
              </span>
              <span className="text-xs text-gray-500">Amicable settlement</span>
            </button>

            <button
              onClick={onIssueCFA}
              disabled={!hasStatusPerm}
              className={`flex flex-col items-start gap-2 p-5 bg-white border border-gray-200 shadow-sm rounded-xl transition-all text-left hover:border-amber-300 hover:shadow-md ${!hasStatusPerm ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="p-2.5 rounded-lg bg-amber-50">
                <AlertCircleIcon className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm font-bold text-amber-600">
                Issue CFA
              </span>
              <span className="text-xs text-gray-500">
                Cert. to File Action
              </span>
            </button>

            <button
              onClick={onDismissCase}
              disabled={!hasStatusPerm}
              className={`flex flex-col items-start gap-2 p-5 bg-white border border-gray-200 shadow-sm rounded-xl transition-all text-left hover:border-gray-400 hover:shadow-md ${!hasStatusPerm ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="p-2.5 rounded-lg bg-gray-100">
                <XIcon className="w-5 h-5 text-gray-600" />
              </div>
              <span className="text-sm font-bold text-gray-700">
                Dismiss Case
              </span>
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
                value={`${luponData.complainant.firstName} ${luponData.complainant.middleName || ''} ${luponData.complainant.lastName}`}
              />
              <InfoRow
                label="Contact Number"
                value={luponData.complainant.contactNumber}
              />
              <InfoRow label="Age" value={luponData.complainant.age} />
              <InfoRow label="Gender" value={luponData.complainant.gender} />
              <InfoRow
                label="Civil Status"
                value={luponData.complainant.civilStatus}
              />
              <InfoRow label="Email" value={luponData.complainant.email} />
              <div className="col-span-2">
                <InfoRow
                  label="Current Address"
                  value={luponData.complainant.completeAddress}
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
                value={`${luponData.respondent.firstName} ${luponData.respondent.middleName || ''} ${luponData.respondent.lastName}`}
              />
              <InfoRow label="Alias" value={luponData.respondent.alias} />
              <InfoRow
                label="Contact Number"
                value={luponData.respondent.contactNumber}
              />
              <InfoRow label="Age" value={luponData.respondent.age} />
              <InfoRow label="Gender" value={luponData.respondent.gender} />
              <InfoRow
                label="Civil Status"
                value={luponData.respondent.civilStatus}
              />
              <InfoRow
                label="Occupation"
                value={luponData.respondent.occupation}
              />
              <InfoRow
                label="Relationship to Complainant"
                value={luponData.respondent.relationshipToComplainant}
              />
              <div className="col-span-2">
                <InfoRow label="Address" value={luponData.respondent.address} />
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">
                  Living with Complainant
                </p>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${luponData.respondent.livingWithComplainant ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  {luponData.respondent.livingWithComplainant ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-5 h-fit">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <ClipboardIcon className="w-5 h-5 text-gray-400" /> Case Information
          </h3>
          <InfoRow label="Blotter Number" value={luponData.blotterNumber} />
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1.5">
              Status
            </p>
            <StatusBadge status={luponData.caseStatus} />
          </div>
          <InfoRow label="Date Filed" value={formatDate(luponData.dateFiled)} />
          <InfoRow
            label="Nature of Complaint"
            value={luponData.incidentDetail.natureOfComplaint}
          />
          <InfoRow
            label="Incident Date"
            value={formatDate(luponData.incidentDetail.incidentDate)}
          />
          {luponData.incidentDetail.incidentTime && (
            <InfoRow
              label="Incident Time"
              value={formatTime(luponData.incidentDetail.incidentTime)}
            />
          )}
          <InfoRow
            label="Incident Place"
            value={luponData.incidentDetail.incidentLocation}
          />
          {luponData.incidentDetail.frequencyOfIncident && (
            <InfoRow
              label="Frequency"
              value={luponData.incidentDetail.frequencyOfIncident}
            />
          )}
          {luponData.evidenceTypeIds &&
            luponData.evidenceTypeIds.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1.5">
                  Evidence Submitted
                </p>
                <div className="flex flex-wrap gap-2">
                  {luponData.evidenceTypeIds.map((id) => (
                    <span
                      key={id}
                      className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-bold"
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
        title="Incident Narrative"
        icon={<FileTextIcon className="w-4 h-4 text-gray-400" />}
      >
        <p className="text-sm text-gray-900 leading-relaxed">
          {luponData.narrative || 'No narrative provided.'}
        </p>
        {luponData.incidentDetail.descriptionOfInjuries && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1.5">
              Description of Injuries
            </p>
            <p className="text-sm text-gray-900">
              {luponData.incidentDetail.descriptionOfInjuries}
            </p>
          </div>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SectionCard
          title={`Pangkat Members (${luponData.memberHandlers?.length ?? 0})`}
          icon={<UsersIcon className="w-4 h-4 text-gray-400" />}
        >
          {!luponData.memberHandlers ||
          luponData.memberHandlers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500 gap-2">
              <UsersIcon className="w-7 h-7 text-gray-300" />
              <p className="text-sm">No Pangkat members assigned.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {luponData.memberHandlers.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-lg border border-gray-100"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">
                    {m.firstName[0]}
                    {m.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {m.firstName} {m.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{m.position}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title={`Witnesses (${luponData.witnesses?.length ?? 0})`}
          icon={<UserIcon className="w-4 h-4 text-gray-400" />}
        >
          {!luponData.witnesses || luponData.witnesses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500 gap-2">
              <UserIcon className="w-7 h-7 text-gray-300" />
              <p className="text-sm">No witnesses recorded for this case.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {luponData.witnesses.map((w, i) => (
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {mediation && (
        <SectionCard
          title="Mediation Process"
          icon={<HashIcon className="w-4 h-4 text-gray-400" />}
        >
          <div className="space-y-0">
            {MEDIATION_STEPS.map((step, idx) => {
              const done = mediationProgress[idx]
              const isLast = idx === MEDIATION_STEPS.length - 1
              return (
                <div key={step.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${done ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400 border-2 border-gray-200'}`}
                    >
                      {done ? <CheckCircleIcon className="w-4 h-4" /> : idx + 1}
                    </div>
                    {!isLast && (
                      <div
                        className={`w-0.5 flex-1 my-1 ${done ? 'bg-emerald-300' : 'bg-gray-200'}`}
                      />
                    )}
                  </div>
                  <div className="pb-5 flex-1 flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {step.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {step.sub(mediation)}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ml-4 ${done ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {done ? 'COMPLETED' : 'PENDING'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>
      )}
    </div>
  )
}
