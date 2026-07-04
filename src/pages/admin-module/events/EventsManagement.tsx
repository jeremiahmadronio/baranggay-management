import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { eventService, type Event } from '../../../service/events/eventService';
import { Calendar, Plus, Edit2, Trash2, MapPin, Clock, Users, ShieldAlert, Award, Phone } from 'lucide-react';
import { EventModal } from './EventModal';
import { ActionModal } from '../../../hooks/SuccessModal';

const statusStyles: Record<string, string> = {
  Upcoming: 'bg-blue-50 text-blue-700 border-blue-100',
  Ongoing: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Completed: 'bg-slate-100 text-slate-750 border-slate-200',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-100',
};

export const EventsManagement = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | undefined>(undefined);
  const [successModal, setSuccessModal] = useState({ isOpen: false, title: '', message: '' });

  const loadEvents = () => {
    eventService.getAdminEvents()
      .then(data => setEvents(data))
      .catch(err => console.error("Failed to load events", err));
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleAddEvent = () => {
    setEventToEdit(undefined);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setEventToEdit(event);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await eventService.deleteEvent(id);
        loadEvents();
        setSuccessModal({
          isOpen: true,
          title: "Deleted Successfully",
          message: "The event has been deleted successfully."
        });
      } catch (err: any) {
        alert(err.message || "Failed to delete event");
      }
    }
  };

  const onSave = () => {
    loadEvents();
    setIsModalOpen(false);
    setSuccessModal({
      isOpen: true,
      title: eventToEdit ? "Updated Successfully" : "Created Successfully",
      message: eventToEdit ? "The event has been updated successfully." : "The event has been created successfully."
    });
  };

  const getEventDateString = (event: Event) => {
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
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {events.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No events scheduled yet. Create one to get started!
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {events.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(event => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-gray-50 transition"
              >
                <div className="flex gap-4 items-start">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex flex-col items-center justify-center border border-blue-100 flex-shrink-0">
                    <span className="text-[10px] font-bold uppercase">{new Date(event.startDate).toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-xl font-extrabold leading-none">{new Date(event.startDate).getDate()}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-base leading-tight">
                        {event.title}
                      </h3>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] uppercase font-bold tracking-wider">
                        {event.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${statusStyles[event.status] || 'bg-gray-100 text-gray-650'}`}>
                        {event.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 pt-0.5">
                      <span className="flex items-center gap-1 font-medium text-gray-700">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" /> {getEventDateString(event)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" /> {event.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" /> {event.location}
                      </span>
                      {event.expectedAttendees !== undefined && event.expectedAttendees !== null && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-gray-400" /> Max: {event.expectedAttendees} pax
                        </span>
                      )}
                    </div>

                    {(event.organizer || event.contactPerson || event.targetAudience) && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-450 pt-1">
                        {event.organizer && (
                          <span className="flex items-center gap-1">
                            <Award className="w-3 h-3 text-blue-400" /> <strong className="text-gray-600">Org:</strong> {event.organizer}
                          </span>
                        )}
                        {event.targetAudience && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-purple-400" /> <strong className="text-gray-600">Eligible:</strong> {event.targetAudience}
                          </span>
                        )}
                        {(event.contactPerson || event.contactNumber) && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-green-400" /> <strong className="text-gray-600">Contact:</strong> {event.contactPerson} {event.contactNumber && `(${event.contactNumber})`}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 self-end lg:self-auto flex-shrink-0">
                  <button
                    onClick={() => handleEditEvent(event)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-rose-50 rounded-lg transition"
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

      <ActionModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
        title={successModal.title}
        type="success"
      >
        <p>{successModal.message}</p>
      </ActionModal>
    </div>
  );
};

export default EventsManagement;
