import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/firebase';
import type { DashboardMetrics, ClicksByDay, TopFraudReason } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const siteId = req.nextUrl.searchParams.get('siteId');

    // Obtener el sitio del usuario (primer sitio si no se especifica siteId)
    const site = await prisma.site.findFirst({
      where: siteId
        ? { id: siteId, userId: session.uid }
        : { userId: session.uid, isActive: true },
      include: { fraudRule: { select: { cpcEstimateUSD: true } } },
    });

    if (!site) {
      return NextResponse.json({ success: false, error: 'No site found' }, { status: 404 });
    }

    const now   = new Date();
    const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 días atrás

    // Ejecutar todas las queries en paralelo
    const [
      totalClicks,
      fraudClicks,
      blockedIPsCount,
      lastBlockedIP,
      clicksByDay,
      topFraudReasons,
    ] = await Promise.all([
      // Total de clics en los últimos 7 días
      prisma.clickLog.count({
        where: { siteId: site.id, timestamp: { gte: since } },
      }),
      // Clics fraudulentos en los últimos 7 días
      prisma.clickLog.count({
        where: { siteId: site.id, isFraud: true, timestamp: { gte: since } },
      }),
      // IPs bloqueadas activas
      prisma.blockedIP.count({
        where: { siteId: site.id, isActive: true },
      }),
      // Última IP bloqueada
      prisma.blockedIP.findFirst({
        where:   { siteId: site.id, isActive: true },
        orderBy: { blockedAt: 'desc' },
        select:  { ip: true, country: true, countryCode: true, reason: true, blockedAt: true },
      }),
      // Clics agrupados por día (últimos 7 días)
      getClicksByDay(site.id, since),
      // Principales motivos de fraude
      getTopFraudReasons(site.id, since),
    ]);

    const cpcEstimate = site.fraudRule?.cpcEstimateUSD ?? 1.5;
    const moneySaved  = Math.round(fraudClicks * cpcEstimate);
    const fraudRate   = totalClicks > 0 ? (fraudClicks / totalClicks) * 100 : 0;

    const metrics: DashboardMetrics = {
      totalClicks,
      fraudClicks,
      fraudRate:       Math.round(fraudRate * 10) / 10,
      moneySaved,
      blockedIPsCount,
      lastBlockedIP:   lastBlockedIP
        ? {
            ip:          lastBlockedIP.ip,
            country:     lastBlockedIP.country     ?? 'Unknown',
            countryCode: lastBlockedIP.countryCode ?? 'XX',
            reason:      lastBlockedIP.reason as any,
            blockedAt:   lastBlockedIP.blockedAt.toISOString(),
          }
        : null,
      clicksByDay,
      topFraudReasons,
    };

    return NextResponse.json({ success: true, data: metrics });
  } catch (err) {
    console.error('[/api/v1/dashboard] Error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getClicksByDay(siteId: string, since: Date): Promise<ClicksByDay[]> {
  // Usamos rawQuery para el GROUP BY por fecha (Prisma no tiene soporte nativo)
  const rows = await prisma.$queryRaw<
    Array<{ date: string; total: bigint; fraud: bigint }>
  >`
    SELECT
      TO_CHAR(timestamp, 'YYYY-MM-DD') AS date,
      COUNT(*)                         AS total,
      COUNT(*) FILTER (WHERE "isFraud") AS fraud
    FROM "ClickLog"
    WHERE "siteId" = ${siteId}
      AND timestamp >= ${since}
    GROUP BY date
    ORDER BY date ASC
  `;

  return rows.map((row: { date: string; total: bigint; fraud: bigint }) => ({
    date:        row.date,
    total:       Number(row.total),
    fraud:       Number(row.fraud),
    legitimate:  Number(row.total) - Number(row.fraud),
  }));
}

async function getTopFraudReasons(siteId: string, since: Date): Promise<TopFraudReason[]> {
  const rows = await prisma.$queryRaw<
    Array<{ reason: string; count: bigint }>
  >`
    SELECT "fraudReason" AS reason, COUNT(*) AS count
    FROM "ClickLog"
    WHERE "siteId" = ${siteId}
      AND "isFraud" = true
      AND "fraudReason" IS NOT NULL
      AND timestamp >= ${since}
    GROUP BY "fraudReason"
    ORDER BY count DESC
    LIMIT 5
  `;

  return rows.map((row: { reason: string; count: bigint }) => ({
    reason: row.reason as any,
    count:  Number(row.count),
  }));
}
