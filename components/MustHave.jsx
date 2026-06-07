"use client";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import styles from "./MustHave.module.css";

export default function MustHave() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

  return (
    <section className={styles.section} id="must-have" ref={ref}>
      <div className={styles.container}>
        <motion.h2
          className={styles.sectionTitle}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          Must Have
        </motion.h2>

        <div className={styles.content}>
          <motion.div
            className={styles.imageSection}
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className={styles.mainImage}>
              <Image
                src={`${BASE_PATH}/assets/unsplash_IdU1Si3wJ-I.png`}
                alt="18k Gold Bracelets on wrist"
                width={480}
                height={400}
                className={styles.image}
              />
            </div>
            <div className={styles.overlayCard}>
              <div className={styles.overlayImageWrap}>
                <Image
                  src={`${BASE_PATH}/assets/Rectangle 14.png`}
                  alt="Gold bracelet close-up"
                  width={220}
                  height={160}
                  className={styles.overlayImage}
                />
              </div>
              <div className={styles.overlayText}>
                <h4 className={styles.overlayTitle}>18k Gold Bracelets</h4>
                <p className={styles.overlaySubtitle}>SALE UP TO 30% OFF</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className={styles.textSection}
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <span className={styles.saleTag}>SALE UP TO 30% OFF</span>
            <h3 className={styles.title}>
              18k Gold
              <br />
              Bracelets
            </h3>
            <Link
              href="/products/18k-gold-chain-bracelet"
              className={styles.shopBtn}
              id="must-have-shop-now"
            >
              SHOP NOW
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
