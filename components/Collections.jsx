"use client";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import styles from "./Collections.module.css";

export default function Collections() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

  return (
    <section className={styles.section} id="collections" ref={ref}>
      <div className={styles.container}>
        <motion.div
          className={styles.card}
          initial={{ opacity: 0, x: -40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <div className={styles.imageWrap}>
            <Image
              src={`${BASE_PATH}/assets/Rectangle 11.png`}
              alt="Birthday Collection - Elegant gold jewelry"
              fill
              className={styles.cardImage}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className={styles.cardOverlay} />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>MUST SEE NEW STYLE</span>
            <h3 className={styles.cardTitle}>
              Birthday
              <br />
              Collection
            </h3>
            <Link href="/shop?collection=Birthday Collection" className={styles.cardBtn}>
              Shop Now
            </Link>
          </div>
        </motion.div>

        <motion.div
          className={styles.card}
          initial={{ opacity: 0, x: 40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className={styles.imageWrap}>
            <Image
              src={`${BASE_PATH}/assets/Rectangle 13.png`}
              alt="Summer Essentials - Trendy jewelry for summer"
              fill
              className={styles.cardImage}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className={styles.cardOverlay} />
          </div>
          <div className={`${styles.cardContent} ${styles.contentRight}`}>
            <span className={styles.cardLabel}>NEW COLLECTION</span>
            <h3 className={styles.cardTitle}>
              Summer
              <br />
              Essentials
            </h3>
            <Link href="/shop?collection=Summer Essentials" className={styles.cardBtn}>
              Shop Now
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
