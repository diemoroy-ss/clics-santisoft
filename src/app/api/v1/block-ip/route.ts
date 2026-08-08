import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/firebase';
import { lookupIP } from '@/lib/geoip';
import { addIPBlock } from '@/lib/google-ads';
import { enforceIPBlockLimit } from '@/lib/ip-block-fifo';

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { ip, siteId, campaignId } = await req.json();

    if (!ip || !siteId) {
      return NextResponse.json(
        { success: false, error: 'Missing ip or siteId' },
        { status: 400 },
      );
    }

    // Validar formato de IP básico
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    if (!ipPattern.test(ip)) {
      return NextResponse.json({ success: false, error: 'Invalid IP format' }, { status: 400 });
    }

    // Verificar que el sitio pertenece al usuario
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site || site.userId !== session.uid) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Verificar si ya está bloqueada
    const existing = await prisma.blockedIP.findUnique({
      where: { siteId_ip: { siteId, ip } },
    });

    if (existing?.isActive) {
      return NextResponse.json(
        { success: false, error: 'IP already blocked' },
        { status: 409 },
      );
    }

    // Obtener info geográfica
    const geo = await lookupIP(ip);

    let googleAdsCriterionId: string | null = null;
    let resolvedCampaignId = campaignId ?? null;

    // Sincronizar con Google Ads si hay customerId y campaignId
    if (site.googleAdsCustomerId && resolvedCampaignId) {
      try {
        await enforceIPBlockLimit(siteId, resolvedCampaignId, session.uid);
        googleAdsCriterionId = await addIPBlock(
          session.uid,
          site.googleAdsCustomerId,
          resolvedCampaignId,
          ip,
        );
        await prisma.campaign.updateMany({
          where: { siteId, googleCampaignId: resolvedCampaignId },
          data:  { blockedIPCount: { increment: 1 }, syncedAt: new Date() },
        });
      } catch (adsErr) {
        console.error('[block-ip] Google Ads error:', adsErr);
      }
    }

    // Crear o reactivar el bloqueo en BD
    const blocked = await prisma.blockedIP.upsert({
      where:  { siteId_ip: { siteId, ip } },
      create: {
        siteId,
        ip,
        reason:               'MANUAL',
        country:              geo.country,
        countryCode:          geo.countryCode,
        isp:                  geo.isp,
        googleAdsCriterionId,
        campaignId:           resolvedCampaignId,
        isActive:             true,
      },
      update: {
        reason:               'MANUAL',
        country:              geo.country,
        countryCode:          geo.countryCode,
        isp:                  geo.isp,
        googleAdsCriterionId,
        campaignId:           resolvedCampaignId,
        isActive:             true,
        blockedAt:            new Date(),
      },
    });

    return NextResponse.json({ success: true, data: blocked });
  } catch (err) {
    console.error('[/api/v1/block-ip] Error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
