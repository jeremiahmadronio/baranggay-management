import { User } from 'lucide-react'
import { Card } from './Card'
import {type WitnessInfo } from './case'
interface WitnessesCardProps {
  witnesses: WitnessInfo[]
}
export function WitnessesCard({ witnesses }: WitnessesCardProps) {
  if (!witnesses || witnesses.length === 0) {
    return (
      <Card title="Witnesses" className="mb-6">
        <p className="text-sm text-gray-400 italic">No witnesses recorded</p>
      </Card>
    )
  }
  return (
    <Card title="Witnesses" className="mb-6" noPadding>
      <div className="divide-y divide-gray-100">
        {witnesses.map((witness, index) => (
          <div key={index} className="p-4 sm:px-6 flex items-start gap-4">
            <div className="bg-gray-50 p-2.5 rounded-full flex-shrink-0 border border-gray-100 mt-0.5">
              <User className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900">
                {witness.fullName}
              </span>
              {(witness.contactNumber || witness.address) && (
                <span className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {[witness.contactNumber, witness.address]
                    .filter(Boolean)
                    .join(' • ')}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
