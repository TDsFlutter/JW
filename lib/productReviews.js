/**
 * Product Reviews — storefront MongoDB data-access layer.
 *
 * One collection: `product_reviews`. Each document is a customer's rating + text
 * for a single product, with a moderation `status`. Only `approved` reviews are
 * ever served publicly. Rating roll-ups (avg / count / breakdown) are denormalized
 * onto the matching `products` document so product cards and listings never have
 * to aggregate reviews at read time.
 *
 * All queries go through this module so the collection name, projection (to keep
 * PII out of public responses) and indexes live in one place — mirroring
 * `lib/googleReviews.js`.
 *
 * @module lib/productReviews
 */

import { getDb } from './mongodb';

const COL = 'product_reviews';

// Fields that must NEVER leave the server in a public response.
const PUBLIC_PROJECTION = {
  author_email: 0,
  user_id: 0,
  meta: 0,
  helpful_by: 0,
  moderation: 0,
};

const SORT_MAP = {
  recent: { created_at: -1 },
  helpful: { helpful_count: -1, created_at: -1 },
  rating_high: { rating: -1, created_at: -1 },
  rating_low: { rating: 1, created_at: -1 },
};

const EMPTY_BREAKDOWN = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

// ---------------------------------------------------------------------------
// Index creation (idempotent — safe to call on every cold start)
// ---------------------------------------------------------------------------

let _indexesCreated = false;

export async function ensureIndexes() {
  if (_indexesCreated) return;
  try {
    const db = await getDb();
    await Promise.all([
      // Product page listing (approved reviews, newest first)
      db.collection(COL).createIndex(
        { product_id: 1, status: 1, created_at: -1 },
        { background: true }
      ),
      // Admin moderation queue
      db.collection(COL).createIndex(
        { status: 1, created_at: -1 },
        { background: true }
      ),
      // One review per user per product — structural anti-duplicate guard
      db.collection(COL).createIndex(
        { product_id: 1, user_id: 1 },
        { unique: true, background: true }
      ),
    ]);
    _indexesCreated = true;
  } catch (err) {
    // Never let index setup break the reviews endpoints — log and continue.
    console.warn('[productReviews] ensureIndexes skipped:', err?.message || err);
  }
}

// ---------------------------------------------------------------------------
// Product lookup helper (slug / sku / numeric id) — matches the products API
// ---------------------------------------------------------------------------

export async function findProduct(slug) {
  const db = await getDb();
  const or = [{ slug }, { sku: slug }];
  if (!isNaN(slug)) or.push({ id: parseInt(slug, 10) });
  return db.collection('products').findOne({ $or: or });
}

// ---------------------------------------------------------------------------
// Public reads
// ---------------------------------------------------------------------------

/**
 * Paginated list of APPROVED reviews for a product.
 * @returns {Promise<{ reviews: object[], total: number }>}
 */
export async function getApprovedReviews(productId, { page = 1, limit = 10, sort = 'recent', rating = null } = {}) {
  const db = await getDb();
  const match = { product_id: productId, status: 'approved' };
  if (rating) match.rating = rating;

  const sortSpec = SORT_MAP[sort] || SORT_MAP.recent;
  const skip = Math.max(0, (page - 1) * limit);

  const [reviews, total] = await Promise.all([
    db
      .collection(COL)
      .find(match, { projection: PUBLIC_PROJECTION })
      .sort(sortSpec)
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection(COL).countDocuments(match),
  ]);

  return { reviews, total };
}

/**
 * Rating summary for a product. Reads the denormalized roll-up from the product
 * document, falling back to a live aggregation if it hasn't been computed yet.
 * @returns {Promise<{ average: number, count: number, breakdown: object }>}
 */
export async function getReviewSummary(productId) {
  const db = await getDb();
  const product = await db
    .collection('products')
    .findOne({ id: productId }, { projection: { rating_avg: 1, rating_count: 1, rating_breakdown: 1 } });

  if (product && typeof product.rating_count === 'number') {
    return {
      average: product.rating_avg || 0,
      count: product.rating_count || 0,
      breakdown: { ...EMPTY_BREAKDOWN, ...(product.rating_breakdown || {}) },
    };
  }
  return recomputeProductAggregates(productId);
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/**
 * Insert a new review. Throws a MongoServerError (code 11000) if the user has
 * already reviewed the product (enforced by the unique index).
 */
export async function createReview(doc) {
  const db = await getDb();
  const now = new Date();
  const review = {
    product_id: doc.product_id,
    product_slug: doc.product_slug,
    product_name: doc.product_name || '',
    user_id: doc.user_id,
    author_name: doc.author_name,
    author_email: doc.author_email || '',
    rating: doc.rating,
    title: doc.title,
    body: doc.body,
    status: doc.status || 'pending',
    verified_purchase: Boolean(doc.verified_purchase),
    helpful_count: 0,
    helpful_by: [],
    admin_reply: null,
    moderation: { moderatedBy: null, moderatedAt: null, notes: null },
    meta: { ipHash: doc.ipHash || null, userAgent: doc.userAgent || null },
    created_at: now,
    updated_at: now,
  };
  const res = await db.collection(COL).insertOne(review);
  // If the review was auto-approved, refresh the product roll-up immediately.
  if (review.status === 'approved') await recomputeProductAggregates(review.product_id);
  return { _id: res.insertedId, ...review };
}

export async function getReviewById(id) {
  const db = await getDb();
  const { ObjectId } = await import('mongodb');
  if (!ObjectId.isValid(id)) return null;
  return db.collection(COL).findOne({ _id: new ObjectId(id) });
}

/**
 * The current user's own review for a product (ANY status, so they can see a
 * pending/rejected one). Excludes internal moderation notes / PII of others.
 */
export async function getMyReview(productId, userId) {
  if (!userId) return null;
  const db = await getDb();
  return db.collection(COL).findOne(
    { product_id: productId, user_id: userId },
    { projection: { author_email: 0, meta: 0, helpful_by: 0, moderation: 0 } }
  );
}

/**
 * Update a review the caller owns. Any edit resets the review to `pending` so it
 * is re-moderated. Recomputes aggregates if the review had been live.
 */
export async function updateOwnReview(id, userId, fields) {
  const db = await getDb();
  const { ObjectId } = await import('mongodb');
  if (!ObjectId.isValid(id)) return null;

  const existing = await db.collection(COL).findOne({ _id: new ObjectId(id) });
  if (!existing || existing.user_id !== userId) return null;

  await db.collection(COL).updateOne(
    { _id: existing._id },
    {
      $set: {
        ...fields,
        status: 'pending',
        updated_at: new Date(),
      },
    }
  );
  if (existing.status === 'approved') await recomputeProductAggregates(existing.product_id);
  return true;
}

/** Delete a review the caller owns. Recomputes aggregates if it had been live. */
export async function deleteOwnReview(id, userId) {
  const db = await getDb();
  const { ObjectId } = await import('mongodb');
  if (!ObjectId.isValid(id)) return null;

  const existing = await db.collection(COL).findOne({ _id: new ObjectId(id) });
  if (!existing || existing.user_id !== userId) return null;

  await db.collection(COL).deleteOne({ _id: existing._id });
  if (existing.status === 'approved') await recomputeProductAggregates(existing.product_id);
  return true;
}

/**
 * Register a "helpful" vote for a review. One vote per user (tracked in
 * `helpful_by`). Returns the new helpful count, or null if already voted / missing.
 */
export async function markHelpful(id, userId) {
  const db = await getDb();
  const { ObjectId } = await import('mongodb');
  if (!ObjectId.isValid(id)) return null;

  const res = await db.collection(COL).findOneAndUpdate(
    { _id: new ObjectId(id), status: 'approved', helpful_by: { $ne: userId } },
    { $addToSet: { helpful_by: userId }, $inc: { helpful_count: 1 } },
    { returnDocument: 'after', projection: { helpful_count: 1 } }
  );
  const doc = res?.value ?? res;
  return doc ? doc.helpful_count : null;
}

// ---------------------------------------------------------------------------
// Verified purchase + aggregates
// ---------------------------------------------------------------------------

/**
 * Best-effort check that `userId` has an order containing this product. Orders
 * store line items loosely (name / metal / size), so we match on product id,
 * slug, sku or name — whichever the order happens to carry.
 */
export async function isVerifiedPurchase(userId, product) {
  if (!userId) return false;
  const db = await getDb();
  const order = await db.collection('orders').findOne({
    user_id: userId,
    $or: [
      { 'items.product_id': product.id },
      { 'items.slug': product.slug },
      { 'items.sku': product.sku },
      { 'items.name': product.name },
    ],
  });
  return Boolean(order);
}

/**
 * Recompute and persist the denormalized rating roll-up on the product document
 * from its APPROVED reviews. Call after any approval-state change.
 * @returns {Promise<{ average: number, count: number, breakdown: object }>}
 */
export async function recomputeProductAggregates(productId) {
  const db = await getDb();
  const rows = await db
    .collection(COL)
    .aggregate([
      { $match: { product_id: productId, status: 'approved' } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ])
    .toArray();

  const breakdown = { ...EMPTY_BREAKDOWN };
  let count = 0;
  let sum = 0;
  for (const r of rows) {
    breakdown[r._id] = r.count;
    count += r.count;
    sum += r._id * r.count;
  }
  const average = count ? Math.round((sum / count) * 10) / 10 : 0;

  await db.collection('products').updateOne(
    { id: productId },
    { $set: { rating_avg: average, rating_count: count, rating_breakdown: breakdown, ratings_updated_at: new Date() } }
  );

  return { average, count, breakdown };
}
