import { incrementIPClickCount } from '@/lib/redis';
import type {
  FraudCheckInput,
  FraudCheckResult,
  FraudReason,
} from '@/types';

/**
 * Motor de evaluación de fraude de clics.
 * Evalúa las reglas en orden de severidad y retorna el resultado.
 *
 * Las reglas se evalúan en cascada: en cuanto se detecta fraude, se retorna
 * inmediatamente sin seguir evaluando (early exit).
 */
export async function evaluateFraud(
  input: FraudCheckInput,
): Promise<FraudCheckResult> {
  const { ip, siteId, payload, geo, rules } = input;

  // ── 1. Regla de Redes Sospechosas ─────────────────────────────────────────
  if (rules.blockVPN && (geo.isVPN || geo.isProxy)) {
    return makeFraud(geo.isProxy ? 'PROXY_DETECTED' : 'VPN_DETECTED', 95);
  }

  if (rules.blockDatacenter && geo.isDatacenter) {
    return makeFraud('DATACENTER', 90);
  }

  // ── 2. Regla de Comportamiento: sesión cero ────────────────────────────────
  if (
    rules.blockBots &&
    payload.sessionTime !== undefined &&
    payload.sessionTime === 0
  ) {
    return makeFraud('ZERO_SESSION', 85);
  }

  // ── 3. Regla de Comportamiento: sin interacción ────────────────────────────
  // Solo aplica si tenemos datos de interacción y la sesión duró más de 2s
  const sessionLong = (payload.sessionTime ?? 0) > 2;
  if (
    rules.blockBots &&
    sessionLong &&
    payload.mouseEvents !== undefined &&
    payload.mouseEvents < rules.minMouseEvents
  ) {
    return makeFraud('NO_INTERACTION', 80);
  }

  // ── 4. Regla de Tiempo Mínimo de Permanencia ──────────────────────────────
  if (
    rules.minSessionSeconds > 0 &&
    payload.sessionTime !== undefined &&
    payload.sessionTime < rules.minSessionSeconds
  ) {
    return makeFraud('ZERO_SESSION', 75);
  }

  // ── 5. Regla de Fingerprint de Bot ────────────────────────────────────────
  if (rules.blockBots && payload.fingerprint) {
    const botScore = scoreBotFingerprint(payload);
    if (botScore >= 70) {
      return makeFraud('BOT_FINGERPRINT', botScore);
    }
  }

  // ── 6. Regla de Frecuencia de Clics (Redis rate-limiting) ─────────────────
  const windowSecs = rules.timeWindowMinutes * 60;
  const clickCount = await incrementIPClickCount(ip, siteId, windowSecs);

  if (clickCount > rules.maxClicksPerIP) {
    return makeFraud('CLICK_FREQUENCY', Math.min(60 + clickCount * 2, 99));
  }

  // ── Sin fraude detectado ───────────────────────────────────────────────────
  return { isFraud: false, score: Math.max(0, clickCount * 5) };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeFraud(reason: FraudReason, score: number): FraudCheckResult {
  return { isFraud: true, reason, score: Math.min(score, 100) };
}

/**
 * Genera un puntaje de probabilidad de bot basado en anomalías del payload.
 * Retorna un número 0–100.
 */
function scoreBotFingerprint(payload: FraudCheckInput['payload']): number {
  let score = 0;

  // User-Agent ausente o inusual
  if (!payload.userAgent) score += 30;
  else if (isBotUserAgent(payload.userAgent)) score += 50;

  // Sin resolución de pantalla
  if (!payload.screenRes) score += 15;

  // Sin referer cuando debería tenerlo (viniendo de Google Ads)
  if (!payload.referer) score += 10;

  // Sin mouseEvents pero sesión > 5s (debería haber movimiento)
  if ((payload.sessionTime ?? 0) > 5 && (payload.mouseEvents ?? 0) === 0) {
    score += 20;
  }

  return Math.min(score, 100);
}

const BOT_UA_PATTERNS = [
  /bot/i, /crawl/i, /spider/i, /scraper/i, /curl/i, /wget/i,
  /python-requests/i, /go-http/i, /axios/i, /java\//i,
  /httpclient/i, /okhttp/i, /libwww/i, /lwp/i,
];

function isBotUserAgent(ua: string): boolean {
  return BOT_UA_PATTERNS.some((re) => re.test(ua));
}
