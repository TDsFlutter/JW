"use client";
import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { products as mockProducts, categories as mockCategories } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useCart } from "@/context/CartContext";
import { isFirebaseConfigured } from "@/lib/firebase";
import styles from "./shop.module.css";

const PRODUCTS_PER_PAGE = 12;
const CACHE_KEY = "ella_products_cache";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes



function ShopContent() {
  const searchParams = useSearchParams();
  const { wishlist } = useCart();

  const search = searchParams.get("search") || "";
  const showWishlistOnly = searchParams.get("wishlist") === "true";
  const collectionParam = searchParams.get("collection") || "";

  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [currentPage, setCurrentPage] = useState(1);

  const [productList, setProductList] = useState([]);
  const [categoryList, setCategoryList] = useState(["All"]);
  const [loading, setLoading] = useState(true);

  // ── Sidebar filter + view state ───────────────────────────────────────────
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [filtersOpen, setFiltersOpen] = useState(false); // mobile drawer
  const [availFilter, setAvailFilter] = useState({ inStock: false, outOfStock: false });
  const [priceMin, setPriceMin] = useState(null);
  const [priceMax, setPriceMax] = useState(null);

  // A product is out of stock when its status says so, or when it has colour
  // variants and none of the enabled ones carry stock.
  const isOutOfStock = (p) => {
    if (p.status === "Out of Stock") return true;
    if (Array.isArray(p.colorVariants) && p.colorVariants.length > 0) {
      const enabled = p.colorVariants.filter((v) => v.enabled);
      if (enabled.length > 0) return enabled.every((v) => (parseInt(v.stock, 10) || 0) <= 0);
    }
    return false;
  };

  // Price bounds across the loaded catalogue (floor/ceil to whole rupees).
  const priceBounds = (() => {
    const prices = productList.map((p) => Number(p.price) || 0).filter((n) => n > 0);
    if (prices.length === 0) return { min: 0, max: 0 };
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  })();

  // Once products load (or change), default the price range to the full span.
  useEffect(() => {
    if (productList.length === 0) return;
    setPriceMin((m) => (m == null ? priceBounds.min : m));
    setPriceMax((m) => (m == null ? priceBounds.max : m));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productList]);

  const activeMin = priceMin == null ? priceBounds.min : priceMin;
  const activeMax = priceMax == null ? priceBounds.max : priceMax;

  const clearAllFilters = () => {
    setActiveCategory("All");
    setAvailFilter({ inStock: false, outOfStock: false });
    setPriceMin(priceBounds.min);
    setPriceMax(priceBounds.max);
  };

  // ── Load products (stale-while-revalidate) ───────────────────────────────
  const loadProducts = useCallback(async () => {
    // 1. Paint instantly from cache if present, but ALWAYS revalidate below so
    //    products activated in the admin panel show up without waiting for the
    //    cache TTL to expire.
    let servedFromCache = false;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const { data, cats, ts } = JSON.parse(raw);
        if (Date.now() - ts < CACHE_TTL_MS && data.length > 0) {
          setProductList(data);
          setCategoryList(cats);
          setLoading(false);
          servedFromCache = true;
        }
      }
    } catch (_) {
      // Ignore corrupt cache
    }

    // 2. Fetch fresh from the website's own API (reads MongoDB directly).
    try {
      const prodRes = await fetch(`/api/products?status=Active`);
      const catsRes = await fetch(`/api/categories`);

      if (prodRes.ok && catsRes.ok) {
        const prodsData = await prodRes.json();
        const catsData = await catsRes.json();

        const finalProducts = prodsData.length > 0 ? prodsData : mockProducts;

        const catNames = new Set(["All"]);
        catsData.forEach(c => catNames.add(c.name));
        const finalCats = Array.from(catNames);

        setProductList(finalProducts);
        setCategoryList(finalCats);

        // Save to cache
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ data: finalProducts, cats: finalCats, ts: Date.now() })
          );
        } catch (_) {}
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Backend fetch error, falling back to mocks:", err);
    }

    // 3. Fallback to mock data only if we had nothing to show from cache.
    if (!servedFromCache) {
      setProductList(mockProducts);
      setCategoryList(mockCategories);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, sortBy, search, collectionParam, showWishlistOnly, availFilter, activeMin, activeMax]);

  // ── Breadcrumbs ───────────────────────────────────────────────────────────
  const breadcrumbs = [
    { label: "Home", href: "/" },
    showWishlistOnly
      ? { label: "Wishlist", href: "/shop?wishlist=true" }
      : search
        ? { label: `Search: "${search}"`, href: `/shop?search=${search}` }
        : collectionParam
          ? { label: collectionParam, href: `/shop?collection=${collectionParam}` }
          : { label: "Shop", href: "/shop" },
  ];

  const pageTitle = showWishlistOnly
    ? "My Wishlist"
    : search
      ? `Search Results for "${search}"`
      : collectionParam
        ? collectionParam
        : "Our Collection";

  const pageSubtitle = showWishlistOnly
    ? "Your curated list of exquisite jewelry pieces"
    : search
      ? `Found items matching your search criteria`
      : collectionParam
        ? `Exquisite designs from our ${collectionParam}`
        : "Discover our handcrafted pieces, designed to celebrate life's most precious moments";

  // ── Filter & Sort ─────────────────────────────────────────────────────────
  let filtered = [...productList];

  if (showWishlistOnly) {
    filtered = filtered.filter((p) => wishlist.includes(p.id));
  }
  if (collectionParam) {
    filtered = filtered.filter(
      (p) => p.collection && p.collection.toLowerCase() === collectionParam.toLowerCase()
    );
  }
  if (activeCategory !== "All") {
    filtered = filtered.filter((p) => p.category === activeCategory);
  }
  if (search) {
    const query = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query)) ||
        (p.description && p.description.toLowerCase().includes(query))
    );
  }

  // Availability + price counts are taken before those two filters apply, so the
  // sidebar can show how many items each option would match.
  const availCounts = {
    inStock: filtered.filter((p) => !isOutOfStock(p)).length,
    outOfStock: filtered.filter((p) => isOutOfStock(p)).length,
  };

  // Availability (checkboxes act as OR; none checked = show all)
  if (availFilter.inStock || availFilter.outOfStock) {
    filtered = filtered.filter((p) => {
      const out = isOutOfStock(p);
      return (availFilter.inStock && !out) || (availFilter.outOfStock && out);
    });
  }

  // Price range
  filtered = filtered.filter((p) => {
    const price = Number(p.price) || 0;
    return price >= activeMin && price <= activeMax;
  });

  // Default ("Featured") order — applies to All and within each category:
  // highest-rated products first, then the most recently added.
  if (sortBy === "default") {
    filtered.sort((a, b) => {
      const byRating = (b.rating_avg || 0) - (a.rating_avg || 0);
      if (byRating !== 0) return byRating;
      const byReviews = (b.rating_count || 0) - (a.rating_count || 0);
      if (byReviews !== 0) return byReviews;
      // Tie → newest added first (fall back to higher id when no date).
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return (b.id || 0) - (a.id || 0);
    });
  }
  if (sortBy === "price-low") filtered.sort((a, b) => a.price - b.price);
  if (sortBy === "price-high") filtered.sort((a, b) => b.price - a.price);
  if (sortBy === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));
  if (sortBy === "top-rated")
    filtered.sort(
      (a, b) =>
        (b.rating_avg || 0) - (a.rating_avg || 0) ||
        (b.rating_count || 0) - (a.rating_count || 0)
    );

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PRODUCTS_PER_PAGE;
  const paginated = filtered.slice(pageStart, pageStart + PRODUCTS_PER_PAGE);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 320, behavior: "smooth" });
  };

  // Build page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("…");
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) {
        pages.push(i);
      }
      if (safePage < totalPages - 2) pages.push("…");
      pages.push(totalPages);
    }
    return pages;
  };

  // ── Skeleton loading state ────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#707070", fontStyle: "italic" }}>Loading Ella Collection...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Breadcrumbs items={breadcrumbs} />

      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className={styles.title}>{pageTitle}</h1>
        <p className={styles.subtitle}>{pageSubtitle}</p>
      </motion.div>

      <div className={styles.shopLayout}>
        {/* ── Mobile filter trigger ── */}
        <button className={styles.mobileFilterBtn} onClick={() => setFiltersOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="7" y1="12" x2="17" y2="12" /><line x1="10" y1="18" x2="14" y2="18" />
          </svg>
          Filter By
        </button>

        {/* ── Filter sidebar ── */}
        <aside className={`${styles.sidebar} ${filtersOpen ? styles.sidebarOpen : ""}`}>
          <div className={styles.sidebarHead}>
            <span className={styles.filterByTitle}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <line x1="4" y1="6" x2="20" y2="6" /><line x1="7" y1="12" x2="17" y2="12" /><line x1="10" y1="18" x2="14" y2="18" />
              </svg>
              FILTER BY
            </span>
            <button className={styles.sidebarClose} onClick={() => setFiltersOpen(false)} aria-label="Close filters">✕</button>
          </div>

          <button className={styles.clearAllBtn} onClick={clearAllFilters}>
            🗑 Clear All
          </button>

          {/* Category */}
          <div className={styles.filterSection}>
            <div className={styles.filterTitle}>
              <span>CATEGORY</span>
              {activeCategory !== "All" && (
                <button className={styles.resetLink} onClick={() => setActiveCategory("All")}>RESET</button>
              )}
            </div>
            <div className={styles.catList}>
              {categoryList.map((cat) => (
                <button
                  key={cat}
                  className={`${styles.catChip} ${activeCategory === cat ? styles.catChipActive : ""}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className={styles.filterSection}>
            <div className={styles.filterTitle}>
              <span>AVAILABILITY</span>
              {(availFilter.inStock || availFilter.outOfStock) && (
                <button
                  className={styles.resetLink}
                  onClick={() => setAvailFilter({ inStock: false, outOfStock: false })}
                >
                  RESET
                </button>
              )}
            </div>
            <label className={styles.checkRow}>
              <span className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={availFilter.inStock}
                  onChange={(e) => setAvailFilter((f) => ({ ...f, inStock: e.target.checked }))}
                />
                In stock
              </span>
              <span className={styles.checkCount}>({availCounts.inStock})</span>
            </label>
            <label className={styles.checkRow}>
              <span className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={availFilter.outOfStock}
                  onChange={(e) => setAvailFilter((f) => ({ ...f, outOfStock: e.target.checked }))}
                />
                Out of stock
              </span>
              <span className={styles.checkCount}>({availCounts.outOfStock})</span>
            </label>
          </div>

          {/* Price */}
          <div className={styles.filterSection}>
            <div className={styles.filterTitle}>
              <span>PRICE</span>
              {(activeMin !== priceBounds.min || activeMax !== priceBounds.max) && (
                <button
                  className={styles.resetLink}
                  onClick={() => { setPriceMin(priceBounds.min); setPriceMax(priceBounds.max); }}
                >
                  RESET
                </button>
              )}
            </div>
            <div className={styles.rangeWrap}>
              <input
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                value={activeMin}
                onChange={(e) => setPriceMin(Math.min(Number(e.target.value), activeMax))}
                className={styles.rangeInput}
              />
              <input
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                value={activeMax}
                onChange={(e) => setPriceMax(Math.max(Number(e.target.value), activeMin))}
                className={styles.rangeInput}
              />
            </div>
            <div className={styles.priceInputs}>
              <input
                type="number"
                min={priceBounds.min}
                max={activeMax}
                value={activeMin}
                onChange={(e) => setPriceMin(Math.min(Number(e.target.value || 0), activeMax))}
                className={styles.priceField}
                aria-label="Minimum price"
              />
              <span className={styles.priceDash}>—</span>
              <input
                type="number"
                min={activeMin}
                max={priceBounds.max}
                value={activeMax}
                onChange={(e) => setPriceMax(Math.max(Number(e.target.value || 0), activeMin))}
                className={styles.priceField}
                aria-label="Maximum price"
              />
            </div>
          </div>

          <button className={styles.applyBtn} onClick={() => setFiltersOpen(false)}>
            Show {filtered.length} Result{filtered.length !== 1 ? "s" : ""}
          </button>
        </aside>

        {filtersOpen && <div className={styles.backdrop} onClick={() => setFiltersOpen(false)} />}

        {/* ── Product content ── */}
        <div className={styles.content}>
          <div className={styles.contentTop}>
            <p className={styles.resultCount}>
              Showing {filtered.length === 0 ? 0 : pageStart + 1}–
              {Math.min(pageStart + PRODUCTS_PER_PAGE, filtered.length)} of {filtered.length}{" "}
              product{filtered.length !== 1 ? "s" : ""}
            </p>

            <div className={styles.contentTopRight}>
              <div className={styles.viewToggle}>
                <button
                  className={`${styles.viewBtn} ${viewMode === "grid" ? styles.viewActive : ""}`}
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                  </svg>
                </button>
                <button
                  className={`${styles.viewBtn} ${viewMode === "list" ? styles.viewActive : ""}`}
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </button>
              </div>

              <div className={styles.sortWrap}>
                <label htmlFor="sort-select" className={styles.sortLabel}>Sort by</label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={styles.sortSelect}
                >
                  <option value="default">Featured</option>
                  <option value="top-rated">Top Rated</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name A–Z</option>
                </select>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${safePage}-${activeCategory}-${sortBy}-${viewMode}`}
              className={viewMode === "list" ? styles.list : styles.grid}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {paginated.map((product, idx) => (
                <ProductCard key={product.id} product={product} index={idx} view={viewMode} />
              ))}
            </motion.div>
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className={styles.empty}>
              <p>
                {showWishlistOnly
                  ? "Your wishlist is empty. Explore our shop and add some items!"
                  : "No products found matching your criteria."}
              </p>
            </div>
          )}

          {/* ── Pagination Controls ── */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => handlePageChange(safePage - 1)}
                disabled={safePage === 1}
                aria-label="Previous page"
              >
                ‹ Prev
              </button>

              {getPageNumbers().map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className={styles.ellipsis}>…</span>
                ) : (
                  <button
                    key={p}
                    className={`${styles.pageBtn} ${safePage === p ? styles.pageActive : ""}`}
                    onClick={() => handlePageChange(p)}
                    aria-label={`Page ${p}`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                className={styles.pageBtn}
                onClick={() => handlePageChange(safePage + 1)}
                disabled={safePage === totalPages}
                aria-label="Next page"
              >
                Next ›
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <div className={styles.page}>
      <Suspense
        fallback={
          <div className={styles.container}>
            <div className={styles.grid}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={styles.skeletonImage} />
                  <div className={styles.skeletonLine} style={{ width: "60%", marginTop: 12 }} />
                  <div className={styles.skeletonLine} style={{ width: "40%", marginTop: 8 }} />
                </div>
              ))}
            </div>
          </div>
        }
      >
        <ShopContent />
      </Suspense>
    </div>
  );
}
