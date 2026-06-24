/**
 * /api/product-reviews/[id]
 *
 *   PATCH  — moderate a review (status / notes / admin reply). Admin only.
 *   DELETE — permanently remove a review. Admin only.
 */

import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { moderateReview, deleteReview, STATUSES } from '@/lib/productReviews';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function PATCH(req, { params }) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    if (body.status && !STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400, headers: corsHeaders });
    }

    const ok = await moderateReview(
      id,
      { status: body.status, notes: body.notes, admin_reply: body.admin_reply },
      admin.email
    );
    if (!ok) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(req, { params }) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { id } = await params;
    const ok = await deleteReview(id);
    if (!ok) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
