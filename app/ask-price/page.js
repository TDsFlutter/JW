"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import styles from "./askprice.module.css";

export default function AskPricePage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", productType: "Ring", metal: "Sterling Silver", size: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate submission delay
    await new Promise((r) => setTimeout(r, 1500));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <motion.h1
          className={styles.heroTitle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Ask Price
        </motion.h1>
        <motion.p
          className={styles.heroSub}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Interested in a custom piece or want a price quote? Fill out the form below and our team will get back to you within 24 hours.
        </motion.p>
      </div>

      <div className={styles.container}>
        {submitted ? (
          <motion.div
            className={styles.success}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <h2>Thank You! 🎉</h2>
            <p>We&apos;ve received your price inquiry. Our team will review your request and respond to <strong>{form.email}</strong> within 24 hours.</p>
          </motion.div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Full Name *</label>
                <input className={styles.input} name="name" value={form.name} onChange={handleChange} required placeholder="Your full name" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email *</label>
                <input className={styles.input} name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Phone Number</label>
                <input className={styles.input} name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Product Type *</label>
                <select className={styles.select} name="productType" value={form.productType} onChange={handleChange}>
                  <option>Ring</option>
                  <option>Bracelet</option>
                  <option>Pendant</option>
                  <option>Earring</option>
                  <option>Necklace</option>
                  <option>Custom Design</option>
                </select>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Preferred Metal</label>
                <select className={styles.select} name="metal" value={form.metal} onChange={handleChange}>
                  <option>Sterling Silver</option>
                  <option>18K Gold Plate</option>
                  <option>Rose Gold</option>
                  <option>Platinum</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Size (if applicable)</label>
                <input className={styles.input} name="size" value={form.size} onChange={handleChange} placeholder="e.g. Ring size 7" />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Message / Description *</label>
              <textarea
                className={styles.textarea}
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                placeholder="Describe the piece you're interested in, any customization requests, or paste a product link..."
              />
            </div>

            <button className={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? "Sending..." : "Submit Inquiry"}
            </button>
            <p className={styles.note}>We typically respond within 24 hours on business days.</p>
          </form>
        )}
      </div>
    </div>
  );
}
