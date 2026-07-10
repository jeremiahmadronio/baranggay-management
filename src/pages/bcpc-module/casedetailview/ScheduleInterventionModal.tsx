import { useEffect, useState } from 'react';
import { scheduleIntervention } from '../../../service/bcpc-api/CaseDetail';
import { getBcpcOfficerOptions, type BcpcOfficerOptionDTO } from '../../../service/bcpc-api/BcpcFormService';

type Props = {
  caseId: number;
  caseNumber: string;
  childName: string;
  natureOfComplaint: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function ScheduleInterventionModal({
  caseId,
  caseNumber,
  childName,
  natureOfComplaint,
  onClose,
  onSuccess,
}: Props) {
  const [sessionType, setSessionType] = useState('Assessment');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [conductedBy, setConductedBy] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Officer dropdown state
  const [officers, setOfficers] = useState<BcpcOfficerOptionDTO[]>([]);
  const [officersLoading, setOfficersLoading] = useState(true);

  useEffect(() => {
    getBcpcOfficerOptions()
      .then(setOfficers)
      .catch(() => setOfficers([]))
      .finally(() => setOfficersLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledDate || !scheduledTime || !conductedBy) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    const dateTime = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

    try {
      await scheduleIntervention(caseId, {
        scheduledDate: dateTime,
        sessionType,
        conductedBy,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule intervention.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Schedule Intervention</h3>
          <p className="text-sm text-gray-500">Case {caseNumber} — {childName}</p>
          {natureOfComplaint && (
            <span className="mt-1 inline-block text-xs bg-sky-50 text-sky-700 border border-sky-200 rounded-full px-2 py-0.5">{natureOfComplaint}</span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Intervention Type</label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="Assessment">Assessment</option>
              <option value="Counseling">Counseling</option>
              <option value="Home Visit">Home Visit</option>
              <option value="Medical Referral">Medical Referral</option>
              <option value="Case Conference">Case Conference</option>
              <option value="Safety Planning">Safety Planning</option>
              <option value="General Intervention">General Intervention</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time <span className="text-red-500">*</span></label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assigned Worker / Officer <span className="text-red-500">*</span>
            </label>
            <select
              value={conductedBy}
              onChange={(e) => setConductedBy(e.target.value)}
              disabled={officersLoading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">
                {officersLoading ? 'Loading officers...' : '— Select Officer / Social Worker —'}
              </option>
              {officers.map((o) => (
                <option key={o.id} value={o.name}>
                  {o.name}{o.position ? ` — ${o.position}` : ''}
                </option>
              ))}
            </select>
          </div>
        </form>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button autoFocus
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Scheduling...' : 'Schedule Session'}
          </button>
        </div>
      </div>
    </div>
  );
}
