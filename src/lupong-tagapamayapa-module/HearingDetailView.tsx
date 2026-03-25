import React from 'react'
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  FileTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  TagIcon,
  HashIcon,
  UserCheckIcon,
  ClipboardListIcon,
  
} from 'lucide-react'
import { Badge } from '../lupong-tagapamayapa-module/ui/Badge'
import { type HearingScheduleDTO } from '../lupong-tagapamayapa-api/Hearing'
interface HearingDetailViewProps {
  hearing: HearingScheduleDTO
  onBack: () => void
  onSuccess: () => void
}
function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  const displayValue =
    value === null || value === undefined || value === '' ? '—' : value
  return (
    <div className="flex items-start gap-3 py-4 border-b border-gray-100 last:border-0">
      <div className="flex-shrink-0 mt-0.5 text-gray-400">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
        <div className="text-sm font-medium text-gray-900">{displayValue}</div>
      </div>
    </div>
  )
}
function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      </div>
      <div className="px-5 divide-y divide-gray-100">{children}</div>
    </div>
  )
}
export function HearingDetailView({
  hearing,
  onBack,
  
}: HearingDetailViewProps) {
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  const formatDateTime = (dateString: string) =>
    `${formatDate(dateString)}, ${formatTime(dateString)}`
  const PresenceTag = ({ present }: { present: boolean | null }) => {
    if (present === null || present === undefined) {
      return <span className="text-gray-400 font-medium text-sm">—</span>
    }
    return present ? (
      <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-md">
        <CheckCircleIcon className="w-4 h-4" /> Present
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 text-sm text-red-700 font-medium bg-red-50 px-2.5 py-1 rounded-md">
        <XCircleIcon className="w-4 h-4" /> Absent
      </span>
    )
  }
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50/30 min-h-screen">
      {/* Back Navigation */}
      <button
        onClick={onBack}
        className="group flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-6"
      >
        <div className="p-1.5 rounded-md bg-white border border-gray-200 group-hover:border-gray-300 transition-colors">
          <ArrowLeftIcon className="w-4 h-4" />
        </div>
        Back to Hearings
      </button>

      {/* Header Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Badge status={hearing.status} className="px-3 py-1 text-sm" />
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                {hearing.casePhase}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {hearing.complainantName}{' '}
              <span className="text-gray-400 font-normal mx-2">vs</span>{' '}
              {hearing.respondentName}
            </h1>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <span>
                Case Ref:{' '}
                <span className="font-semibold text-gray-700">
                  {hearing.blotterNumber}
                </span>
              </span>
            </p>
          </div>
          
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left Column */}
        <div className="space-y-6 lg:space-y-8">
          <SectionCard title="Schedule & Venue">
            <DetailRow
              icon={<CalendarIcon className="w-4 h-4" />}
              label="Date"
              value={formatDate(hearing.scheduledStart)}
            />
            <DetailRow
              icon={<ClockIcon className="w-4 h-4" />}
              label="Time"
              value={
                <span>
                  {formatTime(hearing.scheduledStart)}
                  {hearing.scheduledEnd && (
                    <span className="text-gray-500">
                      {' '}
                      – {formatTime(hearing.scheduledEnd)}
                    </span>
                  )}
                </span>
              }
            />
            <DetailRow
              icon={<MapPinIcon className="w-4 h-4" />}
              label="Venue"
              value={hearing.venue}
            />
          </SectionCard>

          <SectionCard title="Case Information">
            <DetailRow
              icon={<HashIcon className="w-4 h-4" />}
              label="Blotter Number"
              value={hearing.blotterNumber}
            />
            <DetailRow
              icon={<TagIcon className="w-4 h-4" />}
              label="Case Phase"
              value={hearing.casePhase}
            />
            <DetailRow
              icon={<HashIcon className="w-4 h-4" />}
              label="Summon Number"
              value={hearing.summonNumber}
            />
          </SectionCard>
        </div>

        {/* Right Column */}
        <div className="space-y-6 lg:space-y-8">
          <SectionCard title="Parties Involved">
            <DetailRow
              icon={<UserIcon className="w-4 h-4" />}
              label="Complainant"
              value={
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold">
                    {hearing.complainantName}
                  </span>
                  <PresenceTag present={hearing.complainantPresent} />
                </div>
              }
            />
            <DetailRow
              icon={<UserIcon className="w-4 h-4" />}
              label="Respondent"
              value={
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold">
                    {hearing.respondentName}
                  </span>
                  <PresenceTag present={hearing.respondentPresent} />
                </div>
              }
            />
          </SectionCard>

          <SectionCard title="Hearing Record">
            <DetailRow
              icon={<ClipboardListIcon className="w-4 h-4" />}
              label="Hearing Notes"
              value={
                hearing.hearingNotes ? (
                  <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {hearing.hearingNotes}
                  </p>
                ) : null
              }
            />
            <DetailRow
              icon={<CheckCircleIcon className="w-4 h-4" />}
              label="Outcome"
              value={hearing.outcome}
            />
            <DetailRow
              icon={<FileTextIcon className="w-4 h-4" />}
              label="Remarks / Additional Notes"
              value={
                hearing.notes ? (
                  <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {hearing.notes}
                  </p>
                ) : null
              }
            />
            <DetailRow
              icon={<UserCheckIcon className="w-4 h-4" />}
              label="Minutes Recorded By"
              value={hearing.recordedByMinutes}
            />
          </SectionCard>
        </div>
      </div>

      {/* Metadata - Bottom */}
      <div className="mt-6 lg:mt-8">
        <SectionCard title="System Metadata">
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <DetailRow
              icon={<UserCheckIcon className="w-4 h-4" />}
              label="Created By"
              value={hearing.createdBy}
            />
            <DetailRow
              icon={<CalendarIcon className="w-4 h-4" />}
              label="Created At"
              value={formatDateTime(hearing.createdAt)}
            />
          </div>
        </SectionCard>
      </div>

      
    </div>
  )
}
