import { Card } from './Card'
import { type InfoField } from './case'
interface InfoCardProps {
  title: string
  fields: InfoField[]
  className?: string
  columns?: 1 | 2
}
export function InfoCard({
  title,
  fields,
  className = '',
  columns = 2,
}: InfoCardProps) {
  return (
    <Card title={title} className={className}>
      <div
        className={`grid gap-6 ${columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}
      >
        {fields.map((field, index) => (
          <div key={index} className="flex flex-col">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              {field.label}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {field.value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
