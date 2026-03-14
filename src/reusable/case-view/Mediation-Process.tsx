import { Check } from 'lucide-react'
import { Card } from './Card'
import { Badge } from './Badge'
import {type ProcessStep } from './case'
interface MediationProcessProps {
  steps: ProcessStep[]
}
export function MediationProcess({ steps }: MediationProcessProps) {
  return (
    <Card title="Mediation Process" className="mb-6">
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gray-200" />

        <div className="space-y-8 relative">
          {steps.map((step, index) => {
            const isCompleted = step.status === 'completed'
            const isPending = step.status === 'pending'
            return (
              <div key={index} className="flex items-start gap-4">
                {/* Step Indicator */}
                <div
                  className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white flex-shrink-0 transition-colors
                  ${isCompleted ? 'border-green-500 bg-green-500 text-white' : isPending ? 'border-gray-300 text-gray-500' : 'border-gray-200 text-gray-300'}`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-bold">{step.step}</span>
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 pt-1.5 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div>
                    <h4
                      className={`text-sm font-bold ${isCompleted || isPending ? 'text-gray-900' : 'text-gray-400'}`}
                    >
                      {step.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {step.description}
                    </p>
                  </div>

                  <div>
                    {isCompleted ? (
                      <Badge variant="success">COMPLETED</Badge>
                    ) : (
                      <Badge variant="default">PENDING</Badge>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
