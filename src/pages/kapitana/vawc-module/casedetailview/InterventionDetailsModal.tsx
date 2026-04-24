import {
  CalendarDaysIcon,
  ClockIcon,
  FileTextIcon,
  UserIcon,
  XIcon,
} from 'lucide-react';
import type { FollowUpViewDTO, InterventionViewDTO } from '../../../../service/vawc-api/vawc-api';
import { formatDateTime } from './shared';

type LocalFollowUpViewDTO = FollowUpViewDTO & {
  pendingSync?: boolean;
};

type LocalInterventionViewDTO = InterventionViewDTO & {
  followUps: LocalFollowUpViewDTO[];
};

function formatTimeRange(dateStr: string, durationMinutes: number): string {
  try {
    const start = new Date(dateStr);
    const end = new Date(start.getTime() + durationMinutes * 60_000);
    const fmt = (date: Date) =>
      date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${fmt(start)} - ${fmt(end)}`;
  } catch {
    return '-';
  }
}

type InterventionDetailsModalProps = {
  interventionDetails: LocalInterventionViewDTO | null;
  fallbackIntervention?: LocalInterventionViewDTO | null;
  loading?: boolean;
  loadError?: string;
  onClose: () => void;
};

export function InterventionDetailsModal({
  interventionDetails,
  fallbackIntervention = null,
  loading = false,
  loadError = '',
  onClose,
}: InterventionDetailsModalProps) {
  const displayIntervention = interventionDetails ?? fallbackIntervention;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Intervention Details{displayIntervention ? ` - ${displayIntervention.activityType}` : ''}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{displayIntervention ? 'Intervention log details' : 'Loading intervention record.'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {loading && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Loading intervention details from the API...
            </div>
          )}

          {loadError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {loadError}
            </div>
          )}

          {!displayIntervention ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
              No intervention details available for this record.
            </div>
          ) : (
            <>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Intervention Log</p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-6 gap-y-4">
              <div className="min-w-0">
                <p className="text-xs text-gray-400 mb-1">Activity</p>
                <p className="text-sm font-semibold text-blue-600 break-words">{displayIntervention.activityType}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 mb-1">Date</p>
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <CalendarDaysIcon className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                  <span className="break-words leading-5">{formatDateTime(displayIntervention.interventionDate)}</span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 mb-1">Time</p>
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <ClockIcon className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                  <span className="break-words leading-5">{formatTimeRange(displayIntervention.interventionDate, displayIntervention.duration)}</span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 mb-1">Assigned Officer</p>
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <UserIcon className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                  <span className="break-words leading-5">{displayIntervention.performedBy.length > 0 ? displayIntervention.performedBy.join(', ') : 'No assigned officer'}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <FileTextIcon className="w-3.5 h-3.5" /> 1 Notes / Description
            </p>
            <div className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 leading-relaxed min-h-[120px] whitespace-pre-wrap">
              {displayIntervention.details || (
                <span className="text-gray-400 italic">No details recorded for this intervention.</span>
              )}
            </div>
          </div>

          {displayIntervention.followUps.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">2 Follow-up Records</p>
              <div className="space-y-3">
                {displayIntervention.followUps.map((followUp) => (
                  <div
                    key={followUp.id}
                    className="p-4 rounded-lg border border-gray-100 bg-gray-50/60"
                  >
                    <p className="text-sm text-gray-700 mb-2 leading-relaxed">{followUp.notes}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[12px] text-gray-400 font-medium">
                      <span className="text-blue-600 capitalize">By {followUp.createdBy}</span>
                      <span>|</span>
                      <span>{formatDateTime(followUp.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium border border-gray-200 rounded-md text-gray-600 bg-white hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}