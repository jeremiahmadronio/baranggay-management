import React from 'react';

type KPITrend = 'up' | 'down' | 'neutral';
type KPIColor = 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate';

interface KPICardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string | number;
    direction: KPITrend;
    label?: string;
  };
  color?: KPIColor;
  subtitle?: string;
}

const colorConfig: Record<KPIColor, { bg: string; iconBg: string; iconText: string }> = {
  blue: { bg: 'bg-white', iconBg: 'bg-blue-100', iconText: 'text-blue-600' },
  emerald: { bg: 'bg-white', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600' },
  amber: { bg: 'bg-white', iconBg: 'bg-amber-100', iconText: 'text-amber-600' },
  rose: { bg: 'bg-white', iconBg: 'bg-rose-100', iconText: 'text-rose-600' },
  violet: { bg: 'bg-white', iconBg: 'bg-violet-100', iconText: 'text-violet-600' },
  slate: { bg: 'bg-white', iconBg: 'bg-slate-100', iconText: 'text-slate-600' }
};

const trendConfig: Record<KPITrend, { color: string; icon: React.ReactNode }> = {
  up: {
    color: 'text-emerald-600',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    )
  },
  down: {
    color: 'text-rose-600',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    )
  },
  neutral: {
    color: 'text-slate-500',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    )
  }
};

// Default icons for common KPI types
const defaultIcons: Record<string, React.ReactNode> = {
  users: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  document: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  chart: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  check: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  clock: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  home: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
};

export const KPICard = ({
  title,
  value,
  icon,
  trend,
  color = 'blue',
  subtitle
}: KPICardProps) => {
  const colors = colorConfig[color];

  return (
    <div className={`${colors.bg} rounded-lg shadow-sm border border-gray-200 p-5`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          
          {/* Trend indicator */}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 ${trendConfig[trend.direction].color}`}>
              {trendConfig[trend.direction].icon}
              <span className="text-sm font-medium">{trend.value}</span>
              {trend.label && (
                <span className="text-sm text-gray-500 ml-1">{trend.label}</span>
              )}
            </div>
          )}
          
          {/* Subtitle */}
          {subtitle && !trend && (
            <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <div className={`${colors.iconBg} ${colors.iconText} p-3 rounded-lg`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

// Grid wrapper for multiple KPI cards
interface KPIGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
}

const columnClasses: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
  6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
};

export const KPIGrid = ({ children, columns = 4 }: KPIGridProps) => {
  return (
    <div className={`grid ${columnClasses[columns]} gap-4`}>
      {children}
    </div>
  );
};

// Export default icons for easy use
export const KPIIcons = defaultIcons;
