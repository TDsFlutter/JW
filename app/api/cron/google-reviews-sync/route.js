/**
 * GET /api/cron/google-reviews-sync
 *
 * Vercel Cron endpoint — triggered automatically by the schedule in vercel.json.
 * Vercel sends the CRON_SECRET in the Authorization header.
 *
 * Includes a de-duplication guard: skips if the last successful sync was < 6 hours ago.
 */

import { NextResponse } from 'next/server';
import { fetchPlaceReviews } from '@/lib/googlePlacesApi';
import {
  upsertBusiness,
  upsertReviews,
  getSyncMetadata,
  updateSyncMetadata,
  ensureIndexes,
} from '@/lib/googleReviews';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export async function GET(req) {
  try {
    // ---- Auth check ----
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: 'CRON_SECRET is not configured.' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return new NextResponse('Unauthorized', { status: 401 });
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

    // ---- De-duplication guard ----
    const lastSync = await getSyncMetadata(placeId);
    if (
      lastSync?.status === 'success' &&
      lastSync?.lastSyncAt &&
      Date.now() - new Date(lastSync.lastSyncAt).getTime() < SIX_HOURS_MS
    ) {
      return NextResponse.json({
        success: true,
        skipped: true,
        message: 'Skipped — last successful sync was less than 6 hours ago.',
        lastSyncAt: lastSync.lastSyncAt,
      });
    }

    // ---- Fetch from Google ----
    const { business, reviews } = await fetchPlaceReviews(placeId, apiKey);

    // ---- Upsert into MongoDB ----
    await upsertBusiness(business);
    const upsertedCount = await upsertReviews(placeId, reviews);
    await updateSyncMetadata(placeId, 'success', reviews.length);

    console.log(
      `[cron/google-reviews-sync] Synced ${reviews.length} reviews for "${business.businessName}".`
    );

    return NextResponse.json({
      success: true,
      skipped: false,
      message: `Synced ${reviews.length} reviews.`,
      business: business.businessName,
      reviewsSynced: reviews.length,
      documentsUpserted: upsertedCount,
    });
  } catch (error) {
    console.error('[cron/google-reviews-sync] Error:', error);

    try {
      const placeId = process.env.GOOGLE_PLACE_ID;
      if (placeId) {
        await updateSyncMetadata(placeId, 'error', 0, error.message);
      }
    } catch (_) {
      // Don't let metadata logging fail the response
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
