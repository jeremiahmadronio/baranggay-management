import { AlertTriangle } from 'lucide-react'
import { Card } from './Card'
interface IncidentDetailsProps {
  incidentTime?: string
  frequencyOfIncident?: string
  descriptionOfInjuries?: string
}
export function IncidentDetails({
  incidentTime,
  frequencyOfIncident,
  descriptionOfInjuries,
}: IncidentDetailsProps) {
  // If all fields are empty/undefined, don't render the card
  if (!incidentTime && !frequencyOfIncident && !descriptionOfInjuries) {
    return null
  }
  return (
    <Card title="Incident Details" className="mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {incidentTime && (
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              Time of Incident
            </span>
            <span className="text-sm font-medium text-gray-900">
              {incidentTime}
            </span>
          </div>
        )}

        {frequencyOfIncident && (
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              Frequency
            </span>
            <span className="text-sm font-medium text-gray-900">
              {frequencyOfIncident}
            </span>
          </div>
        )}

        {descriptionOfInjuries && (
          <div className="flex flex-col sm:col-span-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              Description of Injuries
            </span>
            <span className="text-sm font-medium text-gray-900 leading-relaxed">
              {descriptionOfInjuries}
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}
