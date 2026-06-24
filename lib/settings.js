/**
 * Site settings — storefront read-only access.
 *
 * Reads the same `settings` collection the admin writes to (_id: 'site').
 * Defaults to everything enabled so a missing document never hides features.
 *
 * @module lib/settings
 */

import { getDb } from './mongodb';

const COL = 'settings';
const DOC_ID = 'site';

const DEFAULTS = {
  googleReviewsEnabled: true,
  productReviewsEnabled: true,
};

export async function getSettings() {
  const db = await getDb();
  const doc = await db.collection(COL).findOne({ _id: DOC_ID }, { projection: { _id: 0 } });
  return { ...DEFAULTS, ...(doc || {}) };
}
