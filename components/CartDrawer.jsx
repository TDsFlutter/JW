"use client";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { getImageSrc, isExternalImage } from "@/lib/imageHelper";
import styles from "./CartDrawer.module.css";

export default function CartDrawer() {
  const {
    cart,
    cartOpen,
    setCartOpen,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
  } = useCart();

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
          />
          <motion.aside
            className={styles.drawer}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35, ease: "easeInOut" }}
            id="cart-drawer"
          >
            <div className={styles.header}>
              <h2 className={styles.title}>Shopping Bag</h2>
              <span className={styles.count}>{cart.length} item{cart.length !== 1 ? "s" : ""}</span>
              <button
                className={styles.closeBtn}
                onClick={() => setCartOpen(false)}
                aria-label="Close cart"
              >
                ✕
              </button>
            </div>

            <div className={styles.items}>
              {cart.length === 0 ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>🛍️</div>
                  <p className={styles.emptyText}>Your bag is empty</p>
                  <button
                    className={styles.continueBtn}
                    onClick={() => setCartOpen(false)}
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <motion.div
                    key={`${item.product.id}-${item.selectedSize}-${item.selectedMetal}`}
                    className={styles.item}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div className={styles.itemImage}>
                      {(() => {
                        const src = getImageSrc(item.product.images?.[0]);
                        const isExt = isExternalImage(src);
                        return isExt ? (
                          <img
                            src={src}
                            alt={item.product.name}
                            style={{ width: "80px", height: "80px", objectFit: "cover", display: "block" }}
                          />
                        ) : (
                          <Image
                            src={src || "/assets/image 1.png"}
                            alt={item.product.name}
                            width={80}
                            height={80}
                            style={{ objectFit: "contain" }}
                          />
                        );
                      })()}
                    </div>
                    <div className={styles.itemInfo}>
                      <h4 className={styles.itemName}>{item.product.name}</h4>
                      <p className={styles.itemVariant}>
                        {item.selectedMetal} / {item.selectedSize}
                      </p>
                      <div className={styles.itemPriceRow}>
                        <span className={styles.itemPrice}>
                          ₹{(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      <div className={styles.qtyRow}>
                        <button
                          className={styles.qtyBtn}
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.selectedSize,
                              item.selectedMetal,
                              item.quantity - 1
                            )
                          }
                          disabled={item.quantity <= 1}
                        >
                          −
                        </button>
                        <span className={styles.qtyNum}>{item.quantity}</span>
                        <button
                          className={styles.qtyBtn}
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.selectedSize,
                              item.selectedMetal,
                              item.quantity + 1
                            )
                          }
                        >
                          +
                        </button>
                        <button
                          className={styles.removeBtn}
                          onClick={() =>
                            removeFromCart(
                              item.product.id,
                              item.selectedSize,
                              item.selectedMetal
                            )
                          }
                          aria-label="Remove item"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className={styles.footer}>
                <div className={styles.subtotalRow}>
                  <span>Subtotal</span>
                  <span className={styles.subtotalPrice}>
                    ₹{cartSubtotal.toFixed(2)}
                  </span>
                </div>
                <p className={styles.shippingNote}>
                  Shipping & taxes calculated at checkout
                </p>
                <Link
                  href="/checkout"
                  className={styles.checkoutBtn}
                  onClick={() => setCartOpen(false)}
                  id="checkout-btn"
                >
                  CHECKOUT
                </Link>
                <button
                  className={styles.continueLink}
                  onClick={() => setCartOpen(false)}
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
