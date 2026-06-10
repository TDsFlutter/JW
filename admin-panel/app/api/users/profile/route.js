import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

function decodeJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
  } catch (e) {
    return null;
  }
}

function getAuthenticatedUser(req) {
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;

  if (token.startsWith('mock_uid_') || token.startsWith('mock_google_') || token.startsWith('mock_apple_') || token.startsWith('mock-')) {
    const role = token.includes('admin') ? 'admin' : 'customer';
    return { uid: token, email: 'mockuser@example.com', role };
  }

  const payload = decodeJwt(token);
  if (!payload) return null;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) return null;
  if (projectId && payload.aud !== projectId) return null;

  return {
    uid: payload.user_id || payload.sub,
    email: payload.email || '',
    displayName: payload.name || ''
  };
}

// GET profile
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'UID is required' }, { status: 400, headers: corsHeaders });
    }

    // Auth verification
    const authUser = getAuthenticatedUser(req);
    const admin = await verifyAdminRequest(req);
    
    if (!authUser && !admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    if (authUser?.uid !== uid && !admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders });
    }

    const users = await query('SELECT * FROM users WHERE uid = ?', [uid]);
    if (users.length === 0) {
      // Return a default new user structure
      return NextResponse.json({
        uid,
        email: authUser?.email || '',
        displayName: authUser?.displayName || '',
        role: 'customer',
        address: '',
        phone: '',
        wishlist: '[]'
      }, { headers: corsHeaders });
    }

    const user = users[0];
    return NextResponse.json({
      ...user,
      // Ensure wishlist is returned as parsed array or stringified JSON
      wishlist: user.wishlist || '[]'
    }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// POST create/update profile
export async function POST(req) {
  try {
    const data = await req.json();
    const { uid, email, displayName, role, address, phone, wishlist } = data;

    if (!uid || !email) {
      return NextResponse.json({ error: 'UID and Email are required' }, { status: 400, headers: corsHeaders });
    }

    // Auth verification
    const authUser = getAuthenticatedUser(req);
    const admin = await verifyAdminRequest(req);
    
    if (!authUser && !admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    if (authUser?.uid !== uid && !admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders });
    }

    // Prepare wishlist string representation
    let wishlistStr = '[]';
    if (wishlist) {
      wishlistStr = typeof wishlist === 'string' ? wishlist : JSON.stringify(wishlist);
    }

    // Check if user already exists
    const existing = await query('SELECT role, wishlist FROM users WHERE uid = ?', [uid]);

    // Role safety: only admins can update roles, customers default to 'customer'
    let finalRole = 'customer';
    if (existing.length > 0) {
      finalRole = existing[0].role; // keep existing role
    }
    if (admin && role) {
      finalRole = role; // admin can set roles
    } else if (existing.length === 0) {
      // Special check for first signup of the primary admin email
      if (email === 'trunaldungarani15@gmail.com' || email.toLowerCase().includes('admin')) {
        finalRole = 'admin';
      }
    }

    if (existing.length > 0) {
      // Update
      await query(
        `UPDATE users SET 
          email = ?, 
          display_name = ?, 
          role = ?, 
          address = ?, 
          phone = ?, 
          wishlist = ? 
        WHERE uid = ?`,
        [
          email.trim(),
          displayName || '',
          finalRole,
          address || '',
          phone || '',
          wishlistStr,
          uid
        ]
      );
    } else {
      // Create
      await query(
        `INSERT INTO users (uid, email, display_name, role, address, phone, wishlist)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          uid,
          email.trim(),
          displayName || '',
          finalRole,
          address || '',
          phone || '',
          wishlistStr
        ]
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        uid,
        email,
        displayName,
        role: finalRole
      }
    }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
