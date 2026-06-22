/**
 * Google Reviews — MongoDB data-access layer.
 *
 * Three collections:
 *   - google_businesses    → cached business info (name, rating, review count)
 *   - google_reviews       → individual review documents
 *   - google_sync_metadata → last sync timestamp & status
 *
 * All queries go through this module so indexes and collection names are
 * defined in a single place.
 *
 * @module lib/googleReviews
 */

import { getDb } from './mongodb';

// Collection names
const COL_BUSINESSES = 'google_businesses';
const COL_REVIEWS = 'google_reviews';
const COL_SYNC = 'google_sync_metadata';

// ---------------------------------------------------------------------------
// Index creation (idempotent — safe to call on every cold start)
// ---------------------------------------------------------------------------

let _indexesCreated = false;

export async function ensureIndexes() {
  if (_indexesCreated) return;

  const db = await getDb();

  await Promise.all([
    db.collection(COL_BUSINESSES).createIndex(
      { placeId: 1 },
      { unique: true, background: true }
    ),
    db.collection(COL_REVIEWS).createIndex(
      { placeId: 1, authorName: 1 },
      { unique: true, background: true }
    ),
    db.collection(COL_REVIEWS).createIndex(
      { placeId: 1, publishTime: -1 },
      { background: true }
    ),
    db.collection(COL_SYNC).createIndex(
      { placeId: 1 },
      { unique: true, background: true }
    ),
  ]);

  _indexesCreated = true;
}

// ---------------------------------------------------------------------------
// Business helpers
// ---------------------------------------------------------------------------

/**
 * Get cached business information for a place.
 * @param {string} placeId
 * @returns {Promise<object|null>}
 */
export async function getBusinessInfo(placeId) {
  const db = await getDb();
  return db.collection(COL_BUSINESSES).findOne(
    { placeId },
    { projection: { _id: 0 } }
  );
}

/**
 * Upsert business information.
 * @param {{ placeId: string, businessName: string, rating: number, totalReviews: number, googleMapsUri: string }} data
 */
export async function upsertBusiness(data) {
  const db = await getDb();
  await db.collection(COL_BUSINESSES).updateOne(
    { placeId: data.placeId },
    {
      $set: {
        ...data,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}

// ---------------------------------------------------------------------------
// Review helpers
// ---------------------------------------------------------------------------

/**
 * Get cached reviews for a place, sorted by publishTime descending.
 * @param {string} placeId
 * @param {number} [limit=5]
 * @returns {Promise<object[]>}
 */
export async function getReviews(placeId, limit = 5) {
  const db = await getDb();
  return db
    .collection(COL_REVIEWS)
    .find({ placeId }, { projection: { _id: 0 } })
    .sort({ publishTime: -1 })
    .limit(Math.min(limit, 10))
    .toArray();
}

/**
 * Bulk-upsert reviews for a place.
 * Each review is keyed on (placeId + authorName) to prevent duplicates.
 * @param {string} placeId
 * @param {object[]} reviews
 * @returns {Promise<number>}  — count of upserted documents
 */
export async function upsertReviews(placeId, reviews) {
  if (!reviews || reviews.length === 0) return 0;

  const db = await getDb();
  const ops = reviews.map((r) => ({
    updateOne: {
      filter: { placeId, authorName: r.authorName },
      update: {
        $set: {
          ...r,
          placeId,
          updatedAt: new Date(),
        },
      },
      upsert: true,
    },
  }));

  const result = await db.collection(COL_REVIEWS).bulkWrite(ops, { ordered: false });
  return result.upsertedCount + result.modifiedCount;
}

// ---------------------------------------------------------------------------
// Sync metadata helpers
// ---------------------------------------------------------------------------

/**
 * Get the last sync metadata for a place.
 * @param {string} placeId
 * @returns {Promise<object|null>}
 */
export async function getSyncMetadata(placeId) {
  const db = await getDb();
  return db.collection(COL_SYNC).findOne(
    { placeId },
    { projection: { _id: 0 } }
  );
}

/**
 * Update the sync metadata after a sync attempt.
 * @param {string} placeId
 * @param {"success"|"error"} status
 * @param {number} reviewCount
 * @param {string|null} [errorMessage=null]
 */
export async function updateSyncMetadata(placeId, status, reviewCount = 0, errorMessage = null) {
  const db = await getDb();
  await db.collection(COL_SYNC).updateOne(
    { placeId },
    {
      $set: {
        placeId,
        lastSyncAt: new Date(),
        status,
        reviewCount,
        errorMessage,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}
