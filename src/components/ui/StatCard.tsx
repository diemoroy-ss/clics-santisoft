import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title:     string;
  value:     string | number;
  subtitle?: string;
  icon:      LucideIcon;
  iconColor: string;
  iconBg:    string;
  trend?:    { value: string; positive: boolean };
}

export function StatCard({
  title, value, subtitle, icon: Icon, iconColor, iconBg, trend,
}: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-dark-400 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-dark-100 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-dark-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-medium ${
          trend.positive ? 'text-green-400' : 'text-red-400'
        }`}>
          <span>{trend.positive ? '▲' : '▼'}</span>
          <span>{trend.value}</span>
          <span className="text-dark-500 font-normal">vs. ayer</span>
        </div>
      )}
    </div>
  );
}
