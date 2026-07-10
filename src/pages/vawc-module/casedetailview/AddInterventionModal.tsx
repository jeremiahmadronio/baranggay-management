import { FileTextIcon, XIcon } from 'lucide-react';
import type { AssignOfficerOptionDTO } from '../../../service/vawc-api/vawc-api';

const ACTIVITY_TYPES = ['Assessment', 'Counseling', 'Medical', 'Legal Assistance', 'Referral', 'Home Visit', 'Others'];

export type InterventionFormState = {
  activityType: string;
  customActivityType: string;
  interventionDetails: string;
  interventionDate: string;
  startTime: string;
  endTime: string;
  performedByEmployeeIds: number[];
};

type AddInterventionModalProps = {
  form: InterventionFormState;
  loading: boolean;
  error: string;
  message: string;
  assignOfficerOptions: AssignOfficerOptionDTO[];
  assignOfficerLoading: boolean;
  onFormChange: (field: keyof InterventionFormState, value: string | number[]) => void;
  onSave: () => void;
  onClose: () => void;
};

export function AddInterventionModal({
  form,
  loading,
  error,
  message,
  assignOfficerOptions,
  assignOfficerLoading,
  onFormChange,
  onSave,
  onClose,
}: AddInterventionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Add New Intervention</h3>
            <p className="text-sm text-gray-500 mt-0.5">Set the schedule, assigned officer, and intervention notes.</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">1 Activity Information</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Activity Type</label>
                <select
                  value={ACTIVITY_TYPES.includes(form.activityType) ? form.activityType : 'Others'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'Others') {
                      onFormChange('activityType', 'Others');
                      onFormChange('customActivityType', '');
                    } else {
                      onFormChange('activityType', val);
                      onFormChange('customActivityType', '');
                    }
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {ACTIVITY_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Assigned To</label>
                {assignOfficerLoading ? (
                  <p className="text-sm text-gray-500 py-2">Loading officers...</p>
                ) : (
                  <select
                    value={form.performedByEmployeeIds[0] ?? ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      onFormChange('performedByEmployeeIds', val ? [val] : []);
                    }}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select officer...</option>
                    {assignOfficerOptions.map((officer) => (
                      <option key={officer.id} value={officer.id}>
                        {officer.name} ({officer.position})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {form.activityType === 'Others' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Activity Name</label>
              <input
                type="text"
                value={form.customActivityType}
                onChange={(e) => onFormChange('customActivityType', e.target.value)}
                placeholder="e.g., Custom activity type"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">2 Schedule</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Scheduled Date</label>
                <input
                  type="date"
                  value={form.interventionDate}
                  onChange={(e) => onFormChange('interventionDate', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => onFormChange('startTime', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">End Time</label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => onFormChange('endTime', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <FileTextIcon className="w-3.5 h-3.5" /> 3 Notes / Description
            </p>
            <textarea
              value={form.interventionDetails}
              onChange={(e) => onFormChange('interventionDetails', e.target.value)}
              rows={5}
              placeholder="Add any additional details here..."
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}
          {message && <p className="text-sm text-emerald-600">{message}</p>}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button autoFocus
            onClick={onSave}
            disabled={loading}
            className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Intervention'}
          </button>
        </div>
      </div>
    </div>
  );
}
