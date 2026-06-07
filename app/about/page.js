"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import styles from "./about.module.css";

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <motion.h1
          className={styles.heroTitle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          About ëlla
        </motion.h1>
        <motion.p
          className={styles.heroSub}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Crafting Elegance Since Day One
        </motion.p>
      </div>

      <div className={styles.container}>
        {/* Our Story */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Our Story</h2>
          <p className={styles.sectionText}>
            ëlla was born from a simple belief — that every person deserves to wear jewelry that
            feels as extraordinary as the moments they celebrate. We specialize in premium 925
            sterling silver jewelry adorned with stunning moissanite gemstones that rival the
            brilliance of natural diamonds at a fraction of the cost. Each piece is thoughtfully
            designed, ethically crafted, and built to last a lifetime.
          </p>
        </section>

        {/* Our Values */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>What We Stand For</h2>
          <div className={styles.valuesGrid}>
            <motion.div
              className={styles.valueCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className={styles.valueIcon}>💎</span>
              <h3 className={styles.valueTitle}>Unmatched Quality</h3>
              <p className={styles.valueDesc}>
                Every piece undergoes rigorous quality checks. We use only premium AAA-grade
                moissanite and 92.5% pure sterling silver with platinum or gold plating.
              </p>
            </motion.div>
            <motion.div
              className={styles.valueCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <span className={styles.valueIcon}>🌿</span>
              <h3 className={styles.valueTitle}>Ethically Sourced</h3>
              <p className={styles.valueDesc}>
                Our moissanite gemstones are lab-created, ensuring zero environmental harm
                and no conflict sourcing. Beauty without compromise.
              </p>
            </motion.div>
            <motion.div
              className={styles.valueCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <span className={styles.valueIcon}>✨</span>
              <h3 className={styles.valueTitle}>Affordable Luxury</h3>
              <p className={styles.valueDesc}>
                We cut the middlemen and sell directly to you. This means you get premium,
                certified jewelry at prices that feel right.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>ëlla in Numbers</h2>
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <div className={styles.statNumber}>10K+</div>
              <div className={styles.statLabel}>Happy Customers</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>500+</div>
              <div className={styles.statLabel}>Unique Designs</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>4.8★</div>
              <div className={styles.statLabel}>Average Rating</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>30+</div>
              <div className={styles.statLabel}>Countries Shipped</div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Why Choose ëlla?</h2>
          <p className={styles.sectionText}>
            We don't just sell jewelry — we deliver confidence, elegance, and a promise of
            authenticity. Every order comes with a TGL Certificate of Authenticity, premium
            packaging, and our dedicated customer support. Whether you're shopping for an
            engagement ring, a birthday gift, or a treat for yourself, ëlla is your trusted
            destination for fine jewelry.
          </p>
        </section>
      </div>

      {/* CTA */}
      <div className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>Ready to find your perfect piece?</h2>
        <Link href="/shop" className={styles.ctaBtn}>
          Explore Our Collection
        </Link>
      </div>
    </div>
  );
}
