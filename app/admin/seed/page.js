"use client";
import { useState } from "react";
import { isFirebaseConfigured, db, rtdb } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { ref, set as dbSet } from "firebase/database";
import { products } from "@/data/products";
import Link from "next/link";

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [success, setSuccess] = useState(false);

  const addLog = (msg) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const handleSeed = async () => {
    setLoading(true);
    setSuccess(false);
    setLogs([]);
    addLog("Starting seeding process...");

    if (!isFirebaseConfigured) {
      addLog("ERROR: Firebase is not configured! Check your environment variables.");
      setLoading(false);
      return;
    }

    try {
      // 1. Seed Products to Firestore and Stock to Realtime DB
      addLog(`Seeding ${products.length} products...`);
      for (const product of products) {
        addLog(`Processing product: ${product.name} (${product.slug})`);
        
        // Write to Firestore /products/{slug} or /products/{id}
        // Let's use the slug as the document ID for clean URLs and queries
        const productRef = doc(db, "products", product.slug);
        await setDoc(productRef, {
          id: product.id,
          name: product.name,
          slug: product.slug,
          category: product.category,
          collection: product.collection || "Uncategorized",
          price: Number(product.price),
          originalPrice: Number(product.originalPrice),
          images: product.images,
          sizes: product.sizes,
          metals: product.metals,
          badge: product.badge || null,
          description: product.description,
          details: product.details,
          care: product.care,
          shipping: product.shipping,
          createdAt: new Date().toISOString()
        });

        // Write initial stock to Realtime Database `/inventory/{slug}`
        if (rtdb) {
          const stockRef = ref(rtdb, `inventory/${product.slug}`);
          await dbSet(stockRef, Number(product.stock));
          addLog(`  -> Stock set to ${product.stock} in Realtime Database`);
        }
      }

      // 2. Seed Default FAQ Content
      addLog("Seeding default FAQs...");
      const faqs = [
        {
          key: "quality",
          question: "Is this jewelry made of real sterling silver?",
          answer: "Yes, all our items are made from premium 92.5% purity solid sterling silver. They are stamped with the 925 mark of quality and authenticity."
        },
        {
          key: "tarnish",
          question: "Will the silver jewelry tarnish over time?",
          answer: "Sterling silver can naturally tarnish when exposed to moisture and air, but we apply thick Platinum or Rose Gold plating to help resist tarnishing. Keeping it dry and clean will preserve its high shine."
        },
        {
          key: "warranty",
          question: "Do you offer any warranty on your rings?",
          answer: "We provide a 6-month product warranty covering manufacturing defects. If you experience issues with plating or stone settings, please contact our support team."
        }
      ];

      for (const faq of faqs) {
        await setDoc(doc(db, "faq", faq.key), faq);
      }
      addLog("FAQs seeded successfully.");

      // 3. Seed Banners and Promo Content
      addLog("Seeding default homepage banners...");
      await setDoc(doc(db, "content", "homepage"), {
        announcement: "FREE SHIPPING WORLDWIDE ON ALL ORDERS OVER $99",
        promoCode: "ELLALUXE15",
        promoDiscount: "15%",
        heroTitle: "Elegant Jewelry Crafted For Modern Luxuries",
        heroSubtitle: "Explore our premium 925 sterling silver rings, bracelets, and pendants designed to elevate every occasion.",
        updatedAt: new Date().toISOString()
      });
      addLog("Content seeded successfully.");

      addLog("Seeding completed successfully! 🎉");
      setSuccess(true);
    } catch (err) {
      console.error(err);
      addLog(`ERROR: ${err.message || "An unexpected error occurred during seeding."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: "600px",
      margin: "60px auto",
      padding: "30px",
      border: "1px solid #eae6df",
      borderRadius: "4px",
      backgroundColor: "#ffffff",
      fontFamily: "var(--font-lato), sans-serif",
      boxShadow: "0 10px 30px rgba(0,0,0,0.03)"
    }}>
      <h1 style={{
        fontFamily: "var(--font-baskerville), serif",
        fontSize: "1.8rem",
        marginBottom: "20px",
        color: "#1a1a1a",
        borderBottom: "1.5px solid #b59410",
        paddingBottom: "10px"
      }}>
        Firebase Seeding Portal
      </h1>
      <p style={{ color: "#555", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "20px" }}>
        This utility seeds the Cloud Firestore database and Realtime Database with standard mock products, categories, default FAQs, and homepage text banners.
      </p>

      {!isFirebaseConfigured && (
        <div style={{
          backgroundColor: "#fffde6",
          border: "1px solid #ffe89e",
          color: "#9c7300",
          padding: "12px",
          fontSize: "0.85rem",
          borderRadius: "2px",
          marginBottom: "20px"
        }}>
          <strong>Firebase is not configured.</strong> Seeding is only available once you set up your <code>.env.local</code> file with valid Firebase project credentials.
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", marginBottom: "30px" }}>
        <button
          onClick={handleSeed}
          disabled={loading || !isFirebaseConfigured}
          style={{
            backgroundColor: loading ? "#777" : "#1a1a1a",
            color: "#ffffff",
            border: "none",
            padding: "12px 24px",
            fontSize: "0.9rem",
            fontWeight: "600",
            cursor: loading || !isFirebaseConfigured ? "not-allowed" : "pointer",
            textTransform: "uppercase",
            letterSpacing: "1px",
            transition: "background-color 0.2s"
          }}
        >
          {loading ? "Seeding..." : "Seed Database"}
        </button>
        <Link 
          href="/admin" 
          style={{
            display: "inline-block",
            border: "1px solid #1a1a1a",
            color: "#1a1a1a",
            padding: "10px 20px",
            fontSize: "0.9rem",
            textDecoration: "none",
            textTransform: "uppercase",
            letterSpacing: "1px",
            fontWeight: "600",
            textAlign: "center"
          }}
        >
          Go to Admin
        </Link>
      </div>

      <h3 style={{ fontSize: "1rem", color: "#1a1a1a", marginBottom: "10px" }}>Console Logs</h3>
      <div style={{
        height: "220px",
        overflowY: "auto",
        backgroundColor: "#faf9f6",
        border: "1px solid #eae6df",
        padding: "15px",
        fontSize: "0.8rem",
        fontFamily: "monospace",
        color: "#444",
        whiteSpace: "pre-wrap",
        lineHeight: "1.5"
      }}>
        {logs.length === 0 ? (
          <span style={{ color: "#999" }}>Logs will appear here once the process starts...</span>
        ) : (
          logs.map((log, idx) => <div key={idx}>{log}</div>)
        )}
      </div>
    </div>
  );
}
