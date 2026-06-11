// Shared in-memory cache + in-flight dedupe for the public active-products list.
// The homepage renders FeaturedProducts, NewArrivals and TopProducts, which each
// need the active product list. Without this, all three fire the same request on
// mount (3 identical calls). This collapses them into a single request and caches
// the result briefly so quick re-navigations don't refetch.
let cached = null;
let cachedAt = 0;
let inflight = null;
const TTL = 30000; // 30s

export async function getActiveProducts() {
  const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001";
  const now = Date.now();
  if (cached && now - cachedAt < TTL) return cached;
  if (inflight) return inflight; // a request is already on the way — reuse it

  inflight = fetch(`${ADMIN_URL}/api/products?status=Active`)
    .then((res) => {
      if (!res.ok) throw new Error("API failed");
      return res.json();
    })
    .then((data) => {
      cached = Array.isArray(data) ? data : [];
      cachedAt = Date.now();
      inflight = null;
      return cached;
    })
    .catch((err) => {
      inflight = null;
      throw err;
    });

  return inflight;
}
