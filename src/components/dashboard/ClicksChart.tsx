'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ClicksByDay } from '@/types';

interface ClicksChartProps {
  data: ClicksByDay[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 text-xs">
      <p className="text-dark-300 mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-dark-400">{p.name}:</span>
          <span className="text-dark-100 font-medium">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export function ClicksChart({ data }: ClicksChartProps) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-dark-200">Clics por Día</h3>
          <p className="text-xs text-dark-500 mt-0.5">Últimos 7 días</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-brand-500" />
            <span className="text-xs text-dark-400">Legítimos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs text-dark-400">Fraude</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorLeg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#5558f8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#5558f8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#677891', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#677891', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="legitimate"
            name="Legítimos"
            stroke="#5558f8"
            strokeWidth={2}
            fill="url(#colorLeg)"
          />
          <Area
            type="monotone"
            dataKey="fraud"
            name="Fraude"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#colorFraud)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
