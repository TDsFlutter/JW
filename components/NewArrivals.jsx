"use client";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { products } from "@/data/products";
import { isFirebaseConfigured } from "@/lib/firebase";
import ProductCard from "@/components/ProductCard";
import styles from "./NewArrivals.module.css";

export default function NewArrivals() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [productList, setProductList] = useState([]);

  useEffect(() => {
    const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001";
    fetch(`${ADMIN_URL}/api/products?status=Active`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("API failed");
      })
      .then((data) => {
        setProductList(data.length > 0 ? data : products);
      })
      .catch((e) => {
        console.error("Error loading products for New Arrivals:", e);
        setProductList(products);
      });
  }, []);

  // Show the last 3 added items as New Arrivals (or first 3 if total is less than 3)
  const newArrivalsList = productList.length >= 3 ? productList.slice(-3) : productList;

  return (
    <section className={styles.section} id="new-arrivals" ref={ref}>
      <div className={styles.container}>
        <motion.h2
          className={styles.title}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          New Arrivals
        </motion.h2>

        <div className={styles.grid}>
          {newArrivalsList.map((product, idx) => (
            <ProductCard key={product.id} product={product} index={idx} />
          ))}
        </div>

        <motion.div
          className={styles.viewAllWrap}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Link href="/shop" className={styles.viewAllBtn} id="new-arrivals-view-all">
            View All
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
