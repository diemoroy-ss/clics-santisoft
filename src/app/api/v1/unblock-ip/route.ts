import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/firebase';
import { resetIPClickCount } from '@/lib/redis';
import { removeIPBlock } from '@/lib/google-ads';

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { blockedIPId } = await req.json();
    if (!blockedIPId) {
      return NextResponse.json({ success: false, error: 'Missing blockedIPId' }, { status: 400 });
    }

    // Obtener la IP bloqueada y verificar que pertenece al usuario
    const blockedEntry = await prisma.blockedIP.findUnique({
      where:   { id: blockedIPId },
      include: { site: { select: { userId: true, googleAdsCustomerId: true } } },
    });

    if (!blockedEntry) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    if (blockedEntry.site.userId !== session.uid) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Desbloquear en Google Ads si corresponde
    if (
      blockedEntry.googleAdsCriterionId &&
      blockedEntry.campaignId &&
      blockedEntry.site.googleAdsCustomerId
    ) {
      try {
        await removeIPBlock(
          session.uid,
          blockedEntry.site.googleAdsCustomerId,
          blockedEntry.googleAdsCriterionId,
        );

        // Decrementar contador de la campaña
        await prisma.campaign.updateMany({
          where: {
            siteId:          blockedEntry.siteId,
            googleCampaignId: blockedEntry.campaignId,
          },
          data: { blockedIPCount: { decrement: 1 } },
        });
      } catch (adsError) {
        console.error('[unblock-ip] Google Ads error:', adsError);
        // Continuamos con el desbloqueo local aunque falle Google Ads
      }
    }

    // Marcar como inactiva en BD (soft delete)
    await prisma.blockedIP.update({
      where: { id: blockedIPId },
      data:  { isActive: false },
    });

    // Resetear el contador de Redis para que la IP pueda hacer clics normalmente
    await resetIPClickCount(blockedEntry.ip, blockedEntry.siteId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[/api/v1/unblock-ip] Error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
