/**
 * Storefront server-side identity verification.
 *
 * Mirrors the admin panel's `lib/auth.js` claim-decode approach but accepts ANY
 * authenticated customer (not just the single admin). It validates the Firebase
 * ID token's standard claims (exp / aud / iss). When Firebase is NOT configured
 * (local mock mode), the storefront sends the raw uid as the bearer token, so we
 * accept that too — but only when no project id is configured.
 *
 * NOTE: this decodes the JWT and validates its claims; it does NOT verify the
 * cryptographic signature. For production-grade trust, swap `decodeJwt` for
 * `firebase-admin`'s `verifyIdToken`, which checks the token against Google's
 * public keys. The function contract below stays the same.
 *
 * @module lib/auth
 */

function decodeJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Resolve the authenticated customer from the request, or null if unauthenticated.
 * @param {Request} req
 * @returns {Promise<{ uid: string, email: string, name: string }|null>}
 */
export async function verifyUser(req) {
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const payload = decodeJwt(token);

  // Mock mode: Firebase isn't configured and the bearer token is a raw uid.
  if (!payload) {
    if (!projectId) return { uid: token, email: '', name: '' };
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) return null;
  if (projectId && payload.aud && payload.aud !== projectId) return null;
  if (
    projectId &&
    payload.iss &&
    payload.iss !== `https://securetoken.google.com/${projectId}`
  ) {
    return null;
  }

  const uid = payload.user_id || payload.sub;
  if (!uid) return null;

  return {
    uid,
    email: payload.email || '',
    name: payload.name || '',
  };
}
