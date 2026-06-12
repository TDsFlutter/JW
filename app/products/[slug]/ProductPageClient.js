"use client";

import { useState, useRef, use, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getProductBySlug, getRelatedProducts } from "@/data/products";
import { getImageSrc, isExternalImage } from "@/lib/imageHelper";
import { buildProductMessage, openWhatsApp } from "@/lib/whatsapp";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductCard from "@/components/ProductCard";
import styles from "./product.module.css";

export default function ProductPageClient({ params }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch product from Backend API or fallback to mock data
  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001";
    fetch(`${ADMIN_URL}/api/products/${slug}`)
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Not found");
      })
      .then(data => {
        setProduct(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching product from API, falling back to mock:", err);
        const mockProduct = getProductBySlug(slug);
        setProduct(mockProduct);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className={styles.notFound}>
        <p style={{ color: "#707070", fontStyle: "italic" }}>Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.notFound}>
        <h1>Product Not Found</h1>
        <p>The product you are looking for does not exist.</p>
        <Link href="/shop" className={styles.backBtn}>
          Back to Shop
        </Link>
      </div>
    );
  }

  return <ProductDetail product={product} />;
}

function ProductDetail({ product }) {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { currentUser, userProfile } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const productMetals = product.metals || ["Sterling Silver", "18K Gold Plate", "Rose Gold"];
  const productSizes = product.sizes || (product.category === "Rings" ? ["6", "7", "8", "9", "10", "11", "12", "13", "14"] : ["Standard"]);

  const [selectedSize, setSelectedSize] = useState(productSizes[0] || "");
  const [selectedMetal, setSelectedMetal] = useState(productMetals[0] || "");

  const galleryItems = [
    ...(product.images || []).map((img) => ({ type: "image", src: img })),
    ...(product.video ? [{ type: "video", src: product.video }] : [])
  ];

  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [zoomActive, setZoomActive] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [addedToCart, setAddedToCart] = useState(false);
  const imageRef = useRef(null);

  // Dynamic Product Specifications & fallback logic
  const getProductSpecs = () => {
    if (product.specs && product.specs.length > 0) {
      return product.specs.filter(s => s.value && s.value.trim() !== "");
    }
    // Fallback to product.details if present
    if (product.details) {
      return Object.entries(product.details)
        .map(([key, val]) => {
          const label = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
          return { label, value: val };
        })
        .filter(s => s.value && s.value.trim() !== "");
    }
    // Fallback to default hardcoded details
    return [
      { label: "SKU Number", value: `ELLA-${product.id || '100'}012` },
      { label: "Style", value: product.name },
      { label: "Metal Type", value: "925 Sterling Silver" },
      { label: "Stone Type", value: "Premium AAA Grade Moissanite" },
      { label: "Carat Weight", value: `${(product.id * 0.4 || 1.2).toFixed(2)} Carats` },
      { label: "Certification", value: "TGL Certified" }
    ].filter(s => s.value && s.value.trim() !== "");
  };

  const productSpecs = getProductSpecs();

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Fetch reviews for this product
  useEffect(() => {
    const fetchReviews = async () => {
      if (!isFirebaseConfigured) {
        setReviews([
          {
            id: "r1",
            authorName: "Sarah K.",
            rating: 5,
            title: "Absolutely stunning!",
            text: "I bought this ring for my anniversary and my partner was speechless. The craftsmanship is impeccable and it sparkles beautifully.",
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60000).toISOString()
          },
          {
            id: "r2",
            authorName: "Emily T.",
            rating: 5,
            title: "Worth every penny",
            text: "The moissanite looks even more brilliant than I expected. Great quality, fast shipping, and the packaging was beautiful!",
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60000).toISOString()
          },
          {
            id: "r3",
            authorName: "Mark D.",
            rating: 4,
            title: "Beautiful gift",
            text: "Bought this for my wife's birthday. She loves it. The rose gold finish is very delicate and classy.",
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60000).toISOString()
          }
        ]);
        return;
      }

      try {
        const reviewsRef = collection(db, "products", product.slug, "reviews");
        const q = query(reviewsRef, orderBy("createdAt", "desc"));
        const querySnap = await getDocs(q);
        const fetched = [];
        querySnap.forEach((doc) => fetched.push({ id: doc.id, ...doc.data() }));
        setReviews(fetched);
      } catch (err) {
        console.error("Error loading reviews:", err);
      }
    };
    fetchReviews();
  }, [product.slug]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please sign in to leave a review.");
      return;
    }
    if (!reviewText.trim()) return;

    setReviewSubmitting(true);
    const newReview = {
      authorName: userProfile?.displayName || currentUser.email?.split("@")[0] || "Customer",
      rating: reviewRating,
      title: reviewTitle || "Review",
      text: reviewText,
      createdAt: new Date().toISOString()
    };

    if (!isFirebaseConfigured) {
      setReviews((prev) => [{ id: "local_" + Date.now(), ...newReview }, ...prev]);
    } else {
      try {
        const reviewsRef = collection(db, "products", product.slug, "reviews");
        const docRef = await addDoc(reviewsRef, newReview);
        setReviews((prev) => [{ id: docRef.id, ...newReview }, ...prev]);
      } catch (err) {
        console.error("Error submitting review:", err);
        alert("Failed to submit review.");
        setReviewSubmitting(false);
        return;
      }
    }

    setReviewTitle("");
    setReviewText("");
    setReviewRating(5);
    setReviewSuccess(true);
    setReviewSubmitting(false);
    setTimeout(() => setReviewSuccess(false), 3000);
  };

  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    const fetchRelated = async () => {
      const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001";
      try {
        const res = await fetch(`${ADMIN_URL}/api/products?category=${encodeURIComponent(product.category)}`);
        if (res.ok) {
          const prods = await res.json();
          const filtered = prods.filter(p => p.slug !== product.slug);
          setRelatedProducts(filtered.length > 0 ? filtered.slice(0, 4) : getRelatedProducts(product, 4));
        } else {
          setRelatedProducts(getRelatedProducts(product, 4));
        }
      } catch (err) {
        console.error("Error fetching related products:", err);
        setRelatedProducts(getRelatedProducts(product, 4));
      }
    };
    fetchRelated();
  }, [product]);

  const priceVal = parseFloat(product.price || 0);
  const origPriceVal = parseFloat(product.originalPrice || 0);

  const discount = origPriceVal > priceVal ? Math.round(
    ((origPriceVal - priceVal) / origPriceVal) * 100
  ) : 0;

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    { label: product.category, href: `/shop?category=${product.category}` },
    { label: product.name, href: `/products/${product.slug}` },
  ];

  const metalSwatches = [
    { name: "Sterling Silver", color: "#C0C0C0", label: "White Gold", gradient: "linear-gradient(135deg, #e8e8e8 0%, #b0b0b0 50%, #d8d8d8 100%)" },
    { name: "18K Gold Plate", color: "#C8A951", label: "Yellow Gold", gradient: "linear-gradient(135deg, #f5d77a 0%, #b8860b 50%, #d4a017 100%)" },
    { name: "Rose Gold", color: "#B76E79", label: "Rose Gold", gradient: "linear-gradient(135deg, #f4a3a8 0%, #b06070 50%, #c9818a 100%)" },
  ];

  const handleMouseMove = (e) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedMetal, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedSize, selectedMetal, quantity);
    window.location.href = "/checkout";
  };

  const handleWhatsAppOrder = () => {
    openWhatsApp(
      buildProductMessage(product, {
        size: selectedSize,
        metal: selectedMetal,
        quantity,
      })
    );
  };

  const toggleAccordion = (key) => {
    setOpenAccordion(openAccordion === key ? null : key);
  };

  const toggleFaq = (key) => {
    setOpenFaq(openFaq === key ? null : key);
  };

  const offerBadges = [
    { label: "5% OFF", sub: "On prepaid orders" },
    { label: "10% OFF", sub: "On orders above ₹1,499" },
    { label: "15% OFF", sub: "On orders above ₹2,999" },
  ];

  const trustIcons = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      label: "TGL Certified",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
          <circle cx="9" cy="9" r="6" /><circle cx="9" cy="9" r="2" />
          <path d="M15.5 15.5l4 4" strokeLinecap="round" />
        </svg>
      ),
      label: "Ring Size?",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      label: "Visit Our Offline Store",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
      label: "84k+ Instagram Follower",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
          <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ),
      label: "Complimentary Engraving",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
          <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
        </svg>
      ),
      label: "15-Day Exchange Policy",
    },
  ];

  const accordionSections = [
    {
      key: "refund",
      title: "Refund & Exchange Policy",
      content: (
        <div className={styles.accordionText}>
          <p>We offer refunds only in cases of <strong>manufacturing defects</strong>, such as receiving the wrong item, a damaged product, or any production-related fault.</p>
          <br />
          <p>Since all our products are <strong>custom made especially for you</strong>, refunds are not possible for any other reason. However, you are eligible for an <strong>exchange within 7 days</strong> of delivery, provided the item is unused, in original condition, and includes all packaging.</p>
        </div>
      ),
    },
    {
      key: "authenticity",
      title: "Authenticity Certificate",
      content: (
        <div className={styles.accordionText}>
          <p>All our products come with a Authenticity Certificate. This gives you total peace of mind that what you are purchasing is of stated precious metal purity and all gemstones are natural unless otherwise stated.</p>
        </div>
      ),
    },
    {
      key: "details",
      title: "Product Description",
      content: (
        <div>
          {product.description ? (
            <p className={styles.accordionText}>
              {product.description}
            </p>
          ) : (
            <p className={styles.accordionText} style={{ fontStyle: "italic" }}>
              No description available for this product.
            </p>
          )}
        </div>
      ),
    },
  ];

  const comparisonData = [
    { attr: "Value", moissanite: "Affordable", diamond: "Expensive", moissaniteGood: true, diamondGood: false },
    { attr: "Clarity", moissanite: "Flawless clarity", diamond: "Varies, but high clarity", moissaniteGood: true, diamondGood: true },
    { attr: "Brilliance", moissanite: "More brilliance (Winner)", diamond: "Less brilliance", moissaniteGood: true, diamondGood: false },
    { attr: "Fire (Light Dispersion)", moissanite: "High fire", diamond: "High fire", moissaniteGood: true, diamondGood: true },
    { attr: "Cost Efficiency", moissanite: "More affordable", diamond: "High cost", moissaniteGood: true, diamondGood: false },
    { attr: "Ethical Considerations", moissanite: "Ethically sourced", diamond: "Mining concerns", moissaniteGood: true, diamondGood: false },
  ];

  const faqItems = [
    { key: "q1", question: "Where are your products manufactured?", answer: "All our jewelry is carefully crafted in our state-of-the-art manufacturing facility, following stringent quality control measures. Each piece undergoes multiple quality checks before shipping." },
    { key: "q2", question: "Is moissanite a good gemstone for jewelry?", answer: "Yes! Moissanite is an excellent choice for fine jewelry. It ranks 9.25 on the Mohs scale of hardness (diamonds are 10), making it extremely durable and resistant to scratching. It also has exceptional brilliance and fire, often surpassing natural diamonds." },
    { key: "q3", question: "Is moissanite a real gemstone?", answer: "Yes, moissanite is a real gemstone. It was first discovered in 1893 by Nobel Prize-winning scientist Henri Moissan in a meteor crater. Natural moissanite is incredibly rare, but today's moissanite is lab-created with the same chemical composition as the natural version." },
    { key: "q4", question: "Is moissanite better than cubic zirconia (CZ)?", answer: "Moissanite is significantly superior to cubic zirconia. Moissanite has a hardness of 9.25 (vs 8.5 for CZ), superior brilliance, better fire, and doesn't cloud or discolor over time like CZ often does. Moissanite is much more durable and long-lasting." },
    { key: "q5", question: "Why does moissanite sparkle more than diamonds?", answer: "Moissanite has a higher refractive index (2.65-2.69) than diamond (2.42), which means it bends light more, creating more rainbow-like flashes. Its exceptional fire (light dispersion) rating of 0.104 exceeds diamond's 0.044, producing spectacular rainbow sparkle." },
    { key: "q6", question: "Will moissanite lose its sparkle over time?", answer: "No. Moissanite will not lose its sparkle or brilliance over time. Unlike some gemstones that can become cloudy or scratched, moissanite maintains its optical properties permanently. It's a lifetime investment that looks as beautiful decades later as the day you received it." },
    { key: "q7", question: "Can moissanite break easily?", answer: "No, moissanite is extremely tough and resistant to breaking. With a hardness of 9.25 on the Mohs scale, it's one of the hardest substances known. It's highly resistant to scratching, chipping, and breaking under normal wear conditions." },
    { key: "q8", question: "How should I clean my moissanite jewelry?", answer: "Clean your moissanite jewelry with warm water, mild dish soap, and a soft brush (like a toothbrush). Gently scrub, rinse thoroughly, and pat dry with a lint-free cloth. You can also use a commercial jewelry cleaner or an ultrasonic cleaner. Avoid harsh chemicals." },
  ];

  const whyMoissanitePoints = [
    { title: "Exceptional Value", desc: "Get unmatched brilliance and quality without the high price tag." },
    { title: "Better Color Quality", desc: "Stunning D-E color for a flawless, diamond-like appearance." },
    { title: "Amazing Clarity", desc: "Impeccable clarity ensures maximum sparkle." },
    { title: "Strong Like a Diamond", desc: "With a 9.50 hardness on the Mohs scale, our Moissanite offers exceptional durability." },
    { title: "Bigger Stone for Less", desc: "Indulge in larger, luxurious stones at a fraction of the cost." },
  ];

  const moissaniteBenefits = [
    "9.50 hardness on the Mohs scale",
    "Timeless brilliance that stands the test of time, just like diamonds",
    "Flawless sparkle with exquisite D-E color",
    "Superior clarity for true elegance",
    "Nickel-Free & hypoallergenic",
    "Safe, comfortable wear without irritation",
    "A blend of timeless classics and modern masterpieces",
    "Inspired by international trends & cultures",
    "No hidden markups or middlemen",
    "Luxury jewelry at prices everyone can afford",
    "Advanced encryption technology",
    "Shop with confidence & hassle-free checkout",
    "A dedicated team ready to assist at every step",
    "From queries to post-purchase care — we're here for you",
  ];

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Breadcrumbs items={breadcrumbs} />

        {/* ===== TOP SECTION: Gallery + Info ===== */}
        <div className={styles.productLayout}>
          {/* Left: Image Gallery */}
          <motion.div
            className={styles.gallery}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.thumbnails}>
              {galleryItems.map((item, idx) => {
                if (item.type === "video") {
                  return (
                    <button
                      key={idx}
                      className={`${styles.thumb} ${selectedImage === idx ? styles.thumbActive : ""}`}
                      onClick={() => setSelectedImage(idx)}
                      aria-label="Play product video"
                    >
                      <div className={styles.videoThumbInner}>
                        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        <span>Video</span>
                      </div>
                    </button>
                  );
                }
                const src = getImageSrc(item.src);
                const isExt = isExternalImage(src);
                return (
                  <button
                    key={idx}
                    className={`${styles.thumb} ${selectedImage === idx ? styles.thumbActive : ""}`}
                    onClick={() => setSelectedImage(idx)}
                    aria-label={`View product image ${idx + 1}`}
                  >
                    {isExt ? (
                      <img
                        src={src}
                        alt={`${product.name} view ${idx + 1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <Image
                        src={src}
                        alt={`${product.name} view ${idx + 1}`}
                        width={80}
                        height={80}
                        style={{ objectFit: "cover", width: "100%", height: "100%" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div
              className={styles.mainImage}
              ref={imageRef}
              onMouseEnter={() => { if (galleryItems[selectedImage]?.type !== "video") setZoomActive(true); }}
              onMouseLeave={() => setZoomActive(false)}
              onMouseMove={(e) => { if (galleryItems[selectedImage]?.type !== "video") handleMouseMove(e); }}
            >
              {(() => {
                const currentItem = galleryItems[selectedImage] || galleryItems[0];
                if (!currentItem) return null;
                
                if (currentItem.type === "video") {
                  return (
                    <video
                      src={currentItem.src}
                      className={styles.heroVideo}
                      controls
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  );
                }

                const src = getImageSrc(currentItem.src);
                const isExt = isExternalImage(src);
                return isExt ? (
                  <img
                    src={src}
                    alt={product.name}
                    className={styles.heroImg}
                    style={{
                      transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                      transform: zoomActive ? "scale(1.8)" : "scale(1)",
                    }}
                  />
                ) : (
                  <Image
                    src={src}
                    alt={product.name}
                    width={600}
                    height={600}
                    className={styles.heroImg}
                    style={{
                      transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                      transform: zoomActive ? "scale(1.8)" : "scale(1)",
                    }}
                    priority
                  />
                );
              })()}
              {product.badge && (
                <span className={styles.productBadge}>{product.badge}</span>
              )}
              {galleryItems[selectedImage]?.type !== "video" && (
                <div className={styles.zoomHint}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/>
                  </svg>
                  Hover to zoom
                </div>
              )}
            </div>
          </motion.div>

          {/* Right: Product Info */}
          <motion.div
            className={styles.info}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            {/* Rating Row */}
            <div className={styles.ratingRow}>
              <div className={styles.stars}>
                {[1,2,3,4].map(i => (
                  <svg key={i} viewBox="0 0 24 24" fill="#F59E0B" width="16" height="16"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ))}
                <svg viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" width="16" height="16"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <span className={styles.reviewCount}>({reviews.length || 174} reviews)</span>
              </div>
            </div>

            <p className={styles.categoryLabel}>{product.category}</p>
            <h1 className={styles.productName}>{product.name}</h1>

            {/* Price Block */}
            <div className={styles.priceBlock}>
              <span className={styles.currentPrice}>₹{priceVal.toFixed(2)}</span>
              {origPriceVal > priceVal && (
                <>
                  <span className={styles.origPrice}>₹{origPriceVal.toFixed(2)}</span>
                  <span className={styles.saveBadge}>Save {discount}%</span>
                </>
              )}
            </div>

            {/* Stock Info */}
            <div className={styles.stockInfo}>
              <span className={styles.inStock}>✓ Made To Order — Handcrafted For You</span>
            </div>

            {/* Metal / Plating Selection */}
            <div className={styles.optionGroup}>
              <div className={styles.metalLabelRow}>
                <span className={styles.metalLabel}>925 Sterling Silver</span>
              </div>
              <label className={styles.optionLabel}>
                Plating: <strong>{metalSwatches.find(s => s.name === selectedMetal)?.label || selectedMetal}</strong>
              </label>
              <div className={styles.swatchRow}>
                {productMetals.map((metal) => {
                  const swatch = metalSwatches.find(s => s.name === metal);
                  return (
                    <button
                      key={metal}
                      className={`${styles.swatchBtn} ${selectedMetal === metal ? styles.swatchActive : ""}`}
                      onClick={() => setSelectedMetal(metal)}
                      title={swatch?.label || metal}
                      aria-label={`Select ${swatch?.label || metal}`}
                    >
                      <span
                        className={styles.swatchCircle}
                        style={{ background: swatch?.gradient || swatch?.color || "#999" }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Selection */}
            <div className={styles.optionGroup}>
              <label className={styles.optionLabel}>Ring size</label>
              <div className={styles.sizeDropdownWrap}>
                <select
                  className={styles.sizeDropdown}
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                >
                  {productSizes.map((size) => (
                    <option key={size} value={size}>
                      {isNaN(size) ? size : `${size} (${(44.2 + (parseInt(size) - 4) * 3.14).toFixed(2)} mm)`}
                    </option>
                  ))}
                </select>
                <svg className={styles.sizeDropdownArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actionsRow}>
              <div className={styles.qtySelector}>
                <button
                  className={styles.qtyBtn}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span className={styles.qtyNum}>{quantity}</span>
                <button
                  className={styles.qtyBtn}
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>

              <button
                className={`${styles.addToCartBtn} ${addedToCart ? styles.addedBtn : ""}`}
                onClick={handleAddToCart}
                id="add-to-cart-btn"
              >
                {addedToCart ? (
                  <>✓ Added to Bag</>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
                    </svg>
                    ADD TO CART
                  </>
                )}
              </button>
            </div>

            <button
              className={styles.buyNowBtn}
              onClick={handleBuyNow}
              id="buy-now-btn"
            >
              BUY NOW →
            </button>

            <button
              className={styles.whatsappBtn}
              onClick={handleWhatsAppOrder}
              id="whatsapp-order-btn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              ORDER ON WHATSAPP
            </button>

            {/* Offer Badges */}
            <div className={styles.offerGrid}>
              {offerBadges.map((offer, idx) => (
                <div key={idx} className={styles.offerCard}>
                  <span className={styles.offerLabel}>{offer.label}</span>
                  <span className={styles.offerSub}>{offer.sub}</span>
                </div>
              ))}
            </div>

          </motion.div>
        </div>

        {/* ===== POLICY ACCORDIONS + WISHLIST (side by side) ===== */}
        <div className={styles.policyAccordionSection}>
          {/* Left: Policy Accordions */}
          <div className={styles.policyAccordionList}>
            {accordionSections.map((section) => (
              <div key={section.key} className={styles.accordionItem}>
                <button
                  className={`${styles.accordionHeader} ${openAccordion === section.key ? styles.accordionOpen : ""}`}
                  onClick={() => toggleAccordion(section.key)}
                >
                  <span>{section.title}</span>
                  <span className={styles.accordionIcon}>
                    {openAccordion === section.key ? "∧" : "∨"}
                  </span>
                </button>
                <AnimatePresence>
                  {openAccordion === section.key && (
                    <motion.div
                      className={styles.accordionBody}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {section.content}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Right: Wishlist + Share Panel */}
          <div className={styles.policyWishlistPanel}>
            <p className={styles.policyWishlistHint}>Love this piece? Save it for later.</p>
            <button
              className={`${styles.wishBtn} ${styles.wishBtnFull} ${isInWishlist(product.id) ? styles.wishActive : ""}`}
              onClick={() => toggleWishlist(product.id)}
              aria-label="Toggle wishlist"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={isInWishlist(product.id) ? "var(--crimson)" : "none"} stroke={isInWishlist(product.id) ? "var(--crimson)" : "#666"} strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {isInWishlist(product.id) ? "Saved to Wishlist" : "Add to Wishlist"}
            </button>
            <div className={styles.policyShareRow}>
              <span className={styles.policyShareLabel}>Share:</span>
              <a href={`https://wa.me/?text=Check out this ${encodeURIComponent(product.name)}`} target="_blank" rel="noopener noreferrer" className={styles.shareBtn} aria-label="Share on WhatsApp">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank" rel="noopener noreferrer" className={styles.shareBtn} aria-label="Share on Facebook">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <button
                className={styles.shareBtn}
                aria-label="Copy link"
                onClick={() => navigator.clipboard && navigator.clipboard.writeText(window.location.href)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* ===== PRODUCT SPECIFICATIONS SECTION ===== */}
        {productSpecs.length > 0 && (
          <div className={styles.specsSection}>
            <div className={styles.specsHeaderArea}>
              <h2 className={styles.specsSectionTitle}>Specifications</h2>
              <p className={styles.specsSectionSubtitle}>Technical details and premium attributes of this fine jewelry piece</p>
              <div className={styles.specsLine}></div>
            </div>
            <div className={styles.specsGrid}>
              {productSpecs.map((spec, idx) => (
                <div key={idx} className={styles.specGridItem}>
                  <span className={styles.specGridLabel}>{spec.label}</span>
                  <span className={styles.specGridValue}>{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== TGL REPORT + WHY TRUST US ===== */}
        <div className={styles.trustSection}>
          <motion.div
            className={styles.tglReport}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.tglHeader}>
              <div className={styles.tglLogo}>
                <div className={styles.tglBadge}>TGL</div>
                <div>
                  <div className={styles.tglBrandName}>Transnational Gemmological</div>
                  <div className={styles.tglBrandName}>Laboratory.</div>
                  <div className={styles.tglCert}>AN ISO 9001:2015 CERTIFIED LABORATORY</div>
                </div>
              </div>
              <div className={styles.tglTitle}>GEMOLOGICAL REPORT</div>
            </div>
            
            <table className={styles.tglTable}>
              <tbody>
                <tr><td>Certificate Number</td><td>TGL {product.id || "829"}LR012</td></tr>
                <tr><td>Product Identification</td><td>Natural Moissanite Jewelry</td></tr>
                <tr><td>Total Weight (approx)</td><td>{(product.id * 0.4 || 1.2).toFixed(2)} Carats</td></tr>
                <tr><td>Precious Metal Purity</td><td>92.5% Sterling Silver</td></tr>
                <tr><td>Gemstone Color Grade</td><td>D-E (Colorless)</td></tr>
                <tr><td>Gemstone Clarity Grade</td><td>VVS1 (Exceptional Clarity)</td></tr>
                <tr><td>Gemstone Cut Grade</td><td>Excellent (Ideal Cut)</td></tr>
              </tbody>
            </table>
          </motion.div>

          <div className={styles.trustContent}>
            <div className={styles.engravingCard}>
              <h3 className={styles.engravingTitle}>Complimentary Engraving</h3>
              <p className={styles.engravingText}>
                Make your jewelry piece truly yours. We offer <strong>free professional custom laser engraving</strong> on all eligible rings. Enter your text at checkout or contact our support team.
              </p>
            </div>

            <div className={styles.whySection}>
              <h3 className={styles.whyTitle}>Why Choose ëlla Moissanite</h3>
              <ul className={styles.whyList}>
                {whyMoissanitePoints.map((p, idx) => (
                  <li key={idx} className={styles.whyItem}>
                    <strong>{p.title}:</strong> {p.desc}
                  </li>
                ))}
              </ul>
              <p className={styles.whySeparator}>
                Each <strong>ëlla Moissanite gemstone</strong> is a masterpiece of luxury, meticulously authenticated and GIA certified to meet uncompromising standards of brilliance.
              </p>
              <p className={styles.whyCallout}>
                Even expert jewelers can&apos;t distinguish <strong>Moissanite</strong> from a natural diamond — even with a diamond tester!
              </p>
              <ul className={styles.benefitsList}>
                {moissaniteBenefits.map((b, idx) => (
                  <li key={idx} className={styles.benefitItem}>
                    <span className={styles.benefitDot}>✦</span> {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ===== WHY CUSTOMERS TRUST US ===== */}
        <div className={styles.customerTrustSection}>
          <h2 className={styles.customerTrustTitle}>Why Customers Trust Us</h2>
          <div className={styles.customerTrustGrid}>
            <div className={styles.trustBadge}>
              <div className={styles.trustBadgeIcon}>
                <span className={styles.googleG}>G</span>
                <div className={styles.googleStars}>
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} viewBox="0 0 24 24" fill="#F59E0B" width="14" height="14"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  ))}
                </div>
              </div>
              <div className={styles.trustBadgeText}>4.9/5 Rating</div>
              <div className={styles.trustBadgeSub}>Based on 8,400+ verified customer reviews</div>
            </div>

            <div className={styles.trustBadge}>
              <div className={styles.trustBadgeIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="36" height="36" style={{ marginBottom: "4px" }}>
                  <rect x="1" y="3" width="15" height="13" rx="2" ry="2" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <div className={styles.trustBadgeText}>Free Shipping</div>
              <div className={styles.trustBadgeSub}>On all orders over ₹1,499</div>
            </div>

            <div className={styles.trustBadge}>
              <div className={styles.trustBadgeIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="36" height="36" style={{ marginBottom: "4px" }}>
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
              </div>
              <div className={styles.trustBadgeText}>Easy Exchange</div>
              <div className={styles.trustBadgeSub}>15-day exchange policy</div>
            </div>

            <div className={styles.trustBadge}>
              <div className={styles.trustBadgeIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="36" height="36" style={{ marginBottom: "4px" }}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className={styles.trustBadgeText}>TGL Certified</div>
              <div className={styles.trustBadgeSub}>100% authentic certifications</div>
            </div>
          </div>
        </div>

        {/* ===== COMPARISON SECTION ===== */}
        <div className={styles.comparisonSection}>
          <table className={styles.compTable}>
            <thead>
              <tr>
                <th className={styles.compAttr}>
                  <span className={styles.compHeaderLabel}>Attribute</span>
                </th>
                <th className={styles.compMoissanite}>
                  <span className={styles.compHeaderLabel}>ëlla Moissanite</span>
                </th>
                <th className={styles.compDiamond}>
                  <span className={styles.compHeaderLabel}>Natural Diamond</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 1 ? styles.compRowAlt : ""}>
                  <td className={styles.compAttrCell}>{row.attr}</td>
                  <td className={`${styles.compCell} ${row.moissaniteGood ? styles.compGood : styles.compBad}`}>
                    {row.moissanite}
                  </td>
                  <td className={`${styles.compCell} ${row.diamondGood ? styles.compGood : styles.compBad}`}>
                    {row.diamond}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ===== FAQ SECTION ===== */}
        <div className={styles.faqSection}>
          <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
          <div className={styles.faqList}>
            {faqItems.map((faq) => (
              <div key={faq.key} className={styles.faqItem}>
                <button
                  className={`${styles.faqQuestion} ${openFaq === faq.key ? styles.faqOpen : ""}`}
                  onClick={() => toggleFaq(faq.key)}
                >
                  <span>{faq.question}</span>
                  <span className={styles.faqIcon}>
                    {openFaq === faq.key ? "−" : "+"}
                  </span>
                </button>
                <AnimatePresence>
                  {openFaq === faq.key && (
                    <motion.div
                      className={styles.faqAnswer}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p>{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* ===== RELATED PRODUCTS ===== */}
        {relatedProducts.length > 0 && (
          <div className={styles.relatedSection}>
            <h2 className={styles.relatedTitle}>Related Products</h2>
            <div className={styles.relatedGrid}>
              {relatedProducts.map((p, idx) => (
                <ProductCard key={p.id} product={p} index={idx} />
              ))}
            </div>
          </div>
        )}

        {/* ===== REVIEWS SECTION ===== */}
        <div className={styles.reviewsSection}>
          <h2 className={styles.reviewsTitle}>Customer Reviews</h2>
          <div className={styles.reviewsLayout}>
            {/* Reviews List */}
            <div className={styles.reviewsList}>
              {reviews.length === 0 ? (
                <div className={styles.emptyReviews}>
                  No reviews yet for this product. Be the first to leave a review!
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className={styles.reviewCard}>
                    <div className={styles.reviewHeader}>
                      <div className={styles.reviewMeta}>
                        <span className={styles.reviewAuthor}>{review.authorName}</span>
                        <span className={styles.reviewDate}>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className={styles.reviewStars}>
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <svg key={i} viewBox="0 0 24 24" fill="#F59E0B" width="14" height="14"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        ))}
                      </div>
                    </div>
                    <h4 className={styles.reviewTitleText}>{review.title}</h4>
                    <p className={styles.reviewText}>{review.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Review Form */}
            <div className={styles.reviewFormCard}>
              <h3 className={styles.reviewFormTitle}>Write a Review</h3>
              {currentUser ? (
                <form onSubmit={handleSubmitReview}>
                  {reviewSuccess && (
                    <div style={{ color: "#16A34A", fontSize: "0.85rem", marginBottom: "12px", fontWeight: "600" }}>
                      ✓ Review submitted successfully!
                    </div>
                  )}

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Rating</label>
                    <div className={styles.starsSelector}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`${styles.starSelectBtn} ${reviewRating >= star ? styles.starSelected : ""}`}
                          onClick={() => setReviewRating(star)}
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="review-title" className={styles.formLabel}>Review Title</label>
                    <input
                      id="review-title"
                      type="text"
                      className={styles.formInputText}
                      placeholder="e.g. Beautiful craftmanship, highly recommend!"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="review-text" className={styles.formLabel}>Review Details</label>
                    <textarea
                      id="review-text"
                      className={styles.formInputText}
                      style={{ minHeight: "100px", resize: "vertical" }}
                      placeholder="Share your experience wearing this piece..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className={styles.buyNowBtn}
                    style={{ width: "100%", marginTop: "10px" }}
                    disabled={reviewSubmitting}
                  >
                    {reviewSubmitting ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <p style={{ fontSize: "0.9rem", color: "#707070", marginBottom: "16px" }}>
                    Please sign in to leave a review.
                  </p>
                  <Link
                    href={`/login?redirect=/products/${product.slug}`}
                    className={styles.backBtn}
                    style={{ marginTop: "0" }}
                  >
                    Sign In to Review
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
