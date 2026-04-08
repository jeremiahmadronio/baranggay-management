import { useEffect, useState } from "react";
import { ClockIcon } from "lucide-react";
import { SectionCard } from "../shared/SectionCard";
import { formatDate } from "../../pages/blotter-module/shared/utils";
import {
  getCaseTimeline,
  type CaseTimelineDTO,
} from "../../service/blotter-api/DocketView";

interface TimelineTabProps {
  blotterNumber: string;
}

export function TimelineTab({ blotterNumber }: TimelineTabProps) {
  const [events, setEvents] = useState<CaseTimelineDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        setLoading(true);
        const data = await getCaseTimeline(blotterNumber);
        setEvents(data);
      } catch (error) {
        console.error("Failed to fetch timeline:", error);
      } finally {
        setLoading(false);
      }
    };

    if (blotterNumber) {
      fetchTimeline();
    }
  }, [blotterNumber]);

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500 animate-pulse text-sm">
        Loading case history...
      </div>
    );
  }

  return (
    <SectionCard
      title="Case History & Timeline"
      icon={<ClockIcon className="w-4 h-4 text-gray-400" />}
    >
      {events.length === 0 ? (
        <div className="py-12 text-center text-gray-500 italic text-sm">
          No events recorded.
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            return (
              <div
                key={event.id}
                className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5"
              >
                <span className="text-xs font-bold text-gray-500 mb-1 block">
                  {formatDate(event.eventDate.split("T")[0])}
                </span>

                <h4 className="text-base font-bold text-gray-900">
                  {event.title}
                </h4>
                <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                  {event.description}
                </p>

                <span className="text-[10px] text-gray-400 mt-2 italic block">
                  Recorded by: {event.performedBy}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
