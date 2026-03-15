import { FileText } from 'lucide-react'
import { Card } from './Card'
interface EvidenceCardProps {
  evidence: string[]
}
export function EvidenceCard({ evidence }: EvidenceCardProps) {
  if (!evidence || evidence.length === 0) {
    return (
      <Card title="Evidence" className="mb-6">
        <p className="text-sm text-gray-400 italic">No evidence attached</p>
      </Card>
    )
  }
  return (
    <Card title="Evidence" className="mb-6">
      <div className="flex flex-wrap gap-2.5">
        {evidence.map((item, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200 shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-gray-400" />
            {item.replace(/_/g, ' ')}
          </span>
        ))}
      </div>
    </Card>
  )
}
