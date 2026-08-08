import { NextRequest, NextResponse } from 'next/server';
import { exchangeCode, listCampaigns } from '@/lib/google-ads';
import { prisma } from '@/lib/prisma';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3004';

/**
 * Callback de OAuth 2.0 de Google Ads.
 * Intercambia el código por tokens y los almacena en la BD.
 *
 * El estado (state) contiene el userId de Firebase (pasado al iniciar el flujo).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code  = searchParams.get('code');
  const state = searchParams.get('state');  // userId (Firebase UID)
  const error = searchParams.get('error');

  // ── Manejo de errores / cancelación ───────────────────────────────────────
  if (error || !code) {
    const reason = error ?? 'no_code';
    return NextResponse.redirect(
      `${APP_URL}/dashboard/install?error=${encodeURIComponent(reason)}`,
    );
  }

  if (!state) {
    return NextResponse.redirect(
      `${APP_URL}/dashboard/install?error=missing_state`,
    );
  }

  try {
    // ── 1. Intercambiar código por tokens ──────────────────────────────────
    const { accessToken, refreshToken, expiresAt } = await exchangeCode(code);

    // ── 2. Obtener el Customer ID del usuario de Google Ads ────────────────
    // Para obtener el customerId necesitamos hacer una llamada a la API de Google Ads
    // usando el accessToken recién obtenido
    const customerId = await fetchCustomerId(accessToken);

    // ── 3. Guardar tokens en la BD ─────────────────────────────────────────
    await prisma.googleAdsToken.upsert({
      where:  { userId_customerId: { userId: state, customerId } },
      create: { userId: state, customerId, accessToken, refreshToken, expiresAt },
      update: { accessToken, refreshToken, expiresAt },
    });

    // ── 4. Asegurarse de que el usuario existe en la BD ────────────────────
    await prisma.user.upsert({
      where:  { id: state },
      create: { id: state, email: `pending-${state}@clics.app` },
      update: {},
    });

    // ── 5. Sincronizar campañas ────────────────────────────────────────────
    // Esto se hace en background, no bloqueamos el redirect
    syncCampaigns(state, customerId, accessToken).catch(console.error);

    return NextResponse.redirect(
      `${APP_URL}/dashboard/install?connected=1&customerId=${encodeURIComponent(customerId)}`,
    );
  } catch (err) {
    console.error('[google-ads/callback] Error:', err);
    return NextResponse.redirect(
      `${APP_URL}/dashboard/install?error=token_exchange_failed`,
    );
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchCustomerId(accessToken: string): Promise<string> {
  const res = await fetch(
    'https://googleads.googleapis.com/v17/customers:listAccessibleCustomers',
    {
      headers: {
        'Authorization':   `Bearer ${accessToken}`,
        'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
      },
    },
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch accessible customers: ${res.status}`);
  }

  const data = await res.json();
  const resourceNames: string[] = data.resourceNames ?? [];

  if (resourceNames.length === 0) {
    throw new Error('No accessible Google Ads customers found');
  }

  // Retorna el primer customer ID (sin el prefijo "customers/")
  return resourceNames[0].replace('customers/', '');
}

async function syncCampaigns(
  userId:      string,
  customerId:  string,
  accessToken: string,
): Promise<void> {
  try {
    const campaigns = await listCampaigns(userId, customerId);
    const site = await prisma.site.findFirst({ where: { userId } });
    if (!site) return;

    for (const c of campaigns) {
      await prisma.campaign.upsert({
        where:  { siteId_googleCampaignId: { siteId: site.id, googleCampaignId: c.id } },
        create: { siteId: site.id, googleCampaignId: c.id, name: c.name, status: c.status },
        update: { name: c.name, status: c.status, syncedAt: new Date() },
      });
    }
  } catch (err) {
    console.error('[syncCampaigns] Error:', err);
  }
}
