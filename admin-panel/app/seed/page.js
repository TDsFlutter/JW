"use client";
import { useState } from "react";
import { isFirebaseConfigured, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
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
      // 1. Seed Products to Firestore
      addLog(`Seeding ${products.length} products...`);
      for (const product of products) {
        addLog(`Processing product: ${product.name} (${product.slug})`);
        
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
      }

      // 2. Seed Default FAQ Content
      addLog("Seeding default FAQs...");
      const faqs = [
        { key: "moissanite", category: "Product & Quality", question: "What is moissanite?", answer: "Moissanite is a lab-created gemstone that rivals the brilliance and fire of natural diamonds. It ranks 9.25 on the Mohs hardness scale, making it one of the hardest gemstones available — perfect for everyday wear." },
        { key: "silver", category: "Product & Quality", question: "Is your jewelry made of real sterling silver?", answer: "Yes! All our jewelry is crafted from premium 92.5% purity solid sterling silver (925 silver). Each piece is stamped with the 925 mark of quality and authenticity." },
        { key: "tarnish", category: "Product & Quality", question: "Will the silver tarnish over time?", answer: "Sterling silver can naturally tarnish when exposed to moisture and chemicals, but we apply thick Platinum, Rose Gold, or 18K Gold plating to help resist tarnishing. With proper care, your piece will maintain its shine for years." },
        { key: "certificate", category: "Product & Quality", question: "Do you provide a certificate of authenticity?", answer: "Yes, every order includes a TGL (Transnational Gemmological Laboratory) Certificate of Authenticity verifying the quality and specifications of your moissanite gemstone." },
        { key: "shipping-time", category: "Orders & Shipping", question: "How long does shipping take?", answer: "We offer free worldwide shipping. Domestic orders (India) are delivered in 5-7 business days. International orders typically arrive within 10-15 business days, depending on your location and customs clearance." },
        { key: "shipping-intl", category: "Orders & Shipping", question: "Do you ship internationally?", answer: "Yes! We ship to 30+ countries worldwide. International shipping is free on orders above ₹2,999 / $99." },
        { key: "tracking", category: "Orders & Shipping", question: "Can I track my order?", answer: "Absolutely. Once your order is shipped, you will receive a tracking number via email and SMS. You can track your package in real-time through our website or the courier's tracking portal." },
        { key: "return-policy", category: "Returns & Exchanges", question: "What is your return policy?", answer: "We offer a 15-day exchange policy. If you receive a defective product or the wrong item, we will arrange a full refund or replacement. Since all our products are custom-made, we do not accept returns for change of mind." },
        { key: "initiate-return", category: "Returns & Exchanges", question: "How do I initiate a return or exchange?", answer: "Contact our support team at support@ella-jewelry.com with your order number, photos of the product, and a description of the issue. We will respond within 24 hours with instructions." },
        { key: "warranty", category: "Returns & Exchanges", question: "Do you offer a warranty?", answer: "Yes, we provide a 6-month product warranty covering manufacturing defects including issues with plating, stone settings, and structural integrity." },
        { key: "payment-methods", category: "Payment & Pricing", question: "What payment methods do you accept?", answer: "We accept all major credit/debit cards, UPI, net banking, and popular wallets. We also support Cash on Delivery (COD) for orders within India." },
        { key: "hidden-charges", category: "Payment & Pricing", question: "Are there any hidden charges?", answer: "No. The price you see is the price you pay. We do not charge any additional processing fees, and shipping is free on qualifying orders." },
        { key: "bulk-orders", category: "Payment & Pricing", question: "Do you offer discounts on bulk orders?", answer: "Yes! For bulk or wholesale inquiries, please use our Ask Price page or contact us directly at support@ella-jewelry.com." }
      ];

      for (const faq of faqs) {
        await setDoc(doc(db, "faq", faq.key), faq);
      }
      addLog("FAQs seeded successfully.");

      // 3. Seed Default Blogs
      addLog("Seeding default Blogs...");
      const blogsData = [
        {
          slug: "choose-perfect-moissanite-engagement-ring",
          title: "How to Choose the Perfect Moissanite Engagement Ring",
          excerpt: "Discover the key differences between moissanite and diamonds, and how to select the right cut, setting, and metal for your special someone.",
          image: "/assets/Rectangle 13.png",
          date: "June 5, 2026",
          category: "Buying Guide",
          content: "Choosing an engagement ring is one of the most significant decisions you will make."
        },
        {
          slug: "caring-for-your-925-sterling-silver-jewelry",
          title: "Caring for Your 925 Sterling Silver Jewelry",
          excerpt: "Keep your sterling silver shining bright for years to come with our simple care instructions.",
          image: "/assets/Rectangle 14.png",
          date: "May 28, 2026",
          category: "Jewelry Care",
          content: "925 sterling silver is a beloved metal for fine jewelry due to its beautiful luster."
        },
        {
          slug: "ultimate-guide-to-custom-jewelry-design",
          title: "The Ultimate Guide to Custom Jewelry Design",
          excerpt: "From initial sketch to final polish, learn how our custom jewelry design process works.",
          image: "/assets/Rectangle 15.png",
          date: "May 15, 2026",
          category: "Custom Design",
          content: "Have you ever dreamed of a piece of jewelry that is uniquely yours?"
        }
      ];

      for (const blog of blogsData) {
        await setDoc(doc(db, "blogs", blog.slug), blog);
      }
      addLog("Blogs seeded successfully.");

      // 4. Seed Contacts & Social Settings
      addLog("Seeding default contacts and socials...");
      await setDoc(doc(db, "settings", "contacts"), {
        phone: "+91 98765 43210",
        whatsapp: "+91 98765 43210",
        email: "support@ella-jewelry.com",
        address: "ORNIVAJEWELS Jewelry Studio\nDiamond Bourse, BKC\nMumbai, Maharashtra 400051",
        hours: "Monday – Saturday: 10:00 AM – 7:00 PM IST\nSunday: Closed",
        instagram: "https://instagram.com",
        facebook: "https://facebook.com",
        twitter: "https://twitter.com"
      });
      addLog("Contacts and Socials seeded successfully.");

      // 5. Seed Banners and Promo Content
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
          href="/" 
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
