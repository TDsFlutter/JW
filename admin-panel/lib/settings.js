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

// Default discount badges shown on every product page. Editable in the admin
// Settings tab; the storefront renders only the enabled ones.
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

// Coerce arbitrary input into exactly three well-formed discount tiers.
function sanitizeDiscountTiers(input) {
  const arr = Array.isArray(input) ? input : [];
  return DEFAULT_DISCOUNT_TIERS.map((fallback, i) => {
    const t = arr[i] || {};
    return {
      label: typeof t.label === 'string' && t.label.trim() ? t.label.trim() : fallback.label,
      sub: typeof t.sub === 'string' ? t.sub.trim() : fallback.sub,
      enabled: t.enabled !== false,
    };
  });
}

export async function getSettings() {
  const db = await getDb();
  const doc = await db.collection(COL).findOne({ _id: DOC_ID }, { projection: { _id: 0 } });
  const merged = { ...DEFAULTS, ...(doc || {}) };
  merged.discountTiers = sanitizeDiscountTiers(merged.discountTiers);
  return merged;
}

export async function updateSettings(patch) {
  const db = await getDb();
  const set = { updated_at: new Date() };
  if (typeof patch.googleReviewsEnabled === 'boolean') set.googleReviewsEnabled = patch.googleReviewsEnabled;
  if (typeof patch.productReviewsEnabled === 'boolean') set.productReviewsEnabled = patch.productReviewsEnabled;
  if (Array.isArray(patch.discountTiers)) set.discountTiers = sanitizeDiscountTiers(patch.discountTiers);
  await db.collection(COL).updateOne({ _id: DOC_ID }, { $set: set }, { upsert: true });
  return getSettings();
}
