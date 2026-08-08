import { Redis } from '@upstash/redis';

// Cliente Upstash Redis para rate limiting y caché de sesiones
export const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ─── Rate Limiting Helpers ───────────────────────────────────────────────────

/**
 * Incrementa el contador de clics de una IP en una ventana de tiempo.
 * Retorna el conteo actual después del incremento.
 *
 * @param ip           Dirección IP del visitante
 * @param siteId       ID del sitio
 * @param windowSecs   Ventana de tiempo en segundos
 */
export async function incrementIPClickCount(
  ip: string,
  siteId: string,
  windowSecs: number,
): Promise<number> {
  const key = `clicks:${siteId}:${ip}`;
  const count = await redis.incr(key);

  // Establece el TTL solo la primera vez (cuando count === 1)
  if (count === 1) {
    await redis.expire(key, windowSecs);
  }

  return count;
}

/**
 * Obtiene el contador actual de clics de una IP (sin incrementar).
 */
export async function getIPClickCount(
  ip: string,
  siteId: string,
): Promise<number> {
  const key = `clicks:${siteId}:${ip}`;
  const count = await redis.get<number>(key);
  return count ?? 0;
}

/**
 * Resetea el contador de clics de una IP (al desbloquear manualmente).
 */
export async function resetIPClickCount(
  ip: string,
  siteId: string,
): Promise<void> {
  const key = `clicks:${siteId}:${ip}`;
  await redis.del(key);
}

/**
 * Guarda una sesión de auth en Redis con TTL de 24h.
 */
export async function setSession(uid: string, data: object): Promise<void> {
  await redis.set(`session:${uid}`, JSON.stringify(data), { ex: 86400 });
}

/**
 * Obtiene una sesión de auth desde Redis.
 */
export async function getSession(uid: string): Promise<object | null> {
  const raw = await redis.get<string>(`session:${uid}`);
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}
