import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { lookupIP, extractIP } from '@/lib/geoip';
import { evaluateFraud } from '@/lib/fraud-engine';
import { enforceIPBlockLimit } from '@/lib/ip-block-fifo';
import { addIPBlock } from '@/lib/google-ads';
import type { TrackPayload, FraudRuleConfig } from '@/types';

// Permitir requests de cualquier origen (los clientes instalan el tracker en sus sitios)
export const runtime = 'nodejs';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    // ── 1. Parse y validar payload ─────────────────────────────────────────
    const body = await req.json().catch(() => null);
    if (!body || !body.siteKey) {
      return NextResponse.json(
        { success: false, error: 'Missing siteKey' },
        { status: 400 },
      );
    }

    const payload: TrackPayload = {
      siteKey:      body.siteKey,
      gclid:        body.gclid,
      fbclid:       body.fbclid,
      userAgent:    body.userAgent ?? req.headers.get('user-agent') ?? undefined,
      fingerprint:  body.fingerprint,
      sessionTime:  typeof body.sessionTime  === 'number' ? body.sessionTime  : undefined,
      mouseEvents:  typeof body.mouseEvents  === 'number' ? body.mouseEvents  : undefined,
      referer:      body.referer ?? req.headers.get('referer') ?? undefined,
      screenRes:    body.screenRes,
      timestamp:    body.timestamp,
    };

    // ── 2. Obtener el sitio por siteKey ────────────────────────────────────
    const site = await prisma.site.findUnique({
      where:   { siteKey: payload.siteKey, isActive: true },
      include: { fraudRule: true },
    });

    if (!site) {
      return NextResponse.json(
        { success: false, error: 'Invalid siteKey' },
        { status: 404 },
      );
    }

    // ── 3. Extraer IP del cliente ──────────────────────────────────────────
    const ip = extractIP(req);

    // ── 4. GeoIP Lookup (en paralelo con la preparación de reglas) ─────────
    const [geo] = await Promise.all([lookupIP(ip)]);

    // ── 5. Preparar reglas (usar defaults si el sitio no tiene configuración) ─
    const rules: FraudRuleConfig = site.fraudRule
      ? {
          maxClicksPerIP:    site.fraudRule.maxClicksPerIP,
          timeWindowMinutes: site.fraudRule.timeWindowMinutes,
          blockVPN:          site.fraudRule.blockVPN,
          blockProxy:        site.fraudRule.blockProxy,
          blockDatacenter:   site.fraudRule.blockDatacenter,
          blockBots:         site.fraudRule.blockBots,
          minSessionSeconds: site.fraudRule.minSessionSeconds,
          minMouseEvents:    site.fraudRule.minMouseEvents,
          autoSyncGoogleAds: site.fraudRule.autoSyncGoogleAds,
          cpcEstimateUSD:    site.fraudRule.cpcEstimateUSD,
        }
      : {
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

    // ── 6. Evaluar fraude ──────────────────────────────────────────────────
    const result = await evaluateFraud({
      ip,
      siteId: site.id,
      payload,
      geo,
      rules,
    });

    // ── 7. Registrar el clic en la base de datos ───────────────────────────
    await prisma.clickLog.create({
      data: {
        siteId:      site.id,
        ip,
        gclid:       payload.gclid,
        fbclid:      payload.fbclid,
        userAgent:   payload.userAgent,
        fingerprint: payload.fingerprint,
        country:     geo.country,
        countryCode: geo.countryCode,
        city:        geo.city,
        isp:         geo.isp,
        isVPN:       geo.isVPN,
        isProxy:     geo.isProxy,
        isDatacenter:geo.isDatacenter,
        isFraud:     result.isFraud,
        fraudReason: result.reason as any,
        sessionTime: payload.sessionTime,
        mouseEvents: payload.mouseEvents,
        referer:     payload.referer,
        screenRes:   payload.screenRes,
      },
    });

    // ── 8. Si es fraude: bloquear IP ───────────────────────────────────────
    if (result.isFraud && result.reason) {
      await blockFraudulentIP({
        ip,
        siteId:     site.id,
        userId:     site.userId,
        reason:     result.reason as any,
        country:    geo.country,
        countryCode:geo.countryCode,
        isp:        geo.isp,
        rules,
        customerId: site.googleAdsCustomerId ?? null,
      });
    }

    return NextResponse.json(
      { success: true, fraud: result.isFraud, score: result.score },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      },
    );
  } catch (err) {
    console.error('[/api/v1/track] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } },
    );
  }
}

// ─── Internal helper ──────────────────────────────────────────────────────────

async function blockFraudulentIP(params: {
  ip:          string;
  siteId:      string;
  userId:      string;
  reason:      string;
  country:     string;
  countryCode: string;
  isp:         string;
  rules:       FraudRuleConfig;
  customerId:  string | null;
}) {
  const { ip, siteId, userId, reason, country, countryCode, isp, rules, customerId } = params;

  // Verificar si la IP ya está bloqueada para este sitio
  const existing = await prisma.blockedIP.findUnique({
    where: { siteId_ip: { siteId, ip } },
  });

  if (existing?.isActive) {
    return; // Ya está bloqueada, no hacer nada
  }

  let googleAdsCriterionId: string | null = null;
  let campaignId: string | null = null;

  // Sincronizar con Google Ads si está habilitado
  if (rules.autoSyncGoogleAds && customerId) {
    try {
      // Obtener la primera campaña activa del sitio
      const campaign = await prisma.campaign.findFirst({
        where: { siteId, status: 'ENABLED' },
        orderBy: { createdAt: 'asc' },
      });

      if (campaign) {
        const cid = campaign.googleCampaignId; // non-null local
        campaignId = cid;

        // Garantizar que no superamos el límite de 500 IPs
        await enforceIPBlockLimit(siteId, cid, userId);

        // Agregar IP a Google Ads
        const criterionName = await addIPBlock(
          userId,
          customerId,
          cid,
          ip,
        );
        googleAdsCriterionId = criterionName;

        // Actualizar contador de la campaña
        await prisma.campaign.update({
          where: { id: campaign.id },
          data:  { blockedIPCount: { increment: 1 }, syncedAt: new Date() },
        });
      }
    } catch (adsError) {
      console.error('[Track] Google Ads sync failed:', adsError);
      // No detener el bloqueo local si Google Ads falla
    }
  }

  // Insertar o reactivar en la BD
  await prisma.blockedIP.upsert({
    where:  { siteId_ip: { siteId, ip } },
    create: {
      siteId,
      ip,
      reason:               reason as any,
      country,
      countryCode,
      isp,
      googleAdsCriterionId,
      campaignId,
      isActive:             true,
    },
    update: {
      reason:               reason as any,
      googleAdsCriterionId,
      campaignId,
      isActive:             true,
      blockedAt:            new Date(),
    },
  });
}
