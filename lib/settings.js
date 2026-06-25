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

// Mirror of the admin defaults so a missing settings document still yields the
// standard three discount badges on the storefront.
export const DEFAULT_DISCOUNT_TIERS = [
  { label: '5% OFF', sub: 'On prepaid orders', enabled: true },
  { label: '10% OFF', sub: 'On orders above ₹1,499', enabled: true },
  { label: '15% OFF', sub: 'On orders above ₹2,999', enabled: true },
];

const DEFAULTS = {
  googleReviewsEnabled: true,
  productReviewsEnabled: true,
  discountTiers: DEFAULT_DISCOUNT_TIERS,
};

export async function getSettings() {
  const db = await getDb();
  const doc = await db.collection(COL).findOne({ _id: DOC_ID }, { projection: { _id: 0 } });
  const merged = { ...DEFAULTS, ...(doc || {}) };
  if (!Array.isArray(merged.discountTiers) || merged.discountTiers.length === 0) {
    merged.discountTiers = DEFAULT_DISCOUNT_TIERS;
  }
  return merged;
}
