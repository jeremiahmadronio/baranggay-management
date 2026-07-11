import { useEffect, useState, useCallback } from 'react';
import {
  ClockIcon,
  HistoryIcon,
  CalendarDaysIcon,
  UserCircle2Icon,
  FileTextIcon,
  ShieldCheckIcon,
  AlertCircleIcon,
  ArrowRightCircleIcon,
  ClipboardListIcon,
  CheckCircle2Icon,
  XCircleIcon,
} from 'lucide-react';
import { SectionCard } from '../shared/SectionCard';
import { getCaseTimeline, type CaseTimelineDTO } from '../../../../service/blotter-api/DocketView';

// Maps event type to an icon + color
const EVENT_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  NOTE_ADDED: {
    icon: <FileTextIcon className="w-4 h-4" />,
    color: 'bg-blue-100 text-blue-600',
  },
  STATUS_CHANGED: {
    icon: <ArrowRightCircleIcon className="w-4 h-4" />,
    color: 'bg-amber-100 text-amber-600',
  },
  CASE_SETTLED: {
    icon: <CheckCircle2Icon className="w-4 h-4" />,
    color: 'bg-emerald-100 text-emerald-600',
  },
  CASE_DISMISSED: {
    icon: <XCircleIcon className="w-4 h-4" />,
    color: 'bg-rose-100 text-rose-600',
  },
  CASE_REFERRED: {
    icon: <ArrowRightCircleIcon className="w-4 h-4" />,
    color: 'bg-violet-100 text-violet-600',
  },
  CASE_FILED: {
    icon: <ClipboardListIcon className="w-4 h-4" />,
    color: 'bg-indigo-100 text-indigo-600',
  },
  INTERVENTION_SCHEDULED: {
    icon: <CalendarDaysIcon className="w-4 h-4" />,
    color: 'bg-sky-100 text-sky-600',
  },
  INTERVENTION_COMPLETED: {
    icon: <ShieldCheckIcon className="w-4 h-4" />,
    color: 'bg-emerald-100 text-emerald-600',
  },
  REFERRAL_ISSUED: {
    icon: <ArrowRightCircleIcon className="w-4 h-4" />,
    color: 'bg-violet-100 text-violet-600',
  },
  DEFAULT: {
    icon: <AlertCircleIcon className="w-4 h-4" />,
    color: 'bg-gray-100 text-gray-500',
  },
};

const getEventConfig = (eventType: string) =>
  EVENT_CONFIG[eventType] ?? EVENT_CONFIG['DEFAULT'];

const formatEventLabel = (eventType: string) =>
  eventType?.replace(/_/g, ' ') || "EVENT";

const toDateAndTime = (raw: string) => {
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return { date: raw, time: '' };
  return {
    date: parsed.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    time: parsed.toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
};

interface TimelineTabProps {
  blotterNumber: string;
}

export function TimelineTab({ blotterNumber }: TimelineTabProps) {
  const [timeline, setTimeline] = useState<CaseTimelineDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = useCallback(async () => {
    if (!blotterNumber) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCaseTimeline(blotterNumber);
      setTimeline(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load timeline.');
    } finally {
      setLoading(false);
    }
  }, [blotterNumber]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  return (
    <SectionCard
      title="Case History & Timeline"
      icon={<ClockIcon className="w-4 h-4 text-gray-400" />}
    >
      {loading ? (
        <div className="animate-pulse space-y-4 py-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0 mt-1" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-12 text-center text-rose-500 text-sm">
          <AlertCircleIcon className="w-5 h-5 mx-auto mb-2" />
          {error}
        </div>
      ) : timeline.length === 0 ? (
        <div className="py-12 text-center text-gray-500 text-sm">
          <HistoryIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="font-medium text-gray-600">No events recorded yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Events are automatically logged as the case progresses (e.g., status changes, notes, interventions).
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />

          <div className="space-y-1">
            {timeline.map((event, idx) => {
              const config = getEventConfig(event.eventType);
              const { date, time } = toDateAndTime(event.eventDate);
              const isFirst = idx === 0;

              return (
                <div key={event.id} className="relative flex gap-4 pl-4">
                  {/* Icon dot on the line */}
                  <div
                    className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full shrink-0 mt-1 -ml-4 ring-2 ring-white ${config.color}`}
                  >
                    {config.icon}
                  </div>

                  {/* Card content */}
                  <div
                    className={`flex-1 min-w-0 pb-4 ${isFirst ? 'mb-0' : ''}`}
                  >
                    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-900 leading-snug">
                          {event.title}
                        </p>
                        <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${config.color}`}>
                          {formatEventLabel(event.eventType)}
                        </span>
                      </div>

                      {event.description && (
                        <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words mt-2">
                          {(() => {
                            const isBase64Attachment = event.description.length > 300 && 
                              (event.description.includes('iVBORw') || event.description.includes('JVBERi') || event.description.includes('/9j/'));
                            
                            if (isBase64Attachment) {
                              const parts = event.description.split('Reason:');
                              const textPart = parts[0]?.length > parts[1]?.length ? parts[1] : parts[0];
                              const base64Match = event.description.match(/[A-Za-z0-9+/=]{100,}/);
                              const base64Str = base64Match ? base64Match[0] : '';
                              
                              let mime = 'application/octet-stream';
                              let ext = 'file';
                              if (base64Str.startsWith('JVBERi')) { mime = 'application/pdf'; ext = 'pdf'; }
                              else if (base64Str.startsWith('iVBORw')) { mime = 'image/png'; ext = 'png'; }
                              else if (base64Str.startsWith('/9j/')) { mime = 'image/jpeg'; ext = 'jpg'; }
                              else if (base64Str.startsWith('UEsDBB')) { mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; ext = 'docx'; }
                              else if (base64Str.startsWith('0M8R4KGxGuE')) { mime = 'application/msword'; ext = 'doc'; }
                              
                              const dataUrl = base64Str ? `data:${mime};base64,${base64Str}` : '#';

                              return (
                                <div className="flex flex-col items-start gap-1">
                                  {textPart ? <span>Reason: {textPart.replace(/[A-Za-z0-9+/=]{100,}/g, '')}</span> : null}
                                  {base64Str && (
                                    <button 
                                      onClick={() => {
                                        const byteCharacters = atob(base64Str);
                                        const byteNumbers = new Array(byteCharacters.length);
                                        for (let i = 0; i < byteCharacters.length; i++) {
                                          byteNumbers[i] = byteCharacters.charCodeAt(i);
                                        }
                                        const byteArray = new Uint8Array(byteNumbers);
                                        const blob = new Blob([byteArray], { type: mime });
                                        const blobUrl = URL.createObjectURL(blob);
                                        window.open(blobUrl, '_blank');
                                        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                                      }}
                                      className="inline-flex items-center gap-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors px-2.5 py-1.5 rounded-md border border-blue-200 font-medium mt-1 cursor-pointer">
                                      <FileTextIcon className="w-4 h-4" /> Attached Narrative Document
                                    </button>
                                  )}
                                </div>
                              );
                            }
                            return <p>{event.description}</p>;
                          })()}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-400">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDaysIcon className="w-3.5 h-3.5" />
                          {date}
                          {time ? ` at ${time}` : ''}
                        </span>
                        {event.performedBy && (
                          <span className="inline-flex items-center gap-1.5">
                            <UserCircle2Icon className="w-3.5 h-3.5" />
                            {event.performedBy}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
