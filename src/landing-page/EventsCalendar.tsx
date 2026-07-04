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
  X,
  Award,
  Phone,
  FileText,
  HelpCircle,
  Activity,
  AlertCircle
} from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

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
  health: 'bg-rose-450',
  education: 'bg-violet-450',
  community: 'bg-amber-450',
  sports: 'bg-emerald-450',
  government: 'bg-blue-450',
  environment: 'bg-green-450',
};

const categoryBadgeStyle: Record<string, string> = {
  health: 'bg-rose-50 text-rose-700 border-rose-100',
  education: 'bg-violet-50 text-violet-700 border-violet-100',
  community: 'bg-amber-50 text-amber-700 border-amber-105',
  sports: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  government: 'bg-blue-50 text-blue-700 border-blue-100',
  environment: 'bg-green-50 text-green-700 border-green-100',
};

const statusStyles: Record<string, string> = {
  Upcoming: 'bg-blue-50 text-blue-700 border-blue-100',
  Ongoing: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Completed: 'bg-slate-100 text-slate-700 border-slate-200',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-100',
};

export const EventsCalendar = () => {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [activeCategory, setActiveCategory] = useState<EventCategory>('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    eventService.getEvents()
      .then(data => setAllEvents(data))
      .catch(err => console.error("Failed to fetch events", err));
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
    const ed = new Date(e.startDate);
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
        const ed = new Date(e.startDate);
        return ed.getDate() === selectedDate.getDate() && ed.getMonth() === selectedDate.getMonth() && ed.getFullYear() === selectedDate.getFullYear();
      });
    } else {
      // Show events for the current month
      filtered = filtered.filter(e => {
        const ed = new Date(e.startDate);
        return ed.getMonth() === currentDate.getMonth() && ed.getFullYear() === currentDate.getFullYear();
      });
    }
    return filtered.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  };

  const displayEvents = getDisplayEvents();

  const formatShortDate = (date: Date) => {
    return `${monthNames[date.getMonth()].slice(0, 3)} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const getEventDateRangeString = (event: Event) => {
    const start = new Date(event.startDate);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    
    if (event.endDate) {
      const end = new Date(event.endDate);
      if (start.toDateString() === end.toDateString()) {
        return start.toLocaleDateString('default', options);
      }
      return `${start.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('default', options)}`;
    }
    return start.toLocaleDateString('default', options);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Clean header */}
      <div className="pt-36 lg:pt-44 pb-12 bg-white border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                <CalendarIcon className="w-8 h-8 text-blue-600" />
                Events & Announcements
              </h1>
              <p className="text-gray-500 mt-1 ml-11 text-sm sm:text-base">Barangay Ugong — Keep up to date with schedules, missions, and community drives.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="bg-white border-b border-gray-205 sticky top-0 z-40 shadow-sm shadow-gray-100/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 overflow-x-auto scrollbar-hide flex gap-2">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id as EventCategory);
                  setSelectedDate(null);
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 flex-shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/15'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Calendar grid (takes 3 cols) */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-extrabold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex gap-1.5">
                <button onClick={() => navigateMonth('prev')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition cursor-pointer">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => navigateMonth('next')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition cursor-pointer">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Calendar skeleton */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {dayNames.map(d => (
                <span key={d} className="text-xs font-bold text-gray-400 uppercase tracking-wider py-1">{d}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((day, idx) => {
                const dayEvents = day ? getEventsForDay(day) : [];
                const hasEvents = dayEvents.length > 0;
                const today = day ? isToday(day) : false;
                const selected = day ? isSelected(day) : false;

                return (
                  <div
                    key={idx}
                    onClick={() => day && setSelectedDate(selected ? null : new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                    className={`min-h-[85px] p-1.5 border rounded-xl flex flex-col justify-between transition-all cursor-pointer select-none group relative ${
                      day 
                        ? selected 
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                          : today
                            ? 'border-blue-200 bg-gray-50'
                            : 'border-gray-100 hover:border-gray-300 bg-white'
                        : 'border-transparent bg-transparent pointer-events-none'
                    }`}
                  >
                    {day && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className={`text-xs font-bold ${
                            selected 
                              ? 'text-blue-600'
                              : today
                                ? 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold'
                                : 'text-gray-700'
                          }`}>
                            {day}
                          </span>
                          {hasEvents && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          )}
                        </div>

                        <div className="mt-1 space-y-1">
                          {dayEvents.slice(0, 2).map(ev => (
                            <div
                              key={ev.id}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded truncate leading-tight border border-gray-100 bg-slate-50 text-slate-700 group-hover:bg-gray-100 transition"
                              title={ev.title}
                            >
                              {ev.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <span className="text-[8px] text-gray-400 pl-1 font-semibold">+{dayEvents.length - 2} more</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Events list (takes 2 cols) */}
          <div className="lg:col-span-2">
            <div className="sticky top-20">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-blue-600" />
                  {selectedDate
                    ? `${formatShortDate(selectedDate)}`
                    : `${monthNames[currentDate.getMonth()]} Events`
                  }
                </h3>
                {selectedDate && (
                  <button onClick={() => setSelectedDate(null)}
                    className="text-xs text-blue-650 hover:text-blue-800 font-bold transition cursor-pointer"
                  >
                    Show all month
                  </button>
                )}
              </div>

              {/* Event list */}
              <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                <AnimatePresence mode="popLayout">
                  {displayEvents.length > 0 ? displayEvents.map((event, i) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ delay: 0.04 * i }}
                      onClick={() => setSelectedEvent(event)}
                      className="group bg-white rounded-xl p-4.5 border border-gray-200 hover:border-blue-200 transition-all hover:shadow-md cursor-pointer relative"
                    >
                      <div className="flex gap-4">
                        {/* Date badge */}
                        <div className="flex-shrink-0 w-13 h-13 rounded-xl bg-slate-50 border border-gray-150 flex flex-col items-center justify-center">
                          <span className="text-[9px] font-bold text-gray-450 uppercase">{monthNames[new Date(event.startDate).getMonth()].slice(0, 3)}</span>
                          <span className="text-xl font-extrabold text-gray-800 leading-none">{new Date(event.startDate).getDate()}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${categoryBadgeStyle[event.category] || 'bg-gray-100 border-gray-200 text-gray-650'}`}>
                              {event.category}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${statusStyles[event.status] || 'bg-gray-100 border-gray-200 text-gray-650'}`}>
                              {event.status}
                            </span>
                          </div>
                          
                          <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-650 transition truncate mb-1">
                            {event.title}
                          </h4>
                          
                          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                            {event.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-450 pt-1 border-t border-gray-100">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-gray-400" />{event.time}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400" />{event.location}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="text-center py-16 bg-white border border-gray-200 rounded-2xl p-6"
                    >
                      <CalendarIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-400 font-bold">No events scheduled</p>
                      <button onClick={() => setSelectedDate(null)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-bold mt-2 transition cursor-pointer"
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

      {/* Event details drawer/modal */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-100"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 relative bg-slate-50/50">
                <div className="flex gap-2 items-center flex-wrap mb-2.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${categoryBadgeStyle[selectedEvent.category] || 'bg-gray-100 border-gray-200 text-gray-650'}`}>
                    {selectedEvent.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${statusStyles[selectedEvent.status] || 'bg-gray-100 border-gray-200 text-gray-650'}`}>
                    {selectedEvent.status}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-950 pr-8 leading-tight">
                  {selectedEvent.title}
                </h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-5 right-5 p-1.5 bg-white hover:bg-gray-150 rounded-full text-gray-500 hover:text-gray-800 transition border border-gray-150 shadow-sm cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Location & Time Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-blue-50/30 rounded-xl p-4 border border-blue-50">
                  <div className="flex gap-3">
                    <CalendarIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Date & Schedule</span>
                      <span className="text-sm font-bold text-gray-900">{getEventDateRangeString(selectedEvent)}</span>
                      <span className="text-xs text-gray-500 block mt-0.5">{selectedEvent.time}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Location / Venue</span>
                      <span className="text-sm font-bold text-gray-900">{selectedEvent.location}</span>
                    </div>
                  </div>
                </div>

                {/* Main Details */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">About the Event</h4>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {selectedEvent.description}
                  </p>
                </div>

                {/* Event Properties Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pt-4 border-t border-gray-100">
                  
                  {selectedEvent.organizer && (
                    <div className="flex gap-3">
                      <Award className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Organizer / Department</span>
                        <span className="text-sm font-semibold text-gray-800">{selectedEvent.organizer}</span>
                      </div>
                    </div>
                  )}

                  {selectedEvent.targetAudience && (
                    <div className="flex gap-3">
                      <Activity className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Eligible / Target Audience</span>
                        <span className="text-sm font-semibold text-gray-800">{selectedEvent.targetAudience}</span>
                      </div>
                    </div>
                  )}

                  {selectedEvent.expectedAttendees !== undefined && selectedEvent.expectedAttendees !== null && (
                    <div className="flex gap-3">
                      <Users className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Expected Attendees Limit</span>
                        <span className="text-sm font-semibold text-gray-800">{selectedEvent.expectedAttendees} pax</span>
                      </div>
                    </div>
                  )}

                  {(selectedEvent.contactPerson || selectedEvent.contactNumber) && (
                    <div className="flex gap-3">
                      <Phone className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">For Inquiries & Contacts</span>
                        <span className="text-sm font-semibold text-gray-800 block">
                          {selectedEvent.contactPerson || 'General Inquiry'}
                        </span>
                        {selectedEvent.contactNumber && (
                          <span className="text-xs font-bold text-blue-600 block mt-0.5">{selectedEvent.contactNumber}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Requirements */}
                {selectedEvent.requirements && (
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4.5 space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-slate-500" />
                      Important Requirements to Bring
                    </h4>
                    <ul className="space-y-1.5 pl-1">
                      {selectedEvent.requirements.split('\n').filter(r => r.trim().length > 0).map((req, idx) => (
                        <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                          <span className="leading-normal font-medium">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50/50">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-250 rounded-lg shadow-sm transition cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default EventsCalendar;
