"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import styles from "./ProductReviews.module.css";

const SORT_OPTIONS = [
  { value: "rating_high", label: "Highest rated" },
  { value: "rating_low", label: "Lowest rated" },
];

const PAGE_SIZE = 10;

/** Read-only star row. `value` may be fractional; rounds to nearest for fill. */
function Stars({ value = 0, size = 16 }) {
  const rounded = Math.round(value);
  return (
    <span className={styles.starRow} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill={i <= rounded ? "#C8A951" : "none"}
          stroke="#C8A951"
          strokeWidth="1.5"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

export default function ProductReviews({ productSlug, productId, onSummaryChange }) {
  const { currentUser, userProfile } = useAuth();
  const { productReviewsEnabled } = useSettings();

  const [summary, setSummary] = useState({ average: 0, count: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [sort, setSort] = useState("rating_high");
  const [ratingFilter, setRatingFilter] = useState(null);

  // Submission form
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  // The signed-in user's own review (any status), for self-management.
  const [myReview, setMyReview] = useState(null);
  const [editing, setEditing] = useState(false);

  const authHeaders = useCallback(async () => {
    if (!currentUser) return null;
    let token = currentUser.uid; // mock fallback
    if (isFirebaseConfigured && auth?.currentUser) {
      try {
        token = await auth.currentUser.getIdToken();
      } catch (e) {
        console.error("Error getting ID token:", e);
      }
    }
    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  }, [currentUser]);

  const fetchPage = useCallback(
    async (pageNum, { append = false } = {}) => {
      if (!productSlug) return;
      append ? setLoadingMore(true) : setLoading(true);
      setError("");
      try {
        const qs = new URLSearchParams({ page: String(pageNum), limit: String(PAGE_SIZE), sort });
        if (ratingFilter) qs.set("rating", String(ratingFilter));
        const res = await fetch(`/api/products/${productSlug}/reviews?${qs.toString()}`);
        if (!res.ok) throw new Error("Failed to load reviews");
        const data = await res.json();

        setSummary(data.summary);
        onSummaryChange?.(data.summary);
        setTotalPages(data.totalPages || 1);
        setPage(data.page || pageNum);
        setReviews((prev) => (append ? [...prev, ...(data.reviews || [])] : data.reviews || []));
      } catch (e) {
        console.error("Error loading product reviews:", e);
        if (!append) setReviews([]);
        setError("Unable to load reviews right now.");
      } finally {
        append ? setLoadingMore(false) : setLoading(false);
      }
    },
    [productSlug, sort, ratingFilter, onSummaryChange]
  );

  // (Re)load from page 1 whenever the filter/sort changes.
  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  // Load the user's own review (incl. pending/rejected) so they can manage it.
  const fetchMine = useCallback(async () => {
    if (!currentUser) {
      setMyReview(null);
      return;
    }
    const headers = await authHeaders();
    if (!headers) return;
    try {
      const res = await fetch(`/api/products/${productSlug}/reviews/mine`, { headers });
      if (res.ok) {
        const data = await res.json();
        setMyReview(data.review || null);
      }
    } catch (e) {
      /* non-critical */
    }
  }, [currentUser, productSlug, authHeaders]);

  useEffect(() => {
    fetchMine();
  }, [fetchMine]);

  const STATUS_LABEL = { pending: "Pending approval", approved: "Published", rejected: "Not approved" };

  const startEdit = () => {
    if (!myReview) return;
    setFormRating(myReview.rating);
    setFormTitle(myReview.title);
    setFormBody(myReview.body);
    setEditing(true);
    setFormError("");
    setFormSuccess("");
  };

  const cancelEdit = () => {
    setEditing(false);
    setFormError("");
    setFormSuccess("");
  };

  const handleDeleteMine = async () => {
    if (!myReview) return;
    if (!window.confirm("Delete your review? This cannot be undone.")) return;
    const headers = await authHeaders();
    if (!headers) return;
    try {
      const res = await fetch(`/api/products/${productSlug}/reviews/${myReview._id}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        setMyReview(null);
        setEditing(false);
        setFormTitle("");
        setFormBody("");
        setFormRating(5);
        setFormSuccess("Your review was deleted.");
        fetchPage(1);
      } else {
        const d = await res.json().catch(() => ({}));
        setFormError(d.error || "Failed to delete review.");
      }
    } catch (e) {
      setFormError("Something went wrong. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    const headers = await authHeaders();
    if (!headers) {
      setFormError("Please sign in to leave a review.");
      return;
    }
    if (formTitle.trim().length < 3) {
      setFormError("Please add a short title (at least 3 characters).");
      return;
    }
    if (formBody.trim().length < 10) {
      setFormError("Please write at least 10 characters about your experience.");
      return;
    }

    setSubmitting(true);
    const isEdit = editing && myReview;
    const url = isEdit
      ? `/api/products/${productSlug}/reviews/${myReview._id}`
      : `/api/products/${productSlug}/reviews`;
    try {
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers,
        body: JSON.stringify({
          rating: formRating,
          title: formTitle.trim(),
          body: formBody.trim(),
          author_name: userProfile?.displayName || currentUser?.displayName || "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        // Already reviewed — switch to managing the existing review.
        setFormError("You've already reviewed this product — you can edit your review below.");
        setEditing(false);
        await fetchMine();
      } else if (!res.ok) {
        setFormError(data.error || "Failed to submit review.");
      } else {
        setFormSuccess(data.message || "Thank you for your review!");
        setEditing(false);
        await fetchMine(); // shows the user their own review (incl. pending) immediately
        fetchPage(1); // refresh public list/summary if it went live
      }
    } catch (e) {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const maxBreakdown = Math.max(1, ...Object.values(summary.breakdown || {}));

  // Hidden entirely when product reviews are disabled in the admin settings.
  if (!productReviewsEnabled) return null;

  return (
    <section className={styles.section} id="reviews">
      <h2 className={styles.title}>Customer Reviews</h2>

      <div className={styles.layout}>
        {/* ── Left: summary + form ── */}
        <aside className={styles.sidebar}>
          <div className={styles.summaryCard}>
            <div className={styles.avgNumber}>{(summary.average || 0).toFixed(1)}</div>
            <Stars value={summary.average} size={20} />
            <div className={styles.summaryCount}>
              {summary.count > 0
                ? `Based on ${summary.count} review${summary.count === 1 ? "" : "s"}`
                : "No reviews yet"}
            </div>

            {summary.count > 0 && (
              <div className={styles.breakdown}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const c = summary.breakdown?.[star] || 0;
                  const active = ratingFilter === star;
                  return (
                    <button
                      key={star}
                      type="button"
                      className={`${styles.breakdownRow} ${active ? styles.breakdownActive : ""}`}
                      onClick={() => setRatingFilter(active ? null : star)}
                      title={`Show ${star}-star reviews`}
                    >
                      <span className={styles.breakdownLabel}>{star}★</span>
                      <span className={styles.barTrack}>
                        <span className={styles.barFill} style={{ width: `${(c / maxBreakdown) * 100}%` }} />
                      </span>
                      <span className={styles.breakdownCount}>{c}</span>
                    </button>
                  );
                })}
                {ratingFilter && (
                  <button type="button" className={styles.clearFilter} onClick={() => setRatingFilter(null)}>
                    Clear filter
                  </button>
                )}
              </div>
            )}
          </div>

          <div className={styles.formCard}>
            {currentUser ? (
              myReview && !editing ? (
                <div className={styles.myReview}>
                  <div className={styles.myReviewTop}>
                    <h3 className={styles.formTitle}>Your Review</h3>
                    <span className={`${styles.statusBadge} ${styles["status_" + myReview.status]}`}>
                      {STATUS_LABEL[myReview.status] || myReview.status}
                    </span>
                  </div>
                  {myReview.status === "pending" && (
                    <p className={styles.statusNote}>Thanks! Your review is awaiting approval and isn&apos;t public yet.</p>
                  )}
                  {myReview.status === "rejected" && (
                    <p className={styles.statusNote}>This review wasn&apos;t approved. You can edit it to resubmit.</p>
                  )}
                  {formSuccess && <div className={styles.successMsg}>✓ {formSuccess}</div>}
                  {formError && <div className={styles.errorMsg}>{formError}</div>}
                  <Stars value={myReview.rating} size={16} />
                  <h4 className={styles.myReviewTitle}>{myReview.title}</h4>
                  <p className={styles.myReviewBody}>{myReview.body}</p>
                  {myReview.admin_reply?.text && (
                    <div className={styles.adminReply}>
                      <span className={styles.adminReplyLabel}>Response from the boutique</span>
                      <p>{myReview.admin_reply.text}</p>
                    </div>
                  )}
                  <div className={styles.myReviewActions}>
                    <button type="button" className={styles.editBtn} onClick={startEdit}>Edit</button>
                    <button type="button" className={styles.deleteBtn} onClick={handleDeleteMine}>Delete</button>
                  </div>
                </div>
              ) : (
              <form onSubmit={handleSubmit}>
                <h3 className={styles.formTitle}>{editing ? "Edit Your Review" : "Write a Review"}</h3>
                {formSuccess && <div className={styles.successMsg}>✓ {formSuccess}</div>}
                {formError && <div className={styles.errorMsg}>{formError}</div>}

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Your Rating</label>
                  <div className={styles.starSelector}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`${styles.starBtn} ${formRating >= star ? styles.starBtnActive : ""}`}
                        onClick={() => setFormRating(star)}
                        aria-label={`${star} star${star === 1 ? "" : "s"}`}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="pr-title" className={styles.formLabel}>Review Title</label>
                  <input
                    id="pr-title"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Beautiful craftsmanship, highly recommend!"
                    maxLength={100}
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="pr-body" className={styles.formLabel}>Your Review</label>
                  <textarea
                    id="pr-body"
                    className={styles.textarea}
                    placeholder="Share your experience wearing this piece..."
                    maxLength={2000}
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formActions}>
                  <button type="submit" className={styles.submitBtn} disabled={submitting}>
                    {submitting ? "Submitting…" : editing ? "Update Review" : "Submit Review"}
                  </button>
                  {editing && (
                    <button type="button" className={styles.cancelBtn} onClick={cancelEdit} disabled={submitting}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
              )
            ) : (
              <div className={styles.signInPrompt}>
                <p>Please sign in to share your experience.</p>
                <Link href={`/login?redirect=/products/${productSlug}`} className={styles.signInBtn}>
                  Sign In to Review
                </Link>
              </div>
            )}
          </div>
        </aside>

        {/* ── Right: review list ── */}
        <div className={styles.listColumn}>
          <div className={styles.listHeader}>
            <span className={styles.listCount}>
              {summary.count} review{summary.count === 1 ? "" : "s"}
              {ratingFilter ? ` · ${ratingFilter}★` : ""}
            </span>
            <label className={styles.sortWrap}>
              <span>Sort by</span>
              <select className={styles.sortSelect} value={sort} onChange={(e) => setSort(e.target.value)}>
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>

          {loading ? (
            <div className={styles.skeletonWrap}>
              {[0, 1, 2].map((i) => (
                <div key={i} className={styles.skeletonCard} />
              ))}
            </div>
          ) : error ? (
            <div className={styles.emptyState}>{error}</div>
          ) : reviews.length === 0 ? (
            <div className={styles.emptyState}>
              {ratingFilter
                ? "No reviews match this filter yet."
                : "No reviews yet for this product. Be the first to leave a review!"}
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {reviews.map((review) => (
                <motion.article
                  key={review._id}
                  className={styles.reviewCard}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className={styles.reviewHead}>
                    <div>
                      <div className={styles.authorRow}>
                        <span className={styles.author}>{review.author_name}</span>
                        {review.verified_purchase && (
                          <span className={styles.verifiedBadge}>✓ Verified Purchase</span>
                        )}
                      </div>
                      <span className={styles.reviewDate}>
                        {new Date(review.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <Stars value={review.rating} size={14} />
                  </div>

                  <h4 className={styles.reviewTitle}>{review.title}</h4>
                  <p className={styles.reviewBody}>{review.body}</p>

                  {review.admin_reply?.text && (
                    <div className={styles.adminReply}>
                      <span className={styles.adminReplyLabel}>Response from the boutique</span>
                      <p>{review.admin_reply.text}</p>
                    </div>
                  )}
                </motion.article>
              ))}
            </AnimatePresence>
          )}

          {!loading && page < totalPages && (
            <button
              type="button"
              className={styles.loadMoreBtn}
              onClick={() => fetchPage(page + 1, { append: true })}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading…" : "Load more reviews"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
