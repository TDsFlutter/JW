"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import styles from "./blog.module.css";

const blogPosts = [
  {
    id: 1,
    title: "How to Choose the Perfect Moissanite Engagement Ring",
    excerpt: "Discover the key differences between moissanite and diamonds, and how to select the right cut, setting, and metal for your special someone.",
    image: "/assets/Rectangle 13.png",
    date: "June 5, 2026",
    category: "Buying Guide"
  },
  {
    id: 2,
    title: "Caring for Your 925 Sterling Silver Jewelry",
    excerpt: "Keep your sterling silver shining bright for years to come with our simple care instructions, cleaning tips, and storage advice.",
    image: "/assets/Rectangle 14.png",
    date: "May 28, 2026",
    category: "Jewelry Care"
  },
  {
    id: 3,
    title: "The Ultimate Guide to Custom Jewelry Design",
    excerpt: "From initial sketch to final polish, learn how our custom jewelry design process works and how you can bring your dream piece to life.",
    image: "/assets/Rectangle 15.png",
    date: "May 15, 2026",
    category: "Custom Design"
  }
];

export default function BlogPage() {
  const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <motion.h1
          className={styles.heroTitle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          ëlla Journal
        </motion.h1>
        <motion.p
          className={styles.heroSub}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Insights, style guides, and stories behind our craft.
        </motion.p>
      </div>

      <div className={styles.container}>
        <div className={styles.grid}>
          {blogPosts.map((post, idx) => (
            <motion.article
              key={post.id}
              className={styles.card}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <img
                src={post.image.startsWith('http') ? post.image : `${BASE_PATH}${post.image}`}
                alt={post.title}
                className={styles.cardImage}
              />
              <div className={styles.cardBody}>
                <div className={styles.cardMeta}>
                  {post.date} • {post.category}
                </div>
                <h2 className={styles.cardTitle}>{post.title}</h2>
                <p className={styles.cardExcerpt}>{post.excerpt}</p>
                <Link href="#" className={styles.cardLink}>
                  Read More
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
}
