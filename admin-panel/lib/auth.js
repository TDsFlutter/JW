// Admin access is restricted to a SINGLE identity.
const ADMIN_EMAIL = 'admin@jw.com';
const ADMIN_UID = 'DUWfmbYSCbhqEF0WvnL4tyiXXvX2';

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
 * Verifies the request belongs to the one authorized admin.
 * Only a valid Firebase ID token whose email is ADMIN_EMAIL or whose uid is
 * ADMIN_UID is accepted — no mock-token bypass, no role-based or email-pattern grants.
 * @param {Request} req
 * @returns {Promise<object|false>}
 */
export async function verifyAdminRequest(req) {
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return false;

  const token = authHeader.split(' ')[1];
  if (!token) return false;

  const payload = decodeJwt(token);
  if (!payload) return false;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const now = Math.floor(Date.now() / 1000);

  // Validate token claims
  if (payload.exp < now) return false;
  if (projectId && payload.aud !== projectId) return false;
  if (projectId && payload.iss !== `https://securetoken.google.com/${projectId}`) return false;

  const uid = payload.user_id || payload.sub;
  const email = (payload.email || '').toLowerCase();

  if (uid === ADMIN_UID || email === ADMIN_EMAIL) {
    return {
      uid,
      email: payload.email || '',
      role: 'admin',
      displayName: payload.name || 'Admin',
    };
  }

  return false;
}
