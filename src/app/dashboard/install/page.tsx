'use client';

import { useState } from 'react';
import { Copy, Check, Link2, Code2, ExternalLink, Zap } from 'lucide-react';

const SITE_KEY = 'sk_demo_abc123xyz'; // TODO: Obtener del perfil del usuario
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://clics.santisoft.cl';

export default function InstallPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const trackingSnippet = `<!-- Clics Anti-Fraud Tracker -->
<script
  src="${APP_URL}/tracker.js"
  data-site-key="${SITE_KEY}"
  async
></script>`;

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-dark-100">Instalación e Integraciones</h1>
        <p className="text-sm text-dark-400 mt-0.5">Conecta tu sitio web y tu cuenta de Google Ads</p>
      </div>

      {/* Google Ads Connect */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <Link2 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-dark-200">Conectar Google Ads</h2>
            <p className="text-xs text-dark-500">Autoriza el acceso para sincronizar exclusiones de IP automáticamente</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <a
            id="connect-google-ads-btn"
            href="/api/v1/google-ads/connect"
            className="btn-primary"
          >
            <Zap className="w-4 h-4" />
            Conectar con Google Ads
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-900 border border-dark-700 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-dark-600" />
            <span className="text-xs text-dark-400">No conectado</span>
          </div>
        </div>
      </div>

      {/* Tracking snippet */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center">
            <Code2 className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-dark-200">Script de Tracking</h2>
            <p className="text-xs text-dark-500">Instala este snippet en el &lt;head&gt; de tu sitio web</p>
          </div>
        </div>

        <div className="relative">
          <pre className="bg-dark-950 border border-dark-700 rounded-lg p-4 text-xs font-mono text-dark-200 overflow-x-auto">
            <code>{trackingSnippet}</code>
          </pre>
          <button
            id="copy-snippet-btn"
            onClick={() => copy(trackingSnippet, 'snippet')}
            className="absolute top-3 right-3 p-1.5 bg-dark-800 hover:bg-dark-700 border border-dark-600 rounded-md transition-all"
          >
            {copied === 'snippet'
              ? <Check className="w-4 h-4 text-green-400" />
              : <Copy className="w-4 h-4 text-dark-400" />}
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <h3 className="text-xs font-semibold text-dark-300 uppercase tracking-wider">Instrucciones</h3>
          {[
            'Copia el snippet de arriba',
            'Pégalo antes del cierre del tag </head> en todas las páginas de tu sitio',
            'Verifica en el dashboard que los clics empiezan a aparecer (puede tardar hasta 1 minuto)',
            'Opcionalmente, conecta Google Ads para bloquear IPs automáticamente',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-xs text-dark-400">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Site Key */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-dark-200 mb-3">Tu Site Key</h2>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-dark-950 border border-dark-700 rounded-lg px-3 py-2">
            <span className="font-mono text-sm text-brand-300">{SITE_KEY}</span>
          </div>
          <button
            id="copy-site-key-btn"
            onClick={() => copy(SITE_KEY, 'key')}
            className="btn-secondary"
          >
            {copied === 'key' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            {copied === 'key' ? '¡Copiado!' : 'Copiar'}
          </button>
        </div>
        <p className="text-xs text-dark-500 mt-2">
          Esta clave identifica tu sitio de forma única. No la compartas públicamente.
        </p>
      </div>
    </div>
  );
}
