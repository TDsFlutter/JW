"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isFirebaseConfigured, auth } from "@/lib/firebase";
import Link from "next/link";
import styles from "./admin.module.css";

const MAIN_SITE_URL = process.env.NEXT_PUBLIC_MAIN_SITE_URL || "http://localhost:3000";

export default function AdminDashboard() {
  const { currentUser, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  // Auth guard — redirect non-admin users
  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        router.push("/login");
      } else if (!isAdmin) {
        window.location.href = MAIN_SITE_URL;
      }
    }
  }, [currentUser, isAdmin, authLoading, router]);

  // Tab States
  // tabs: dashboard, products, categories, specifications, blogs, faqs, inquiries
  const [activeTab, setActiveTab] = useState("dashboard");

  // Core Data States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [specFields, setSpecFields] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status/Error States
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);

  // UI Filters / Search for Products
  const [prodSearch, setProdSearch] = useState("");
  const [prodCatFilter, setProdCatFilter] = useState("all");
  const [prodStatusFilter, setProdStatusFilter] = useState("all");

  // Drawers/Dialogs
  const [isProductDrawerOpen, setIsProductDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [isCatDrawerOpen, setIsCatDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [isSpecDrawerOpen, setIsSpecDrawerOpen] = useState(false);
  const [editingSpecField, setEditingSpecField] = useState(null);

  const [isBlogDrawerOpen, setIsBlogDrawerOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);

  const [isFaqDrawerOpen, setIsFaqDrawerOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);

  // Form States - Products
  const [formProdName, setFormProdName] = useState("");
  const [formProdShortDesc, setFormProdShortDesc] = useState("");
  const [formProdDesc, setFormProdDesc] = useState("");
  const [formProdCatId, setFormProdCatId] = useState("");
  const [formProdSubcat, setFormProdSubcat] = useState("");
  const [formProdMetalType, setFormProdMetalType] = useState("Gold");
  const [formProdMetalColor, setFormProdMetalColor] = useState("Yellow");
  const [formProdPurity, setFormProdPurity] = useState("18K");
  const [formProdStoneType, setFormProdStoneType] = useState("Moissanite");
  const [formProdStoneShape, setFormProdStoneShape] = useState("Round");
  const [formProdCutGrade, setFormProdCutGrade] = useState("Excellent");
  const [formProdStyle, setFormProdStyle] = useState("");
  const [formProdCollection, setFormProdCollection] = useState("Luxury");
  const [formProdBasePrice, setFormProdBasePrice] = useState("");
  const [formProdSalePrice, setFormProdSalePrice] = useState("");
  const [formProdStatus, setFormProdStatus] = useState("Draft");
  const [formProdDisplayOrder, setFormProdDisplayOrder] = useState("0");
  const [formProdGender, setFormProdGender] = useState("Unisex");
  const [formProdAvailability, setFormProdAvailability] = useState("Made To Order");
  const [formProdVideoUrl, setFormProdVideoUrl] = useState("");
  const [formProdImages, setFormProdImages] = useState([""]);
  const [formProdSpecs, setFormProdSpecs] = useState([]); // array of { name, value }

  // Form States - Categories
  const [formCatName, setFormCatName] = useState("");
  const [formCatPrefix, setFormCatPrefix] = useState("");
  const [formCatOrder, setFormCatOrder] = useState("0");

  // Form States - Spec Fields
  const [formSpecName, setFormSpecName] = useState("");
  const [formSpecOrder, setFormSpecOrder] = useState("0");

  // Form States - Blogs
  const [formBlogTitle, setFormBlogTitle] = useState("");
  const [formBlogContent, setFormBlogContent] = useState("");
  const [formBlogExcerpt, setFormBlogExcerpt] = useState("");
  const [formBlogCoverImage, setFormBlogCoverImage] = useState("");
  const [formBlogStatus, setFormBlogStatus] = useState("Draft");

  // Form States - FAQs
  const [formFaqQuestion, setFormFaqQuestion] = useState("");
  const [formFaqAnswer, setFormFaqAnswer] = useState("");
  const [formFaqOrder, setFormFaqOrder] = useState("0");

  // Get Auth Token Helper
  const getHeaders = async () => {
    if (!currentUser) return {};
    let token = currentUser.uid; // Mock token fallback
    if (isFirebaseConfigured && auth.currentUser) {
      try {
        token = await auth.currentUser.getIdToken();
      } catch (err) {
        console.error("Error getting ID token:", err);
      }
    }
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  };

  // Initialize DB helper
  const handleDbInitialize = async () => {
    if (!confirm("Are you sure you want to initialize the database? This will seed default categories, specifications, and sample products.")) {
      return;
    }
    setIsInitializing(true);
    setError("");
    setSuccess("");
    try {
      const headers = await getHeaders();
      const res = await fetch("/api/db-init", {
        method: "POST",
        headers
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess("Database initialized successfully!");
        loadAllData();
      } else {
        setError(data.error || "Initialization failed.");
      }
    } catch (err) {
      setError("Error initializing database: " + err.message);
    } finally {
      setIsInitializing(false);
    }
  };

  // Load All Data from MySQL APIs
  const loadAllData = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = await getHeaders();

      // Fetch Categories
      const catRes = await fetch("/api/categories", { headers });
      const catsData = await catRes.json();
      setCategories(Array.isArray(catsData) ? catsData : []);

      // Fetch Spec Fields
      const specRes = await fetch("/api/specifications", { headers });
      const specsData = await specRes.json();
      setSpecFields(Array.isArray(specsData) ? specsData : []);

      // Fetch FAQs
      const faqRes = await fetch("/api/faqs", { headers });
      const faqsData = await faqRes.json();
      setFaqs(Array.isArray(faqsData) ? faqsData : []);

      // Fetch Blogs
      const blogRes = await fetch("/api/blogs?status=all", { headers });
      const blogsData = await blogRes.json();
      setBlogs(Array.isArray(blogsData) ? blogsData : []);

      // Fetch Products
      const prodRes = await fetch("/api/products?status=all", { headers });
      const prodsData = await prodRes.json();
      setProducts(Array.isArray(prodsData) ? prodsData : []);

      // Fetch Inquiries
      const inqRes = await fetch("/api/contact", { headers });
      if (inqRes.status === 200) {
        const inqsData = await inqRes.json();
        setInquiries(Array.isArray(inqsData) ? inqsData : []);
      } else {
        setInquiries([]);
      }

      // Fetch Orders
      const orderRes = await fetch("/api/orders", { headers });
      if (orderRes.ok) {
        const ordersData = await orderRes.json();
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } else {
        setOrders([]);
      }

    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Failed to load backend data. Ensure database is running and initialized.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && isAdmin) {
      loadAllData();
    }
  }, [currentUser, isAdmin, activeTab]);

  // ── File Upload Helper (Cloudflare R2) ────────────────────────────────────
  const handleFileUpload = async (e, type, index = null) => {
    const file = e.target.files[0];
    if (!file) return;

    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = isFirebaseConfigured && auth.currentUser ? await auth.currentUser.getIdToken() : currentUser.uid;
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Upload failed");
      }

      const data = await res.json();
      
      if (type === "video") {
        setFormProdVideoUrl(data.url);
      } else if (type === "image" && index !== null) {
        const updatedImages = [...formProdImages];
        updatedImages[index] = data.url;
        setFormProdImages(updatedImages);
      } else if (type === "blog") {
        setFormBlogCoverImage(data.url);
      }
      setSuccess("File uploaded successfully.");
    } catch (err) {
      setError("File upload failed: " + err.message);
    }
  };

  // ── Product Operations ──────────────────────────────────────────────────
  const openProductDrawer = (prod = null) => {
    setError("");
    setSuccess("");
    if (prod) {
      setEditingProduct(prod);
      setFormProdName(prod.name || "");
      setFormProdShortDesc(prod.short_description || "");
      setFormProdDesc(prod.description || "");
      
      // Match category ID from list
      const matchedCat = categories.find(c => c.name === prod.category);
      setFormProdCatId(matchedCat ? matchedCat.id : (categories[0]?.id || ""));
      
      setFormProdSubcat(prod.subcategory || "");
      setFormProdMetalType(prod.metal_type || "Gold");
      setFormProdMetalColor(prod.metal_color || "Yellow");
      setFormProdPurity(prod.purity || "18K");
      setFormProdStoneType(prod.stone_type || "Moissanite");
      setFormProdStoneShape(prod.stone_shape || "Round");
      setFormProdCutGrade(prod.cut_grade || "Excellent");
      setFormProdStyle(prod.style || "");
      setFormProdCollection(prod.collection || "Luxury");
      setFormProdBasePrice(prod.price || "");
      setFormProdSalePrice(prod.originalPrice || "");
      setFormProdStatus(prod.status || "Draft");
      setFormProdDisplayOrder(String(prod.display_order || "0"));
      setFormProdGender(prod.gender || "Unisex");
      setFormProdAvailability(prod.availability || "Made To Order");
      setFormProdVideoUrl(prod.video_url || "");
      setFormProdImages(Array.isArray(prod.images) && prod.images.length > 0 ? prod.images : [""]);
      setFormProdSpecs(Array.isArray(prod.specs) ? prod.specs.map(s => ({ name: s.label, value: s.value })) : []);
    } else {
      setEditingProduct(null);
      setFormProdName("");
      setFormProdShortDesc("");
      setFormProdDesc("");
      setFormProdCatId(categories[0]?.id || "");
      setFormProdSubcat("");
      setFormProdMetalType("Gold");
      setFormProdMetalColor("Yellow");
      setFormProdPurity("18K");
      setFormProdStoneType("Moissanite");
      setFormProdStoneShape("Round");
      setFormProdCutGrade("Excellent");
      setFormProdStyle("");
      setFormProdCollection("Luxury");
      setFormProdBasePrice("");
      setFormProdSalePrice("");
      setFormProdStatus("Draft");
      setFormProdDisplayOrder("0");
      setFormProdGender("Unisex");
      setFormProdAvailability("Made To Order");
      setFormProdVideoUrl("");
      setFormProdImages([""]);
      setFormProdSpecs([]);
    }
    setIsProductDrawerOpen(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formProdName || !formProdCatId || !formProdBasePrice) {
      setError("Name, Category, and Base Price are required.");
      return;
    }

    const payload = {
      name: formProdName,
      short_description: formProdShortDesc,
      description: formProdDesc,
      category_id: parseInt(formProdCatId, 10),
      subcategory: formProdSubcat,
      metal_type: formProdMetalType,
      metal_color: formProdMetalColor,
      purity: formProdPurity,
      stone_type: formProdStoneType,
      stone_shape: formProdStoneShape,
      cut_grade: formProdCutGrade,
      style: formProdStyle,
      collection: formProdCollection,
      base_price: parseFloat(formProdBasePrice),
      sale_price: formProdSalePrice ? parseFloat(formProdSalePrice) : null,
      status: formProdStatus,
      display_order: parseInt(formProdDisplayOrder || 0, 10),
      gender: formProdGender,
      availability: formProdAvailability,
      video_url: formProdVideoUrl || null,
      images: formProdImages.filter(img => img.trim() !== ""),
      specs: formProdSpecs.filter(s => s.name && s.value)
    };

    try {
      const headers = await getHeaders();
      const url = editingProduct ? `/api/products/${editingProduct.slug}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccess(editingProduct ? "Product updated successfully." : "Product created successfully.");
        setIsProductDrawerOpen(false);
        loadAllData();
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to save product.");
      }
    } catch (err) {
      setError("Error saving product: " + err.message);
    }
  };

  const handleProductDelete = async (slug) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setError("");
    setSuccess("");
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/products/${slug}`, {
        method: "DELETE",
        headers
      });

      if (res.ok) {
        setSuccess("Product deleted successfully.");
        loadAllData();
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to delete product.");
      }
    } catch (err) {
      setError("Error deleting product: " + err.message);
    }
  };

  // ── Category Operations ──────────────────────────────────────────────────
  const openCategoryDrawer = (cat = null) => {
    setError("");
    setSuccess("");
    if (cat) {
      setEditingCategory(cat);
      setFormCatName(cat.name);
      setFormCatPrefix(cat.sku_prefix);
      setFormCatOrder(String(cat.display_order));
    } else {
      setEditingCategory(null);
      setFormCatName("");
      setFormCatPrefix("");
      setFormCatOrder("0");
    }
    setIsCatDrawerOpen(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formCatName || !formCatPrefix) {
      setError("Category Name and SKU Prefix are required.");
      return;
    }

    const payload = {
      name: formCatName,
      sku_prefix: formCatPrefix,
      display_order: parseInt(formCatOrder || 0, 10)
    };

    try {
      const headers = await getHeaders();
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccess(editingCategory ? "Category updated." : "Category created.");
        setIsCatDrawerOpen(false);
        loadAllData();
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to save category.");
      }
    } catch (err) {
      setError("Error: " + err.message);
    }
  };

  const handleCategoryDelete = async (id) => {
    if (!confirm("Are you sure? Deleting this category will delete all products inside it due to database constraints.")) return;
    setError("");
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE", headers });
      if (res.ok) {
        setSuccess("Category deleted.");
        loadAllData();
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to delete.");
      }
    } catch (err) {
      setError("Error: " + err.message);
    }
  };

  const handleCategoryReorder = async (direction, index) => {
    const newCats = [...categories];
    if (direction === "up" && index > 0) {
      const temp = newCats[index];
      newCats[index] = newCats[index - 1];
      newCats[index - 1] = temp;
    } else if (direction === "down" && index < newCats.length - 1) {
      const temp = newCats[index];
      newCats[index] = newCats[index + 1];
      newCats[index + 1] = temp;
    } else {
      return;
    }

    // Reassign order sequential numbers
    const updatedCats = newCats.map((cat, idx) => ({
      id: cat.id,
      display_order: idx + 1
    }));

    try {
      const headers = await getHeaders();
      const res = await fetch("/api/categories/reorder", {
        method: "POST",
        headers,
        body: JSON.stringify({ items: updatedCats })
      });
      if (res.ok) {
        loadAllData();
      } else {
        setError("Failed to reorder categories.");
      }
    } catch (err) {
      setError("Reorder failed: " + err.message);
    }
  };

  // ── Specification Operations ──────────────────────────────────────────────
  const openSpecDrawer = (field = null) => {
    setError("");
    setSuccess("");
    if (field) {
      setEditingSpecField(field);
      setFormSpecName(field.name);
      setFormSpecOrder(String(field.display_order));
    } else {
      setEditingSpecField(null);
      setFormSpecName("");
      setFormSpecOrder("0");
    }
    setIsSpecDrawerOpen(true);
  };

  const handleSpecSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formSpecName) {
      setError("Specification field name is required.");
      return;
    }

    const payload = {
      name: formSpecName,
      display_order: parseInt(formSpecOrder || 0, 10)
    };

    try {
      const headers = await getHeaders();
      const url = editingSpecField ? `/api/specifications/${editingSpecField.id}` : "/api/specifications";
      const method = editingSpecField ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccess(editingSpecField ? "Spec field updated." : "Spec field added.");
        setIsSpecDrawerOpen(false);
        loadAllData();
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to save specification field.");
      }
    } catch (err) {
      setError("Error: " + err.message);
    }
  };

  const handleSpecDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this custom specification?")) return;
    setError("");
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/specifications/${id}`, { method: "DELETE", headers });
      if (res.ok) {
        setSuccess("Spec field deleted.");
        loadAllData();
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to delete.");
      }
    } catch (err) {
      setError("Error: " + err.message);
    }
  };

  // ── Blogs & FAQs Operations ───────────────────────────────────────────────
  const openBlogDrawer = (blog = null) => {
    setError("");
    setSuccess("");
    if (blog) {
      setEditingBlog(blog);
      setFormBlogTitle(blog.title);
      setFormBlogContent(blog.content);
      setFormBlogExcerpt(blog.excerpt || "");
      setFormBlogCoverImage(blog.cover_image || blog.image || "");
      setFormBlogStatus(blog.status || "Draft");
    } else {
      setEditingBlog(null);
      setFormBlogTitle("");
      setFormBlogContent("");
      setFormBlogExcerpt("");
      setFormBlogCoverImage("");
      setFormBlogStatus("Draft");
    }
    setIsBlogDrawerOpen(true);
  };

  const handleBlogSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!formBlogTitle || !formBlogContent || !formBlogCoverImage) {
      setError("Title, Content, and Cover Image are required.");
      return;
    }
    const payload = {
      title: formBlogTitle,
      content: formBlogContent,
      excerpt: formBlogExcerpt,
      cover_image: formBlogCoverImage,
      status: formBlogStatus
    };
    try {
      const headers = await getHeaders();
      const url = editingBlog ? `/api/blogs/${editingBlog.slug}` : "/api/blogs";
      const method = editingBlog ? "PUT" : "POST";
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      if (res.ok) {
        setIsBlogDrawerOpen(false);
        loadAllData();
        setSuccess("Blog saved.");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save blog.");
      }
    } catch (err) {
      setError("Error: " + err.message);
    }
  };

  const handleBlogDelete = async (slug) => {
    if (!confirm("Are you sure you want to delete this blog?")) return;
    setError("");
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/blogs/${slug}`, { method: "DELETE", headers });
      if (res.ok) {
        loadAllData();
        setSuccess("Blog deleted.");
      }
    } catch (err) {
      setError("Error: " + err.message);
    }
  };

  const openFaqDrawer = (faq = null) => {
    setError("");
    setSuccess("");
    if (faq) {
      setEditingFaq(faq);
      setFormFaqQuestion(faq.question);
      setFormFaqAnswer(faq.answer);
      setFormFaqOrder(String(faq.display_order));
    } else {
      setEditingFaq(null);
      setFormFaqQuestion("");
      setFormFaqAnswer("");
      setFormFaqOrder("0");
    }
    setIsFaqDrawerOpen(true);
  };

  const handleFaqSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!formFaqQuestion || !formFaqAnswer) {
      setError("Question and Answer are required.");
      return;
    }
    const payload = {
      question: formFaqQuestion,
      answer: formFaqAnswer,
      display_order: parseInt(formFaqOrder || 0, 10)
    };
    try {
      const headers = await getHeaders();
      const url = editingFaq ? `/api/faqs/${editingFaq.id}` : "/api/faqs";
      const method = editingFaq ? "PUT" : "POST";
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      if (res.ok) {
        setIsFaqDrawerOpen(false);
        loadAllData();
        setSuccess("FAQ saved.");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save FAQ.");
      }
    } catch (err) {
      setError("Error: " + err.message);
    }
  };

  const handleFaqDelete = async (id) => {
    if (!confirm("Are you sure?")) return;
    setError("");
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/faqs/${id}`, { method: "DELETE", headers });
      if (res.ok) {
        loadAllData();
        setSuccess("FAQ deleted.");
      }
    } catch (err) {
      setError("Error: " + err.message);
    }
  };

  const handleOrderStatusUpdate = async (id, status) => {
    setError("");
    setSuccess("");
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setSuccess("Order status updated.");
        loadAllData();
      } else {
        setError("Failed to update status.");
      }
    } catch (err) {
      setError("Error: " + err.message);
    }
  };

  const handleOrderDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    setError("");
    setSuccess("");
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE", headers });
      if (res.ok) {
        setSuccess("Order deleted successfully.");
        loadAllData();
      } else {
        setError("Failed to delete order.");
      }
    } catch (err) {
      setError("Error: " + err.message);
    }
  };

  // ── Render Helpers ────────────────────────────────────────────────────────
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(prodSearch.toLowerCase()) || p.sku.toLowerCase().includes(prodSearch.toLowerCase());
    const matchesCat = prodCatFilter === "all" || p.category === prodCatFilter;
    const matchesStatus = prodStatusFilter === "all" || p.status === prodStatusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  if (authLoading || (currentUser && !isAdmin)) {
    return (
      <div className={styles.adminContainer} style={{ justifyContent: "center", alignItems: "center" }}>
        <p style={{ fontStyle: "italic", color: "#707070" }}>Verifying credentials...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      
      {/* ── SIDEBAR ── */}
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>
          <h1 className={styles.logoText}>ëlla</h1>
          <div className={styles.logoSub}>Admin Panel</div>
        </div>

        <nav>
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
                Products
              </button>
            </li>
            <li className={styles.menuItem}>
              <button
                className={`${styles.menuBtn} ${activeTab === "categories" ? styles.activeMenu : ""}`}
                onClick={() => setActiveTab("categories")}
              >
                Categories
              </button>
            </li>
            <li className={styles.menuItem}>
              <button
                className={`${styles.menuBtn} ${activeTab === "specifications" ? styles.activeMenu : ""}`}
                onClick={() => setActiveTab("specifications")}
              >
                Specifications
              </button>
            </li>
            <li className={styles.menuItem}>
              <button
                className={`${styles.menuBtn} ${activeTab === "blogs" ? styles.activeMenu : ""}`}
                onClick={() => setActiveTab("blogs")}
              >
                Blogs
              </button>
            </li>
            <li className={styles.menuItem}>
              <button
                className={`${styles.menuBtn} ${activeTab === "faqs" ? styles.activeMenu : ""}`}
                onClick={() => setActiveTab("faqs")}
              >
                FAQs
              </button>
            </li>
            <li className={styles.menuItem}>
              <button
                className={`${styles.menuBtn} ${activeTab === "orders" ? styles.activeMenu : ""}`}
                onClick={() => setActiveTab("orders")}
              >
                Orders ({orders.length})
              </button>
            </li>
            <li className={styles.menuItem}>
              <button
                className={`${styles.menuBtn} ${activeTab === "inquiries" ? styles.activeMenu : ""}`}
                onClick={() => setActiveTab("inquiries")}
              >
                Inquiries ({inquiries.length})
              </button>
            </li>
          </ul>
        </nav>

        <a href={MAIN_SITE_URL} className={`${styles.menuBtn} ${styles.exitBtn}`}>
          Exit Admin
        </a>
      </aside>

      {/* ── MAIN CONTENT PANEL ── */}
      <main className={styles.mainPanel}>
        
        {/* PANEL HEADER */}
        <header className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>
              {activeTab === "dashboard" && "Analytics Overview"}
              {activeTab === "products" && "Product Catalog"}
              {activeTab === "categories" && "Product Categories"}
              {activeTab === "specifications" && "Specification Fields"}
              {activeTab === "blogs" && "Journal & Articles"}
              {activeTab === "faqs" && "Store FAQ Management"}
              {activeTab === "orders" && "Order Management"}
              {activeTab === "inquiries" && "Customer Inquiries"}
            </h2>
            <p className={styles.panelDesc}>
              {activeTab === "dashboard" && "Performance metrics, system actions, and recent inquiries."}
              {activeTab === "products" && "Manage listing parameters, auto SKU generation, and image gallery."}
              {activeTab === "categories" && "Setup category tags, SKU prefixes, and sequence sorting."}
              {activeTab === "specifications" && "Add, edit, or remove dynamic specification keys."}
              {activeTab === "blogs" && "Publish press releases, style guides, and product announcements."}
              {activeTab === "faqs" && "Update dynamic accordion contents for customer support."}
              {activeTab === "orders" && "Update customer order statuses and fulfill orders."}
              {activeTab === "inquiries" && "Review contact messages and pricing requests from the storefront."}
            </p>
          </div>

          <div>
            {activeTab === "dashboard" && (
              <button 
                className={styles.actionBtn}
                onClick={handleDbInitialize}
                disabled={isInitializing}
              >
                {isInitializing ? "Initializing..." : "Initialize Database Schema"}
              </button>
            )}
            {activeTab === "products" && (
              <button className={styles.actionBtn} onClick={() => openProductDrawer()}>
                + Add Product
              </button>
            )}
            {activeTab === "categories" && (
              <button className={styles.actionBtn} onClick={() => openCategoryDrawer()}>
                + Add Category
              </button>
            )}
            {activeTab === "specifications" && (
              <button className={styles.actionBtn} onClick={() => openSpecDrawer()}>
                + Add Spec Field
              </button>
            )}
            {activeTab === "blogs" && (
              <button className={styles.actionBtn} onClick={() => openBlogDrawer()}>
                + Add Post
              </button>
            )}
            {activeTab === "faqs" && (
              <button className={styles.actionBtn} onClick={() => openFaqDrawer()}>
                + Add FAQ
              </button>
            )}
          </div>
        </header>

        {/* ALERTS */}
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        {loading ? (
          <p style={{ fontStyle: "italic", color: "#707070" }}>Loading records from MySQL...</p>
        ) : (
          <>
            {/* ── TAB: DASHBOARD ── */}
            {activeTab === "dashboard" && (
              <div>
                <section className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                      <span className={styles.statVal}>{products.length}</span>
                      <span className={styles.statLabel}>Products</span>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                      <span className={styles.statVal}>{categories.length}</span>
                      <span className={styles.statLabel}>Categories</span>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                      <span className={styles.statVal}>{blogs.length}</span>
                      <span className={styles.statLabel}>Articles</span>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                      <span className={styles.statVal}>{orders.length}</span>
                      <span className={styles.statLabel}>Orders</span>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                      <span className={styles.statVal}>{inquiries.length}</span>
                      <span className={styles.statLabel}>Inquiries</span>
                    </div>
                  </div>
                </section>

                <div className={styles.contentCard}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>Recent Contact Inquiries</h3>
                  </div>
                  <div className={styles.tableResponsive}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Message</th>
                          <th>Received At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inquiries.slice(0, 5).map(inq => (
                          <tr key={inq.id}>
                            <td>{inq.name}</td>
                            <td>{inq.email}</td>
                            <td>{inq.phone || "—"}</td>
                            <td>{inq.message}</td>
                            <td>{new Date(inq.created_at).toLocaleString()}</td>
                          </tr>
                        ))}
                        {inquiries.length === 0 && (
                          <tr>
                            <td colSpan="5" style={{ textAlign: "center", fontStyle: "italic" }}>
                              No messages received.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: PRODUCTS ── */}
            {activeTab === "products" && (
              <div className={styles.contentCard}>
                <div style={{ display: "flex", gap: "15px", marginBottom: "20px", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    placeholder="Search by name or SKU..."
                    value={prodSearch}
                    onChange={(e) => setProdSearch(e.target.value)}
                    className={styles.input}
                    style={{ maxWidth: "300px" }}
                  />
                  <select
                    value={prodCatFilter}
                    onChange={(e) => setProdCatFilter(e.target.value)}
                    className={styles.input}
                    style={{ maxWidth: "200px" }}
                  >
                    <option value="all">All Categories</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    value={prodStatusFilter}
                    onChange={(e) => setProdStatusFilter(e.target.value)}
                    className={styles.input}
                    style={{ maxWidth: "150px" }}
                  >
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className={styles.tableResponsive}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>SKU</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Order</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(p => (
                        <tr key={p.id}>
                          <td>
                            <div className={styles.tableImg}>
                              {p.images && p.images[0] && (
                                <img
                                  src={p.images[0]}
                                  alt={p.name}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              )}
                            </div>
                          </td>
                          <td style={{ fontWeight: "600" }}>{p.sku}</td>
                          <td>{p.name}</td>
                          <td>{p.category}</td>
                          <td>₹{p.price}</td>
                          <td>
                            <span className={`${styles.badge} ${
                              p.status === "Active" ? styles.badgeSuccess : 
                              p.status === "Draft" ? styles.badgeWarning : styles.badgeDanger
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td>{p.display_order}</td>
                          <td>
                            <div className={styles.btnGroup}>
                              <button className={styles.editBtn} onClick={() => openProductDrawer(p)}>
                                Edit
                              </button>
                              <button className={styles.deleteBtn} onClick={() => handleProductDelete(p.slug)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan="8" style={{ textAlign: "center", fontStyle: "italic" }}>
                            No products matching filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB: CATEGORIES ── */}
            {activeTab === "categories" && (
              <div className={styles.contentCard}>
                <p style={{ fontSize: "0.85rem", color: "#707070", marginBottom: "15px" }}>
                  💡 Use Up/Down buttons to sort categories. Reordering will immediately sync and control the website categories layout.
                </p>
                <div className={styles.tableResponsive}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Category Name</th>
                        <th>SKU Prefix</th>
                        <th>Display Order</th>
                        <th>Reorder</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((cat, index) => (
                        <tr key={cat.id}>
                          <td>{cat.id}</td>
                          <td style={{ fontWeight: "600" }}>{cat.name}</td>
                          <td><code>{cat.sku_prefix}</code></td>
                          <td>{cat.display_order}</td>
                          <td>
                            <div className={styles.btnGroup}>
                              <button 
                                className={styles.editBtn} 
                                disabled={index === 0} 
                                onClick={() => handleCategoryReorder("up", index)}
                              >
                                ▲
                              </button>
                              <button 
                                className={styles.editBtn} 
                                disabled={index === categories.length - 1} 
                                onClick={() => handleCategoryReorder("down", index)}
                              >
                                ▼
                              </button>
                            </div>
                          </td>
                          <td>
                            <div className={styles.btnGroup}>
                              <button className={styles.editBtn} onClick={() => openCategoryDrawer(cat)}>
                                Edit
                              </button>
                              <button className={styles.deleteBtn} onClick={() => handleCategoryDelete(cat.id)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB: SPECIFICATIONS ── */}
            {activeTab === "specifications" && (
              <div className={styles.contentCard}>
                <div className={styles.tableResponsive}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Specification Key</th>
                        <th>Display Order</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {specFields.map(field => (
                        <tr key={field.id}>
                          <td>{field.id}</td>
                          <td style={{ fontWeight: "600" }}>{field.name}</td>
                          <td>{field.display_order}</td>
                          <td>
                            <div className={styles.btnGroup}>
                              <button className={styles.editBtn} onClick={() => openSpecDrawer(field)}>
                                Edit
                              </button>
                              <button className={styles.deleteBtn} onClick={() => handleSpecDelete(field.id)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB: BLOGS ── */}
            {activeTab === "blogs" && (
              <div className={styles.contentCard}>
                <div className={styles.tableResponsive}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Cover</th>
                        <th>Title</th>
                        <th>Slug</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blogs.map(b => (
                        <tr key={b.id}>
                          <td>
                            <div className={styles.tableImg}>
                              {b.coverImage && (
                                <img
                                  src={b.coverImage}
                                  alt={b.title}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              )}
                            </div>
                          </td>
                          <td style={{ fontWeight: "600" }}>{b.title}</td>
                          <td>{b.slug}</td>
                          <td>
                            <span className={`${styles.badge} ${b.status === "Active" ? styles.badgeSuccess : styles.badgeWarning}`}>
                              {b.status}
                            </span>
                          </td>
                          <td>
                            <div className={styles.btnGroup}>
                              <button className={styles.editBtn} onClick={() => openBlogDrawer(b)}>
                                Edit
                              </button>
                              <button className={styles.deleteBtn} onClick={() => handleBlogDelete(b.slug)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB: FAQS ── */}
            {activeTab === "faqs" && (
              <div className={styles.contentCard}>
                <div className={styles.tableResponsive}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Question</th>
                        <th>Answer</th>
                        <th>Order</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {faqs.map(faq => (
                        <tr key={faq.id}>
                          <td>{faq.id}</td>
                          <td style={{ fontWeight: "600" }}>{faq.question}</td>
                          <td>{faq.answer.substring(0, 100)}...</td>
                          <td>{faq.display_order}</td>
                          <td>
                            <div className={styles.btnGroup}>
                              <button className={styles.editBtn} onClick={() => openFaqDrawer(faq)}>
                                Edit
                              </button>
                              <button className={styles.deleteBtn} onClick={() => handleFaqDelete(faq.id)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB: ORDERS ── */}
            {activeTab === "orders" && (
              <div className={styles.contentCard}>
                <div className={styles.tableResponsive}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Contact / Email</th>
                        <th>Address</th>
                        <th>Amount</th>
                        <th>Items</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(ord => (
                        <tr key={ord.id}>
                          <td style={{ fontWeight: "600" }}>{ord.order_number}</td>
                          <td style={{ fontWeight: "500" }}>{ord.name}</td>
                          <td>
                            <div>{ord.phone}</div>
                            <div style={{ fontSize: "0.8rem", color: "#666" }}>{ord.email}</div>
                          </td>
                          <td style={{ maxWidth: "180px", fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>{ord.address}</td>
                          <td style={{ fontWeight: "600" }}>₹{parseFloat(ord.total_amount).toFixed(2)}</td>
                          <td style={{ fontSize: "0.85rem" }}>
                            {Array.isArray(ord.items) ? ord.items.map((it, idx) => (
                              <div key={idx}>
                                • {it.name} x {it.quantity} ({it.metal} / Size: {it.size})
                              </div>
                            )) : "—"}
                          </td>
                          <td>
                            <select
                              value={ord.status}
                              onChange={(e) => handleOrderStatusUpdate(ord.order_number, e.target.value)}
                              className={styles.input}
                              style={{ padding: "4px 8px", fontSize: "0.85rem", minWidth: "120px" }}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td>
                            <button className={styles.deleteBtn} onClick={() => handleOrderDelete(ord.order_number)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan="8" style={{ textAlign: "center", fontStyle: "italic" }}>
                            No orders found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB: INQUIRIES ── */}
            {activeTab === "inquiries" && (
              <div className={styles.contentCard}>
                <div className={styles.tableResponsive}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Message</th>
                        <th>Received At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inquiries.map(inq => (
                        <tr key={inq.id}>
                          <td style={{ fontWeight: "600" }}>{inq.name}</td>
                          <td><a href={`mailto:${inq.email}`}>{inq.email}</a></td>
                          <td>{inq.phone ? <a href={`tel:${inq.phone}`}>{inq.phone}</a> : "—"}</td>
                          <td>{inq.message}</td>
                          <td>{new Date(inq.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                      {inquiries.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ textAlign: "center", fontStyle: "italic" }}>
                            No inquiries.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

      </main>

      {/* ── PRODUCT DRAWERS / MODALS ── */}
      {isProductDrawerOpen && (
        <div className={styles.drawerOverlay} onClick={() => setIsProductDrawerOpen(false)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <header className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>{editingProduct ? "Edit Product" : "Add New Product"}</h3>
              <button className={styles.closeBtn} onClick={() => setIsProductDrawerOpen(false)}>×</button>
            </header>
            
            <form onSubmit={handleProductSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Product Name *</label>
                <input
                  type="text"
                  required
                  value={formProdName}
                  onChange={(e) => setFormProdName(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Category *</label>
                  <select
                    required
                    value={formProdCatId}
                    onChange={(e) => setFormProdCatId(e.target.value)}
                    className={styles.input}
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Subcategory</label>
                  <input
                    type="text"
                    value={formProdSubcat}
                    onChange={(e) => setFormProdSubcat(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Base Price (₹) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formProdBasePrice}
                    onChange={(e) => setFormProdBasePrice(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Original/Sale Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Optional compare price"
                    value={formProdSalePrice}
                    onChange={(e) => setFormProdSalePrice(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Short Description</label>
                <input
                  type="text"
                  value={formProdShortDesc}
                  onChange={(e) => setFormProdShortDesc(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Full Description</label>
                <textarea
                  rows="4"
                  value={formProdDesc}
                  onChange={(e) => setFormProdDesc(e.target.value)}
                  className={styles.input}
                  style={{ fontFamily: "inherit", resize: "vertical" }}
                />
              </div>

              <h4 style={{ borderBottom: "1px solid #eae6df", paddingBottom: "6px", margin: "15px 0 5px" }} className={styles.label}>
                Jewelry Attributes
              </h4>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Metal Type</label>
                  <select value={formProdMetalType} onChange={(e) => setFormProdMetalType(e.target.value)} className={styles.input}>
                    <option value="Gold">Gold</option>
                    <option value="White Gold">White Gold</option>
                    <option value="Rose Gold">Rose Gold</option>
                    <option value="Platinum">Platinum</option>
                    <option value="Silver">Sterling Silver</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Metal Color</label>
                  <select value={formProdMetalColor} onChange={(e) => setFormProdMetalColor(e.target.value)} className={styles.input}>
                    <option value="Yellow">Yellow</option>
                    <option value="White">White</option>
                    <option value="Rose">Rose</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Purity</label>
                  <input type="text" placeholder="e.g. 18K, 14K, 925" value={formProdPurity} onChange={(e) => setFormProdPurity(e.target.value)} className={styles.input} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Stone Type</label>
                  <select value={formProdStoneType} onChange={(e) => setFormProdStoneType(e.target.value)} className={styles.input}>
                    <option value="Diamond">Diamond</option>
                    <option value="Moissanite">Moissanite</option>
                    <option value="Emerald">Emerald</option>
                    <option value="Ruby">Ruby</option>
                    <option value="Sapphire">Sapphire</option>
                    <option value="None">None</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Stone Shape</label>
                  <input type="text" placeholder="e.g. Round, Oval, Princess" value={formProdStoneShape} onChange={(e) => setFormProdStoneShape(e.target.value)} className={styles.input} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Cut Grade</label>
                  <input type="text" placeholder="e.g. Excellent, Very Good" value={formProdCutGrade} onChange={(e) => setFormProdCutGrade(e.target.value)} className={styles.input} />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Collection</label>
                  <select value={formProdCollection} onChange={(e) => setFormProdCollection(e.target.value)} className={styles.input}>
                    <option value="Wedding">Wedding</option>
                    <option value="Engagement">Engagement</option>
                    <option value="Vintage">Vintage</option>
                    <option value="Luxury">Luxury</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Style / Setting</label>
                  <input type="text" placeholder="e.g. Solitaire, Halo" value={formProdStyle} onChange={(e) => setFormProdStyle(e.target.value)} className={styles.input} />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Gender</label>
                  <select value={formProdGender} onChange={(e) => setFormProdGender(e.target.value)} className={styles.input}>
                    <option value="Women">Women</option>
                    <option value="Men">Men</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Availability</label>
                  <input type="text" value={formProdAvailability} onChange={(e) => setFormProdAvailability(e.target.value)} className={styles.input} />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Status</label>
                  <select value={formProdStatus} onChange={(e) => setFormProdStatus(e.target.value)} className={styles.input}>
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Display Order Priority</label>
                  <input type="number" value={formProdDisplayOrder} onChange={(e) => setFormProdDisplayOrder(e.target.value)} className={styles.input} />
                </div>
              </div>

              {/* DYNAMIC PRODUCT SPECIFICATIONS */}
              <h4 style={{ borderBottom: "1px solid #eae6df", paddingBottom: "6px", margin: "15px 0 5px" }} className={styles.label}>
                Dynamic Product Specifications
              </h4>
              <p style={{ fontSize: "0.75rem", color: "#707070", margin: "0 0 10px" }}>
                Select specification keys configured under the Specifications tab. Enter values for this product.
              </p>
              
              <div className={styles.specsEditorContainer}>
                <div className={styles.specsList}>
                  {formProdSpecs.map((spec, index) => (
                    <div key={index} className={styles.specRow}>
                      <select
                        value={spec.name}
                        onChange={(e) => {
                          const updated = [...formProdSpecs];
                          updated[index].name = e.target.value;
                          setFormProdSpecs(updated);
                        }}
                        className={styles.input}
                        style={{ padding: "6px", flex: 1 }}
                      >
                        <option value="">Select Spec Key</option>
                        {specFields.map(f => (
                          <option key={f.id} value={f.name}>{f.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Value (e.g. VS1, 1.5 Carat)"
                        value={spec.value}
                        onChange={(e) => {
                          const updated = [...formProdSpecs];
                          updated[index].value = e.target.value;
                          setFormProdSpecs(updated);
                        }}
                        className={styles.input}
                        style={{ padding: "6px", flex: 1.5 }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormProdSpecs(formProdSpecs.filter((_, idx) => idx !== index));
                        }}
                        className={styles.deleteBtn}
                        style={{ padding: "4px 8px" }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setFormProdSpecs([...formProdSpecs, { name: "", value: "" }])}
                  className={styles.editBtn}
                  style={{ width: "100%", padding: "8px" }}
                >
                  + Add Specification Row
                </button>
              </div>

              {/* IMAGE UPLOADS */}
              <h4 style={{ borderBottom: "1px solid #eae6df", paddingBottom: "6px", margin: "15px 0 5px" }} className={styles.label}>
                Product Images (Cloudflare R2 CDN)
              </h4>
              {formProdImages.map((imgUrl, index) => (
                <div key={index} className={styles.formGroup} style={{ border: "1px solid #eae6df", padding: "10px", backgroundColor: "#faf9f6" }}>
                  <label className={styles.label} style={{ fontSize: "0.7rem" }}>Image {index + 1}</label>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <input
                      type="text"
                      placeholder="Image URL"
                      value={imgUrl}
                      onChange={(e) => {
                        const updated = [...formProdImages];
                        updated[index] = e.target.value;
                        setFormProdImages(updated);
                      }}
                      className={styles.input}
                      style={{ flex: 1 }}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "image", index)}
                      style={{ display: "none" }}
                      id={`file-image-${index}`}
                    />
                    <label htmlFor={`file-image-${index}`} className={styles.editBtn} style={{ margin: 0, padding: "10px", textAlign: "center", whiteSpace: "nowrap" }}>
                      Upload File
                    </label>
                    {formProdImages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setFormProdImages(formProdImages.filter((_, idx) => idx !== index))}
                        className={styles.deleteBtn}
                        style={{ padding: "10px" }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFormProdImages([...formProdImages, ""])}
                className={styles.editBtn}
                style={{ alignSelf: "flex-start" }}
              >
                + Add Image Slot
              </button>

              {/* VIDEO UPLOAD */}
              <h4 style={{ borderBottom: "1px solid #eae6df", paddingBottom: "6px", margin: "15px 0 5px" }} className={styles.label}>
                Product Video (Cloudflare R2 CDN)
              </h4>
              <div className={styles.formGroup} style={{ border: "1px solid #eae6df", padding: "10px", backgroundColor: "#faf9f6" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Product Video URL (Optional)"
                    value={formProdVideoUrl}
                    onChange={(e) => setFormProdVideoUrl(e.target.value)}
                    className={styles.input}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileUpload(e, "video")}
                    style={{ display: "none" }}
                    id="file-video"
                  />
                  <label htmlFor="file-video" className={styles.editBtn} style={{ margin: 0, padding: "10px", textAlign: "center", whiteSpace: "nowrap" }}>
                    Upload Video
                  </label>
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={styles.submitBtn}>
                  {editingProduct ? "Save Changes" : "Create Listing"}
                </button>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsProductDrawerOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CATEGORY DRAWER ── */}
      {isCatDrawerOpen && (
        <div className={styles.drawerOverlay} onClick={() => setIsCatDrawerOpen(false)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <header className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>{editingCategory ? "Edit Category" : "Add Category"}</h3>
              <button className={styles.closeBtn} onClick={() => setIsCatDrawerOpen(false)}>×</button>
            </header>
            <form onSubmit={handleCategorySubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Category Name *</label>
                <input
                  type="text"
                  required
                  value={formCatName}
                  onChange={(e) => setFormCatName(e.target.value)}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>SKU Prefix * (e.g. RNG, ERG)</label>
                <input
                  type="text"
                  required
                  maxLength="10"
                  value={formCatPrefix}
                  onChange={(e) => setFormCatPrefix(e.target.value)}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Display Order Priority</label>
                <input
                  type="number"
                  value={formCatOrder}
                  onChange={(e) => setFormCatOrder(e.target.value)}
                  className={styles.input}
                />
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.submitBtn}>
                  {editingCategory ? "Save" : "Add"}
                </button>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsCatDrawerOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SPECIFICATION DRAWER ── */}
      {isSpecDrawerOpen && (
        <div className={styles.drawerOverlay} onClick={() => setIsSpecDrawerOpen(false)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <header className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>{editingSpecField ? "Edit Spec Field" : "Add Spec Field"}</h3>
              <button className={styles.closeBtn} onClick={() => setIsSpecDrawerOpen(false)}>×</button>
            </header>
            <form onSubmit={handleSpecSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Spec Field Name * (e.g. Setting Type, Clarity)</label>
                <input
                  type="text"
                  required
                  value={formSpecName}
                  onChange={(e) => setFormSpecName(e.target.value)}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Display Order Priority</label>
                <input
                  type="number"
                  value={formSpecOrder}
                  onChange={(e) => setFormSpecOrder(e.target.value)}
                  className={styles.input}
                />
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.submitBtn}>
                  {editingSpecField ? "Save" : "Add"}
                </button>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsSpecDrawerOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── BLOG DRAWER ── */}
      {isBlogDrawerOpen && (
        <div className={styles.drawerOverlay} onClick={() => setIsBlogDrawerOpen(false)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <header className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>{editingBlog ? "Edit Blog Post" : "Add Blog Post"}</h3>
              <button className={styles.closeBtn} onClick={() => setIsBlogDrawerOpen(false)}>×</button>
            </header>
            <form onSubmit={handleBlogSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Post Title *</label>
                <input type="text" required value={formBlogTitle} onChange={(e) => setFormBlogTitle(e.target.value)} className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Excerpt / Short Summary</label>
                <input type="text" value={formBlogExcerpt} onChange={(e) => setFormBlogExcerpt(e.target.value)} className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Cover Image URL *</label>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <input type="text" required value={formBlogCoverImage} onChange={(e) => setFormBlogCoverImage(e.target.value)} className={styles.input} style={{ flex: 1 }} />
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "blog")} style={{ display: "none" }} id="file-blog-cover" />
                  <label htmlFor="file-blog-cover" className={styles.editBtn} style={{ margin: 0, padding: "10px", whiteSpace: "nowrap" }}>
                    Upload Image
                  </label>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Content *</label>
                <textarea rows="8" required value={formBlogContent} onChange={(e) => setFormBlogContent(e.target.value)} className={styles.input} style={{ fontFamily: "inherit", resize: "vertical" }} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Status</label>
                <select value={formBlogStatus} onChange={(e) => setFormBlogStatus(e.target.value)} className={styles.input}>
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                </select>
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.submitBtn}>{editingBlog ? "Save" : "Publish"}</button>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsBlogDrawerOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── FAQ DRAWER ── */}
      {isFaqDrawerOpen && (
        <div className={styles.drawerOverlay} onClick={() => setIsFaqDrawerOpen(false)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <header className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>{editingFaq ? "Edit FAQ" : "Add FAQ"}</h3>
              <button className={styles.closeBtn} onClick={() => setIsFaqDrawerOpen(false)}>×</button>
            </header>
            <form onSubmit={handleFaqSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Question *</label>
                <input type="text" required value={formFaqQuestion} onChange={(e) => setFormFaqQuestion(e.target.value)} className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Answer *</label>
                <textarea rows="4" required value={formFaqAnswer} onChange={(e) => setFormFaqAnswer(e.target.value)} className={styles.input} style={{ fontFamily: "inherit", resize: "vertical" }} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Display Order Priority</label>
                <input type="number" value={formFaqOrder} onChange={(e) => setFormFaqOrder(e.target.value)} className={styles.input} />
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.submitBtn}>{editingFaq ? "Save" : "Add"}</button>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsFaqDrawerOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
