"use client";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { products } from "@/data/products";
import { isFirebaseConfigured, db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import ProductCard from "@/components/ProductCard";
import styles from "./NewArrivals.module.css";

export default function NewArrivals() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [productList, setProductList] = useState([]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setProductList(products);
      return;
    }
    const unsub = onSnapshot(
      collection(db, "products"),
      (querySnapshot) => {
        const fetched = [];
        querySnapshot.forEach((doc) => {
          fetched.push({ id: doc.id, ...doc.data() });
        });
        setProductList(fetched.length > 0 ? fetched : products);
      },
      (e) => {
        console.error("Error loading products for New Arrivals:", e);
        setProductList(products);
      }
    );

    return () => unsub();
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
