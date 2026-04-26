import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { eventService, type Event } from '../../../service/events/eventService';
import { Calendar, Plus, Edit2, Trash2, MapPin, Clock, Users } from 'lucide-react';
import { EventModal } from './EventModal';

export const EventsManagement = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | undefined>(undefined);

  useEffect(() => {
    setEvents(eventService.getEvents());
  }, []);

  const handleAddEvent = () => {
    setEventToEdit(undefined);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setEventToEdit(event);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = (id: number) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      eventService.deleteEvent(id);
      setEvents(eventService.getEvents());
      alert("Event deleted successfully");
    }
  };

  const onSave = () => {
    setEvents(eventService.getEvents());
    setIsModalOpen(false);
    alert(eventToEdit ? "Event updated successfully" : "Event created successfully");
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Event Scheduling
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage barangay events and announcements</p>
        </div>
        <button
          onClick={handleAddEvent}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {events.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No events scheduled yet. Create one to get started!
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(event => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 transition"
              >
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-lg flex flex-col items-center justify-center border border-blue-100 flex-shrink-0">
                    <span className="text-xs font-semibold uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-xl font-bold leading-none">{new Date(event.date).getDate()}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      {event.title}
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] uppercase font-medium">
                        {event.category}
                      </span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {event.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {event.location}
                      </span>
                      {event.expectedAttendees && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {event.expectedAttendees}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 self-end md:self-auto">
                  <button
                    onClick={() => handleEditEvent(event)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSave}
        eventToEdit={eventToEdit}
      />
    </div>
  );
};

export default EventsManagement;
