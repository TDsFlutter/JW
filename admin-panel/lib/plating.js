/**
 * Plating / colour variants.
 *
 * Products are 925 Sterling Silver; colour is a plating choice. We support a
 * fixed set of three platings whose `key` matches the storefront swatch names
 * so the product page can resolve gradients without extra mapping.
 *
 * Each product stores `colorVariants: [{ key, label, enabled, stock }]`. The
 * storefront shows a colour only when it is enabled, and renders the swatch
 * selector only when two or more colours are enabled.
 *
 * @module lib/plating
 */

export const PLATING_OPTIONS = [
  { key: 'Sterling Silver', label: 'White Gold' },
  { key: '18K Gold Plate', label: 'Yellow Gold' },
  { key: 'Rose Gold', label: 'Rose Gold' },
];

/**
 * Normalise arbitrary input into exactly the three supported plating variants,
 * preserving admin-set `enabled`/`stock` and ignoring unknown keys.
 */
export function sanitizeColorVariants(input) {
  const arr = Array.isArray(input) ? input : [];
  return PLATING_OPTIONS.map((opt) => {
    const v = arr.find((x) => x && x.key === opt.key) || {};
    const stock = parseInt(v.stock, 10);
    return {
      key: opt.key,
      label: opt.label,
      enabled: v.enabled === true,
      stock: Number.isFinite(stock) && stock > 0 ? stock : 0,
    };
  });
}
