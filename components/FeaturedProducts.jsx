"use client";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { products } from "@/data/products";
import { getActiveProducts } from "@/lib/productsCache";
import ProductCard from "@/components/ProductCard";
import styles from "./FeaturedProducts.module.css";

export default function FeaturedProducts() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [productList, setProductList] = useState([]);

  useEffect(() => {
    getActiveProducts()
      .then((data) => {
        setProductList(data.length > 0 ? data : products);
      })
      .catch((e) => {
        console.error("Error loading products for Featured Products:", e);
        setProductList(products);
      });
  }, []);

  // Use the first 4 products as featured items
  const featuredList = productList.length >= 4 ? productList.slice(0, 4) : productList;

  return (
    <section className={styles.section} id="featured-products" ref={ref}>
      <div className={styles.container}>
        <motion.h2
          className={styles.title}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          Featured Products
        </motion.h2>

        <div className={styles.grid}>
          {featuredList.map((product, idx) => (
            <ProductCard key={product.id} product={product} index={idx} />
          ))}
        </div>

        <motion.div
          className={styles.viewAllWrap}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Link href="/shop" className={styles.viewAllBtn} id="featured-view-all">
            View All
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
