/**
 * POST /api/reviews/sync
 *
 * Protected endpoint that triggers a manual sync of Google reviews.
 * Fetches from the Google Places API (New) and upserts into MongoDB.
 *
 * Authorization: Bearer <CRON_SECRET>
 */

import { NextResponse } from 'next/server';
import { fetchPlaceReviews } from '@/lib/googlePlacesApi';
import {
  upsertBusiness,
  upsertReviews,
  updateSyncMetadata,
  ensureIndexes,
} from '@/lib/googleReviews';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Allow up to 30s for API + DB ops

export async function POST(req) {
  try {
    // ---- Auth check ----
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: 'CRON_SECRET is not configured on the server.' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized. Provide a valid Bearer token.' },
        { status: 401 }
      );
    }

    // ---- Env validation ----
    const placeId = process.env.GOOGLE_PLACE_ID;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!placeId || !apiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_PLACE_ID and GOOGLE_MAPS_API_KEY must be set.' },
        { status: 500 }
      );
    }

    await ensureIndexes();

    // ---- Fetch from Google ----
    const { business, reviews } = await fetchPlaceReviews(placeId, apiKey);

    // ---- Upsert into MongoDB ----
    await upsertBusiness(business);
    const upsertedCount = await upsertReviews(placeId, reviews);
    await updateSyncMetadata(placeId, 'success', reviews.length);

    return NextResponse.json({
      success: true,
      message: `Synced ${reviews.length} reviews for "${business.businessName}".`,
      business: {
        name: business.businessName,
        rating: business.rating,
        totalReviews: business.totalReviews,
      },
      reviewsSynced: reviews.length,
      documentsUpserted: upsertedCount,
    });
  } catch (error) {
    console.error('[POST /api/reviews/sync] Error:', error);

    // Try to record the error in sync metadata
    try {
      const placeId = process.env.GOOGLE_PLACE_ID;
      if (placeId) {
        await updateSyncMetadata(placeId, 'error', 0, error.message);
      }
    } catch (_) {
      // Don't let metadata logging fail the response
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Sync failed.',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
