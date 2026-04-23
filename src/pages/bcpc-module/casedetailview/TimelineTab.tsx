import { CalendarDaysIcon, ClockIcon, HistoryIcon, UserCircle2Icon } from 'lucide-react';
import { SectionCard } from './shared';
import type { BcpcTimelineEvent } from './shared';

type TimelineTabProps = {
  timeline: BcpcTimelineEvent[];
  timelineLoading: boolean;
  formatDate: (date?: string) => string;
};

const toDateAndTime = (raw: string) => {
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return { date: raw, time: '' };
  }
  return {
    date: parsed.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    time: parsed.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
  };
};

export function TimelineTab({ timeline, timelineLoading }: TimelineTabProps) {
  return (
    <SectionCard
      title="Case History & Timeline"
      icon={<ClockIcon className="w-4 h-4 text-gray-400" />}
    >
      {timelineLoading ? (
        <div className="py-12 text-center text-gray-500 animate-pulse text-sm">
          Loading case history...
        </div>
      ) : timeline.length === 0 ? (
        <div className="py-12 text-center text-gray-500 text-sm">
          <HistoryIcon className="w-5 h-5 mx-auto mb-2 text-slate-400" />
          No events recorded.
        </div>
      ) : (
        <div className="space-y-3">
          {timeline.map((event) => {
            const { date, time } = toDateAndTime(event.eventDate);
            return (
              <div key={event.id} className="p-4 sm:p-5 rounded-lg border border-slate-200 bg-white">
                <h4 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                  {event.title}
                </h4>
                <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">
                  {event.description || 'No additional description.'}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDaysIcon className="w-3.5 h-3.5" />
                    {date}
                    {time ? ` • ${time}` : ''}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <UserCircle2Icon className="w-3.5 h-3.5" />
                    {event.performedBy || 'System'}
                  </span>
                  <span className="text-[11px] uppercase tracking-wide text-slate-500">
                    {event.eventType?.replace(/_/g, ' ') || 'Event'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
