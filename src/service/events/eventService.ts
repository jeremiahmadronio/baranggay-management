import { api } from '../../apiClients';

export type EventCategory = 'all' | 'health' | 'education' | 'community' | 'sports' | 'government' | 'environment';

export interface Event {
  id: number;
  title: string;
  startDate: string; // ISO string
  endDate?: string; // ISO string
  time: string;
  location: string;
  description: string;
  category: EventCategory;
  expectedAttendees?: number;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
  organizer?: string;
  contactPerson?: string;
  contactNumber?: string;
  requirements?: string;
  targetAudience?: string;
  isFeatured?: boolean;
}

export const eventService = {
  getEvents: async (): Promise<Event[]> => {
    return api.get('/api/v1/web-browsing/public/events', { requiresAuth: false });
  },

  getAdminEvents: async (): Promise<Event[]> => {
    return api.get('/api/v1/web-browsing/events', { requiresAuth: true });
  },

  createEvent: async (eventData: Omit<Event, 'id'>): Promise<Event> => {
    return api.post('/api/v1/web-browsing/events', eventData, {
      requiresAuth: true,
      offlineDescription: `Create Event: ${eventData.title}`
    });
  },

  updateEvent: async (id: number, eventData: Omit<Event, 'id'>): Promise<Event> => {
    return api.put(`/api/v1/web-browsing/events/${id}`, eventData, {
      requiresAuth: true,
      offlineDescription: `Update Event: ${eventData.title}`
    });
  },

  deleteEvent: async (id: number): Promise<void> => {
    return api.delete(`/api/v1/web-browsing/events/${id}`, {
      requiresAuth: true,
      offlineDescription: `Delete Event ID: ${id}`
    });
  }
};
