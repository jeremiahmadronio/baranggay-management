import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Users, 
  FileText, 
  BarChart, 
  CheckCircle, 
  Clock, 
  Home, 
  FileCheck, 
  CalendarDays, 
  Banknote, 
  Hourglass ,
  PiggyBank 
} from 'lucide-react';

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
    icon: <TrendingUp className="w-4 h-4" />
  },
  down: {
    color: 'text-rose-600',
    icon: <TrendingDown className="w-4 h-4" />
  },
  neutral: {
    color: 'text-slate-500',
    icon: <Minus className="w-4 h-4" />
  }
};

const defaultIcons: Record<string, React.ReactNode> = {
  users: <Users className="w-6 h-6" />,
  document: <FileText className="w-6 h-6" />,
  chart: <BarChart className="w-6 h-6" />,
  check: <CheckCircle className="w-6 h-6" />,
  clock: <Clock className="w-6 h-6" />,
  home: <Home className="w-6 h-6" />,
  
  //clearance stats icons
  issued: <FileCheck className="w-6 h-6" />,
  month: <CalendarDays className="w-6 h-6" />,
  revenue: <PiggyBank className="w-6 h-6" />,
  pending: <Hourglass className="w-6 h-6" />
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
          
          {trend && (
            <div className={`flex items-center gap-1 mt-2 ${trendConfig[trend.direction].color}`}>
              {trendConfig[trend.direction].icon}
              <span className="text-sm font-medium">{trend.value}</span>
              {trend.label && (
                <span className="text-sm text-gray-500 ml-1">{trend.label}</span>
              )}
            </div>
          )}
          
          {subtitle && !trend && (
            <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
          )}
        </div>

        {icon && (
          <div className={`${colors.iconBg} ${colors.iconText} p-3 rounded-lg`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

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

export const KPIIcons = defaultIcons;