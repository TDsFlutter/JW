"use client";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { isFirebaseConfigured } from "@/lib/firebase";
import { getImageSrc, isExternalImage } from "@/lib/imageHelper";
import styles from "./TopProducts.module.css";

const categories = ["Diamond Ring", "Bracelet", "Pendant", "Earring"];

const categoryMapping = {
  "Diamond Ring": "Rings",
  "Bracelet": "Bracelets",
  "Pendant": "Pendants",
  "Earring": "Earrings"
};

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

const mockProductsByCategory = {
  "Rings": [
    {
      id: "mock-r1",
      name: "Diamond In Platinum",
      images: ["/assets/image 1.png"],
      slug: "diamond-in-platinum-ring",
      price: 45000,
      category: "Rings",
    },
    {
      id: "mock-r2",
      name: "Makers Slice Ring",
      images: ["/assets/image 2.png"],
      slug: "makers-slice-ring",
      price: 25000,
      category: "Rings",
    },
    {
      id: "mock-r3",
      name: "Nesting Band Ring",
      images: ["/assets/image 4.png"],
      slug: "nesting-band-ring",
      price: 32000,
      category: "Rings",
    },
    {
      id: "mock-r4",
      name: "Olive Leaf Band Ring",
      images: ["/assets/Rectangle 15.png"],
      slug: "olive-leaf-band-ring",
      price: 28000,
      category: "Rings",
    },
  ],
  "Bracelets": [
    {
      id: "mock-b1",
      name: "Classic Tennis Bracelet",
      images: ["/assets/Rectangle 22.png"],
      slug: "classic-tennis-bracelet",
      price: 75000,
      category: "Bracelets",
    },
    {
      id: "mock-b2",
      name: "Gold Bangle Bracelet",
      images: ["/assets/Rectangle 23.png"],
      slug: "gold-bangle-bracelet",
      price: 62000,
      category: "Bracelets",
    },
  ],
  "Pendants": [
    {
      id: "mock-p1",
      name: "Heart Solitaire Pendant",
      images: ["/assets/Rectangle 13.png"],
      slug: "heart-solitaire-pendant",
      price: 18000,
      category: "Pendants",
    },
    {
      id: "mock-p2",
      name: "Minimalist Gold Chain Pendant",
      images: ["/assets/Rectangle 14.png"],
      slug: "minimalist-gold-chain-pendant",
      price: 15000,
      category: "Pendants",
    },
  ],
  "Earrings": [
    {
      id: "mock-e1",
      name: "Diamond Stud Earrings",
      images: ["/assets/Rectangle 11.png"],
      slug: "diamond-stud-earrings",
      price: 35000,
      category: "Earrings",
    },
    {
      id: "mock-e2",
      name: "Silver Hoop Earrings",
      images: ["/assets/Rectangle 16.png"],
      slug: "silver-hoop-earrings",
      price: 12000,
      category: "Earrings",
    },
  ],
};

export default function TopProducts() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [productList, setProductList] = useState([]);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001";
    fetch(`${ADMIN_URL}/api/products?status=Active`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("API failed");
      })
      .then((data) => {
        setProductList(data);
      })
      .catch((e) => {
        console.error("Error loading products for TopProducts:", e);
      });
  }, []);

  const activeCategoryName = categories[activeCategory];
  const mappedCategory = categoryMapping[activeCategoryName];

  // Filter Firestore products
  const dbFiltered = productList.filter(
    (p) => p.category && p.category.toLowerCase() === mappedCategory.toLowerCase()
  );

  // If we have database products, use them, otherwise use category mock fallback
  const displayedProducts = dbFiltered.length > 0 
    ? dbFiltered.slice(0, 4) 
    : (mockProductsByCategory[mappedCategory] || []);

  return (
    <section className={styles.section} id="top-products" ref={ref}>
      <div className={styles.container}>
        <div className={styles.header}>
          <motion.h2
            className={styles.title}
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            Top Product
          </motion.h2>

          <motion.div
            className={styles.categories}
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {categories.map((cat, idx) => (
              <button
                key={idx}
                className={`${styles.catBtn} ${activeCategory === idx ? styles.active : ""}`}
                onClick={() => setActiveCategory(idx)}
              >
                {cat}
              </button>
            ))}
            <div className={styles.arrows}>
              <button className={styles.arrowBtn} aria-label="Previous">
                &lt;
              </button>
              <button className={styles.arrowBtn} aria-label="Next">
                &gt;
              </button>
            </div>
          </motion.div>
        </div>

        <div className={styles.grid}>
          {displayedProducts.map((product, idx) => {
            const src = getImageSrc(product.images?.[0] || product.image);
            const isExt = isExternalImage(src);
            return (
              <motion.div
                key={product.id || idx}
                className={styles.card}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
              >
                <div className={styles.imageWrap}>
                  {isExt ? (
                    <img
                      src={src}
                      alt={product.name}
                      className={styles.productImage}
                      style={{ width: "200px", height: "200px", objectFit: "cover", display: "block" }}
                    />
                  ) : (
                    <Image
                      src={src}
                      alt={product.name}
                      width={200}
                      height={200}
                      className={styles.productImage}
                      style={{ objectFit: "cover" }}
                    />
                  )}
                </div>
                <h3 className={styles.productName}>{product.name}</h3>
                <Link href={`/products/${product.slug}`} className={styles.shopLink}>
                  Shop Now
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
