import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/google-ads';

/**
 * Inicia el flujo OAuth 2.0 de Google Ads.
 * Redirige al usuario a la pantalla de consentimiento de Google.
 */
export async function GET(req: NextRequest) {
  try {
    // Obtener el siteId del query param para pasarlo como state
    const siteId = req.nextUrl.searchParams.get('siteId') ?? '';

    const authUrl = getAuthorizationUrl(siteId);

    return NextResponse.redirect(authUrl);
  } catch (err) {
    console.error('[google-ads/connect] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to generate authorization URL' },
      { status: 500 },
    );
  }
}
