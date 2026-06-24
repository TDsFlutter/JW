/**
 * POST /api/product-reviews/bulk
 *
 * Admin-only bulk moderation. Body: { ids: string[], action: 'approve'|'reject'|'delete' }.
 */

import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { bulkAction } from '@/lib/productReviews';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { ids, action } = await req.json().catch(() => ({}));
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No reviews selected' }, { status: 400, headers: corsHeaders });
    }
    if (!['approve', 'reject', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400, headers: corsHeaders });
    }

    const { modified } = await bulkAction(ids, action, admin.email);
    return NextResponse.json({ success: true, modified }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
