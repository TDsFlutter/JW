/**
 * /api/products/[slug]/reviews/[id]
 *
 *   PUT    — authenticated owner edits their review (resets it to `pending`).
 *   DELETE — authenticated owner removes their review.
 */

import { NextResponse } from 'next/server';
import { verifyUser } from '@/lib/auth';
import { getReviewById, updateOwnReview, deleteOwnReview } from '@/lib/productReviews';

export const dynamic = 'force-dynamic';

const TITLE_MIN = 3;
const TITLE_MAX = 100;
const BODY_MIN = 10;
const BODY_MAX = 2000;

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const user = await verifyUser(req);
    if (!user) {
      return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
    }

    const existing = await getReviewById(id);
    if (!existing) return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    if (existing.user_id !== user.uid) {
      return NextResponse.json({ error: 'You can only edit your own review.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const fields = {};

    if (body.rating !== undefined) {
      const rating = parseInt(body.rating, 10);
      if (!(rating >= 1 && rating <= 5)) {
        return NextResponse.json({ error: 'Rating must be between 1 and 5.' }, { status: 400 });
      }
      fields.rating = rating;
    }
    if (body.title !== undefined) {
      const title = (body.title || '').trim();
      if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
        return NextResponse.json({ error: `Title must be ${TITLE_MIN}–${TITLE_MAX} characters.` }, { status: 400 });
      }
      fields.title = title;
    }
    if (body.body !== undefined || body.text !== undefined) {
      const text = (body.body ?? body.text ?? '').trim();
      if (text.length < BODY_MIN || text.length > BODY_MAX) {
        return NextResponse.json({ error: `Review must be ${BODY_MIN}–${BODY_MAX} characters.` }, { status: 400 });
      }
      fields.body = text;
    }

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
    }

    await updateOwnReview(id, user.uid, fields);
    return NextResponse.json({
      success: true,
      status: 'pending',
      message: 'Your review was updated and will reappear once re-approved.',
    });
  } catch (error) {
    console.error('[PUT /api/products/[slug]/reviews/[id]] Error:', error);
    return NextResponse.json({ error: 'Failed to update review.', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const user = await verifyUser(req);
    if (!user) {
      return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
    }

    const existing = await getReviewById(id);
    if (!existing) return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    if (existing.user_id !== user.uid) {
      return NextResponse.json({ error: 'You can only delete your own review.' }, { status: 403 });
    }

    await deleteOwnReview(id, user.uid);
    return NextResponse.json({ success: true, message: 'Review deleted.' });
  } catch (error) {
    console.error('[DELETE /api/products/[slug]/reviews/[id]] Error:', error);
    return NextResponse.json({ error: 'Failed to delete review.', details: error.message }, { status: 500 });
  }
}
