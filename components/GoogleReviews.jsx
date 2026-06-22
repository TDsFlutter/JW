"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import { trackEvent } from "@/lib/firebase";
import styles from "./GoogleReviews.module.css";

// ---- Star rendering helpers ----

function StarRating({ rating, className = "", starClass, emptyClass }) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
  const roundUp = rating - fullStars >= 0.75;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars || (roundUp && i === fullStars)) {
      stars.push(
        <span key={i} className={starClass || styles.star}>
          ★
        </span>
      );
    } else if (hasHalf && i === fullStars) {
      stars.push(
        <span key={i} className={styles.starHalf}>
          ★
        </span>
      );
    } else {
      stars.push(
        <span key={i} className={emptyClass || styles.starEmpty}>
          ★
        </span>
      );
    }
  }

  return <div className={className}>{stars}</div>;
}

// ---- Review Card ----

function ReviewCard({ review, index }) {
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const MAX_TEXT = 150;
  const isLong = review.text && review.text.length > MAX_TEXT;
  const displayText =
    !isLong || expanded ? review.text : review.text.slice(0, MAX_TEXT) + "…";

  const initials = (review.authorName || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      className={styles.reviewCard}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <div className={styles.cardHeader}>
        {review.authorPhotoUri && !imgError ? (
          <img
            src={review.authorPhotoUri}
            alt={review.authorName}
            className={styles.authorPhoto}
            loading="lazy"
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className={styles.authorFallback}>{initials}</div>
        )}
        <div className={styles.authorInfo}>
          {review.authorUri ? (
            <a
              href={review.authorUri}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.authorNameLink}
            >
              <span className={styles.authorName}>{review.authorName}</span>
            </a>
          ) : (
            <span className={styles.authorName}>{review.authorName}</span>
          )}
          <div className={styles.reviewMeta}>
            <StarRating
              rating={review.rating}
              className={styles.cardStars}
              starClass={styles.cardStar}
              emptyClass={styles.cardStarEmpty}
            />
            {review.relativeTime && (
              <span className={styles.reviewDate}>{review.relativeTime}</span>
            )}
          </div>
        </div>
      </div>

      <p className={styles.reviewText}>
        {displayText}
        {isLong && (
          <button
            className={styles.readMore}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </p>
    </motion.div>
  );
}

// ---- Main Component ----

export default function GoogleReviews() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sectionRef = useRef(null);
  const carouselRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const hasTrackedView = useRef(false);

  // ---- Fetch reviews from our API ----
  useEffect(() => {
    let cancelled = false;

    async function fetchReviews() {
      try {
        const res = await fetch("/api/reviews?limit=5");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    fetchReviews();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Analytics: track widget viewed ----
  useEffect(() => {
    if (isInView && !hasTrackedView.current && data?.business) {
      hasTrackedView.current = true;
      trackEvent("reviews_widget_viewed", {
        business_name: data.business.businessName,
        rating: data.business.rating,
        review_count: data.reviews?.length || 0,
      });
    }
  }, [isInView, data]);

  // ---- Carousel scroll ----
  const scroll = useCallback(
    (direction) => {
      const el = carouselRef.current;
      if (!el) return;
      const cardWidth = el.querySelector(`.${styles.reviewCard}`)?.offsetWidth || 340;
      const scrollAmount = direction === "left" ? -(cardWidth + 24) : cardWidth + 24;
      el.scrollBy({ left: scrollAmount, behavior: "smooth" });
      trackEvent("review_carousel_interaction", { direction });
    },
    []
  );

  // ---- Carousel arrow visibility ----
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    // Initial check
    updateScrollButtons();
    return () => el.removeEventListener("scroll", updateScrollButtons);
  }, [loading, updateScrollButtons]);

  // ---- View more handler ----
  const handleViewMore = useCallback(() => {
    trackEvent("review_view_more_clicked", {
      business_name: data?.business?.businessName || "",
    });
  }, [data]);

  // ---- Render ----

  return (
    <section className={styles.section} id="google-reviews" ref={sectionRef}>
      <div className={styles.container}>
        {/* Section Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.sectionLabel}>Customer Reviews</div>
          <h2 className={styles.sectionTitle}>What Our Customers Say</h2>
          <p className={styles.sectionSubtitle}>
            Real reviews from our valued customers on Google
          </p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <>
            <div className={styles.skeletonBadge} />
            <div className={styles.skeletonCards}>
              <div className={styles.skeletonCard} />
              <div className={styles.skeletonCard} />
              <div className={styles.skeletonCard} />
            </div>
          </>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>⚠️</div>
            <p>Unable to load reviews right now. Please try again later.</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && (!data?.reviews || data.reviews.length === 0) && (
          <div className={styles.emptyState}>
            <p>No reviews available yet. Check back soon!</p>
          </div>
        )}

        {/* Loaded State */}
        {!loading && !error && data?.business && data.reviews?.length > 0 && (
          <>
            {/* Google Badge */}
            <motion.div
              className={styles.googleBadge}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className={styles.googleLogo}>
                <span>G</span>
                <span>o</span>
                <span>o</span>
                <span>g</span>
                <span>l</span>
                <span>e</span>
              </div>
              <div className={styles.badgeDivider} />
              <div className={styles.badgeInfo}>
                <span className={styles.ratingValue}>
                  {data.business.rating?.toFixed(1) || "0.0"}
                </span>
                <StarRating
                  rating={data.business.rating || 0}
                  className={styles.starsRow}
                />
                <span className={styles.reviewCount}>
                  Based on {data.business.totalReviews || 0} reviews
                </span>
              </div>
            </motion.div>

            {/* Review Carousel */}
            <div className={styles.carouselWrapper}>
              <button
                className={`${styles.carouselArrow} ${styles.arrowLeft} ${
                  !canScrollLeft ? styles.arrowHidden : ""
                }`}
                onClick={() => scroll("left")}
                aria-label="Scroll reviews left"
              >
                ‹
              </button>

              <div className={styles.carousel} ref={carouselRef}>
                {data.reviews.map((review, idx) => (
                  <ReviewCard
                    key={`${review.authorName}-${idx}`}
                    review={review}
                    index={idx}
                  />
                ))}
              </div>

              <button
                className={`${styles.carouselArrow} ${styles.arrowRight} ${
                  !canScrollRight ? styles.arrowHidden : ""
                }`}
                onClick={() => scroll("right")}
                aria-label="Scroll reviews right"
              >
                ›
              </button>
            </div>

            {/* View All Button */}
            {data.business.googleMapsUri && (
              <div className={styles.viewAllWrap}>
                <a
                  href={data.business.googleMapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.viewAllBtn}
                  onClick={handleViewMore}
                >
                  View All Reviews on Google
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
