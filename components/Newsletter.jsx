"use client";
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import styles from "./Newsletter.module.css";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    setTimeout(() => {
      setStatus("success");
      setEmail("");
    }, 1200);
  };

  return (
    <section className={styles.section} id="newsletter-signup" ref={ref}>
      <div className={styles.container}>
        <motion.div
          className={styles.content}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className={styles.title}>NEWSLETTER SIGN UP</h2>
          <p className={styles.subtitle}>Sign up for new arrivals, offers, and more!</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              type="email"
              placeholder="Enter Your Email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "loading"}
              required
              id="newsletter-email-input"
            />
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={status === "loading"}
              id="newsletter-submit-button"
            >
              {status === "loading" ? "SUBMITTING..." : "SUBMIT"}
            </button>
          </form>

          {status === "success" && (
            <motion.p
              className={styles.successMsg}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Thank you for subscribing!
            </motion.p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
