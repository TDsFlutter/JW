"use client";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { getActiveProducts } from "@/lib/productsCache";
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

export default function TopProducts() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [productList, setProductList] = useState([]);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    getActiveProducts()
      .then((data) => setProductList(data))
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

  const displayedProducts = dbFiltered.slice(0, 4);

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
              <button
                className={styles.arrowBtn}
                aria-label="Previous"
                onClick={() =>
                  setActiveCategory((prev) => (prev - 1 + categories.length) % categories.length)
                }
              >
                &lt;
              </button>
              <button
                className={styles.arrowBtn}
                aria-label="Next"
                onClick={() =>
                  setActiveCategory((prev) => (prev + 1) % categories.length)
                }
              >
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
