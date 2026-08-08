import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { AuthSession } from '@/types';

// Inicializar Firebase Admin (server-side)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
      privateKey:  process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
  });
}

const adminAuth = getAuth();

/**
 * Verifica un Firebase ID token y retorna la sesión del usuario.
 * Lanza un error si el token es inválido o expirado.
 */
export async function verifyFirebaseToken(idToken: string): Promise<AuthSession> {
  const decoded = await adminAuth.verifyIdToken(idToken);
  return {
    uid:   decoded.uid,
    email: decoded.email ?? '',
    name:  decoded.name,
  };
}

/**
 * Extrae y verifica el token del header Authorization: Bearer <token>
 */
export async function getSessionFromRequest(
  req: Request,
): Promise<AuthSession | null> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    const token = authHeader.slice(7);
    return await verifyFirebaseToken(token);
  } catch {
    return null;
  }
}
