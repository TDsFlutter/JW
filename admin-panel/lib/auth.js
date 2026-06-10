import { query } from './db';

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
 * Verifies if the incoming request is authenticated as an Admin.
 * Supports both real Firebase JWTs and mock development tokens.
 * @param {Request} req - Next.js Request object.
 * @returns {Promise<object|boolean>} - User profile object if verified, false otherwise.
 */
export async function verifyAdminRequest(req) {
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.split(' ')[1];
  if (!token) return false;

  // 1. Mock token check (for offline local development)
  if (token === 'mock-admin-token') {
    return { uid: 'mock-admin-uid', email: 'admin@ella-jewelry.com', role: 'admin', displayName: 'Mock Admin' };
  }

  if (token.startsWith('mock_uid_') || token.startsWith('mock_google_') || token.startsWith('mock_apple_') || token.startsWith('mock-')) {
    // Check role in database for mock users
    try {
      const users = await query('SELECT * FROM users WHERE uid = ?', [token]);
      if (users.length > 0 && users[0].role === 'admin') {
        return users[0];
      }
    } catch (_) {
      // Ignore DB errors if not initialized yet
    }

    // Fallback if email has admin or if it's the specific admin
    if (token.includes('admin')) {
      return { uid: token, email: 'admin@ella-jewelry.com', role: 'admin', displayName: 'Admin' };
    }
    return false;
  }

  // 2. Real Firebase ID Token check (decoded JWT)
  const payload = decodeJwt(token);
  if (!payload) return false;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const now = Math.floor(Date.now() / 1000);

  // Validate token claims
  if (payload.exp < now) {
    console.warn('Firebase token expired');
    return false;
  }
  if (projectId && payload.aud !== projectId) {
    console.warn('Audience mismatch:', payload.aud, 'expected:', projectId);
    return false;
  }
  if (projectId && payload.iss !== `https://securetoken.google.com/${projectId}`) {
    console.warn('Issuer mismatch:', payload.iss);
    return false;
  }

  const uid = payload.user_id || payload.sub;
  if (!uid) return false;

  // Query MySQL database for user's role
  try {
    const users = await query('SELECT * FROM users WHERE uid = ?', [uid]);
    if (users.length > 0 && users[0].role === 'admin') {
      return users[0];
    }
  } catch (error) {
    console.error('Error querying user in auth helper:', error);
  }

  // Fallback check based on email
  const email = payload.email || '';
  if (email === 'trunaldungarani15@gmail.com' || email.toLowerCase().includes('admin')) {
    return { uid, email, role: 'admin', displayName: payload.name || email.split('@')[0] };
  }

  return false;
}
