'use client';

import { useState } from 'react';
import { Search, ShieldX, Unlock, Globe, Calendar, AlertTriangle, Plus } from 'lucide-react';

const REASON_LABELS: Record<string, string> = {
  CLICK_FREQUENCY: 'Frecuencia',
  ZERO_SESSION:    'Sesión Cero',
  NO_INTERACTION:  'Sin Interacción',
  VPN_DETECTED:    'VPN',
  PROXY_DETECTED:  'Proxy',
  DATACENTER:      'Datacenter',
  MANUAL:          'Manual',
  BOT_FINGERPRINT: 'Bot',
};

const MOCK_IPS = Array.from({ length: 20 }, (_, i) => ({
  id:          String(i + 1),
  ip:          `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
  reason:      ['CLICK_FREQUENCY','VPN_DETECTED','DATACENTER','BOT_FINGERPRINT','PROXY_DETECTED'][i % 5],
  country:     ['Germany','China','Russia','United States','Netherlands'][i % 5],
  countryCode: ['de','cn','ru','us','nl'][i % 5],
  isp:         ['Contabo GmbH','Alibaba Cloud','JSC ER-Telecom','Amazon AWS','Frantech Solutions'][i % 5],
  blockedAt:   new Date(Date.now() - i * 3600000).toISOString(),
  isActive:    true,
}));

export default function BlockedIPsPage() {
  const [search, setSearch]         = useState('');
  const [quickBlock, setQuickBlock] = useState('');
  const [ips, setIps]               = useState(MOCK_IPS);

  const filtered = ips.filter(
    (ip) =>
      ip.ip.includes(search) ||
      ip.country.toLowerCase().includes(search.toLowerCase()) ||
      REASON_LABELS[ip.reason]?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleUnblock = (id: string) => {
    setIps((prev) => prev.filter((ip) => ip.id !== id));
  };

  const handleQuickBlock = () => {
    if (!quickBlock.trim()) return;
    const newEntry = {
      id:          String(Date.now()),
      ip:          quickBlock.trim(),
      reason:      'MANUAL',
      country:     'Unknown',
      countryCode: 'xx',
      isp:         'Unknown',
      blockedAt:   new Date().toISOString(),
      isActive:    true,
    };
    setIps((prev) => [newEntry, ...prev]);
    setQuickBlock('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">IPs Bloqueadas</h1>
          <p className="text-sm text-dark-400 mt-0.5">{ips.length} IPs actualmente bloqueadas</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            id="search-ips"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field w-full pl-9"
            placeholder="Buscar por IP, país o motivo..."
          />
        </div>
        <div className="flex gap-2">
          <input
            id="quick-block-input"
            type="text"
            value={quickBlock}
            onChange={(e) => setQuickBlock(e.target.value)}
            className="input-field w-40"
            placeholder="1.2.3.4"
          />
          <button id="quick-block-btn" onClick={handleQuickBlock} className="btn-danger">
            <Plus className="w-4 h-4" />
            Bloquear IP
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-xs text-dark-500 uppercase tracking-wider">
              <th className="px-4 py-3 text-left">IP</th>
              <th className="px-4 py-3 text-left">País / ISP</th>
              <th className="px-4 py-3 text-left">Motivo</th>
              <th className="px-4 py-3 text-left">Bloqueada</th>
              <th className="px-4 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/3">
            {filtered.map((ip) => (
              <tr key={ip.id} className="table-row-hover">
                <td className="px-4 py-3">
                  <span className="font-mono text-dark-100 bg-dark-900 px-2 py-0.5 rounded text-xs">
                    {ip.ip}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={`https://flagcdn.com/16x12/${ip.countryCode}.png`}
                      alt={ip.country}
                      className="w-4 h-3 object-cover rounded-sm"
                    />
                    <div>
                      <div className="text-dark-200 text-xs">{ip.country}</div>
                      <div className="text-dark-500 text-xs">{ip.isp}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="badge-fraud">
                    <AlertTriangle className="w-3 h-3" />
                    {REASON_LABELS[ip.reason] ?? ip.reason}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-xs text-dark-400">
                    <Calendar className="w-3 h-3" />
                    {new Date(ip.blockedAt).toLocaleString('es-CL')}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleUnblock(ip.id)}
                    className="p-1.5 text-dark-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all"
                    title="Desbloquear IP"
                  >
                    <Unlock className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <ShieldX className="w-8 h-8 text-dark-600 mx-auto mb-2" />
            <p className="text-sm text-dark-500">No se encontraron IPs</p>
          </div>
        )}
      </div>
    </div>
  );
}
