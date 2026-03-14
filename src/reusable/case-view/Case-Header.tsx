import { Badge } from './Badge'
import {type CaseData } from './case'
interface CaseHeaderProps {
  data: CaseData
  showTabs?: boolean
  activeTab?: string
  onTabChange?: (tab: string) => void
}
export function CaseHeader({
  data,
  showTabs = true,
  activeTab = 'overview',
  onTabChange,
}: CaseHeaderProps) {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
    },
    {
      id: 'hearings',
      label: 'Hearings (0)',
    },
    {
      id: 'notes',
      label: 'Case Notes (0)',
    },
    {
      id: 'timeline',
      label: 'Timeline',
    },
  ]
  return (
    <div className="bg-white border-b border-gray-200 pt-6 px-6 sm:px-8 mb-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">
            {data.caseNumber}
          </h1>
          <Badge variant={data.status === 'active' ? 'primary' : 'default'}>
            {data.status}
          </Badge>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          {data.complainant} • {data.natureOfComplaint}
        </p>

        {showTabs && (
          <div className="flex space-x-8 border-b border-transparent">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-md" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
