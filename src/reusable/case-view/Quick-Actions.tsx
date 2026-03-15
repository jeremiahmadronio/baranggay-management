import {type QuickAction } from './case'
interface QuickActionsProps {
  actions: QuickAction[]
}
export function QuickActions({ actions }: QuickActionsProps) {
  const getVariantStyles = (variant: QuickAction['variant']) => {
    switch (variant) {
      case 'primary':
        return 'border-blue-100 bg-blue-50/50 hover:bg-blue-50 text-blue-700'
      case 'danger':
        return 'border-red-100 bg-red-50/50 hover:bg-red-50 text-red-700'
      case 'success':
        return 'border-green-100 bg-green-50/50 hover:bg-green-50 text-green-700'
      default:
        return 'border-gray-200 bg-gray-50/50 hover:bg-gray-50 text-gray-700'
    }
  }
  const getIconColor = (variant: QuickAction['variant']) => {
    switch (variant) {
      case 'primary':
        return 'text-blue-500'
      case 'danger':
        return 'text-red-500'
      case 'success':
        return 'text-green-500'
      default:
        return 'text-gray-500'
    }
  }
  return (
    <div className="mb-6">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon
          const variantStyles = getVariantStyles(action.variant)
          const iconColor = getIconColor(action.variant)
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`flex flex-col items-start p-4 rounded-xl border transition-all text-left ${action.disabled ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200' : variantStyles}`}
            >
              <Icon
                className={`w-5 h-5 mb-3 ${action.disabled ? 'text-gray-400' : iconColor}`}
              />
              <span
                className={`font-bold text-sm mb-1 ${action.disabled ? 'text-gray-500' : ''}`}
              >
                {action.label}
              </span>
              <span className="text-xs text-gray-400">
                {action.description}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
