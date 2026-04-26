export type EventCategory = 'all' | 'health' | 'education' | 'community' | 'sports' | 'government' | 'environment';

export interface Event {
  id: number;
  title: string;
  date: string; // Stored as ISO string
  time: string;
  location: string;
  description: string;
  category: EventCategory;
  expectedAttendees?: string;
  isFeatured?: boolean;
}

const STORAGE_KEY = 'baranggay_events';

// Default mock events to initialize if storage is empty
const defaultEvents: Event[] = [
  {
    id: 1, title: 'Medical Mission - Free Checkup', date: new Date(2026, 3, 28).toISOString(),
    time: '8:00 AM - 4:00 PM', location: 'Barangay Health Center',
    description: 'Free medical consultation, blood pressure monitoring, and blood sugar testing for all residents of Barangay Ugong.',
    category: 'health', expectedAttendees: '500', isFeatured: true,
  },
  {
    id: 2, title: 'Youth Leadership Summit 2026', date: new Date(2026, 4, 2).toISOString(),
    time: '9:00 AM - 5:00 PM', location: 'Barangay Hall Function Room',
    description: 'Workshop and seminar for the youth on leadership, public speaking, and community service.',
    category: 'education', expectedAttendees: '150',
  },
  {
    id: 3, title: 'Barangay General Assembly', date: new Date(2026, 4, 5).toISOString(),
    time: '2:00 PM - 6:00 PM', location: 'Covered Court',
    description: 'Quarterly assembly for all residents. Important announcements, budget report, and Q&A session with the Barangay Captain.',
    category: 'government', expectedAttendees: '1000', isFeatured: true,
  },
];

export const eventService = {
  getEvents: (): Event[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        // Initialize with default events if empty
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultEvents));
        return defaultEvents;
      }
      return JSON.parse(data);
    } catch (error) {
      console.error("Failed to load events from local storage", error);
      return [];
    }
  },

  createEvent: (eventData: Omit<Event, 'id'>): Event => {
    const events = eventService.getEvents();
    const newId = events.length > 0 ? Math.max(...events.map(e => e.id)) + 1 : 1;
    const newEvent: Event = { ...eventData, id: newId };
    
    events.push(newEvent);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    return newEvent;
  },

  updateEvent: (id: number, eventData: Partial<Event>): Event | null => {
    const events = eventService.getEvents();
    const index = events.findIndex(e => e.id === id);
    
    if (index === -1) return null;
    
    const updatedEvent = { ...events[index], ...eventData };
    events[index] = updatedEvent;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    return updatedEvent;
  },

  deleteEvent: (id: number): boolean => {
    const events = eventService.getEvents();
    const filteredEvents = events.filter(e => e.id !== id);
    
    if (filteredEvents.length === events.length) return false;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredEvents));
    return true;
  }
};
