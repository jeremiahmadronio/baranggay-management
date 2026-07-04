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

const eventTitleOptions = [
  'General Assembly Meeting',
  'Medical Mission & Health Wellness',
  'SK Sports Festival & Tournament',
  'Feeding Program & Nutrition Drive',
  'Community Clean-up & Tree Planting',
  'Katarungang Pambarangay Seminar',
  'Disaster Preparedness Drill',
  'Others'
];

const organizerOptions = [
  'Office of the Barangay Captain',
  'Barangay Council',
  'SK Ugong',
  'Barangay Health Office',
  'Lupon Office',
  'VAWC Desk',
  'BCPC Office',
  'Others'
];

const eligibilityOptions = [
  'All Residents',
  'Senior Citizens',
  'Youth / SK',
  'Children (0-5 years old)',
  'Women / VAWC',
  'Indigent Residents',
  'Others'
];

export const EventModal = ({ isOpen, onClose, onSave, eventToEdit }: EventModalProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customOrganizer, setCustomOrganizer] = useState('');
  const [customEligibility, setCustomEligibility] = useState('');
  
  const [newRequirement, setNewRequirement] = useState('');
  const [requirementsList, setRequirementsList] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: eventTitleOptions[0],
    startDate: '',
    endDate: '',
    time: '',
    location: '',
    category: 'community' as EventCategory,
    expectedAttendees: '',
    status: 'Upcoming' as 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled',
    organizer: 'Office of the Barangay Captain',
    contactPerson: '',
    contactNumber: '',
    targetAudience: 'All Residents',
    description: '',
  });

  const getLocalDateTimeString = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const offset = date.getTimezoneOffset();
      const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
      return adjustedDate.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (eventToEdit) {
      const title = eventToEdit.title || '';
      const isPredefinedTitle = eventTitleOptions.slice(0, -1).includes(title);

      const org = eventToEdit.organizer || '';
      const isPredefinedOrg = organizerOptions.slice(0, -1).includes(org);
      
      const aud = eventToEdit.targetAudience || '';
      const isPredefinedAud = eligibilityOptions.slice(0, -1).includes(aud);

      const reqs = eventToEdit.requirements
        ? eventToEdit.requirements.split('\n').map(r => r.trim()).filter(Boolean)
        : [];

      setFormData({
        title: isPredefinedTitle ? title : (title ? 'Others' : eventTitleOptions[0]),
        startDate: getLocalDateTimeString(eventToEdit.startDate),
        endDate: getLocalDateTimeString(eventToEdit.endDate),
        time: eventToEdit.time,
        location: eventToEdit.location,
        category: eventToEdit.category,
        expectedAttendees: eventToEdit.expectedAttendees !== undefined && eventToEdit.expectedAttendees !== null
          ? eventToEdit.expectedAttendees.toString()
          : '',
        status: eventToEdit.status || 'Upcoming',
        organizer: isPredefinedOrg ? org : (org ? 'Others' : 'Office of the Barangay Captain'),
        contactPerson: eventToEdit.contactPerson || '',
        contactNumber: eventToEdit.contactNumber || '',
        targetAudience: isPredefinedAud ? aud : (aud ? 'Others' : 'All Residents'),
        description: eventToEdit.description || '',
      });
      
      setCustomTitle(isPredefinedTitle ? '' : title);
      setCustomOrganizer(isPredefinedOrg ? '' : org);
      setCustomEligibility(isPredefinedAud ? '' : aud);
      setRequirementsList(reqs);
      setNewRequirement('');
    } else {
      const nowStr = new Date().toISOString().slice(0, 16);
      setFormData({
        title: eventTitleOptions[0],
        startDate: nowStr,
        endDate: '',
        time: '',
        location: '',
        category: 'community',
        expectedAttendees: '',
        status: 'Upcoming',
        organizer: 'Office of the Barangay Captain',
        contactPerson: '',
        contactNumber: '',
        targetAudience: 'All Residents',
        description: '',
      });
      setCustomTitle('');
      setCustomOrganizer('');
      setCustomEligibility('');
      setRequirementsList([]);
      setNewRequirement('');
    }
  }, [eventToEdit, isOpen]);

  const handleAddRequirement = () => {
    const val = newRequirement.trim();
    if (val && !requirementsList.includes(val)) {
      setRequirementsList([...requirementsList, val]);
      setNewRequirement('');
    }
  };

  const handleRemoveRequirement = (index: number) => {
    setRequirementsList(requirementsList.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const startDateIso = formData.startDate ? new Date(formData.startDate).toISOString() : new Date().toISOString();
    const endDateIso = formData.endDate ? new Date(formData.endDate).toISOString() : undefined;
    const finalTitle = formData.title === 'Others' ? customTitle : formData.title;
    const finalOrganizer = formData.organizer === 'Others' ? customOrganizer : formData.organizer;
    const finalEligibility = formData.targetAudience === 'Others' ? customEligibility : formData.targetAudience;
    const finalRequirements = requirementsList.join('\n');

    // Auto-generate time string if left blank (or override with formatted date range)
    let finalTimeLabel = formData.time;
    if (!finalTimeLabel && formData.startDate) {
      const startD = new Date(formData.startDate);
      const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });
      const formattedStart = timeFormatter.format(startD);
      if (formData.endDate) {
        const endD = new Date(formData.endDate);
        const formattedEnd = timeFormatter.format(endD);
        finalTimeLabel = `${formattedStart} - ${formattedEnd}`;
      } else {
        finalTimeLabel = `${formattedStart} onwards`;
      }
    }

    if (!finalTitle.trim()) {
      alert("Please specify a valid Event Title.");
      return;
    }

    const eventPayload = {
      title: finalTitle,
      startDate: startDateIso,
      endDate: endDateIso,
      time: finalTimeLabel || 'TBA',
      location: formData.location,
      category: formData.category,
      expectedAttendees: formData.expectedAttendees ? parseInt(formData.expectedAttendees, 10) : undefined,
      status: formData.status,
      organizer: finalOrganizer || undefined,
      contactPerson: formData.contactPerson || undefined,
      contactNumber: formData.contactNumber || undefined,
      requirements: finalRequirements || undefined,
      targetAudience: finalEligibility || undefined,
      description: formData.description,
    };

    setIsSaving(true);
    try {
      if (eventToEdit) {
        await eventService.updateEvent(eventToEdit.id, eventPayload);
      } else {
        await eventService.createEvent(eventPayload);
      }
      onSave();
    } catch (err: any) {
      alert(err.message || "Failed to save event");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-150">
              <h2 className="text-lg font-semibold text-gray-800">
                {eventToEdit ? 'Edit Event' : 'Create New Event'}
              </h2>
              <button 
                onClick={onClose} 
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
              
              {/* Event Title Dropdown & Write-in */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title <span className="text-red-500 font-semibold">*</span>
                  </label>
                  <select
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    {eventTitleOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                
                {formData.title === 'Others' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specify Event Title <span className="text-red-500 font-semibold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customTitle}
                      onChange={e => setCustomTitle(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-yellow-50/10"
                      placeholder="e.g. Barangay Vaccination Drive"
                    />
                  </div>
                )}
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date & Time <span className="text-red-500 font-semibold">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date & Time <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Time Label & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule / Time Label <span className="text-gray-400 font-normal text-xs">(Optional - auto-derived if blank)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. 8:00 AM - 4:00 PM"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location <span className="text-red-500 font-semibold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. Barangay Health Center"
                  />
                </div>
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500 font-semibold">*</span>
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status <span className="text-red-500 font-semibold">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Expected Attendees & Target Eligibility Dropdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Capacity <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.expectedAttendees}
                    onChange={e => setFormData({ ...formData, expectedAttendees: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. 150"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Eligibility / Audience <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                  </label>
                  <select
                    value={formData.targetAudience}
                    onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    {eligibilityOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Target Eligibility Specific Write-in */}
              {formData.targetAudience === 'Others' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specify Target Eligibility <span className="text-red-500 font-semibold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customEligibility}
                    onChange={e => setCustomEligibility(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-yellow-50/10"
                    placeholder="e.g. Senior citizens aged 65 and above, Single parents"
                  />
                </div>
              )}

              {/* Organizer / Department Dropdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hosting / Organizer Department <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                  </label>
                  <select
                    value={formData.organizer}
                    onChange={e => setFormData({ ...formData, organizer: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    {organizerOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                
                {formData.organizer === 'Others' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specify Department Name <span className="text-red-500 font-semibold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customOrganizer}
                      onChange={e => setCustomOrganizer(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-yellow-50/10"
                      placeholder="e.g. SK Barangay Ugong"
                    />
                  </div>
                )}
              </div>

              {/* Inquiry Contact Person & Contact Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inquiry Contact Person <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. Kagawad Juan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inquiry Contact Number <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.contactNumber}
                    onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. 0917-XXX-XXXX"
                  />
                </div>
              </div>

              {/* Interactive Required Documents List Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Required Documents to Bring <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRequirement}
                    onChange={e => setNewRequirement(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddRequirement();
                      }
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Type document name, then click Add (e.g. Barangay Clearance)"
                  />
                  <button
                    type="button"
                    onClick={handleAddRequirement}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
                {requirementsList.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 border border-gray-150 bg-gray-50/40 p-3 rounded-lg">
                    {requirementsList.map((req, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-blue-100"
                      >
                        {req}
                        <button
                          type="button"
                          onClick={() => handleRemoveRequirement(idx)}
                          className="hover:text-red-650 hover:bg-red-50 p-0.5 rounded transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description / Content <span className="text-red-500 font-semibold">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  placeholder="Brief details about the event..."
                />
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-150 flex justify-end gap-3 bg-white">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save Event'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
