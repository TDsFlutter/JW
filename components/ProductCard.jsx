"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { getImageSrc, isExternalImage } from "@/lib/imageHelper";
import styles from "./ProductCard.module.css";

export default function ProductCard({ product, index = 0 }) {
  const { toggleWishlist, isInWishlist, addToCart } = useCart();
  const discount = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, product.sizes[0], product.metals[0], 1);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const src = getImageSrc(product.images?.[0]);
  const isExt = isExternalImage(src);

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <Link href={`/products/${product.slug}`} className={styles.link}>
        <div className={styles.imageWrap}>
          {isExt ? (
            <img
              src={src}
              alt={product.name}
              className={styles.image}
              style={{ width: "100%", height: "auto", display: "block", aspectRatio: "1/1", objectFit: "cover" }}
            />
          ) : (
            <Image
              src={src || "/assets/image 1.png"}
              alt={product.name}
              width={300}
              height={300}
              className={styles.image}
              style={{ width: "100%", height: "auto" }}
            />
          )}

          {product.badge && (
            <span className={styles.badge}>{product.badge}</span>
          )}

          {discount > 0 && (
            <span className={styles.discount}>-{discount}%</span>
          )}

          <div className={styles.overlay}>
            <button
              className={styles.quickAddBtn}
              onClick={handleQuickAdd}
              aria-label="Quick add to cart"
            >
              Quick Add
            </button>
          </div>

          <button
            className={`${styles.wishlistBtn} ${isInWishlist(product.id) ? styles.wishlistActive : ""}`}
            onClick={handleWishlist}
            aria-label="Toggle wishlist"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist(product.id) ? "var(--crimson)" : "none"} stroke={isInWishlist(product.id) ? "var(--crimson)" : "#666"} strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>

        <div className={styles.info}>
          <div className={styles.priceRow}>
            <span className={styles.price}>₹{product.price.toFixed(2)}</span>
            {product.originalPrice > product.price && (
              <span className={styles.originalPrice}>
                ₹{product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          <h3 className={styles.name}>{product.name}</h3>
          <p className={styles.category}>{product.category}</p>
        </div>
      </Link>
    </motion.div>
  );
}
