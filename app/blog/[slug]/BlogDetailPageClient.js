"use client";
import { use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { blogPosts } from "@/data/blog";
import styles from "../blog.module.css";

export default function BlogDetailPageClient({ params }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const post = blogPosts.find((p) => p.slug === slug);
  const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

  if (!post) {
    return (
      <div className={styles.detailContainer}>
        <h1 className={styles.title}>Post Not Found</h1>
        <p>The journal entry you are looking for does not exist.</p>
        <Link href="/blog" className={styles.backLink}>
          ← Back to Journal
        </Link>
      </div>
    );
  }

  const imageSrc = post.image.startsWith('http') ? post.image : `${BASE_PATH}${post.image}`;

  return (
    <div className={styles.page}>
      <div className={styles.detailContainer}>
        <Link href="/blog" className={styles.backLink}>
          ← Back to Journal
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.meta}>
            {post.date} • {post.category}
          </div>
          <h1 className={styles.title}>{post.title}</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <img
            src={imageSrc}
            alt={post.title}
            className={styles.mainImage}
          />
        </motion.div>

        <motion.div
          className={styles.content}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {post.content}
        </motion.div>
      </div>
    </div>
  );
}
