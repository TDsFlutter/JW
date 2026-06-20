"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { logout, isFirebaseConfigured, auth } from "@/lib/firebase";
import { products } from "@/data/products";
import { getImageSrc, isExternalImage } from "@/lib/imageHelper";
import Link from "next/link";
import Image from "next/image";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const { currentUser, userProfile, updateProfileData, loading } = useAuth();
  const { wishlist, toggleWishlist } = useCart();
  const [activeMenu, setActiveMenu] = useState("dashboard"); // dashboard, orders, wishlist, settings
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const router = useRouter();

  // Settings form states
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Sync settings inputs when user profile loads
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || "");
      setPhone(userProfile.phone || "");
      setAddress(userProfile.address || "");
    }
  }, [userProfile]);

  // Load orders
  useEffect(() => {
    if (!currentUser) return;

    const fetchOrders = async () => {
      setOrdersLoading(true);

      const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001";
      try {
        const token = isFirebaseConfigured && auth?.currentUser
          ? await auth.currentUser.getIdToken()
          : currentUser.uid;
        const res = await fetch(`${ADMIN_URL}/api/orders?user_id=${currentUser.uid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
          setOrdersLoading(false);
          return;
        }
      } catch (err) {
        console.error("Error loading orders from API, trying mock fallback:", err);
      }

      // Local storage mock fallback
      const allMockOrders = JSON.parse(localStorage.getItem("mock_orders") || "[]");
      const userMockOrders = allMockOrders.filter(o => o.user_id === currentUser.uid || o.userId === currentUser.uid);
      setOrders(userMockOrders);
      setOrdersLoading(false);
    };

    fetchOrders();
  }, [currentUser, activeMenu]);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push("/login?redirect=/profile");
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: "center", padding: "80px 0", color: "#707070" }}>
          Loading user session...
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaveSuccess(false);
    setSaveError("");
    try {
      await updateProfileData({
        displayName,
        phone,
        address
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message || "Failed to update profile.");
    }
  };

  const [productsList, setProductsList] = useState([]);

  useEffect(() => {
    setProductsList(products);
  }, []);

  // Get wishlist products
  const wishlistProducts = productsList.filter(p => wishlist.includes(p.id) || wishlist.includes(p.slug));

  return (
    <div className={styles.container}>
      <h1 className={styles.sectionTitle} style={{ fontSize: "2rem", border: "none" }}>
        My Account
      </h1>
      
      <div className={styles.profileLayout}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.welcomeSection}>
            <div className={styles.avatar}>
              {(userProfile?.displayName || userProfile?.email || "U").charAt(0)}
            </div>
            <h2 className={styles.welcomeTitle}>
              Hello, {userProfile?.displayName || "Guest"}
            </h2>
            <p className={styles.userEmail}>{userProfile?.email}</p>
            {userProfile?.role === "admin" && (
              <span style={{
                display: "inline-block",
                backgroundColor: "#fff8e6",
                color: "#b59410",
                fontSize: "0.7rem",
                fontWeight: "700",
                padding: "2px 8px",
                borderRadius: "10px",
                marginTop: "8px",
                textTransform: "uppercase"
              }}>
                Administrator
              </span>
            )}
          </div>

          <nav className={styles.menuList}>
            <button 
              className={`${styles.menuBtn} ${activeMenu === "dashboard" ? styles.activeMenu : ""}`}
              onClick={() => setActiveMenu("dashboard")}
            >
              Dashboard
            </button>
            <button 
              className={`${styles.menuBtn} ${activeMenu === "orders" ? styles.activeMenu : ""}`}
              onClick={() => setActiveMenu("orders")}
            >
              Order History ({orders.length})
            </button>
            <button 
              className={`${styles.menuBtn} ${activeMenu === "wishlist" ? styles.activeMenu : ""}`}
              onClick={() => setActiveMenu("wishlist")}
            >
              Wishlist ({wishlist.length})
            </button>
            <button 
              className={`${styles.menuBtn} ${activeMenu === "settings" ? styles.activeMenu : ""}`}
              onClick={() => setActiveMenu("settings")}
            >
              Account Settings
            </button>
            {userProfile?.role === "admin" && (
              <a 
                href={process.env.NEXT_PUBLIC_ADMIN_URL || "/admin"} 
                className={styles.menuBtn}
                style={{ 
                  color: "#b59410", 
                  fontWeight: "bold",
                  display: "block",
                  textDecoration: "none"
                }}
              >
                Admin Panel ➔
              </a>
            )}
          </nav>

          <button onClick={handleLogout} className={styles.logoutBtn}>
            Logout
          </button>
        </aside>

        {/* Main Content Area */}
        <main className={styles.contentCard}>
          {activeMenu === "dashboard" && (
            <div>
              <h2 className={styles.sectionTitle}>Dashboard Overview</h2>
              <p style={{ color: "#555", marginBottom: "30px", lineHeight: "1.6" }}>
                Welcome to your client portal. Here you can track your recent purchases, manage your billing and shipping addresses, and review products you have wishlisted.
              </p>

              <div className={styles.dashboardStats}>
                <div className={styles.statCard}>
                  <div className={styles.statVal}>{orders.length}</div>
                  <div className={styles.statLbl}>Total Orders</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statVal}>{wishlist.length}</div>
                  <div className={styles.statLbl}>Wishlist Items</div>
                </div>
              </div>

              <h3 style={{ fontFamily: "var(--font-montserrat), sans-serif", fontWeight: 600, fontSize: "1.2rem", marginBottom: "15px" }}>
                Default Shipping Address
              </h3>
              {userProfile?.address ? (
                <div style={{ padding: "16px", border: "1px solid #eae6df", backgroundColor: "#faf9f6", lineHeight: "1.6" }}>
                  <p><strong>{userProfile.displayName}</strong></p>
                  <p>{userProfile.address}</p>
                  {userProfile.phone && <p>Phone: {userProfile.phone}</p>}
                </div>
              ) : (
                <p style={{ color: "#777", fontSize: "0.9rem" }}>
                  No shipping address added yet. Update your address in the <span style={{ textDecoration: "underline", cursor: "pointer", color: "#b59410" }} onClick={() => setActiveMenu("settings")}>Account Settings</span> tab.
                </p>
              )}
            </div>
          )}

          {activeMenu === "orders" && (
            <div>
              <h2 className={styles.sectionTitle}>Order History</h2>
              
              {ordersLoading ? (
                <p style={{ color: "#777" }}>Loading orders...</p>
              ) : orders.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>You have not placed any orders yet.</p>
                  <Link href="/shop" className={styles.goShopBtn}>Shop Collections</Link>
                </div>
              ) : (
                <div className={styles.orderList}>
                  {orders.map((order) => (
                    <div key={order.id} className={styles.orderCard}>
                      <div className={styles.orderHeader}>
                        <div>
                          <span className={styles.orderId}>Order #{order.id.substring(0, 8).toUpperCase()}</span>
                          <span className={styles.orderDate}> — {new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span className={`${styles.orderStatus} ${
                          order.status === "delivered" ? styles.statusDelivered :
                          order.status === "shipped" ? styles.statusShipped : styles.statusPending
                        }`}>
                          {order.status || "pending"}
                        </span>
                      </div>

                      <div className={styles.orderItems}>
                        {order.items?.map((item, index) => (
                          <div key={index} className={styles.orderItem}>
                            <span className={styles.itemName}>
                              {item.name} {item.metal ? `(${item.metal})` : ""} {item.size ? `- Sz ${item.size}` : ""}
                            </span>
                            <span className={styles.itemQty}>x{item.quantity}</span>
                            <span className={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className={styles.orderTotal}>
                        Total: ₹{(order.totalAmount || order.total || 0).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeMenu === "wishlist" && (
            <div>
              <h2 className={styles.sectionTitle}>My Wishlist</h2>
              
              {wishlistProducts.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>Your wishlist is empty.</p>
                  <Link href="/shop" className={styles.goShopBtn}>Browse Shop</Link>
                </div>
              ) : (
                <div className={styles.wishlistGrid}>
                  {wishlistProducts.map((product) => (
                    <div key={product.id} className={styles.wishlistCard}>
                      <Link href={`/products/[slug]`} className={styles.wishlistImgWrapper}>
                        {(() => {
                          const src = getImageSrc(product.images?.[0]);
                          const isExt = isExternalImage(src);
                          return isExt ? (
                            <img 
                              src={src} 
                              alt={product.name} 
                              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", aspectRatio: "1/1" }}
                            />
                          ) : (
                            <Image 
                              src={src || "/assets/image 1.png"} 
                              alt={product.name} 
                              fill 
                              style={{ objectFit: "cover" }}
                            />
                          );
                        })()}
                      </Link>
                      <div className={styles.wishlistInfo}>
                        <div>
                          <Link href={`/products/${product.slug}`} style={{ textDecoration: "none" }}>
                            <h3 className={styles.wishlistName}>{product.name}</h3>
                          </Link>
                          <div className={styles.wishlistPrice}>₹{product.price.toFixed(2)}</div>
                        </div>
                        <button 
                          className={styles.removeWishlist}
                          onClick={() => toggleWishlist(product.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeMenu === "settings" && (
            <div>
              <h2 className={styles.sectionTitle}>Account Settings</h2>

              {saveSuccess && <div className={styles.successMsg}>Your profile settings have been updated.</div>}
              {saveError && <div className={styles.error} style={{ marginBottom: "20px" }}>{saveError}</div>}

              <form onSubmit={handleSaveSettings} className={styles.form}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="fullName" className={styles.label}>Full Name</label>
                    <input 
                      id="fullName"
                      type="text" 
                      className={styles.input} 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="phoneNumber" className={styles.label}>Phone Number</label>
                    <input 
                      id="phoneNumber"
                      type="tel" 
                      className={styles.input} 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +1 555-0199"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="shippingAddress" className={styles.label}>Shipping Address</label>
                  <textarea 
                    id="shippingAddress"
                    className={styles.input} 
                    style={{ height: "100px", resize: "vertical" }}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter street address, city, state, and zip code"
                  />
                </div>

                <button type="submit" className={styles.saveBtn}>
                  Save Changes
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
