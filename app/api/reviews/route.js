/**
 * GET /api/reviews
 *
 * Public, read-only endpoint that serves Google reviews from MongoDB.
 * Never calls the Google API directly — all data is pre-synced.
 *
 * Query params:
 *   ?limit=5  — number of reviews to return (default 5, max 10)
 */

import { NextResponse } from 'next/server';
import {
  getBusinessInfo,
  getReviews,
  getSyncMetadata,
  ensureIndexes,
} from '@/lib/googleReviews';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || '5', 10) || 5, 1),
      10
    );

    const placeId = process.env.GOOGLE_PLACE_ID;
    if (!placeId) {
      return NextResponse.json(
        { error: 'GOOGLE_PLACE_ID is not configured.' },
        { status: 500 }
      );
    }

    await ensureIndexes();

    const [business, reviews, syncMeta] = await Promise.all([
      getBusinessInfo(placeId),
      getReviews(placeId, limit),
      getSyncMetadata(placeId),
    ]);

    // If no data exists yet, return an empty but valid response
    if (!business) {
      return NextResponse.json({
        business: null,
        reviews: [],
        lastSync: null,
        message: 'No reviews synced yet. Trigger a sync via POST /api/reviews/sync.',
      });
    }

    return NextResponse.json({
      business,
      reviews,
      lastSync: syncMeta
        ? {
            lastSyncAt: syncMeta.lastSyncAt,
            status: syncMeta.status,
            reviewCount: syncMeta.reviewCount,
          }
        : null,
    });
  } catch (error) {
    console.error('[GET /api/reviews] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews.', details: error.message },
      { status: 500 }
    );
  }
}
