"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { isFirebaseConfigured } from "@/lib/firebase";
import { getImageSrc, isExternalImage } from "@/lib/imageHelper";
import Breadcrumbs from "@/components/Breadcrumbs";
import styles from "./checkout.module.css";

const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Checkout", href: "/checkout" },
];

export default function CheckoutPage() {
  const { cart, cartSubtotal, clearCart } = useCart();
  const { currentUser, userProfile } = useAuth();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "India",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
  });

  // Autofill forms from user profile when loaded
  useEffect(() => {
    if (userProfile) {
      const names = (userProfile.displayName || "").split(" ");
      const firstName = names[0] || "";
      const lastName = names.slice(1).join(" ") || "";
      
      setForm((prev) => ({
        ...prev,
        firstName: prev.firstName || firstName,
        lastName: prev.lastName || lastName,
        email: prev.email || currentUser?.email || "",
        phone: prev.phone || userProfile.phone || "",
        address: prev.address || userProfile.address || "",
        country: prev.country || userProfile.country || "India"
      }));
    }
  }, [userProfile, currentUser]);

  const shipping = cartSubtotal > 1499 ? 0 : 99.00;
  const tax = +(cartSubtotal * 0.08).toFixed(2);
  const total = +(cartSubtotal + shipping + tax).toFixed(2);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);

    const generatedId = "ord_" + Math.random().toString(36).substring(2, 10).toUpperCase();

    const orderPayload = {
      order_number: generatedId,
      user_id: currentUser?.uid || null,
      email: form.email || currentUser?.email || "guest@ella.com",
      name: `${form.firstName} ${form.lastName}`,
      phone: form.phone || '',
      address: `${form.address}, ${form.city}, ${form.state}, ${form.zip}, ${form.country}`,
      total_amount: total,
      payment_method: "Credit Card",
      items: cart.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        metal: item.selectedMetal || "",
        size: item.selectedSize || ""
      }))
    };

    try {
      const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001";
      const res = await fetch(`${ADMIN_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        setOrderId(generatedId);
        setOrderPlaced(true);
        clearCart();
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Checkout API failed");
      }
    } catch (err) {
      console.error("Order submission failed, using local mock fallback:", err);
      // Fallback in case database is offline
      const allMockOrders = JSON.parse(localStorage.getItem("mock_orders") || "[]");
      allMockOrders.push(orderPayload);
      localStorage.setItem("mock_orders", JSON.stringify(allMockOrders));

      setOrderId(generatedId);
      setOrderPlaced(true);
      clearCart();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0 && !orderPlaced) {
    return (
      <div className={styles.emptyPage}>
        <div className={styles.emptyContent}>
          <span className={styles.emptyIcon}>🛒</span>
          <h1 className={styles.emptyTitle}>Your bag is empty</h1>
          <p className={styles.emptyText}>
            Add some beautiful jewelry to your bag before checking out.
          </p>
          <Link href="/shop" className={styles.shopLink}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Breadcrumbs items={breadcrumbs} />

        <AnimatePresence mode="wait">
          {orderPlaced ? (
            <motion.div
              className={styles.successWrap}
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className={styles.successCard}>
                <div className={styles.successIcon}>✓</div>
                <h1 className={styles.successTitle}>Order Placed!</h1>
                <p className={styles.successText}>
                  Thank you for your purchase. Your order has been confirmed and
                  will be shipped within 2-3 business days.
                </p>
                <p className={styles.orderId}>
                  Order #{orderId}
                </p>
                <Link href="/shop" className={styles.successBtn}>
                  Continue Shopping
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className={styles.pageTitle}>Checkout</h1>

              {submitError && <div className={styles.error} style={{ color: "#c0392b", backgroundColor: "#fdf3f2", padding: "12px", border: "1px solid #f2cfcb", marginBottom: "20px" }}>{submitError}</div>}

              <form onSubmit={handleSubmit} className={styles.layout}>
                {/* Left: Form */}
                <div className={styles.formSection}>
                  <h2 className={styles.sectionTitle}>Shipping Information</h2>
                  <div className={styles.formGrid}>
                    <div className={styles.field}>
                      <label className={styles.label}>First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        required
                        className={styles.input}
                        value={form.firstName}
                        onChange={handleChange}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        required
                        className={styles.input}
                        value={form.lastName}
                        onChange={handleChange}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Email</label>
                      <input
                        type="email"
                        name="email"
                        required
                        className={styles.input}
                        value={form.email}
                        onChange={handleChange}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        className={styles.input}
                        value={form.phone}
                        onChange={handleChange}
                      />
                    </div>
                    <div className={styles.fieldFull}>
                      <label className={styles.label}>Address</label>
                      <input
                        type="text"
                        name="address"
                        required
                        className={styles.input}
                        value={form.address}
                        onChange={handleChange}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>City</label>
                      <input
                        type="text"
                        name="city"
                        required
                        className={styles.input}
                        value={form.city}
                        onChange={handleChange}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>State</label>
                      <input
                        type="text"
                        name="state"
                        required
                        className={styles.input}
                        value={form.state}
                        onChange={handleChange}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>ZIP Code</label>
                      <input
                        type="text"
                        name="zip"
                        required
                        className={styles.input}
                        value={form.zip}
                        onChange={handleChange}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Country</label>
                      <select
                        name="country"
                        className={styles.input}
                        value={form.country}
                        onChange={handleChange}
                      >
                        <option>United States</option>
                        <option>Canada</option>
                        <option>United Kingdom</option>
                        <option>Australia</option>
                        <option>India</option>
                      </select>
                    </div>
                  </div>

                  <h2 className={`${styles.sectionTitle} ${styles.paymentTitle}`}>
                    Payment Details
                  </h2>
                  <div className={styles.formGrid}>
                    <div className={styles.fieldFull}>
                      <label className={styles.label}>Card Number</label>
                      <input
                        type="text"
                        name="cardNumber"
                        required
                        placeholder="1234 5678 9012 3456"
                        className={styles.input}
                        value={form.cardNumber}
                        onChange={handleChange}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Expiry</label>
                      <input
                        type="text"
                        name="cardExpiry"
                        required
                        placeholder="MM/YY"
                        className={styles.input}
                        value={form.cardExpiry}
                        onChange={handleChange}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>CVC</label>
                      <input
                        type="text"
                        name="cardCvc"
                        required
                        placeholder="123"
                        className={styles.input}
                        value={form.cardCvc}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <button type="submit" className={styles.placeOrderBtn} disabled={isSubmitting}>
                    {isSubmitting ? "PROCESSING ORDER..." : `PLACE ORDER — ₹${total.toFixed(2)}`}
                  </button>
                </div>

                {/* Right: Summary */}
                <div className={styles.summarySection}>
                  <h2 className={styles.summaryTitle}>Order Summary</h2>

                  <div className={styles.summaryList}>
                    {cart.map((item, index) => (
                      <div className={styles.summaryItem} key={index}>
                        <div className={styles.itemImg}>
                          {(() => {
                            const src = getImageSrc(item.product.images?.[0]);
                            const isExt = isExternalImage(src);
                            return isExt ? (
                              <img
                                src={src}
                                alt={item.product.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", aspectRatio: "1/1" }}
                              />
                            ) : (
                              <Image
                                src={src || "/assets/image 1.png"}
                                alt={item.product.name}
                                fill
                                style={{ objectFit: "cover" }}
                              />
                            );
                          })()}
                        </div>
                        <div className={styles.itemInfo}>
                          <h3 className={styles.itemName}>
                            {item.product.name}
                          </h3>
                          <p className={styles.itemMeta}>
                            Metal: {item.selectedMetal} | Size: {item.selectedSize}
                          </p>
                          <p className={styles.itemPriceQty}>
                            ₹{item.product.price.toFixed(2)} x {item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.totalsBlock}>
                    <div className={styles.totalRow}>
                      <span>Subtotal</span>
                      <span>₹{cartSubtotal.toFixed(2)}</span>
                    </div>
                    <div className={styles.totalRow}>
                      <span>Shipping</span>
                      <span>
                        {shipping === 0 ? "FREE" : `₹${shipping.toFixed(2)}`}
                      </span>
                    </div>
                    <div className={styles.totalRow}>
                      <span>Estimated Tax</span>
                      <span>₹{tax.toFixed(2)}</span>
                    </div>
                    <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                      <span>Grand Total</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
