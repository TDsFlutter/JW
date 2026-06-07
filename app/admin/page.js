"use client";
import { useState, useEffect } from "react";
import { 
  isFirebaseConfigured, 
  db, 
  rtdb, 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc, 
  ref, 
  onValue,
  getDoc,
  updateDoc,
  dbSet
} from "@/lib/firebase";
import { products as initialProducts } from "@/data/products";
import { getImageSrc, isExternalImage } from "@/lib/imageHelper";
import Link from "next/link";
import Image from "next/image";
import styles from "./admin.module.css";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, products, orders, content, live
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeCarts, setActiveCarts] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Drawer states (Add/Edit Product)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Product Form Fields
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formCategory, setFormCategory] = useState("Rings");
  const [formGender, setFormGender] = useState("Woman");
  const [formPrice, setFormPrice] = useState("");
  const [formOriginalPrice, setFormOriginalPrice] = useState("");
  const [formBadge, setFormBadge] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImages, setFormImages] = useState([""]);
  const [uploadingIndices, setUploadingIndices] = useState({});
  const [formSelectedSizes, setFormSelectedSizes] = useState([]);
  const [formSelectedMetals, setFormSelectedMetals] = useState([]);

  // Content edit states
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [contentSuccess, setContentSuccess] = useState("");

  // Fast Listing Metadata Options Configuration
  const [metadataConfig, setMetadataConfig] = useState({
    categories: ["Rings", "Bracelets", "Pendants", "Earrings"],
    platings: ["Sterling Silver", "18K Gold Plate", "Rose Gold"],
    promoBadges: ["New", "Best Seller", "Trending", "Limited", "Hot Deal"],
    manSizes: {
      "Rings": ["9", "10", "11", "12", "13", "14", "15"],
      "Bracelets": ["7.5 inch", "8 inch", "8.5 inch"],
      "Pendants": ["20 inch", "22 inch", "24 inch"],
      "Earrings": ["One Size"]
    },
    womanSizes: {
      "Rings": ["4", "5", "6", "7", "8", "9", "10"],
      "Bracelets": ["6 inch", "6.5 inch", "7 inch", "7.5 inch"],
      "Pendants": ["16 inch", "18 inch", "20 inch"],
      "Earrings": ["One Size"]
    }
  });

  const [sizeMgrGender, setSizeMgrGender] = useState("Woman");
  const [sizeMgrCat, setSizeMgrCat] = useState("Rings");
  const [metadataSuccess, setMetadataSuccess] = useState("");

  const addMetadataItem = (field, val, inputId) => {
    const trimmed = val ? val.trim() : "";
    if (!trimmed) return;
    if (metadataConfig[field].includes(trimmed)) {
      alert("Item already exists!");
      return;
    }
    setMetadataConfig(prev => ({
      ...prev,
      [field]: [...prev[field], trimmed]
    }));
    const el = document.getElementById(inputId);
    if (el) el.value = "";
  };

  const deleteMetadataItem = (field, val) => {
    setMetadataConfig(prev => ({
      ...prev,
      [field]: prev[field].filter(x => x !== val)
    }));
  };

  const addSizeItem = (genderField, category, val, inputId) => {
    const trimmed = val ? val.trim() : "";
    if (!trimmed) return;
    const currentSizes = metadataConfig[genderField][category] || [];
    if (currentSizes.includes(trimmed)) {
      alert("Size already exists!");
      return;
    }
    setMetadataConfig(prev => ({
      ...prev,
      [genderField]: {
        ...prev[genderField],
        [category]: [...currentSizes, trimmed]
      }
    }));
    const el = document.getElementById(inputId);
    if (el) el.value = "";
  };

  const deleteSizeItem = (genderField, category, val) => {
    setMetadataConfig(prev => ({
      ...prev,
      [genderField]: {
        ...prev[genderField],
        [category]: (prev[genderField][category] || []).filter(x => x !== val)
      }
    }));
  };

  const saveMetadataConfig = async () => {
    setMetadataSuccess("");
    if (!isFirebaseConfigured) {
      localStorage.setItem("metadata_config", JSON.stringify(metadataConfig));
      setMetadataSuccess("Metadata options updated successfully in local storage!");
      setTimeout(() => setMetadataSuccess(""), 3000);
      return;
    }

    try {
      await setDoc(doc(db, "metadata", "config"), metadataConfig);
      setMetadataSuccess("Metadata options saved to Firebase Firestore successfully!");
      setTimeout(() => setMetadataSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save metadata: " + err.message);
    }
  };

  const getAvailableSizes = (category, gender) => {
    const manList = metadataConfig.manSizes[category] || [];
    const womanList = metadataConfig.womanSizes[category] || [];
    if (gender === "Man") return manList;
    if (gender === "Woman") return womanList;
    return Array.from(new Set([...womanList, ...manList]));
  };

  // Auto-select all available sizes and metals for fast listings on creating a new product
  useEffect(() => {
    if (!editingProduct) {
      setFormSelectedSizes(getAvailableSizes(formCategory, formGender));
    }
  }, [formCategory, formGender, editingProduct]);

  useEffect(() => {
    if (!editingProduct) {
      setFormSelectedMetals(metadataConfig.platings);
    }
  }, [metadataConfig.platings, editingProduct]);

  // 1. Fetch initial dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      
      // Load products
      if (!isFirebaseConfigured) {
        const localProds = localStorage.getItem("mock_products");
        if (localProds) {
          setProducts(JSON.parse(localProds));
        } else {
          setProducts(initialProducts);
          localStorage.setItem("mock_products", JSON.stringify(initialProducts));
        }
      } else {
        try {
          const querySnapshot = await getDocs(collection(db, "products"));
          const fetchedProds = [];
          querySnapshot.forEach((doc) => {
            fetchedProds.push({ id: doc.id, ...doc.data() });
          });
          setProducts(fetchedProds.length > 0 ? fetchedProds : initialProducts);
        } catch (err) {
          console.error("Firestore loading error:", err);
          setProducts(initialProducts);
        }
      }

      // Load orders
      if (!isFirebaseConfigured) {
        const localOrders = localStorage.getItem("mock_orders");
        setOrders(localOrders ? JSON.parse(localOrders) : []);
      } else {
        try {
          const querySnapshot = await getDocs(collection(db, "orders"));
          const fetchedOrders = [];
          querySnapshot.forEach((doc) => {
            fetchedOrders.push({ id: doc.id, ...doc.data() });
          });
          fetchedOrders.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
          setOrders(fetchedOrders);
        } catch (err) {
          console.error("Orders loading error:", err);
        }
      }

      // Load default content settings
      if (!isFirebaseConfigured) {
        setHeroTitle("Elegant Jewelry Crafted For Modern Luxuries");
        setHeroSubtitle("Explore our premium 925 sterling silver rings, bracelets, and pendants.");
        setAnnouncement("FREE SHIPPING OVER ₹1,499");

        const localMeta = localStorage.getItem("metadata_config");
        if (localMeta) {
          setMetadataConfig(JSON.parse(localMeta));
        }
      } else {
        try {
          setHeroTitle("Elegant Jewelry Crafted For Modern Luxuries");
          setHeroSubtitle("Explore our premium 925 sterling silver rings, bracelets, and pendants.");
          setAnnouncement("FREE SHIPPING OVER ₹1,499");

          const docRef = doc(db, "metadata", "config");
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setMetadataConfig(docSnap.data());
          }
        } catch (e) {
          console.error(e);
        }
      }

      setLoading(false);
    };

    loadDashboardData();
  }, [activeTab]);

  // 2. Realtime cart synchronization
  useEffect(() => {
    if (!isFirebaseConfigured || !rtdb) {
      // Set static mock carts
      setActiveCarts({
        "mock_1": {
          email: "buyer@ella.com",
          displayName: "Alice Mercer",
          itemsCount: 1,
          total: 22.00,
          items: [{ name: "Diamond In Platinum Ring", quantity: 1, size: "6", metal: "Sterling Silver" }],
          updatedAt: new Date().toISOString()
        },
        "mock_2": {
          email: "customer@ella.com",
          displayName: "David Miller",
          itemsCount: 3,
          total: 92.00,
          items: [
            { name: "Makers Slice Ring", quantity: 2, size: "8", metal: "18K Gold Plate" },
            { name: "Olive Leaf Band Ring", quantity: 1, size: "7", metal: "Sterling Silver" }
          ],
          updatedAt: new Date(Date.now() - 5 * 60000).toISOString()
        }
      });
      return;
    }

    const cartsRef = ref(rtdb, "active_carts");
    const unsubscribe = onValue(cartsRef, (snapshot) => {
      if (snapshot.exists()) {
        setActiveCarts(snapshot.val());
      } else {
        setActiveCarts({});
      }
    });

    return () => unsubscribe();
  }, [activeTab]);

  // Open Drawer for Add Product
  const handleAddProductClick = () => {
    setEditingProduct(null);
    setFormName("");
    setFormSlug("");
    setFormCategory(metadataConfig.categories[0] || "Rings");
    setFormGender("Woman");
    setFormPrice("");
    setFormOriginalPrice("");
    setFormBadge("");
    setFormDescription("");
    setFormImages([""]);
    setFormSelectedSizes([]);
    setFormSelectedMetals([]);
    setError("");
    setSuccess("");
    setIsDrawerOpen(true);
  };

  // Open Drawer for Edit Product
  const handleEditProductClick = (product) => {
    setEditingProduct(product);
    setFormName(product.name || "");
    setFormSlug(product.slug || "");
    setFormCategory(product.category || "Rings");
    setFormGender(product.gender || "Woman");
    setFormPrice(product.price ? product.price.toString() : "");
    setFormOriginalPrice(product.originalPrice ? product.originalPrice.toString() : "");
    setFormBadge(product.badge || "");
    setFormDescription(product.description || "");
    
    // Filter out static placeholder images so they are not shown in edit form
    const staticPlaceholders = ["/assets/image 1.png", "/assets/Rectangle 15.png", "/assets/Rectangle 16.png"];
    const filteredImages = product.images 
      ? product.images.filter(img => !staticPlaceholders.includes(img))
      : [];
    setFormImages(filteredImages.length > 0 ? filteredImages : [""]);

    setFormSelectedSizes(product.sizes || []);
    setFormSelectedMetals(product.metals || []);
    setError("");
    setSuccess("");
    setIsDrawerOpen(true);
  };

  // Handle Product Save (Create/Update)
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formName || !formSlug || !formPrice) {
      setError("Please fill in all required fields (Name, Slug, Price).");
      return;
    }

    const defaultDetails = {
      material: "925 Sterling Silver Plated",
      stone: "Premium AAA Grade Moissanite",
      stoneWeight: "1.0 Carat",
      finish: "High Polish Finish",
      width: "3mm Width Band",
      certification: "Certificate of Authenticity Included"
    };

    const productData = {
      stock: 10,
      details: defaultDetails,
      care: "Avoid contact with perfumes and harsh chemicals. Store in dry containers.",
      shipping: "Free shipping worldwide. 30-day return policy.",
      ...(editingProduct || {}),
      name: formName,
      slug: formSlug.toLowerCase().trim().replace(/\s+/g, "-"),
      category: formCategory,
      gender: formGender,
      price: Number(formPrice),
      originalPrice: Number(formOriginalPrice || formPrice),
      badge: formBadge || null,
      description: formDescription,
      images: formImages.filter(img => img.trim() !== "").length > 0 
        ? formImages.filter(img => img.trim() !== "") 
        : ["/assets/image 1.png"],
      sizes: formSelectedSizes,
      metals: formSelectedMetals,
    };

    if (!isFirebaseConfigured) {
      // Mock Save to LocalStorage
      const local = localStorage.getItem("mock_products");
      let updatedProds = [];
      if (local) {
        const prods = JSON.parse(local);
        if (editingProduct) {
          updatedProds = prods.map(p => p.slug === editingProduct.slug ? { ...p, ...productData, id: p.id } : p);
        } else {
          const newId = prods.length > 0 ? Math.max(...prods.map(p => p.id)) + 1 : 1;
          updatedProds = [...prods, { id: newId, ...productData }];
        }
      } else {
        updatedProds = editingProduct 
          ? initialProducts.map(p => p.slug === editingProduct.slug ? { ...p, ...productData } : p)
          : [...initialProducts, { id: 9, ...productData }];
      }

      localStorage.setItem("mock_products", JSON.stringify(updatedProds));
      setProducts(updatedProds);
      setSuccess("Product saved successfully in Local Storage!");
      setTimeout(() => setIsDrawerOpen(false), 1200);
      return;
    }

    try {
      // Save to Cloud Firestore
      await setDoc(doc(db, "products", productData.slug), productData);
      
      // Update inventory in Realtime Database as well!
      if (rtdb) {
        const stockRef = ref(rtdb, `inventory/${productData.slug}`);
        await dbSet(stockRef, productData.stock);
      }

      setSuccess("Product saved successfully in Firebase!");
      setTimeout(() => {
        setIsDrawerOpen(false);
        // Trigger page refresh data
        setActiveTab("products");
      }, 1200);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save product in Firebase.");
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async (slug) => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;

    if (!isFirebaseConfigured) {
      const local = localStorage.getItem("mock_products");
      if (local) {
        const prods = JSON.parse(local);
        const filtered = prods.filter(p => p.slug !== slug);
        localStorage.setItem("mock_products", JSON.stringify(filtered));
        setProducts(filtered);
      }
      alert("Product deleted from Local Storage.");
      return;
    }

    try {
      await deleteDoc(doc(db, "products", slug));
      // Refresh list
      setProducts(products.filter(p => p.slug !== slug));
      alert("Product deleted from Firestore successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to delete product: " + err.message);
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    if (!isFirebaseConfigured) {
      const local = localStorage.getItem("mock_orders");
      if (local) {
        const ords = JSON.parse(local);
        const updated = ords.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
        localStorage.setItem("mock_orders", JSON.stringify(updated));
        setOrders(updated);
      }
      return;
    }

    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error(err);
      alert("Failed to update status: " + err.message);
    }
  };

  // Update Homepage Content Banners
  const handleSaveContent = async (e) => {
    e.preventDefault();
    setContentSuccess("");
    
    if (!isFirebaseConfigured) {
      setContentSuccess("Banners updated in Local Cache!");
      setTimeout(() => setContentSuccess(""), 3000);
      return;
    }

    try {
      await setDoc(doc(db, "content", "homepage"), {
        announcement,
        heroTitle,
        heroSubtitle,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setContentSuccess("Homepage Content updated successfully in Firestore!");
      setTimeout(() => setContentSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to update content: " + err.message);
    }
  };

  const handleFileUpload = async (e, idx) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit.");
      return;
    }

    setUploadingIndices(prev => ({ ...prev, [idx]: true }));

    try {
      const token = process.env.NEXT_PUBLIC_GITLAB_ACCESS_TOKEN;
      const projectId = process.env.NEXT_PUBLIC_GITLAB_PROJECT_ID;
      const branch = process.env.NEXT_PUBLIC_GITLAB_BRANCH || "main";
      const uploadPath = process.env.NEXT_PUBLIC_GITLAB_UPLOAD_PATH || "public/uploads";
      const baseUrl = process.env.NEXT_PUBLIC_GITLAB_BASE_URL || "https://gitlab.com";

      if (!token || token === "YOUR_PERSONAL_ACCESS_TOKEN" || !projectId || projectId === "YOUR_PROJECT_ID") {
        alert("GitLab configuration is missing. Please check your NEXT_PUBLIC_GITLAB_ env variables in .env.local.");
        setUploadingIndices(prev => ({ ...prev, [idx]: false }));
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64Data = reader.result.split(",")[1];
          const uniqueFileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
          const cleanUploadPath = uploadPath.replace(/\/$/, "");
          const fullFilePath = `${cleanUploadPath}/${uniqueFileName}`;
          const encodedFilePath = encodeURIComponent(fullFilePath);

          const apiUrl = `${baseUrl}/api/v4/projects/${projectId}/repository/files/${encodedFilePath}`;
          // Route through corsproxy.io to bypass browser CORS block on gitlab.com
          const proxyApiUrl = `https://corsproxy.io/?url=${encodeURIComponent(apiUrl)}`;

          const response = await fetch(proxyApiUrl, {
            method: "POST",
            headers: {
              "PRIVATE-TOKEN": token,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              branch: branch,
              author_email: "admin@ella.com",
              author_name: "ëlla Admin",
              content: base64Data,
              encoding: "base64",
              commit_message: `Upload image: ${uniqueFileName} via Admin Control Panel (Static Client)`
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            alert(`Upload failed: ${errorData.message || "Unknown error"}`);
            setUploadingIndices(prev => ({ ...prev, [idx]: false }));
            return;
          }

          // Fetch the project details dynamically to resolve the exact namespace path (for public raw URL)
          const projectUrl = `${baseUrl}/api/v4/projects/${projectId}`;
          const proxyProjectUrl = `https://corsproxy.io/?url=${encodeURIComponent(projectUrl)}`;
          const projectResponse = await fetch(proxyProjectUrl, {
            headers: { "PRIVATE-TOKEN": token }
          });
          
          let pathWithNamespace = "";
          if (projectResponse.ok) {
            const projectData = await projectResponse.json();
            pathWithNamespace = projectData.path_with_namespace;
          }

          if (!pathWithNamespace) {
            pathWithNamespace = decodeURIComponent(projectId);
          }

          const publicUrl = `${baseUrl}/${pathWithNamespace}/-/raw/${branch}/${fullFilePath}`;

          setFormImages(prev => prev.map((item, i) => i === idx ? publicUrl : item));
          setUploadingIndices(prev => ({ ...prev, [idx]: false }));
        } catch (uploadErr) {
          console.error("GitLab upload client error:", uploadErr);
          alert("Error uploading: " + uploadErr.message);
          setUploadingIndices(prev => ({ ...prev, [idx]: false }));
        }
      };
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        alert("Error reading file.");
        setUploadingIndices(prev => ({ ...prev, [idx]: false }));
      };
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error uploading file: " + err.message);
      setUploadingIndices(prev => ({ ...prev, [idx]: false }));
    }
  };

  // Metrics details
  const totalSales = orders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);
  const lowStockProducts = products.filter(p => p.stock <= 5);
  const activeCartsArray = Object.values(activeCarts);

  if (loading) {
    return (
      <div style={{ padding: "80px", textAlign: "center", color: "#777" }}>
        Loading Admin Panel Content...
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>
          <div className={styles.logoText}>ëlla</div>
          <div className={styles.logoSub}>Admin Board</div>
        </div>

        <nav style={{ flex: 1 }}>
          <ul className={styles.menuList}>
            <li className={styles.menuItem}>
              <button 
                className={`${styles.menuBtn} ${activeTab === "dashboard" ? styles.activeMenu : ""}`}
                onClick={() => setActiveTab("dashboard")}
              >
                Dashboard
              </button>
            </li>
            <li className={styles.menuItem}>
              <button 
                className={`${styles.menuBtn} ${activeTab === "products" ? styles.activeMenu : ""}`}
                onClick={() => setActiveTab("products")}
              >
                Products Manager
              </button>
            </li>
            <li className={styles.menuItem}>
              <button 
                className={`${styles.menuBtn} ${activeTab === "orders" ? styles.activeMenu : ""}`}
                onClick={() => setActiveTab("orders")}
              >
                Orders Tracker ({orders.length})
              </button>
            </li>
            <li className={styles.menuItem}>
              <button 
                className={`${styles.menuBtn} ${activeTab === "content" ? styles.activeMenu : ""}`}
                onClick={() => setActiveTab("content")}
              >
                Content & Banners
              </button>
            </li>
            <li className={styles.menuItem}>
              <button 
                className={`${styles.menuBtn} ${activeTab === "live" ? styles.activeMenu : ""}`}
                onClick={() => setActiveTab("live")}
              >
                Live Monitor ({activeCartsArray.length})
              </button>
            </li>
            <li className={styles.menuItem}>
              <button 
                className={`${styles.menuBtn} ${activeTab === "metadata" ? styles.activeMenu : ""}`}
                onClick={() => setActiveTab("metadata")}
              >
                Fast Listing Options
              </button>
            </li>
            <li className={styles.menuItem} style={{ marginTop: "20px" }}>
              <Link 
                href="/admin/seed" 
                className={styles.menuBtn}
                style={{ color: "#b59410", border: "1px dashed #b59410" }}
              >
                Database Seed Portal
              </Link>
            </li>
          </ul>
        </nav>

        <Link href="/profile" className={`${styles.menuBtn} ${styles.exitBtn}`} style={{ textDecoration: "none", textAlign: "center", display: "block" }}>
          Exit Admin
        </Link>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainPanel}>
        <div className={styles.panelHeader}>
          <div>
            <h1 className={styles.panelTitle}>
              {activeTab === "dashboard" && "Analytics Overview"}
              {activeTab === "products" && "Product Catalog Management"}
              {activeTab === "orders" && "Customer Orders Tracker"}
              {activeTab === "content" && "Storefront Content Settings"}
              {activeTab === "live" && "Live Real-Time Activity"}
              {activeTab === "metadata" && "Fast Listing Options"}
            </h1>
            <p className={styles.panelDesc}>
              {activeTab === "dashboard" && "Performance metrics and sales statistics."}
              {activeTab === "products" && "Create, update, and remove catalog items."}
              {activeTab === "orders" && "Fulfill, track, and update order statuses."}
              {activeTab === "content" && "Manage banners, promotions, and announcement texts."}
              {activeTab === "live" && "Active shopper carts and database activities."}
              {activeTab === "metadata" && "Configure categories, platings, sizes, and badges."}
            </p>
          </div>

          {!isFirebaseConfigured && (
            <div style={{ backgroundColor: "#fffde6", border: "1px solid #ffe89e", color: "#9a7300", fontSize: "0.8rem", padding: "8px 12px", borderRadius: "2px" }}>
              ⚠️ Running in Local Mock mode
            </div>
          )}
        </div>

        {/* 3.1 DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statInfo}>
                  <div className={styles.statVal}>₹{totalSales.toFixed(2)}</div>
                  <div className={styles.statLabel}>Total Sales</div>
                </div>
                <div className={styles.statIconWrap}>₹</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statInfo}>
                  <div className={styles.statVal}>{orders.length}</div>
                  <div className={styles.statLabel}>Total Orders</div>
                </div>
                <div className={styles.statIconWrap}>📦</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statInfo}>
                  <div className={styles.statVal}>{products.length}</div>
                  <div className={styles.statLabel}>Products listed</div>
                </div>
                <div className={styles.statIconWrap}>💍</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statInfo}>
                  <div className={styles.statVal} style={{ color: lowStockProducts.length > 0 ? "#c0392b" : "#1a1a1a" }}>
                    {lowStockProducts.length}
                  </div>
                  <div className={styles.statLabel}>Low Stock Items</div>
                </div>
                <div className={styles.statIconWrap}>⚠️</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "30px" }}>
              {/* Recent Orders List */}
              <div className={styles.contentCard}>
                <h3 className={styles.cardTitle} style={{ marginBottom: "20px" }}>Recent Orders</h3>
                {orders.length === 0 ? (
                  <p style={{ color: "#777", fontStyle: "italic", fontSize: "0.9rem" }}>No orders placed yet.</p>
                ) : (
                  <div className={styles.tableResponsive}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer</th>
                          <th>Total Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 5).map((order) => (
                          <tr key={order.id}>
                            <td>#{order.id.substring(0, 8).toUpperCase()}</td>
                            <td>{order.shippingAddress?.fullName || order.userEmail || "Customer"}</td>
                            <td>₹{(order.totalAmount || order.total || 0).toFixed(2)}</td>
                            <td>
                              <span className={`${styles.badge} ${
                                order.status === "delivered" ? styles.badgeSuccess :
                                order.status === "shipped" ? styles.badgeWarning : styles.badgeDanger
                              }`}>
                                {order.status || "pending"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Active Carts List */}
              <div className={styles.contentCard}>
                <h3 className={styles.cardTitle} style={{ marginBottom: "20px" }}>Active Carts ({activeCartsArray.length})</h3>
                {activeCartsArray.length === 0 ? (
                  <p style={{ color: "#777", fontStyle: "italic", fontSize: "0.9rem" }}>No active shoppers.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {activeCartsArray.slice(0, 4).map((cart, idx) => (
                      <div key={idx} style={{ padding: "12px", border: "1px solid #eae6df", backgroundColor: "#faf9f6" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", fontSize: "0.85rem" }}>
                          <span>{cart.displayName}</span>
                          <span style={{ color: "#b59410" }}>₹{cart.total?.toFixed(2)}</span>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#707070", marginTop: "4px" }}>
                          {cart.itemsCount} items currently in cart
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3.2 PRODUCTS TAB */}
        {activeTab === "products" && (
          <div className={styles.contentCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Product Catalog</h3>
              <button className={styles.actionBtn} onClick={handleAddProductClick}>
                + Add Product
              </button>
            </div>

            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Badge</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const src = getImageSrc(p.images?.[0]);
                    const isExt = isExternalImage(src);
                    return (
                      <tr key={p.slug}>
                        <td>
                          <div className={styles.tableImg}>
                            {isExt ? (
                              <img src={src} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <Image src={src || "/assets/image 1.png"} alt={p.name} fill style={{ objectFit: "cover" }} />
                            )}
                          </div>
                        </td>
                        <td style={{ fontWeight: "600" }}>{p.name}</td>
                        <td>{p.category}</td>
                        <td style={{ fontWeight: "600", color: "#b59410" }}>₹{p.price.toFixed(2)}</td>
                        <td>
                          {p.badge ? (
                            <span className={styles.badge} style={{ backgroundColor: "#1a1a1a", color: "white" }}>
                              {p.badge}
                            </span>
                          ) : "None"}
                        </td>
                        <td>
                          <div className={styles.btnGroup}>
                            <button className={styles.editBtn} onClick={() => handleEditProductClick(p)}>
                              Edit
                            </button>
                            <button className={styles.deleteBtn} onClick={() => handleDeleteProduct(p.slug)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3.3 ORDERS TAB */}
        {activeTab === "orders" && (
          <div className={styles.contentCard}>
            <h3 className={styles.cardTitle} style={{ marginBottom: "20px" }}>Active Customer Orders</h3>
            {orders.length === 0 ? (
              <p style={{ color: "#777", fontStyle: "italic" }}>No orders found.</p>
            ) : (
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Customer Info</th>
                      <th>Shipping Address</th>
                      <th>Items Purchased</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Change Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                          #{order.id.substring(0, 8).toUpperCase()}
                        </td>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div><strong>{order.shippingAddress?.fullName}</strong></div>
                          <div style={{ fontSize: "0.75rem", color: "#707070" }}>{order.userEmail}</div>
                          <div style={{ fontSize: "0.75rem", color: "#707070" }}>{order.shippingAddress?.phone}</div>
                        </td>
                        <td style={{ fontSize: "0.8rem", maxWidth: "200px" }}>
                          {order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.zipCode}
                        </td>
                        <td style={{ fontSize: "0.8rem" }}>
                          {order.items?.map((it, idx) => (
                            <div key={idx} style={{ marginBottom: "4px" }}>
                              {it.name} {it.metal ? `(${it.metal})` : ""} {it.size ? `Sz ${it.size}` : ""} x{it.quantity}
                            </div>
                          ))}
                        </td>
                        <td style={{ fontWeight: "600", color: "#b59410" }}>
                          ₹{(order.totalAmount || order.total || 0).toFixed(2)}
                        </td>
                        <td>
                          <span className={`${styles.badge} ${
                            order.status === "delivered" ? styles.badgeSuccess :
                            order.status === "shipped" ? styles.badgeWarning : styles.badgeDanger
                          }`}>
                            {order.status || "pending"}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <button 
                              className={styles.editBtn} 
                              style={{ fontSize: "0.7rem", padding: "4px 8px" }}
                              onClick={() => handleUpdateOrderStatus(order.id, "shipped")}
                              disabled={order.status === "shipped"}
                            >
                              Mark Shipped
                            </button>
                            <button 
                              className={styles.editBtn} 
                              style={{ fontSize: "0.7rem", padding: "4px 8px" }}
                              onClick={() => handleUpdateOrderStatus(order.id, "delivered")}
                              disabled={order.status === "delivered"}
                            >
                              Mark Delivered
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3.4 CONTENT TAB */}
        {activeTab === "content" && (
          <div className={styles.contentCard}>
            <h3 className={styles.cardTitle} style={{ marginBottom: "20px" }}>Homepage Content & Promos</h3>
            
            {contentSuccess && <div className={styles.success}>{contentSuccess}</div>}

            <form onSubmit={handleSaveContent} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Top Bar Announcement Text</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  placeholder="e.g. FREE SHIPPING OVER $99"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Main Hero Headline</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Hero Subtitle Text</label>
                <textarea 
                  className={styles.input} 
                  style={{ height: "80px" }}
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                />
              </div>

              <button type="submit" className={styles.actionBtn} style={{ width: "fit-content" }}>
                Update Storefront Content
              </button>
            </form>
          </div>
        )}

        {/* 3.5 LIVE MONITOR TAB */}
        {activeTab === "live" && (
          <div className={styles.contentCard}>
            <h3 className={styles.cardTitle} style={{ marginBottom: "20px" }}>Live Shoppers Monitor</h3>
            <p style={{ color: "#777", fontSize: "0.85rem", marginBottom: "20px" }}>
              Shows customer shopping carts currently active in Realtime Database. Carts are cleared upon checkout or logout.
            </p>

            {activeCartsArray.length === 0 ? (
              <div className={styles.emptyReviews}>No active users currently browsing.</div>
            ) : (
              <div className={styles.liveFeedList}>
                {activeCartsArray.map((cart, index) => (
                  <div key={index} className={styles.liveCartCard}>
                    <div className={styles.liveCartHead}>
                      <span>{cart.displayName} ({cart.email})</span>
                      <span style={{ color: "#b59410" }}>Total: ₹{cart.total?.toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#707070", marginBottom: "8px" }}>
                      Updated: {new Date(cart.updatedAt).toLocaleTimeString()}
                    </div>
                    <div>
                      {cart.items?.map((it, idx) => (
                        <div key={idx} className={styles.liveCartItem}>
                          💍 {it.name} {it.metal ? `(${it.metal})` : ""} {it.size ? `Sz ${it.size}` : ""} — Quantity: <strong>{it.quantity}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3.6 METADATA CONFIG TAB */}
        {activeTab === "metadata" && (
          <div className={styles.contentCard}>
            <h3 className={styles.cardTitle} style={{ marginBottom: "20px" }}>Fast Listing Metadata Options</h3>
            <p style={{ color: "#777", fontSize: "0.85rem", marginBottom: "25px" }}>
              Configure categories, platings, sizes, and badges. These values will instantly update the selection dropdowns and checkbox grids in the product creation drawer to enable rapid, single-click product listings.
            </p>

            {/* Save Status */}
            {metadataSuccess && (
              <div style={{ backgroundColor: "#f3faf1", border: "1px solid #d4ecd0", color: "#27ae60", padding: "10px 14px", fontSize: "0.85rem", borderRadius: "2px", marginBottom: "16px" }}>
                {metadataSuccess}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
              
              {/* Category Management */}
              <div style={{ border: "1px solid #eae6df", padding: "20px", backgroundColor: "#faf9f6" }}>
                <h4 style={{ fontFamily: "var(--font-baskerville)", fontSize: "1.1rem", borderBottom: "1px solid #eae6df", paddingBottom: "8px", marginBottom: "15px" }}>Categories</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "15px" }}>
                  {metadataConfig.categories.map(cat => (
                    <span key={cat} style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#fff", border: "1px solid #eae6df", padding: "4px 10px", fontSize: "0.8rem", borderRadius: "2px" }}>
                      {cat}
                      <button type="button" onClick={() => deleteMetadataItem("categories", cat)} style={{ border: "none", background: "none", color: "#c0392b", cursor: "pointer", fontWeight: "bold" }}>✕</button>
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input type="text" id="new-category" placeholder="Add category..." style={{ flex: 1, padding: "8px 12px", border: "1px solid #eae6df", fontSize: "0.8rem" }} onKeyDown={(e) => { if (e.key === 'Enter') addMetadataItem("categories", e.target.value, "new-category"); }} />
                  <button type="button" onClick={() => { const input = document.getElementById("new-category"); addMetadataItem("categories", input.value, "new-category"); }} style={{ backgroundColor: "#1a1a1a", color: "#fff", border: "none", padding: "8px 16px", fontSize: "0.8rem", cursor: "pointer" }}>Add</button>
                </div>
              </div>

              {/* Platings Management */}
              <div style={{ border: "1px solid #eae6df", padding: "20px", backgroundColor: "#faf9f6" }}>
                <h4 style={{ fontFamily: "var(--font-baskerville)", fontSize: "1.1rem", borderBottom: "1px solid #eae6df", paddingBottom: "8px", marginBottom: "15px" }}>Platings / Metals</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "15px" }}>
                  {metadataConfig.platings.map(plat => (
                    <span key={plat} style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#fff", border: "1px solid #eae6df", padding: "4px 10px", fontSize: "0.8rem", borderRadius: "2px" }}>
                      {plat}
                      <button type="button" onClick={() => deleteMetadataItem("platings", plat)} style={{ border: "none", background: "none", color: "#c0392b", cursor: "pointer", fontWeight: "bold" }}>✕</button>
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input type="text" id="new-plating" placeholder="Add plating..." style={{ flex: 1, padding: "8px 12px", border: "1px solid #eae6df", fontSize: "0.8rem" }} onKeyDown={(e) => { if (e.key === 'Enter') addMetadataItem("platings", e.target.value, "new-plating"); }} />
                  <button type="button" onClick={() => { const input = document.getElementById("new-plating"); addMetadataItem("platings", input.value, "new-plating"); }} style={{ backgroundColor: "#1a1a1a", color: "#fff", border: "none", padding: "8px 16px", fontSize: "0.8rem", cursor: "pointer" }}>Add</button>
                </div>
              </div>

            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
              
              {/* Promo Badges Management */}
              <div style={{ border: "1px solid #eae6df", padding: "20px", backgroundColor: "#faf9f6" }}>
                <h4 style={{ fontFamily: "var(--font-baskerville)", fontSize: "1.1rem", borderBottom: "1px solid #eae6df", paddingBottom: "8px", marginBottom: "15px" }}>Promo Badges</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "15px" }}>
                  {metadataConfig.promoBadges.map(badge => (
                    <span key={badge} style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#fff", border: "1px solid #eae6df", padding: "4px 10px", fontSize: "0.8rem", borderRadius: "2px" }}>
                      {badge}
                      <button type="button" onClick={() => deleteMetadataItem("promoBadges", badge)} style={{ border: "none", background: "none", color: "#c0392b", cursor: "pointer", fontWeight: "bold" }}>✕</button>
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input type="text" id="new-badge" placeholder="Add badge..." style={{ flex: 1, padding: "8px 12px", border: "1px solid #eae6df", fontSize: "0.8rem" }} onKeyDown={(e) => { if (e.key === 'Enter') addMetadataItem("promoBadges", e.target.value, "new-badge"); }} />
                  <button type="button" onClick={() => { const input = document.getElementById("new-badge"); addMetadataItem("promoBadges", input.value, "new-badge"); }} style={{ backgroundColor: "#1a1a1a", color: "#fff", border: "none", padding: "8px 16px", fontSize: "0.8rem", cursor: "pointer" }}>Add</button>
                </div>
              </div>

              {/* Sizes Management Option */}
              <div style={{ border: "1px solid #eae6df", padding: "20px", backgroundColor: "#faf9f6" }}>
                <h4 style={{ fontFamily: "var(--font-baskerville)", fontSize: "1.1rem", borderBottom: "1px solid #eae6df", paddingBottom: "8px", marginBottom: "15px" }}>Sizes Manager</h4>
                
                {/* Gender toggle */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                  <button type="button" onClick={() => setSizeMgrGender("Woman")} style={{ flex: 1, padding: "6px", fontSize: "0.75rem", border: "1px solid #1a1a1a", backgroundColor: sizeMgrGender === "Woman" ? "#1a1a1a" : "#fff", color: sizeMgrGender === "Woman" ? "#fff" : "#1a1a1a", cursor: "pointer" }}>Woman Sizes</button>
                  <button type="button" onClick={() => setSizeMgrGender("Man")} style={{ flex: 1, padding: "6px", fontSize: "0.75rem", border: "1px solid #1a1a1a", backgroundColor: sizeMgrGender === "Man" ? "#1a1a1a" : "#fff", color: sizeMgrGender === "Man" ? "#fff" : "#1a1a1a", cursor: "pointer" }}>Man Sizes</button>
                </div>

                {/* Category select */}
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: "bold", display: "block", marginBottom: "4px" }}>Select Category:</label>
                  <select value={sizeMgrCat} onChange={(e) => setSizeMgrCat(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid #eae6df", fontSize: "0.8rem" }}>
                    {metadataConfig.categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Render sizes list */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px", minHeight: "36px" }}>
                  {(metadataConfig[sizeMgrGender === "Man" ? "manSizes" : "womanSizes"][sizeMgrCat] || []).map(sz => (
                    <span key={sz} style={{ display: "inline-flex", alignItems: "center", gap: "5px", backgroundColor: "#fff", border: "1px solid #eae6df", padding: "3px 8px", fontSize: "0.75rem", borderRadius: "2px" }}>
                      {sz}
                      <button type="button" onClick={() => deleteSizeItem(sizeMgrGender === "Man" ? "manSizes" : "womanSizes", sizeMgrCat, sz)} style={{ border: "none", background: "none", color: "#c0392b", cursor: "pointer", fontSize: "0.75rem" }}>✕</button>
                    </span>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <input type="text" id="new-size" placeholder="Add size (e.g. 11 or 7 inch)..." style={{ flex: 1, padding: "8px 12px", border: "1px solid #eae6df", fontSize: "0.8rem" }} onKeyDown={(e) => { if (e.key === 'Enter') addSizeItem(sizeMgrGender === "Man" ? "manSizes" : "womanSizes", sizeMgrCat, e.target.value, "new-size"); }} />
                  <button type="button" onClick={() => { const input = document.getElementById("new-size"); addSizeItem(sizeMgrGender === "Man" ? "manSizes" : "womanSizes", sizeMgrCat, input.value, "new-size"); }} style={{ backgroundColor: "#1a1a1a", color: "#fff", border: "none", padding: "8px 16px", fontSize: "0.8rem", cursor: "pointer" }}>Add</button>
                </div>
              </div>

            </div>

            <div style={{ textAlign: "right" }}>
              <button type="button" onClick={saveMetadataConfig} style={{ backgroundColor: "#b59410", color: "#fff", border: "none", padding: "12px 24px", fontSize: "0.9rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer" }}>Save Metadata Config</button>
            </div>
          </div>
        )}
      </main>

      {/* 4. CRUD PRODUCT DRAWER (MODAL) */}
      {isDrawerOpen && (
        <div className={styles.drawerOverlay} onClick={() => setIsDrawerOpen(false)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h2 className={styles.drawerTitle}>
                {editingProduct ? `Edit ${editingProduct.name}` : "Create New Product"}
              </h2>
              <button className={styles.closeBtn} onClick={() => setIsDrawerOpen(false)}>
                ✕
              </button>
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

            <form onSubmit={handleProductSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Product Name *</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!editingProduct) {
                      setFormSlug(e.target.value.toLowerCase().trim().replace(/\s+/g, "-"));
                    }
                  }}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>URL Slug *</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  disabled={!!editingProduct}
                  required
                />
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Category</label>
                  <select 
                    className={styles.input} 
                    value={formCategory} 
                    onChange={(e) => setFormCategory(e.target.value)}
                  >
                    {metadataConfig.categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Gender Access</label>
                  <select 
                    className={styles.input} 
                    value={formGender} 
                    onChange={(e) => setFormGender(e.target.value)}
                  >
                    <option value="Woman">Woman</option>
                    <option value="Man">Man</option>
                    <option value="Unisex">Unisex (Both)</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Price (₹) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className={styles.input} 
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Original Price (₹)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className={styles.input} 
                    value={formOriginalPrice}
                    onChange={(e) => setFormOriginalPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Promo Badge</label>
                <select 
                  className={styles.input} 
                  value={formBadge} 
                  onChange={(e) => setFormBadge(e.target.value)}
                >
                  <option value="">None (No Badge)</option>
                  {metadataConfig.promoBadges.map(badge => (
                    <option key={badge} value={badge}>{badge}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Product Images (Paths or URLs)</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {formImages.map((img, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input 
                        type="text" 
                        className={styles.input} 
                        value={img}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormImages(prev => prev.map((item, i) => i === idx ? val : item));
                        }}
                        placeholder={`Image URL/Path #${idx + 1}`}
                      />
                      
                      {/* GitLab Uploader Button */}
                      <input 
                        type="file" 
                        id={`upload-${idx}`} 
                        style={{ display: "none" }} 
                        onChange={(e) => handleFileUpload(e, idx)} 
                        accept="image/*" 
                      />
                      {uploadingIndices[idx] ? (
                        <span style={{ fontSize: "0.75rem", color: "#888", fontStyle: "italic", whiteSpace: "nowrap" }}>
                          Uploading...
                        </span>
                      ) : (
                        <label 
                          htmlFor={`upload-${idx}`} 
                          style={{
                            backgroundColor: "#f5f5f5",
                            border: "1px solid #eae6df",
                            color: "#1a1a1a",
                            padding: "8px 12px",
                            fontSize: "0.8rem",
                            fontWeight: "bold",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            whiteSpace: "nowrap",
                            borderRadius: "2px",
                            userSelect: "none"
                          }}
                        >
                          📁 Upload
                        </label>
                      )}

                      {formImages.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => setFormImages(prev => prev.filter((_, i) => i !== idx))} 
                          style={{
                            backgroundColor: "#c0392b",
                            color: "#fff",
                            border: "none",
                            padding: "8px 12px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            borderRadius: "2px"
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button 
                    type="button" 
                    onClick={() => setFormImages(prev => [...prev, ""])} 
                    style={{
                      backgroundColor: "#f0f0f0",
                      color: "#1a1a1a",
                      border: "1px dashed #ccc",
                      padding: "8px",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                      textAlign: "center",
                      borderRadius: "2px",
                      marginTop: "4px"
                    }}
                  >
                    + Add More Image
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Available Sizes</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", padding: "10px", border: "1px solid #eae6df", backgroundColor: "#faf9f6" }}>
                  {getAvailableSizes(formCategory, formGender).length === 0 ? (
                    <span style={{ fontSize: "0.75rem", color: "#999", fontStyle: "italic" }}>No sizes configured for this category. Add sizes in Fast Listing Options tab.</span>
                  ) : (
                    getAvailableSizes(formCategory, formGender).map(sz => (
                      <label key={sz} style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.8rem", cursor: "pointer", marginRight: "10px" }}>
                        <input 
                          type="checkbox" 
                          checked={formSelectedSizes.includes(sz)} 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormSelectedSizes(prev => [...prev, sz]);
                            } else {
                              setFormSelectedSizes(prev => prev.filter(x => x !== sz));
                            }
                          }} 
                        />
                        {sz}
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Available Platings</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", padding: "10px", border: "1px solid #eae6df", backgroundColor: "#faf9f6" }}>
                  {metadataConfig.platings.map(plat => (
                    <label key={plat} style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.8rem", cursor: "pointer", marginRight: "10px" }}>
                      <input 
                        type="checkbox" 
                        checked={formSelectedMetals.includes(plat)} 
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormSelectedMetals(prev => [...prev, plat]);
                          } else {
                            setFormSelectedMetals(prev => prev.filter(x => x !== plat));
                          }
                        }} 
                      />
                      {plat}
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Detailed Description</label>
                <textarea 
                  className={styles.input} 
                  style={{ height: "100px" }}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={styles.submitBtn}>
                  Save Product
                </button>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsDrawerOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
