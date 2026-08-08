import { prisma } from '@/lib/prisma';
import { removeIPBlock } from '@/lib/google-ads';

const MAX_IPS_PER_CAMPAIGN = 500;
const INACTIVE_DAYS = 30;

/**
 * Garantiza que la lista de IPs bloqueadas de una campaña no supere el límite
 * de 500 IPs impuesto por Google Ads.
 *
 * Algoritmo FIFO:
 * 1. Cuenta las IPs actualmente bloqueadas para la campaña dada.
 * 2. Si el conteo supera el límite, elimina las más antiguas (> 30 días primero,
 *    o las más antiguas en general si no hay ninguna con 30 días).
 * 3. Retorna la cantidad de IPs removidas.
 *
 * @param siteId     ID del sitio en la BD
 * @param campaignId ID de la campaña en Google Ads
 * @param userId     ID del usuario (para obtener el token de Google Ads)
 */
export async function enforceIPBlockLimit(
  siteId: string,
  campaignId: string,
  userId: string,
): Promise<number> {
  // Contar IPs activas bloqueadas para esta campaña
  const currentCount = await prisma.blockedIP.count({
    where: {
      siteId,
      campaignId,
      isActive: true,
    },
  });

  if (currentCount < MAX_IPS_PER_CAMPAIGN) {
    return 0; // No hay nada que limpiar
  }

  const toRemove = currentCount - MAX_IPS_PER_CAMPAIGN + 1; // Dejar espacio para 1 nueva IP

  // ── Prioridad 1: IPs inactivas por más de 30 días ─────────────────────────
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - INACTIVE_DAYS);

  const oldIPs = await prisma.blockedIP.findMany({
    where: {
      siteId,
      campaignId,
      isActive: true,
      blockedAt: { lt: cutoffDate },
    },
    orderBy: { blockedAt: 'asc' },
    take:    toRemove,
    select:  { id: true, ip: true, googleAdsCriterionId: true },
  });

  let removed = await removeIPBatch(oldIPs, siteId, campaignId, userId);

  // ── Prioridad 2: Si aún no es suficiente, eliminar las más antiguas ────────
  if (removed < toRemove) {
    const stillNeeded = toRemove - removed;
    const newerIPs = await prisma.blockedIP.findMany({
      where: {
        siteId,
        campaignId,
        isActive: true,
      },
      orderBy: { blockedAt: 'asc' },
      take:    stillNeeded,
      select:  { id: true, ip: true, googleAdsCriterionId: true },
    });

    removed += await removeIPBatch(newerIPs, siteId, campaignId, userId);
  }

  return removed;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function removeIPBatch(
  ips: Array<{ id: string; ip: string; googleAdsCriterionId: string | null }>,
  siteId: string,
  campaignId: string,
  userId: string,
): Promise<number> {
  if (ips.length === 0) return 0;

  let removed = 0;

  for (const entry of ips) {
    try {
      // 1. Eliminar de Google Ads si tenemos el criterionId
      if (entry.googleAdsCriterionId) {
        await removeIPBlock(userId, campaignId, entry.googleAdsCriterionId);
      }

      // 2. Marcar como inactiva en la BD (soft delete para auditoría)
      await prisma.blockedIP.update({
        where: { id: entry.id },
        data:  { isActive: false },
      });

      // 3. Actualizar contador de campaña
      await prisma.campaign.updateMany({
        where: { siteId, googleCampaignId: campaignId },
        data:  { blockedIPCount: { decrement: 1 } },
      });

      removed++;
    } catch (err) {
      console.error(`[FIFO] Failed to remove IP ${entry.ip}:`, err);
      // Continúa con el siguiente aunque uno falle
    }
  }

  return removed;
}
