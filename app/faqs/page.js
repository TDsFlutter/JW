"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { isFirebaseConfigured, db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import styles from "./faqs.module.css";

const defaultFaqsData = {
  "Product & Quality": [
    { q: "What is moissanite?", a: "Moissanite is a lab-created gemstone that rivals the brilliance and fire of natural diamonds. It ranks 9.25 on the Mohs hardness scale, making it one of the hardest gemstones available — perfect for everyday wear." },
    { q: "Is your jewelry made of real sterling silver?", a: "Yes! All our jewelry is crafted from premium 92.5% purity solid sterling silver (925 silver). Each piece is stamped with the 925 mark of quality and authenticity." },
    { q: "Will the silver tarnish over time?", a: "Sterling silver can naturally tarnish when exposed to moisture and chemicals, but we apply thick Platinum, Rose Gold, or 18K Gold plating to help resist tarnishing. With proper care, your piece will maintain its shine for years." },
    { q: "Do you provide a certificate of authenticity?", a: "Yes, every order includes a TGL (Transnational Gemmological Laboratory) Certificate of Authenticity verifying the quality and specifications of your moissanite gemstone." },
  ],
  "Orders & Shipping": [
    { q: "How long does shipping take?", a: "We offer free worldwide shipping. Domestic orders (India) are delivered in 5-7 business days. International orders typically arrive within 10-15 business days, depending on your location and customs clearance." },
    { q: "Do you ship internationally?", a: "Yes! We ship to 30+ countries worldwide. International shipping is free on orders above ₹2,999 / $99." },
    { q: "Can I track my order?", a: "Absolutely. Once your order is shipped, you will receive a tracking number via email and SMS. You can track your package in real-time through our website or the courier's tracking portal." },
  ],
  "Returns & Exchanges": [
    { q: "What is your return policy?", a: "We offer a 15-day exchange policy. If you receive a defective product or the wrong item, we will arrange a full refund or replacement. Since all our products are custom-made, we do not accept returns for change of mind." },
    { q: "How do I initiate a return or exchange?", a: "Contact our support team at support@ella-jewelry.com with your order number, photos of the product, and a description of the issue. We will respond within 24 hours with instructions." },
    { q: "Do you offer a warranty?", a: "Yes, we provide a 6-month product warranty covering manufacturing defects including issues with plating, stone settings, and structural integrity." },
  ],
  "Payment & Pricing": [
    { q: "What payment methods do you accept?", a: "We accept all major credit/debit cards, UPI, net banking, and popular wallets. We also support Cash on Delivery (COD) for orders within India." },
    { q: "Are there any hidden charges?", a: "No. The price you see is the price you pay. We do not charge any additional processing fees, and shipping is free on qualifying orders." },
    { q: "Do you offer discounts on bulk orders?", a: "Yes! For bulk or wholesale inquiries, please use our Ask Price page or contact us directly at support@ella-jewelry.com." },
  ],
};

export default function FaqsPage() {
  const [openIndex, setOpenIndex] = useState(null);
  const [faqsList, setFaqsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      const cached = localStorage.getItem("mock_faqs");
      if (cached) {
        setFaqsList(JSON.parse(cached));
      } else {
        const flattened = [];
        Object.entries(defaultFaqsData).forEach(([category, items]) => {
          items.forEach((item, idx) => {
            flattened.push({ id: `${category}-${idx}`, category, q: item.q, a: item.a });
          });
        });
        setFaqsList(flattened);
        localStorage.setItem("mock_faqs", JSON.stringify(flattened));
      }
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(collection(db, "faq"), (querySnapshot) => {
      const fetched = [];
      querySnapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() });
      });
      
      if (fetched.length === 0) {
        const flattened = [];
        Object.entries(defaultFaqsData).forEach(([category, items]) => {
          items.forEach((item, idx) => {
            flattened.push({ id: `${category}-${idx}`, category, q: item.q, a: item.a });
          });
        });
        setFaqsList(flattened);
      } else {
        setFaqsList(fetched);
      }
      setLoading(false);
    }, (e) => {
      console.error("Error loading FAQs:", e);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const toggle = (key) => setOpenIndex(openIndex === key ? null : key);

  // Group by category
  const groupedFaqs = faqsList.reduce((acc, item) => {
    const cat = item.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push({ 
      q: item.q || item.question || "", 
      a: item.a || item.answer || "", 
      id: item.id 
    });
    return acc;
  }, {});

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#707070", fontStyle: "italic" }}>Loading FAQs...</p>
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
          Frequently Asked Questions
        </motion.h1>
        <motion.p
          className={styles.heroSub}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Everything you need to know
        </motion.p>
      </div>

      <div className={styles.container}>
        {Object.entries(groupedFaqs).map(([category, items]) => (
          <div key={category}>
            <h2 className={styles.categoryTitle}>{category}</h2>
            {items.map((faq, idx) => {
              const key = `${category}-${idx}-${faq.id}`;
              const isOpen = openIndex === key;
              return (
                <div className={styles.item} key={key}>
                  <button className={styles.question} onClick={() => toggle(key)}>
                    {faq.q}
                    <span className={`${styles.icon} ${isOpen ? styles.iconOpen : ""}`}>+</span>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        className={styles.answer}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className={styles.ctaSection}>
        <p className={styles.ctaText}>Still have questions? We&apos;re here to help.</p>
        <Link href="/contact" className={styles.ctaBtn}>Contact Us</Link>
      </div>
    </div>
  );
}
