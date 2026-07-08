import { useState, useEffect, useCallback } from 'react';
import { CalendarIcon, PlusIcon, FileTextIcon } from 'lucide-react';
import { getInterventions } from '../../../service/bcpc-api/CaseDetail';
import type { BcpcInterventionDTO } from '../../../service/bcpc-api/CaseDetail';
import { ScheduleInterventionModal } from './ScheduleInterventionModal';
import { RecordInterventionModal } from './RecordInterventionModal';

type Props = {
  caseId: number;
  isReadOnly: boolean;
  caseNumber: string;
  childName: string;
  respondentName: string;
  natureOfComplaint: string;
  onRefresh: () => void;
};

export function InterventionTab({
  caseId,
  isReadOnly,
  caseNumber,
  childName,
  respondentName,
  natureOfComplaint,
  onRefresh,
}: Props) {
  const [interventions, setInterventions] = useState<BcpcInterventionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<BcpcInterventionDTO | null>(null);
  const [showRecord, setShowRecord] = useState(false);

  const fetchInterventions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInterventions(caseId);
      setInterventions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchInterventions();
  }, [fetchInterventions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Intervention Plan & Sessions</h3>
        {!isReadOnly && (
          <button
            onClick={() => setShowSchedule(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4" /> Schedule Intervention
          </button>
        )}
      </div>

      {loading ? (
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-20 bg-gray-100 rounded-xl"></div>
          <div className="h-20 bg-gray-100 rounded-xl"></div>
        </div>
      ) : interventions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Interventions Scheduled</h3>
          <p className="mt-1 text-sm text-gray-500">
            Schedule an intervention session (Counseling, Assessment, etc.) for this BCPC case.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interventions.map((session) => (
            <div key={session.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                    Session {session.sessionNumber} • {session.sessionType}
                  </span>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {new Date(session.scheduledDate).toLocaleString('en-PH', {
                      month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  session.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                  session.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700' :
                  'bg-amber-50 text-amber-700'
                }`}>
                  {session.status}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="flex gap-2">
                  <FileTextIcon className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <p>{session.remarks || 'No remarks recorded yet.'}</p>
                </div>
                {session.conductedBy && (
                  <p className="mt-2 text-xs text-gray-500 italic">Conducted by: {session.conductedBy}</p>
                )}
              </div>

              {!isReadOnly && session.status === 'SCHEDULED' && (
                <button
                  onClick={() => {
                    setSelectedIntervention(session);
                    setShowRecord(true);
                  }}
                  className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  Record Outcome
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showSchedule && (
        <ScheduleInterventionModal
          caseId={caseId}
          caseNumber={caseNumber}
          childName={childName}
          natureOfComplaint={natureOfComplaint}
          onClose={() => setShowSchedule(false)}
          onSuccess={() => {
            setShowSchedule(false);
            fetchInterventions();
            onRefresh();
          }}
        />
      )}

      {showRecord && selectedIntervention && (
        <RecordInterventionModal
          sessionId={selectedIntervention.id!}
          sessionType={selectedIntervention.sessionType}
          onClose={() => {
            setShowRecord(false);
            setSelectedIntervention(null);
          }}
          onSuccess={() => {
            setShowRecord(false);
            setSelectedIntervention(null);
            fetchInterventions();
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
