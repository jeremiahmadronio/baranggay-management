import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Users,
  ArrowLeft,
  Filter,
  
  Star,
  Stethoscope,
  GraduationCap,
  Heart,
  Shield,
  TreeDeciduous,
  Megaphone
} from 'lucide-react';

// Event Types
type EventCategory = 'all' | 'health' | 'education' | 'community' | 'sports' | 'government' | 'environment';

interface Event {
  id: number;
  title: string;
  date: Date;
  time: string;
  location: string;
  description: string;
  category: EventCategory;
  attendees?: number;
  isFeatured?: boolean;
}

export const EventsCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeCategory, setActiveCategory] = useState<EventCategory>('all');

  // Sample events data
  const events: Event[] = [
    {
      id: 1,
      title: 'Medical Mission - Free Checkup',
      date: new Date(2026, 1, 15),
      time: '8:00 AM - 4:00 PM',
      location: 'Barangay Health Center',
      description: 'Free medical consultation, blood pressure monitoring, at blood sugar testing para sa lahat ng residente.',
      category: 'health',
      attendees: 150,
      isFeatured: true,
    },
    {
      id: 2,
      title: 'Youth Leadership Summit',
      date: new Date(2026, 1, 18),
      time: '9:00 AM - 5:00 PM',
      location: 'Barangay Hall Function Room',
      description: 'Workshop at seminar para sa mga kabataan tungkol sa leadership at community service.',
      category: 'education',
      attendees: 75,
    },
    {
      id: 3,
      title: 'Barangay Assembly',
      date: new Date(2026, 1, 20),
      time: '2:00 PM - 6:00 PM',
      location: 'Covered Court',
      description: 'Quarterly assembly ng lahat ng residente. May important announcements at Q&A session.',
      category: 'government',
      attendees: 300,
      isFeatured: true,
    },
    {
      id: 4,
      title: 'Basketball Tournament Opening',
      date: new Date(2026, 1, 22),
      time: '3:00 PM',
      location: 'Barangay Sports Complex',
      description: 'Opening ceremony ng Inter-Purok Basketball Tournament 2026.',
      category: 'sports',
      attendees: 200,
    },
    {
      id: 5,
      title: 'Clean-Up Drive',
      date: new Date(2026, 1, 25),
      time: '6:00 AM - 10:00 AM',
      location: 'Starting at Barangay Hall',
      description: 'Monthly clean-up drive sa ating barangay. Dalhin ang sariling panglinis.',
      category: 'environment',
      attendees: 100,
    },
    {
      id: 6,
      title: 'Livelihood Training: Baking',
      date: new Date(2026, 1, 28),
      time: '9:00 AM - 12:00 PM',
      location: 'Skills Training Center',
      description: 'Free baking workshop para sa mga interesadong residente. Limited slots only!',
      category: 'community',
      attendees: 30,
    },
    {
      id: 7,
      title: 'Senior Citizens Day',
      date: new Date(2026, 2, 1),
      time: '10:00 AM - 3:00 PM',
      location: 'Barangay Multi-Purpose Hall',
      description: 'Celebration para sa ating mga senior citizens. May programa, games, at pa-raffle.',
      category: 'community',
      isFeatured: true,
    },
    {
      id: 8,
      title: 'Parents-Teachers Meeting',
      date: new Date(2026, 2, 5),
      time: '2:00 PM - 4:00 PM',
      location: 'Barangay Day Care Center',
      description: 'Meeting ng mga magulang at guro ng day care center.',
      category: 'education',
    },
    {
      id: 9,
      title: 'Vaccination Drive - Flu',
      date: new Date(2026, 2, 10),
      time: '8:00 AM - 12:00 PM',
      location: 'Barangay Health Center',
      description: 'Free flu vaccination para sa senior citizens at bata.',
      category: 'health',
    },
  ];

  const categories = [
    { id: 'all', label: 'Lahat', icon: CalendarIcon, color: 'blue' },
    { id: 'health', label: 'Kalusugan', icon: Stethoscope, color: 'red' },
    { id: 'education', label: 'Edukasyon', icon: GraduationCap, color: 'violet' },
    { id: 'community', label: 'Komunidad', icon: Heart, color: 'pink' },
    { id: 'sports', label: 'Sports', icon: Star, color: 'orange' },
    { id: 'government', label: 'Gobyerno', icon: Shield, color: 'slate' },
    { id: 'environment', label: 'Kalikasan', icon: TreeDeciduous, color: 'green' },
  ];

  const categoryColors: Record<string, { bg: string; text: string; light: string; border: string }> = {
    health: { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50', border: 'border-red-200' },
    education: { bg: 'bg-violet-500', text: 'text-violet-600', light: 'bg-violet-50', border: 'border-violet-200' },
    community: { bg: 'bg-pink-500', text: 'text-pink-600', light: 'bg-pink-50', border: 'border-pink-200' },
    sports: { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50', border: 'border-orange-200' },
    government: { bg: 'bg-slate-500', text: 'text-slate-600', light: 'bg-slate-50', border: 'border-slate-200' },
    environment: { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50', border: 'border-green-200' },
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const getEventsForDay = (day: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear() &&
        (activeCategory === 'all' || event.category === activeCategory)
      );
    });
  };

  const getFilteredEvents = () => {
    let filtered = events;
    if (activeCategory !== 'all') {
      filtered = filtered.filter(e => e.category === activeCategory);
    }
    if (selectedDate) {
      filtered = filtered.filter(e => {
        const eventDate = new Date(e.date);
        return (
          eventDate.getDate() === selectedDate.getDate() &&
          eventDate.getMonth() === selectedDate.getMonth() &&
          eventDate.getFullYear() === selectedDate.getFullYear()
        );
      });
    }
    return filtered.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    return events
      .filter(e => e.date >= today && (activeCategory === 'all' || e.category === activeCategory))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fil-PH', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Lin', 'Lun', 'Mar', 'Miy', 'Huw', 'Biy', 'Sab'];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <CalendarIcon className="w-7 h-7 text-blue-600" />
                  Events Calendar
                </h1>
                <p className="text-sm text-gray-500">Barangay Ugong Schedule at Events</p>
              </div>
            </div>
           
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Filter by Category:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as EventCategory)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${activeCategory === cat.id 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
                  }
                `}
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            >
              {/* Calendar Header */}
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6">
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => navigateMonth('prev')}
                    className="p-2 hover:bg-white/20 rounded-lg transition"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                  <h2 className="text-2xl font-bold text-white">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <button 
                    onClick={() => navigateMonth('next')}
                    className="p-2 hover:bg-white/20 rounded-lg transition"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>

              {/* Day Names */}
              <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
                {dayNames.map(day => (
                  <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7">
                    {calendarDays.map((day, index) => {
                  const dayEvents = day ? getEventsForDay(day) : [];
                  const hasFeatured = dayEvents.some(e => e.isFeatured);

                  return (
                    <div
                      key={index}
                      onClick={() => day && setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                      className={`
                        min-h-[100px] p-2 border-b border-r border-gray-100 transition cursor-pointer
                        ${!day ? 'bg-gray-50' : 'hover:bg-blue-50'}
                        ${isSelected(day!) ? 'bg-blue-100 ring-2 ring-blue-500 ring-inset' : ''}
                      `}
                    >
                      {day && (
                        <>
                          <div className={`
                            w-8 h-8 flex items-center justify-center rounded-full mb-1 text-sm font-medium
                            ${isToday(day) ? 'bg-blue-600 text-white' : 'text-gray-700'}
                            ${hasFeatured ? 'ring-2 ring-yellow-400' : ''}
                          `}>
                            {day}
                          </div>
                          <div className="space-y-1">
                            {dayEvents.slice(0, 2).map(event => (
                              <div 
                                key={event.id}
                                className={`
                                  text-xs px-2 py-1 rounded truncate
                                  ${categoryColors[event.category]?.light || 'bg-blue-50'}
                                  ${categoryColors[event.category]?.text || 'text-blue-600'}
                                `}
                              >
                                {event.title}
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <div className="text-xs text-gray-500 pl-2">
                                +{dayEvents.length - 2} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Selected Date Events */}
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Events sa {formatDate(selectedDate)}
                </h3>
                <div className="space-y-4">
                  <AnimatePresence>
                    {getFilteredEvents().length > 0 ? (
                      getFilteredEvents().map(event => (
                        <EventCard key={event.id} event={event} categoryColors={categoryColors} />
                      ))
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-8 text-center">
                        <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Walang event sa araw na ito.</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar - Upcoming Events */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Upcoming Events */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-blue-600" />
                  Upcoming Events
                </h3>
                <div className="space-y-4">
                  {getUpcomingEvents().map(event => (
                    <div 
                      key={event.id}
                      onClick={() => setSelectedDate(new Date(event.date))}
                      className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition group"
                    >
                      <div className={`
                        w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-white
                        ${categoryColors[event.category]?.bg || 'bg-blue-500'}
                      `}>
                        <span className="text-xs font-medium">{monthNames[event.date.getMonth()].slice(0, 3)}</span>
                        <span className="text-lg font-bold leading-none">{event.date.getDate()}</span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm truncate group-hover:text-blue-600 transition">
                          {event.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <Clock className="w-3 h-3" />
                          {event.time}
                        </div>
                        {event.isFeatured && (
                          <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full mt-1">
                            <Star className="w-3 h-3" />
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-6 text-white"
              >
                <h3 className="font-bold mb-4">This Month</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold">{events.filter(e => e.date.getMonth() === currentDate.getMonth()).length}</div>
                    <div className="text-sm text-blue-100">Total Events</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold">{events.filter(e => e.isFeatured && e.date.getMonth() === currentDate.getMonth()).length}</div>
                    <div className="text-sm text-blue-100">Featured</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Event Card Component
const EventCard = ({ event, categoryColors }: { event: Event; categoryColors: Record<string, any> }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        bg-white rounded-xl p-5 shadow-md border hover:shadow-lg transition-all cursor-pointer
        ${categoryColors[event.category]?.border || 'border-gray-200'}
      `}
    >
      <div className="flex items-start gap-4">
        <div className={`
          w-16 h-16 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-white shadow-lg
          ${categoryColors[event.category]?.bg || 'bg-blue-500'}
        `}>
          <span className="text-xs font-medium opacity-80">
            {event.date.toLocaleDateString('fil-PH', { month: 'short' })}
          </span>
          <span className="text-2xl font-bold leading-none">{event.date.getDate()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-bold text-gray-900">{event.title}</h4>
            {event.isFeatured && (
              <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex-shrink-0">
                <Star className="w-3 h-3" />
                Featured
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {event.time}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {event.location}
            </span>
            {event.attendees && (
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {event.attendees} expected
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EventsCalendar;
