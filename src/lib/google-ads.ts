import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

const CLIENT_ID     = process.env.GOOGLE_ADS_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET!;
const REDIRECT_URI  = process.env.GOOGLE_ADS_REDIRECT_URI!;
const DEV_TOKEN     = process.env.GOOGLE_ADS_DEVELOPER_TOKEN!;

const GOOGLE_ADS_API_BASE = 'https://googleads.googleapis.com/v17';
const SCOPES = ['https://www.googleapis.com/auth/adwords'];

// ─── OAuth 2.0 ────────────────────────────────────────────────────────────────

/**
 * Crea el cliente OAuth2 de Google Ads.
 */
export function createOAuthClient() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

/**
 * Genera la URL de autorización OAuth 2.0 para Google Ads.
 */
export function getAuthorizationUrl(state?: string): string {
  const oauth2Client = createOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type:  'offline',
    scope:        SCOPES,
    prompt:       'consent',   // Forzar para obtener refresh_token
    state:        state ?? '',
  });
}

/**
 * Intercambia el authorization code por access + refresh tokens.
 */
export async function exchangeCode(code: string): Promise<{
  accessToken:  string;
  refreshToken: string;
  expiresAt:    Date;
}> {
  const oauth2Client = createOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('No access_token or refresh_token in response');
  }

  const expiresAt = tokens.expiry_date
    ? new Date(tokens.expiry_date)
    : new Date(Date.now() + 3600 * 1000);

  return {
    accessToken:  tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt,
  };
}

// ─── Token Management ─────────────────────────────────────────────────────────

/**
 * Obtiene un access token válido para el usuario, refrescándolo si expiró.
 */
async function getValidAccessToken(
  userId: string,
  customerId: string,
): Promise<string> {
  const tokenRecord = await prisma.googleAdsToken.findUniqueOrThrow({
    where: { userId_customerId: { userId, customerId } },
  });

  // Si expira en menos de 5 minutos, refrescar
  const BUFFER_MS = 5 * 60 * 1000;
  if (tokenRecord.expiresAt.getTime() - Date.now() < BUFFER_MS) {
    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials({ refresh_token: tokenRecord.refreshToken });

    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token');
    }

    const expiresAt = credentials.expiry_date
      ? new Date(credentials.expiry_date)
      : new Date(Date.now() + 3600 * 1000);

    await prisma.googleAdsToken.update({
      where: { userId_customerId: { userId, customerId } },
      data:  {
        accessToken: credentials.access_token,
        expiresAt,
      },
    });

    return credentials.access_token;
  }

  return tokenRecord.accessToken;
}

// ─── Google Ads API Calls ─────────────────────────────────────────────────────

/**
 * Construye los headers para la API de Google Ads.
 */
async function buildHeaders(
  userId: string,
  customerId: string,
): Promise<HeadersInit> {
  const token = await getValidAccessToken(userId, customerId);
  return {
    'Authorization':            `Bearer ${token}`,
    'developer-token':          DEV_TOKEN,
    'login-customer-id':        customerId,
    'Content-Type':             'application/json',
  };
}

/**
 * Agrega una IP a la lista de exclusiones de una campaña en Google Ads.
 *
 * @returns El resource name del criterio creado (para poder eliminarlo luego)
 */
export async function addIPBlock(
  userId:     string,
  customerId: string,
  campaignId: string,
  ip:         string,
): Promise<string> {
  const headers = await buildHeaders(userId, customerId);

  const body = {
    operations: [
      {
        create: {
          campaign:  `customers/${customerId}/campaigns/${campaignId}`,
          criterion: {
            type:    'IP_BLOCK',
            ipBlock: { ipAddress: ip },
          },
          negative: true,
        },
      },
    ],
  };

  const res = await fetch(
    `${GOOGLE_ADS_API_BASE}/customers/${customerId}/campaignCriteria:mutate`,
    { method: 'POST', headers, body: JSON.stringify(body) },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = JSON.stringify(err);
    throw new Error(`Google Ads addIPBlock failed (${res.status}): ${msg}`);
  }

  const data = await res.json();
  const resourceName: string =
    data?.results?.[0]?.resourceName ?? '';

  return resourceName;
}

/**
 * Elimina un criterio de exclusión de IP de una campaña.
 *
 * @param criterionResourceName  Resource name del criterio (ej: customers/XXX/campaignCriteria/YYY~ZZZ)
 */
export async function removeIPBlock(
  userId:                string,
  customerId:            string,
  criterionResourceName: string,
): Promise<void> {
  const headers = await buildHeaders(userId, customerId);

  const body = {
    operations: [
      { remove: criterionResourceName },
    ],
  };

  const res = await fetch(
    `${GOOGLE_ADS_API_BASE}/customers/${customerId}/campaignCriteria:mutate`,
    { method: 'POST', headers, body: JSON.stringify(body) },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = JSON.stringify(err);
    throw new Error(`Google Ads removeIPBlock failed (${res.status}): ${msg}`);
  }
}

/**
 * Lista las campañas activas de un customer de Google Ads.
 */
export async function listCampaigns(
  userId:     string,
  customerId: string,
): Promise<Array<{ id: string; name: string; status: string }>> {
  const headers = await buildHeaders(userId, customerId);

  const query = `
    SELECT campaign.id, campaign.name, campaign.status
    FROM campaign
    WHERE campaign.status = 'ENABLED'
    ORDER BY campaign.name
    LIMIT 100
  `;

  const res = await fetch(
    `${GOOGLE_ADS_API_BASE}/customers/${customerId}/googleAds:searchStream`,
    {
      method:  'POST',
      headers,
      body:    JSON.stringify({ query }),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Google Ads listCampaigns failed: ${JSON.stringify(err)}`);
  }

  const data = await res.json();

  // searchStream devuelve un array de resultados en batches
  const campaigns: Array<{ id: string; name: string; status: string }> = [];
  for (const batch of data) {
    for (const row of batch.results ?? []) {
      campaigns.push({
        id:     String(row.campaign.id),
        name:   row.campaign.name,
        status: row.campaign.status,
      });
    }
  }

  return campaigns;
}
