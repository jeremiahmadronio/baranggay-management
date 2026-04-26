import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventService, type Event, type EventCategory } from '../service/events/eventService';

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,

  Star,
  Stethoscope,
  GraduationCap,
  Heart,
  Shield,
  TreeDeciduous,
  Megaphone,
} from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

// We removed the static sampleEvents array as it's now handled by the eventService

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const categories = [
  { id: 'all', label: 'All', icon: CalendarIcon },
  { id: 'health', label: 'Health', icon: Stethoscope },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'community', label: 'Community', icon: Heart },
  { id: 'sports', label: 'Sports', icon: Star },
  { id: 'government', label: 'Government', icon: Shield },
  { id: 'environment', label: 'Environment', icon: TreeDeciduous },
];

const categoryDot: Record<string, string> = {
  health: 'bg-rose-400',
  education: 'bg-violet-400',
  community: 'bg-amber-400',
  sports: 'bg-emerald-400',
  government: 'bg-blue-400',
  environment: 'bg-green-400',
};

export const EventsCalendar = () => {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [activeCategory, setActiveCategory] = useState<EventCategory>('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    setAllEvents(eventService.getEvents());
  }, []);

  // Calendar helpers
  const getDaysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const getFirstDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();

  const isToday = (day: number) => {
    const t = new Date();
    return day === t.getDate() && currentDate.getMonth() === t.getMonth() && currentDate.getFullYear() === t.getFullYear();
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return day === selectedDate.getDate() && currentDate.getMonth() === selectedDate.getMonth() && currentDate.getFullYear() === selectedDate.getFullYear();
  };

  const getEventsForDay = (day: number) => allEvents.filter(e => {
    const ed = new Date(e.date);
    return ed.getDate() === day && ed.getMonth() === currentDate.getMonth() && ed.getFullYear() === currentDate.getFullYear()
      && (activeCategory === 'all' || e.category === activeCategory);
  });

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDay(currentDate);
  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });

  const navigateMonth = (dir: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + (dir === 'prev' ? -1 : 1));
      return d;
    });
    setSelectedDate(null);
  };

  // Events for sidebar
  const getDisplayEvents = () => {
    let filtered = allEvents.filter(e => activeCategory === 'all' || e.category === activeCategory);
    if (selectedDate) {
      filtered = filtered.filter(e => {
        const ed = new Date(e.date);
        return ed.getDate() === selectedDate.getDate() && ed.getMonth() === selectedDate.getMonth() && ed.getFullYear() === selectedDate.getFullYear();
      });
    } else {
      // Show events for the current month
      filtered = filtered.filter(e => {
        const ed = new Date(e.date);
        return ed.getMonth() === currentDate.getMonth() && ed.getFullYear() === currentDate.getFullYear();
      });
    }
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const displayEvents = getDisplayEvents();

  const formatShortDate = (date: Date) => {
    return `${monthNames[date.getMonth()].slice(0, 3)} ${date.getDate()}, ${date.getFullYear()}`;
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Clean header */}
      <div className="pt-36 lg:pt-44 pb-8 bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <CalendarIcon className="w-7 h-7 text-blue-600" />
                Events & Announcements
              </h1>
              <p className="text-sm text-gray-500 mt-1 ml-10">Barangay Ugong — Schedule of events and announcements</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id as EventCategory)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <cat.icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main layout: Calendar + Events */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-5 gap-8">

          {/* Calendar — takes 3 cols */}
          <div className="lg:col-span-3">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
            >
              {/* Month nav */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <button onClick={() => navigateMonth('prev')} className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <ChevronLeft className="w-5 h-5 text-gray-500" />
                </button>
                <h2 className="text-lg font-bold text-gray-900">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button onClick={() => navigateMonth('next')} className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-gray-100">
                {dayNames.map(day => (
                  <div key={day} className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => {
                  const dayEvents = day ? getEventsForDay(day) : [];
                  return (
                    <div key={index}
                      onClick={() => day && setSelectedDate(
                        selectedDate && isSelected(day) ? null : new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                      )}
                      className={`min-h-[90px] p-2 border-b border-r border-gray-50 transition-colors cursor-pointer
                        ${!day ? 'bg-gray-50/30' : 'hover:bg-blue-50/50'}
                        ${day && isSelected(day) ? 'bg-blue-50 ring-1 ring-blue-300 ring-inset' : ''}
                      `}
                    >
                      {day && (
                        <>
                          <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm mb-1
                            ${isToday(day) ? 'bg-blue-600 text-white font-bold' : 'text-gray-700 font-medium'}
                          `}>
                            {day}
                          </div>
                          <div className="space-y-0.5">
                            {dayEvents.slice(0, 2).map(ev => (
                              <div key={ev.id} className="flex items-center gap-1">
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${categoryDot[ev.category] || 'bg-gray-400'}`} />
                                <span className="text-[11px] text-gray-600 truncate leading-tight">{ev.title}</span>
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <span className="text-[10px] text-gray-400 pl-3">+{dayEvents.length - 2} more</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Events sidebar — takes 2 cols */}
          <div className="lg:col-span-2">
            <div className="sticky top-16">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-blue-600" />
                  {selectedDate
                    ? `${formatShortDate(selectedDate)}`
                    : `${monthNames[currentDate.getMonth()]} Events`
                  }
                </h3>
                {selectedDate && (
                  <button onClick={() => setSelectedDate(null)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium transition"
                  >
                    Show all
                  </button>
                )}
              </div>

              {/* Event list */}
              <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
                <AnimatePresence mode="popLayout">
                  {displayEvents.length > 0 ? displayEvents.map((event, i) => (
                    <motion.div key={event.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ delay: 0.04 * i }}
                      className="group bg-white rounded-xl p-4 border border-gray-150 hover:border-gray-300 transition-all hover:shadow-sm"
                    >
                      <div className="flex gap-3">
                        {/* Date badge */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center">
                          <span className="text-[10px] font-semibold text-gray-400 uppercase">{monthNames[new Date(event.date).getMonth()].slice(0, 3)}</span>
                          <span className="text-lg font-bold text-gray-800 leading-none">{new Date(event.date).getDate()}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${categoryDot[event.category] || 'bg-gray-400'}`} />
                            <h4 className="text-sm font-semibold text-gray-900 truncate">{event.title}</h4>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 mb-2 leading-relaxed">{event.description}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{event.time}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>
                            {event.expectedAttendees && (
                              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{event.expectedAttendees} expected</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <CalendarIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm text-gray-400 font-medium">No events on this date</p>
                      <button onClick={() => setSelectedDate(null)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-2 transition"
                      >
                        View all events
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EventsCalendar;
