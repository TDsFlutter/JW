/**
 * POST /api/products/[slug]/reviews/[id]/helpful
 *
 * Authenticated; registers a one-per-user "helpful" vote on an approved review.
 */

import { NextResponse } from 'next/server';
import { verifyUser } from '@/lib/auth';
import { markHelpful } from '@/lib/productReviews';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const user = await verifyUser(req);
    if (!user) {
      return NextResponse.json({ error: 'You must be signed in to vote.' }, { status: 401 });
    }

    const count = await markHelpful(id, user.uid);
    if (count === null) {
      return NextResponse.json({ error: 'Already counted or review unavailable.' }, { status: 409 });
    }

    return NextResponse.json({ success: true, helpful_count: count });
  } catch (error) {
    console.error('[POST /api/products/[slug]/reviews/[id]/helpful] Error:', error);
    return NextResponse.json({ error: 'Failed to record vote.', details: error.message }, { status: 500 });
  }
}
