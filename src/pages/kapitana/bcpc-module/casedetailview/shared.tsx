import type { ReactNode } from 'react';

export const CASE_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  ONGOING: 'bg-blue-50 text-blue-700 border border-blue-200',
  UNDER_INTERVENTION: 'bg-sky-50 text-sky-700 border border-sky-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  REFERRED: 'bg-violet-50 text-violet-700 border border-violet-200',
  CERTIFIED_TO_FILE_ACTION: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  WITHDRAWN: 'bg-gray-100 text-gray-600 border border-gray-200',
  DISMISSED: 'bg-rose-50 text-rose-700 border border-rose-200',
};

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className ?? ''}`} />;
}

export function InfoField({
  label,
  value,
}: {
  label: string;
  value?: string | number | boolean | null;
}) {
  const display =
    value === null || value === undefined || value === ''
      ? '—'
      : typeof value === 'boolean'
        ? value ? 'Yes' : 'No'
        : String(value);

  return (
    <div>
      <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-gray-700">{display}</p>
    </div>
  );
}

export function SectionCard({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-medium text-gray-800 flex items-center gap-2">
          {icon}
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export function formatDate(date?: string) {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return date;
  }
}

export function formatDateTime(date?: string) {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return date;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActiveTab = 'overview' | 'mediation' | 'notes' | 'referrals' | 'bpo' | 'timeline';

export interface BcpcCaseDetailDTO {
  id: number;
  caseNumber: string;
  // child info
  childFirstName: string;
  childMiddleName?: string;
  childLastName: string;
  childAge?: number;
  childGender?: string;
  childAddress?: string;
  childContact?: string;
  // respondent / guardian
  respondentFirstName?: string;
  respondentMiddleName?: string;
  respondentLastName?: string;
  respondentRelationship?: string;
  respondentAddress?: string;
  respondentContact?: string;
  // case info
  caseStatus: string;
  caseType?: string;
  violenceTypes?: string;
  dateFiled: string;
  incidentDate?: string;
  incidentTime?: string;
  incidentLocation?: string;
  narrative?: string;
  assignedOfficer?: string;
  bpoDeadline?: string;
  remainingTime?: string;
  natureOfComplaint?: string;
  caseFiledBy?: string;
}

export interface BcpcCaseNote {
  id: number;
  note: string;
  createdBy: string;
  createdAt: string;
}

export interface BcpcTimelineEvent {
  id: number;
  eventType: string;
  title: string;
  description?: string;
  performedBy?: string;
  eventDate: string;
}

export interface BcpcMediationSession {
  id: number;
  sessionDate: string;
  sessionType: string;
  notes?: string;
  outcome?: string;
  mediator?: string;
}

export interface BcpcReferral {
  id: number;
  referredTo: string;
  referralDate: string;
  grounds?: string;
  status?: string;
  referredBy?: string;
}

export interface BcpcBpoRecord {
  id: number;
  bpoNumber?: string;
  issuedAt?: string;
  expiredAt?: string;
  status?: string;
  assignOfficer?: string;
}
