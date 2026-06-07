"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import styles from "./TopProducts.module.css";

const categories = ["Diamond Ring", "Bracelet", "Pendant", "Earring"];

const products = [
  {
    name: "Diamond In Platinum",
    image: "/assets/image 1.png",
    slug: "diamond-in-platinum-ring",
  },
  {
    name: "Makers Slice Ring",
    image: "/assets/image 2.png",
    slug: "makers-slice-ring",
  },
  {
    name: "Nesting Band Ring",
    image: "/assets/image 4.png",
    slug: "nesting-band-ring",
  },
  {
    name: "Olive Leaf Band Ring",
    image: "/assets/Rectangle 15.png",
    slug: "olive-leaf-band-ring",
  },
];

export default function TopProducts() {
  const [activeCategory, setActiveCategory] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

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
          {products.map((product, idx) => (
            <motion.div
              key={idx}
              className={styles.card}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
            >
              <div className={styles.imageWrap}>
                <Image
                  src={product.image}
                  alt={product.name}
                  width={200}
                  height={200}
                  className={styles.productImage}
                />
              </div>
              <h3 className={styles.productName}>{product.name}</h3>
              <Link href={`/products/${product.slug}`} className={styles.shopLink}>
                Shop Now
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
