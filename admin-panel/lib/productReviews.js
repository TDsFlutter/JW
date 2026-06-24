/**
 * Product Reviews — admin moderation data-access layer.
 *
 * Operates on the SAME `product_reviews` collection the storefront writes to.
 * The admin sees every review (any status, incl. author email) and can approve /
 * reject / reply / delete. Any change to a review's approval state recomputes the
 * denormalized rating roll-up on the matching `products` document so the
 * storefront stays consistent.
 *
 * @module lib/productReviews
 */

import { getDb } from './mongodb';

const COL = 'product_reviews';
const STATUSES = ['pending', 'approved', 'rejected'];
const EMPTY_BREAKDOWN = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function toObjectId(id) {
  const { ObjectId } = await import('mongodb');
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

export { STATUSES };

/**
 * Paginated, filtered moderation list.
 * @returns {Promise<{ reviews: object[], total: number, pendingCount: number }>}
 */
export async function listReviews({ status, product, rating, search, page = 1, limit = 25 } = {}) {
  const db = await getDb();
  const match = {};
  if (status && STATUSES.includes(status)) match.status = status;
  if (rating) match.rating = parseInt(rating, 10);
  if (product) {
    if (isNaN(product)) match.product_slug = product;
    else match.product_id = parseInt(product, 10);
  }
  if (search) {
    const term = new RegExp(escapeRegex(search), 'i');
    match.$or = [
      { author_name: term },
      { author_email: term },
      { title: term },
      { body: term },
      { product_name: term },
    ];
  }

  const skip = Math.max(0, (page - 1) * limit);
  const [reviews, total, pendingCount] = await Promise.all([
    db.collection(COL).find(match).sort({ created_at: -1 }).skip(skip).limit(limit).toArray(),
    db.collection(COL).countDocuments(match),
    db.collection(COL).countDocuments({ status: 'pending' }),
  ]);

  return { reviews, total, pendingCount };
}

export async function getReviewById(id) {
  const db = await getDb();
  const _id = await toObjectId(id);
  if (!_id) return null;
  return db.collection(COL).findOne({ _id });
}

/**
 * Moderate a single review: change status, set moderation notes, and/or add an
 * admin reply. Recomputes the product roll-up if approval state changed.
 */
export async function moderateReview(id, { status, notes, admin_reply }, adminEmail) {
  const db = await getDb();
  const _id = await toObjectId(id);
  if (!_id) return null;

  const existing = await db.collection(COL).findOne({ _id });
  if (!existing) return null;

  const set = { updated_at: new Date() };
  if (status && STATUSES.includes(status)) set.status = status;
  if (notes !== undefined || status) {
    set.moderation = {
      moderatedBy: adminEmail || existing.moderation?.moderatedBy || null,
      moderatedAt: new Date(),
      notes: notes !== undefined ? notes : existing.moderation?.notes || null,
    };
  }
  if (admin_reply !== undefined) {
    set.admin_reply = admin_reply
      ? { text: String(admin_reply).slice(0, 1000), repliedBy: adminEmail || 'Admin', repliedAt: new Date() }
      : null;
  }

  await db.collection(COL).updateOne({ _id }, { $set: set });

  const wasApproved = existing.status === 'approved';
  const nowApproved = (set.status || existing.status) === 'approved';
  if (wasApproved !== nowApproved || (nowApproved && set.status)) {
    await recomputeProductAggregates(existing.product_id);
  }
  return true;
}

export async function deleteReview(id) {
  const db = await getDb();
  const _id = await toObjectId(id);
  if (!_id) return null;
  const existing = await db.collection(COL).findOne({ _id });
  if (!existing) return null;
  await db.collection(COL).deleteOne({ _id });
  if (existing.status === 'approved') await recomputeProductAggregates(existing.product_id);
  return true;
}

/**
 * Bulk approve / reject / delete by id list. Recomputes aggregates for every
 * affected product once.
 * @returns {Promise<{ modified: number }>}
 */
export async function bulkAction(ids, action, adminEmail) {
  const db = await getDb();
  const objectIds = (await Promise.all((ids || []).map(toObjectId))).filter(Boolean);
  if (objectIds.length === 0) return { modified: 0 };

  const affected = await db
    .collection(COL)
    .find({ _id: { $in: objectIds } }, { projection: { product_id: 1 } })
    .toArray();
  const productIds = [...new Set(affected.map((r) => r.product_id))];

  let modified = 0;
  if (action === 'delete') {
    const res = await db.collection(COL).deleteMany({ _id: { $in: objectIds } });
    modified = res.deletedCount;
  } else if (action === 'approve' || action === 'reject') {
    const status = action === 'approve' ? 'approved' : 'rejected';
    const res = await db.collection(COL).updateMany(
      { _id: { $in: objectIds } },
      {
        $set: {
          status,
          updated_at: new Date(),
          moderation: { moderatedBy: adminEmail || 'Admin', moderatedAt: new Date(), notes: null },
        },
      }
    );
    modified = res.modifiedCount;
  } else {
    return { modified: 0 };
  }

  await Promise.all(productIds.map((pid) => recomputeProductAggregates(pid)));
  return { modified };
}

/** Recompute + persist the denormalized rating roll-up from APPROVED reviews. */
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
