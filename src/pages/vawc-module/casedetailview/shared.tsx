import type { ReactNode } from 'react';

export const CASE_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-green-50 text-green-700 border border-green-200',
  ONGOING: 'bg-blue-50 text-blue-700 border border-blue-200',
  RESOLVED: 'bg-purple-50 text-purple-700 border border-purple-200',
  DISMISSED: 'bg-gray-100 text-gray-600 border border-gray-200',
  REFERRED: 'bg-amber-50 text-amber-700 border border-amber-200',
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
        ? value
          ? 'Yes'
          : 'No'
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

export type ActiveTab = 'overview' | 'bpo' | 'notes' | 'timeline' | 'cfa';