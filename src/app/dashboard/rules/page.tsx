'use client';

import { useState } from 'react';
import { Settings, Save, Info } from 'lucide-react';
import { Toggle } from '@/components/ui/Toggle';
import type { FraudRuleConfig } from '@/types';

const DEFAULT_RULES: FraudRuleConfig = {
  maxClicksPerIP:    5,
  timeWindowMinutes: 60,
  blockVPN:          true,
  blockProxy:        true,
  blockDatacenter:   true,
  blockBots:         true,
  minSessionSeconds: 3,
  minMouseEvents:    0,
  autoSyncGoogleAds: false,
  cpcEstimateUSD:    1.5,
};

export default function RulesPage() {
  const [rules, setRules] = useState<FraudRuleConfig>(DEFAULT_RULES);
  const [saved, setSaved] = useState(false);

  const update = <K extends keyof FraudRuleConfig>(key: K, value: FraudRuleConfig[K]) => {
    setRules((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    // TODO: llamar a API /api/v1/rules con fetch
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Reglas de Bloqueo</h1>
          <p className="text-sm text-dark-400 mt-0.5">Configura el motor de detección de fraude</p>
        </div>
        <button id="save-rules-btn" onClick={handleSave} className="btn-primary">
          <Save className="w-4 h-4" />
          {saved ? '¡Guardado!' : 'Guardar cambios'}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Frecuencia */}
        <div className="glass-card p-5 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-4 h-4 text-brand-400" />
            <h2 className="text-sm font-semibold text-dark-200">Regla de Frecuencia</h2>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-medium text-dark-300">Máximo de clics por IP</label>
              <span className="text-xs font-bold text-brand-300">{rules.maxClicksPerIP} clics</span>
            </div>
            <input
              id="max-clicks-slider"
              type="range"
              min={1} max={50} step={1}
              value={rules.maxClicksPerIP}
              onChange={(e) => update('maxClicksPerIP', Number(e.target.value))}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-dark-600 mt-1">
              <span>1</span><span>25</span><span>50</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-medium text-dark-300">Ventana de tiempo</label>
              <span className="text-xs font-bold text-brand-300">{rules.timeWindowMinutes} min</span>
            </div>
            <input
              id="time-window-slider"
              type="range"
              min={1} max={1440} step={1}
              value={rules.timeWindowMinutes}
              onChange={(e) => update('timeWindowMinutes', Number(e.target.value))}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-dark-600 mt-1">
              <span>1 min</span><span>12h</span><span>24h</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-medium text-dark-300">Tiempo mínimo de sesión</label>
              <span className="text-xs font-bold text-brand-300">{rules.minSessionSeconds}s</span>
            </div>
            <input
              id="min-session-slider"
              type="range"
              min={0} max={30} step={1}
              value={rules.minSessionSeconds}
              onChange={(e) => update('minSessionSeconds', Number(e.target.value))}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-dark-600 mt-1">
              <span>0s</span><span>15s</span><span>30s</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-medium text-dark-300">CPC estimado (USD)</label>
              <span className="text-xs font-bold text-green-400">${rules.cpcEstimateUSD}</span>
            </div>
            <input
              id="cpc-slider"
              type="range"
              min={0.1} max={20} step={0.1}
              value={rules.cpcEstimateUSD}
              onChange={(e) => update('cpcEstimateUSD', Number(e.target.value))}
              className="w-full accent-green-500"
            />
            <div className="flex justify-between text-xs text-dark-600 mt-1">
              <span>$0.1</span><span>$10</span><span>$20</span>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-4 h-4 text-brand-400" />
            <h2 className="text-sm font-semibold text-dark-200">Tipos de Bloqueo</h2>
          </div>

          <Toggle
            id="toggle-vpn"
            checked={rules.blockVPN}
            onChange={(v) => update('blockVPN', v)}
            label="Bloquear VPNs"
            desc="Detecta y bloquea tráfico de redes VPN conocidas"
          />
          <div className="border-t border-white/5" />
          <Toggle
            id="toggle-proxy"
            checked={rules.blockProxy}
            onChange={(v) => update('blockProxy', v)}
            label="Bloquear Proxies"
            desc="Bloquea IPs identificadas como proxies públicos o anónimos"
          />
          <div className="border-t border-white/5" />
          <Toggle
            id="toggle-datacenter"
            checked={rules.blockDatacenter}
            onChange={(v) => update('blockDatacenter', v)}
            label="Bloquear Datacenters"
            desc="IPs de AWS, GCP, Azure, DigitalOcean, etc."
          />
          <div className="border-t border-white/5" />
          <Toggle
            id="toggle-bots"
            checked={rules.blockBots}
            onChange={(v) => update('blockBots', v)}
            label="Detección de Bots"
            desc="Analiza comportamiento: sesión cero, sin interacción, User-Agent de bot"
          />
          <div className="border-t border-white/5" />
          <Toggle
            id="toggle-google-ads-sync"
            checked={rules.autoSyncGoogleAds}
            onChange={(v) => update('autoSyncGoogleAds', v)}
            label="Sincronizar con Google Ads"
            desc="Añade automáticamente las IPs bloqueadas como exclusiones de campaña"
          />

          <div className="flex items-start gap-2 p-3 bg-brand-500/5 border border-brand-500/10 rounded-lg mt-2">
            <Info className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-brand-300/70">
              La sincronización con Google Ads requiere conectar tu cuenta en la sección de Instalación.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
