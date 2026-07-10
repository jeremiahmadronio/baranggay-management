import { useState } from 'react';
import { recordIntervention } from '../../../service/bcpc-api/CaseDetail';

type Props = {
  sessionId: number;
  sessionType: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function RecordInterventionModal({
  sessionId,
  sessionType,
  onClose,
  onSuccess,
}: Props) {
  const [status, setStatus] = useState('COMPLETED');
  const [remarks, setRemarks] = useState('');
  const [conductedBy, setConductedBy] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarks.trim() || !conductedBy.trim()) {
      setError('Please provide remarks and who conducted the session.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await recordIntervention(sessionId, {
        scheduledDate: new Date().toISOString(), // won't be updated by backend, but required by DTO type loosely
        sessionType,
        status,
        remarks,
        conductedBy,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to record intervention outcome.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Record Session Outcome</h3>
          <p className="text-sm text-gray-500">For: {sessionType}</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Outcome</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="COMPLETED">Completed successfully</option>
              <option value="CANCELLED">Cancelled / Did not attend</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks / Findings</label>
            <textarea
              rows={4}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter assessment findings, counseling notes, or reasons for cancellation..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conducted By</label>
            <input
              type="text"
              placeholder="Name of social worker or officer..."
              value={conductedBy}
              onChange={(e) => setConductedBy(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
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
            {loading ? 'Saving...' : 'Save Outcome'}
          </button>
        </div>
      </div>
    </div>
  );
}
