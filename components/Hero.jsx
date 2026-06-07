"use client";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import styles from "./Hero.module.css";

export default function Hero() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section className={styles.hero} id="hero-section" ref={ref}>
      <div className={styles.imageWrap}>
        <Image
          src="/assets/Rectangle 5.png"
          alt="Model wearing elegant jewelry from Milancélos collection"
          fill
          priority
          className={styles.heroImage}
          sizes="100vw"
        />
        <div className={styles.overlay} />
      </div>

      <div className={styles.content}>
        <motion.p
          className={styles.label}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          NEW ARRIVALS__
        </motion.p>

        <motion.h1
          className={styles.title}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Milancélos
        </motion.h1>

        <motion.p
          className={styles.description}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          Quisquemos sodals sust ait dilo condiment
          <br />
          cosmo lacus meleifend blandilos.
        </motion.p>

        <Link
          href="/shop"
          className={styles.shopBtn}
          id="hero-shop-now"
        >
          SHOP NOW
        </Link>
      </div>
    </section>
  );
}
