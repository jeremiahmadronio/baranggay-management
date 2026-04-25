import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { eventService, type Event, type EventCategory } from '../../../service/events/eventService';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  eventToEdit?: Event;
}

export const EventModal = ({ isOpen, onClose, onSave, eventToEdit }: EventModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    category: 'community' as EventCategory,
    expectedAttendees: '',
    description: '',
  });

  useEffect(() => {
    if (eventToEdit) {
      setFormData({
        title: eventToEdit.title,
        date: eventToEdit.date.split('T')[0], // Extract YYYY-MM-DD
        time: eventToEdit.time,
        location: eventToEdit.location,
        category: eventToEdit.category,
        expectedAttendees: eventToEdit.expectedAttendees || '',
        description: eventToEdit.description,
      });
    } else {
      setFormData({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        location: '',
        category: 'community',
        expectedAttendees: '',
        description: '',
      });
    }
  }, [eventToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse date properly for ISO format, setting time to noon to avoid timezone shift
    const parsedDate = new Date(formData.date);
    parsedDate.setHours(12);

    const eventPayload = {
      ...formData,
      date: parsedDate.toISOString(),
    };

    if (eventToEdit) {
      eventService.updateEvent(eventToEdit.id, eventPayload);
    } else {
      eventService.createEvent(eventPayload);
    }
    onSave();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {eventToEdit ? 'Edit Event' : 'Create New Event'}
              </h2>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. Barangay Medical Mission"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="text"
                    required
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. 8:00 AM - 4:00 PM"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. Barangay Hall"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value as EventCategory })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="all">General (All)</option>
                  <option value="health">Health</option>
                  <option value="education">Education</option>
                  <option value="community">Community</option>
                  <option value="sports">Sports</option>
                  <option value="government">Government</option>
                  <option value="environment">Environment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Attendees</label>
                <input
                  type="text"
                  value={formData.expectedAttendees}
                  onChange={e => setFormData({ ...formData, expectedAttendees: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. 100, 50-100, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  placeholder="Brief details about the event..."
                />
              </div>
            </form>

            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
              >
                Save Event
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
