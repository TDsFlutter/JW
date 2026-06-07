"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { products as mockProducts, categories as mockCategories } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useCart } from "@/context/CartContext";
import { isFirebaseConfigured, db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import styles from "./shop.module.css";

function ShopContent() {
  const searchParams = useSearchParams();
  const { wishlist } = useCart();
  
  const search = searchParams.get("search") || "";
  const showWishlistOnly = searchParams.get("wishlist") === "true";
  const collectionParam = searchParams.get("collection") || "";
  
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  
  const [productList, setProductList] = useState([]);
  const [categoryList, setCategoryList] = useState(["All"]);
  const [loading, setLoading] = useState(true);

  // Fetch products from Firestore or fallback
  useEffect(() => {
    const fetchDbProducts = async () => {
      setLoading(true);
      if (!isFirebaseConfigured) {
        setProductList(mockProducts);
        setCategoryList(mockCategories);
        setLoading(false);
        return;
      }

      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const fetched = [];
        const cats = new Set(["All"]);
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetched.push({ id: doc.id, ...data });
          if (data.category) cats.add(data.category);
        });

        if (fetched.length === 0) {
          // If Firestore is empty, use mock products
          setProductList(mockProducts);
          setCategoryList(mockCategories);
        } else {
          setProductList(fetched);
          setCategoryList(Array.from(cats));
        }
      } catch (err) {
        console.error("Error loading products from Firestore:", err);
        setProductList(mockProducts);
        setCategoryList(mockCategories);
      } finally {
        setLoading(false);
      }
    };

    fetchDbProducts();
  }, []);

  // Determine breadcrumbs
  const breadcrumbs = [
    { label: "Home", href: "/" },
    showWishlistOnly 
      ? { label: "Wishlist", href: "/shop?wishlist=true" }
      : search 
        ? { label: `Search: "${search}"`, href: `/shop?search=${search}` }
        : collectionParam
          ? { label: collectionParam, href: `/shop?collection=${collectionParam}` }
          : { label: "Shop", href: "/shop" }
  ];

  // Title and description
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

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#707070", fontStyle: "italic" }}>Loading Ella Collection...</p>
      </div>
    );
  }

  // Filter products
  let filtered = [...productList];

  // Filter by wishlist
  if (showWishlistOnly) {
    // Note: productList IDs might be numbers (from mocks) or strings (from firestore)
    filtered = filtered.filter((p) => wishlist.includes(p.id));
  }

  // Filter by collection
  if (collectionParam) {
    filtered = filtered.filter((p) => p.collection && p.collection.toLowerCase() === collectionParam.toLowerCase());
  }

  // Filter by category
  if (activeCategory !== "All") {
    filtered = filtered.filter((p) => p.category === activeCategory);
  }

  // Filter by search query
  if (search) {
    const query = search.toLowerCase();
    filtered = filtered.filter(
      (p) => 
        (p.name && p.name.toLowerCase().includes(query)) || 
        (p.category && p.category.toLowerCase().includes(query)) ||
        (p.description && p.description.toLowerCase().includes(query))
    );
  }

  // Sort
  if (sortBy === "price-low") filtered.sort((a, b) => a.price - b.price);
  if (sortBy === "price-high") filtered.sort((a, b) => b.price - a.price);
  if (sortBy === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className={styles.container}>
      <Breadcrumbs items={breadcrumbs} />

      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
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
        Showing {filtered.length} product{filtered.length !== 1 ? "s" : ""}
      </p>

      <div className={styles.grid}>
        {filtered.map((product, idx) => (
          <ProductCard key={product.id} product={product} index={idx} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className={styles.empty}>
          <p>
            {showWishlistOnly 
              ? "Your wishlist is empty. Explore our shop and add some items!" 
              : "No products found matching your criteria."}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <div className={styles.page}>
      <Suspense fallback={
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p>Loading Collection...</p>
        </div>
      }>
        <ShopContent />
      </Suspense>
    </div>
  );
}
