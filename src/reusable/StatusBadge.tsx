type StatusType = 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'info' 
  | 'pending' 
  | 'default';

interface StatusBadgeProps {
  status: StatusType;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<StatusType, { border: string; text: string; dot: string }> = {
  success: {
    border: 'border-emerald-400',
    text: 'text-emerald-600',
    dot: 'bg-emerald-500'
  },
  warning: {
    border: 'border-amber-400',
    text: 'text-amber-600',
    dot: 'bg-amber-500'
  },
  danger: {
    border: 'border-rose-400',
    text: 'text-rose-600',
    dot: 'bg-rose-500'
  },
  info: {
    border: 'border-sky-400',
    text: 'text-sky-600',
    dot: 'bg-sky-500'
  },
  pending: {
    border: 'border-orange-400',
    text: 'text-orange-600',
    dot: 'bg-orange-500'
  },
  default: {
    border: 'border-slate-300',
    text: 'text-slate-500',
    dot: 'bg-slate-400'
  }
};

const sizeConfig = {
  sm: 'text-xs px-2 py-0.5 gap-1.5',
  md: 'text-xs px-3 py-1 gap-1.5',
  lg: 'text-sm px-3.5 py-1.5 gap-2'
};

const dotSizeConfig = {
  sm: 'w-1.5 h-1.5',
  md: 'w-1.5 h-1.5',
  lg: 'w-2 h-2'
};

export const StatusBadge = ({ 
  status, 
  label, 
  size = 'md'
}: StatusBadgeProps) => {
  const config = statusConfig[status] || statusConfig.default;

  return (
    <span 
      className={`
        inline-flex items-center font-medium rounded-full border bg-white
        ${config.border} ${config.text} ${sizeConfig[size]}
      `}
    >
      <span className={`${config.dot} ${dotSizeConfig[size]} rounded-full`} />
      {label}
    </span>
  );
};

export const getStatusFromValue = (value: string): StatusType => {
  const statusMap: Record<string, StatusType> = {
    // Success variants
    'active': 'success',
    'approved': 'success',
    'completed': 'success',
    'verified': 'success',
    'paid': 'success',
    'done': 'success',
    
    // Warning variants
    'pending': 'pending',
    'processing': 'warning',
    'review': 'warning',
    'on-hold': 'warning',
    
    // Danger variants
    'inactive': 'danger',
    'rejected': 'danger',
    'cancelled': 'danger',
    'failed': 'danger',
    'expired': 'danger',
    'deleted': 'danger',
    
    // Info variants
    'new': 'info',
    'draft': 'info',
    'scheduled': 'info',
  };

  return statusMap[value.toLowerCase()] || 'default';
};
