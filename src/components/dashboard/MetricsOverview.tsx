import {
  MousePointerClick,
  ShieldX,
  DollarSign,
  Activity,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import type { DashboardMetrics } from '@/types';

interface MetricsOverviewProps {
  metrics: DashboardMetrics;
}

export function MetricsOverview({ metrics }: MetricsOverviewProps) {
  const fraudRate = metrics.totalClicks > 0
    ? ((metrics.fraudClicks / metrics.totalClicks) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        title="Total Clics (7d)"
        value={metrics.totalClicks.toLocaleString()}
        icon={MousePointerClick}
        iconColor="text-brand-400"
        iconBg="bg-brand-500/10"
        trend={{ value: '+12.4%', positive: true }}
      />
      <StatCard
        title="Clics Fraudulentos"
        value={metrics.fraudClicks.toLocaleString()}
        subtitle={`${fraudRate}% del total`}
        icon={ShieldX}
        iconColor="text-red-400"
        iconBg="bg-red-500/10"
        trend={{ value: `${fraudRate}% tasa`, positive: false }}
      />
      <StatCard
        title="Dinero Protegido"
        value={`$${metrics.moneySaved.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
        subtitle="USD estimado"
        icon={DollarSign}
        iconColor="text-green-400"
        iconBg="bg-green-500/10"
        trend={{ value: `${metrics.fraudClicks} clics × CPC`, positive: true }}
      />
      <StatCard
        title="IPs Bloqueadas"
        value={metrics.blockedIPsCount.toLocaleString()}
        subtitle="actualmente activas"
        icon={Activity}
        iconColor="text-yellow-400"
        iconBg="bg-yellow-500/10"
      />
    </div>
  );
}
