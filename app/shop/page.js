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

    // 2. Fetch fresh from the backend APIs and overwrite whatever we showed.
    const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001";
    try {
      const prodRes = await fetch(`${ADMIN_URL}/api/products?status=Active`);
      const catsRes = await fetch(`${ADMIN_URL}/api/categories`);

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
  }, [activeCategory, sortBy, search, collectionParam, showWishlistOnly]);

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

  if (sortBy === "price-low") filtered.sort((a, b) => a.price - b.price);
  if (sortBy === "price-high") filtered.sort((a, b) => b.price - a.price);
  if (sortBy === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));

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

      <div className={styles.toolbar}>
        <div className={styles.categories}>
          {categoryList.map((cat) => (
            <button
              key={cat}
              className={`${styles.catBtn} ${activeCategory === cat ? styles.active : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className={styles.sortWrap}>
          <label htmlFor="sort-select" className={styles.sortLabel}>
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.sortSelect}
          >
            <option value="default">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </div>

      <p className={styles.resultCount}>
        Showing {pageStart + 1}–{Math.min(pageStart + PRODUCTS_PER_PAGE, filtered.length)} of{" "}
        {filtered.length} product{filtered.length !== 1 ? "s" : ""}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${safePage}-${activeCategory}-${sortBy}`}
          className={styles.grid}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {paginated.map((product, idx) => (
            <ProductCard key={product.id} product={product} index={idx} />
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
              <span key={`ellipsis-${i}`} className={styles.ellipsis}>
                …
              </span>
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
