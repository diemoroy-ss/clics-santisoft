import { Suspense } from 'react';
import { MetricsOverview } from '@/components/dashboard/MetricsOverview';
import { ClicksChart } from '@/components/dashboard/ClicksChart';
import { LastBlockedIP } from '@/components/dashboard/LastBlockedIP';
import type { DashboardMetrics } from '@/types';

// Mock data for initial render (replace with real API fetch)
const MOCK_METRICS: DashboardMetrics = {
  totalClicks:     12847,
  fraudClicks:     2341,
  fraudRate:       18.2,
  moneySaved:      3512,
  blockedIPsCount: 89,
  lastBlockedIP: {
    ip:          '185.220.101.47',
    country:     'Germany',
    countryCode: 'de',
    reason:      'VPN_DETECTED',
    blockedAt:   new Date().toISOString(),
  },
  clicksByDay: [
    { date: 'Lun', total: 1820, fraud: 310, legitimate: 1510 },
    { date: 'Mar', total: 1650, fraud: 280, legitimate: 1370 },
    { date: 'Mié', total: 2100, fraud: 420, legitimate: 1680 },
    { date: 'Jue', total: 1930, fraud: 350, legitimate: 1580 },
    { date: 'Vie', total: 2450, fraud: 510, legitimate: 1940 },
    { date: 'Sáb', total: 1600, fraud: 290, legitimate: 1310 },
    { date: 'Dom', total: 1297, fraud: 181, legitimate: 1116 },
  ],
  topFraudReasons: [
    { reason: 'CLICK_FREQUENCY', count: 980 },
    { reason: 'VPN_DETECTED',    count: 720 },
    { reason: 'DATACENTER',      count: 380 },
    { reason: 'BOT_FINGERPRINT', count: 261 },
  ],
};

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Vista General</h1>
          <p className="text-sm text-dark-400 mt-0.5">Últimos 7 días · Actualización cada 30s</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
          <span className="pulse-dot w-1.5 h-1.5" />
          <span className="text-xs font-medium text-green-400">Protección activa</span>
        </div>
      </div>

      {/* Metrics cards */}
      <MetricsOverview metrics={MOCK_METRICS} />

      {/* Charts + Last blocked IP */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ClicksChart data={MOCK_METRICS.clicksByDay} />
        </div>
        <div>
          <LastBlockedIP data={MOCK_METRICS.lastBlockedIP} />
        </div>
      </div>

      {/* Top fraud reasons */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-dark-200 mb-4">Principales Motivos de Bloqueo</h3>
        <div className="space-y-3">
          {MOCK_METRICS.topFraudReasons.map((item) => {
            const pct = Math.round((item.count / MOCK_METRICS.fraudClicks) * 100);
            const labels: Record<string, string> = {
              CLICK_FREQUENCY: 'Frecuencia de Clics',
              VPN_DETECTED:    'VPN / Proxy',
              DATACENTER:      'Datacenter',
              BOT_FINGERPRINT: 'Fingerprint de Bot',
            };
            return (
              <div key={item.reason}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-dark-300">{labels[item.reason] ?? item.reason}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-dark-500">{item.count.toLocaleString()}</span>
                    <span className="text-xs font-medium text-dark-200">{pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-dark-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
