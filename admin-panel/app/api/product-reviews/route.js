/**
 * GET /api/product-reviews
 *
 * Admin-only moderation list of customer product reviews. Filterable by status,
 * product, rating and free-text search; paginated. Returns the pending count so
 * the dashboard can badge the Reviews tab.
 *
 * (Unrelated to the storefront's Google Places reviews.)
 */

import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { listReviews } from '@/lib/productReviews';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '25', 10) || 25, 1), 100);

    const result = await listReviews({
      status: searchParams.get('status') || '',
      product: searchParams.get('product') || '',
      rating: searchParams.get('rating') || '',
      search: searchParams.get('search') || '',
      page,
      limit,
    });

    return NextResponse.json(result, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
