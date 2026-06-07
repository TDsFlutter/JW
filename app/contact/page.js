"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { isFirebaseConfigured, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import styles from "./contact.module.css";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [contacts, setContacts] = useState({
    phone: "+91 98765 43210",
    whatsapp: "+91 98765 43210",
    email: "support@ella-jewelry.com",
    address: "ëlla Jewelry Studio\nDiamond Bourse, BKC\nMumbai, Maharashtra 400051",
    hours: "Monday – Saturday: 10:00 AM – 7:00 PM IST\nSunday: Closed",
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    twitter: "https://twitter.com"
  });

  useEffect(() => {
    if (!isFirebaseConfigured) {
      const cached = localStorage.getItem("mock_contacts");
      if (cached) setContacts(JSON.parse(cached));
      return;
    }
    const unsub = onSnapshot(doc(db, "settings", "contacts"), (docSnap) => {
      if (docSnap.exists()) {
        setContacts(docSnap.data());
      } else {
        const cached = localStorage.getItem("mock_contacts");
        if (cached) setContacts(JSON.parse(cached));
      }
    });
    return () => unsub();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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
          Contact Us
        </motion.h1>
        <motion.p
          className={styles.heroSub}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          We&apos;d love to hear from you
        </motion.p>
      </div>

      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Left: Contact Info */}
          <div className={styles.infoSection}>
            <h2 className={styles.infoTitle}>Get in Touch</h2>

            <div className={styles.infoItem}>
              <div className={styles.infoIcon}>📧</div>
              <div>
                <div className={styles.infoLabel}>Email</div>
                <div className={styles.infoValue}>
                  <a href={`mailto:${contacts.email}`} style={{ color: "inherit", textDecoration: "none" }}>
                    {contacts.email}
                  </a>
                </div>
              </div>
            </div>

            <div className={styles.infoItem}>
              <div className={styles.infoIcon}>📞</div>
              <div>
                <div className={styles.infoLabel}>Phone</div>
                <div className={styles.infoValue}>
                  <a href={`tel:${contacts.phone}`} style={{ color: "inherit", textDecoration: "none" }}>
                    {contacts.phone}
                  </a>
                </div>
              </div>
            </div>

            <div className={styles.infoItem}>
              <div className={styles.infoIcon}>📍</div>
              <div>
                <div className={styles.infoLabel}>Address</div>
                <div className={styles.infoValue} style={{ whiteSpace: "pre-wrap" }}>
                  {contacts.address}
                </div>
              </div>
            </div>

            <div className={styles.infoItem}>
              <div className={styles.infoIcon}>💬</div>
              <div>
                <div className={styles.infoLabel}>WhatsApp</div>
                <div className={styles.infoValue}>
                  <a href={`https://wa.me/${contacts.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
                    {contacts.whatsapp}
                  </a>
                </div>
              </div>
            </div>

            <div className={styles.hours}>
              <div className={styles.hoursTitle}>Business Hours</div>
              <div className={styles.hoursText} style={{ whiteSpace: "pre-wrap" }}>
                {contacts.hours}
              </div>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className={styles.formSection}>
            <h2 className={styles.formTitle}>Send Us a Message</h2>
            {submitted ? (
              <motion.div
                className={styles.success}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <h3>Message Sent! ✓</h3>
                <p>Thank you for reaching out. We&apos;ll respond within 24 hours.</p>
              </motion.div>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.row}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Name *</label>
                    <input className={styles.input} name="name" value={form.name} onChange={handleChange} required placeholder="Your name" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Email *</label>
                    <input className={styles.input} name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Subject *</label>
                  <input className={styles.input} name="subject" value={form.subject} onChange={handleChange} required placeholder="How can we help?" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Message *</label>
                  <textarea className={styles.textarea} name="message" value={form.message} onChange={handleChange} required placeholder="Write your message here..." />
                </div>
                <button className={styles.submitBtn} type="submit" disabled={loading}>
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
