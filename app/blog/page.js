"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { isFirebaseConfigured, db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { blogPosts } from "@/data/blog";
import styles from "./blog.module.css";

export default function BlogPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

  useEffect(() => {
    if (!isFirebaseConfigured) {
      const cached = localStorage.getItem("mock_blogs");
      setBlogs(cached ? JSON.parse(cached) : blogPosts);
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      collection(db, "blogs"),
      (querySnapshot) => {
        const fetched = [];
        querySnapshot.forEach((doc) => {
          fetched.push({ id: doc.id, ...doc.data() });
        });
        setBlogs(fetched.length > 0 ? fetched : blogPosts);
        setLoading(false);
      },
      (e) => {
        console.error("Error loading blogs from Firestore:", e);
        setBlogs(blogPosts);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#707070", fontStyle: "italic" }}>Loading Ella Journal...</p>
      </div>
    );
  }

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
          {blogs.map((post, idx) => (
            <motion.article
              key={post.id || post.slug || idx}
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
                <Link href={`/blog/${post.slug}`} className={styles.cardLink}>
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
