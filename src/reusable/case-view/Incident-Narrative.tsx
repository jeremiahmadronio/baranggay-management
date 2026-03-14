import { Card } from './Card'
interface IncidentNarrativeProps {
  narrative: string
}
export function IncidentNarrative({ narrative }: IncidentNarrativeProps) {
  return (
    <Card title="Incident Narrative" className="mb-6">
      <p className="text-sm text-gray-600 leading-relaxed">{narrative}</p>
    </Card>
  )
}
