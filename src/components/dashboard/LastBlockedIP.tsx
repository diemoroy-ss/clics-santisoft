import { ShieldAlert, Globe, Clock, AlertTriangle } from 'lucide-react';
import type { LastBlockedIP as LastBlockedIPType } from '@/types';

const REASON_LABELS: Record<string, string> = {
  CLICK_FREQUENCY: 'Frecuencia excesiva de clics',
  ZERO_SESSION:    'Sesión de 0 segundos',
  NO_INTERACTION:  'Sin interacción (bot)',
  VPN_DETECTED:    'VPN detectada',
  PROXY_DETECTED:  'Proxy detectado',
  DATACENTER:      'IP de datacenter',
  MANUAL:          'Bloqueo manual',
  BOT_FINGERPRINT: 'Fingerprint de bot',
};

interface LastBlockedIPProps {
  data: LastBlockedIPType | null;
}

export function LastBlockedIP({ data }: LastBlockedIPProps) {
  if (!data) {
    return (
      <div className="glass-card p-5 flex items-center justify-center h-32">
        <p className="text-sm text-dark-500">Sin bloqueos recientes 🎉</p>
      </div>
    );
  }

  const flagUrl = `https://flagcdn.com/24x18/${data.countryCode.toLowerCase()}.png`;

  return (
    <div className="glass-card p-5 border-red-500/15 glow-fraud">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
          <ShieldAlert className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-dark-200">Última IP Bloqueada</h3>
          <div className="flex items-center gap-1 text-xs text-dark-500">
            <span className="pulse-dot pulse-dot-red w-1.5 h-1.5" />
            En vivo
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-dark-500">Dirección IP</span>
          <span className="font-mono text-sm text-dark-100 bg-dark-900 px-2 py-0.5 rounded">
            {data.ip}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-dark-500 flex items-center gap-1">
            <Globe className="w-3 h-3" /> País
          </span>
          <div className="flex items-center gap-1.5">
            <img src={flagUrl} alt={data.country} className="w-4 h-3 object-cover rounded-sm" />
            <span className="text-sm text-dark-200">{data.country}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-dark-500 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Motivo
          </span>
          <span className="badge-fraud text-xs">
            {REASON_LABELS[data.reason] ?? data.reason}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-dark-500 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Hora
          </span>
          <span className="text-xs text-dark-400">
            {new Date(data.blockedAt).toLocaleString('es-CL')}
          </span>
        </div>
      </div>
    </div>
  );
}
