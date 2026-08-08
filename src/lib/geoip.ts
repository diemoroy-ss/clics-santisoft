import type { GeoIPResult } from '@/types';

const IPAPI_BASE = 'http://ip-api.com/json';

// Campos que solicitamos a ip-api.com
// Con el tier Pro se puede agregar "proxy,hosting" para detectar VPN/proxy
const FIELDS = [
  'status',
  'country',
  'countryCode',
  'city',
  'isp',
  'org',
  'query',
  'proxy',    // Disponible en Pro; en free siempre viene false
  'hosting',  // Disponible en Pro; en free siempre viene false
].join(',');

// Rangos CIDR de datacenters conocidos (sample list, expandir con otros)
const DATACENTER_PATTERNS = [
  /amazon/i,
  /google cloud/i,
  /digitalocean/i,
  /linode/i,
  /vultr/i,
  /hetzner/i,
  /ovh/i,
  /microsoft azure/i,
  /cloudflare/i,
  /fastly/i,
  /akamai/i,
  /limelight/i,
  /aws/i,
  /azure/i,
  /gce/i,
  /ec2/i,
];

/**
 * Consulta ip-api.com para obtener información geográfica y reputación de una IP.
 * Maneja IPs privadas/locales retornando un resultado vacío seguro.
 */
export async function lookupIP(ip: string): Promise<GeoIPResult> {
  // IPs privadas / localhost → no consultar la API
  if (isPrivateIP(ip)) {
    return {
      ip,
      country:     'Local',
      countryCode: 'XX',
      city:        'localhost',
      isp:         'Private Network',
      isVPN:       false,
      isProxy:     false,
      isDatacenter:false,
      success:     true,
    };
  }

  try {
    const proKey = process.env.IPAPI_PRO_KEY;
    const url = proKey
      ? `https://pro.ip-api.com/json/${ip}?fields=${FIELDS}&key=${proKey}`
      : `${IPAPI_BASE}/${ip}?fields=${FIELDS}`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'clics-fraud-detector/1.0' },
      signal: AbortSignal.timeout(3000), // timeout de 3s
    });

    if (!res.ok) {
      throw new Error(`ip-api responded with status ${res.status}`);
    }

    const data = await res.json();

    if (data.status !== 'success') {
      throw new Error(`ip-api status: ${data.message ?? 'unknown error'}`);
    }

    const isp: string = data.isp ?? '';
    const org: string = data.org ?? '';
    const isDatacenter = DATACENTER_PATTERNS.some(
      (re) => re.test(isp) || re.test(org),
    ) || Boolean(data.hosting);

    return {
      ip,
      country:      data.country     ?? 'Unknown',
      countryCode:  data.countryCode ?? 'XX',
      city:         data.city        ?? 'Unknown',
      isp:          isp              || org || 'Unknown',
      isVPN:        Boolean(data.proxy),       // ip-api llama VPN/proxy como "proxy"
      isProxy:      Boolean(data.proxy),
      isDatacenter,
      success:      true,
    };
  } catch (error) {
    console.error('[GeoIP] lookup failed for IP', ip, error);
    // Si falla GeoIP, retornamos sin bloquear por esa razón
    return {
      ip,
      country:     'Unknown',
      countryCode: 'XX',
      city:        'Unknown',
      isp:         'Unknown',
      isVPN:       false,
      isProxy:     false,
      isDatacenter:false,
      success:     false,
    };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isPrivateIP(ip: string): boolean {
  const privates = [
    /^127\./,
    /^10\./,
    /^192\.168\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^::1$/,
    /^fc00:/i,
    /^localhost$/i,
  ];
  return privates.some((re) => re.test(ip));
}

/**
 * Obtiene la IP real del cliente a partir de los headers de la request.
 * Compatible con servidores detrás de proxies / load balancers.
 */
export function extractIP(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Puede venir como "IP1, IP2, IP3" → tomamos la primera (cliente original)
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = req.headers.get('x-real-ip');
  if (realIP) return realIP.trim();

  // Fallback (localhost en dev)
  return '127.0.0.1';
}
