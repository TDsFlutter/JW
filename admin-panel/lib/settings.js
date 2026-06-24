/**
 * Site settings — admin data-access layer.
 *
 * A single document in the `settings` collection (_id: 'site') holds feature
 * flags the storefront reads. Currently: which review systems are enabled.
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

export async function updateSettings(patch) {
  const db = await getDb();
  const set = { updated_at: new Date() };
  if (typeof patch.googleReviewsEnabled === 'boolean') set.googleReviewsEnabled = patch.googleReviewsEnabled;
  if (typeof patch.productReviewsEnabled === 'boolean') set.productReviewsEnabled = patch.productReviewsEnabled;
  await db.collection(COL).updateOne({ _id: DOC_ID }, { $set: set }, { upsert: true });
  return getSettings();
}
