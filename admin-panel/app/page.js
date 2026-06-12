"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isFirebaseConfigured, auth } from "@/lib/firebase";
import Link from "next/link";
import styles from "./admin.module.css";
import AdminShell from "@/components/AdminShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { ToastBridge } from "@/components/ui/Toast";

const MAIN_SITE_URL = process.env.NEXT_PUBLIC_MAIN_SITE_URL || "http://localhost:3000";

const PRODUCT_STATUS_OPTIONS = ["Draft", "Active", "Deactive", "Out of Stock"];

const statusSelectCls = (s) => {
  const tones = {
    Active: "border-green-300 bg-green-50 text-green-700",
    Draft: "border-amber-300 bg-amber-50 text-amber-700",
    Deactive: "border-gray-300 bg-gray-100 text-gray-600",
    "Out of Stock": "border-red-300 bg-red-50 text-red-700",
  };
  return `cursor-pointer rounded-md border px-2 py-1 text-xs font-semibold outline-none focus:ring-2 focus:ring-gold/40 ${tones[s] || "border-line bg-white text-ink"}`;
};

export default function AdminDashboard() {
  const { currentUser, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  // Auth guard — redirect non-admin users
  useEffect(() => {
    if (!authLoading) {
      // Logged out OR logged in without admin rights → stay in the admin app on
      // the login screen (the login page shows an "not an admin" message).
      // Never bounce to the public storefront from here.
      if (!currentUser || !isAdmin) {
        router.replace("/login");
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
  const [stats, setStats] = useState(null);
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
  const [formCatGenders, setFormCatGenders] = useState([]);

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

  // ── Lazy, per-tab data loading ────────────────────────────────────────────
  // Each tab fetches ONLY the resources it needs, in parallel, and caches the
  // result so switching tabs (or opening drawers) never re-fetches. Mutations
  // force a refresh. This replaces the old loadAllData() that fetched all seven
  // endpoints serially on every tab change.
  const ALL_RESOURCES = ["stats", "categories", "specifications", "faqs", "blogs", "products", "inquiries", "orders"];
  const TAB_RESOURCES = {
    dashboard: ["stats"],
    products: ["products", "categories"],
    categories: ["categories"],
    specifications: ["specifications"],
    blogs: ["blogs"],
    faqs: ["faqs"],
    orders: ["orders"],
    inquiries: ["inquiries"],
  };

  const loadedRef = useRef({});

  const fetchResource = async (name, headers) => {
    if (name === "stats") {
      const r = await fetch("/api/stats", { headers });
      const d = r.ok ? await r.json() : null;
      setStats(d && typeof d === "object" ? d : null);
    } else if (name === "categories") {
      const d = await (await fetch("/api/categories", { headers })).json();
      setCategories(Array.isArray(d) ? d : []);
    } else if (name === "specifications") {
      const d = await (await fetch("/api/specifications", { headers })).json();
      setSpecFields(Array.isArray(d) ? d : []);
    } else if (name === "faqs") {
      const d = await (await fetch("/api/faqs", { headers })).json();
      setFaqs(Array.isArray(d) ? d : []);
    } else if (name === "blogs") {
      const d = await (await fetch("/api/blogs?status=all", { headers })).json();
      setBlogs(Array.isArray(d) ? d : []);
    } else if (name === "products") {
      const d = await (await fetch("/api/products?status=all", { headers })).json();
      setProducts(Array.isArray(d) ? d : []);
    } else if (name === "inquiries") {
      const r = await fetch("/api/contact", { headers });
      const d = r.ok ? await r.json() : [];
      setInquiries(Array.isArray(d) ? d : []);
    } else if (name === "orders") {
      const r = await fetch("/api/orders", { headers });
      const d = r.ok ? await r.json() : [];
      setOrders(Array.isArray(d) ? d : []);
    }
  };

  // Fetch the given resources (in parallel). Skips ones already cached unless
  // force=true. Only flips the loading spinner when there's actually work to do.
  const loadResources = async (names, { force = false } = {}) => {
    const todo = (names || []).filter((n) => force || !loadedRef.current[n]);
    if (todo.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const headers = await getHeaders();
      await Promise.all(todo.map((n) => fetchResource(n, headers)));
      todo.forEach((n) => { loadedRef.current[n] = true; });
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load backend data. Ensure the database is initialized.");
    } finally {
      setLoading(false);
    }
  };

  // Force-refresh every resource (used after a full DB re-init).
  const loadAllData = () => loadResources(ALL_RESOURCES, { force: true });

  // On every section click, fetch THAT section's API(s) fresh (in parallel) —
  // never everything upfront, and always up-to-date data when you open a tab.
  useEffect(() => {
    if (currentUser && isAdmin) {
      loadResources(TAB_RESOURCES[activeTab] || [], { force: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setFormProdGender(prod.gender || "");
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
      setFormProdGender("");
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

    if (!formProdName || !formProdGender || !formProdCatId || !formProdBasePrice) {
      setError("Name, Category, Sub-category, and Base Price are required.");
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

  // Inline quick-edit: update a single product's status from the listing row,
  // optimistically reflecting it in the UI and reverting if the request fails.
  const handleProductStatusChange = async (product, status) => {
    if (status === product.status) return;
    const prevStatus = product.status;
    setError("");
    setSuccess("");
    setProducts((list) =>
      list.map((x) => (x.id === product.id ? { ...x, status } : x))
    );
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/products/${product.slug}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update status.");
      }
      setSuccess(`Status updated to "${status}".`);
    } catch (err) {
      setProducts((list) =>
        list.map((x) => (x.id === product.id ? { ...x, status: prevStatus } : x))
      );
      setError(err.message || "Failed to update status.");
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
      setFormCatGenders(Array.isArray(cat.genders) ? cat.genders : []);
    } else {
      setEditingCategory(null);
      setFormCatName("");
      setFormCatPrefix("");
      setFormCatOrder("0");
      setFormCatGenders([]);
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
      display_order: parseInt(formCatOrder || 0, 10),
      genders: formCatGenders
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
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="italic text-gray-500">Verifying credentials…</p>
      </div>
    );
  }

  const navItems = [
    { key: "dashboard", label: "Dashboard" },
    { key: "products", label: "Products" },
    { key: "categories", label: "Categories" },
    { key: "specifications", label: "Specifications" },
    { key: "blogs", label: "Blogs" },
    { key: "faqs", label: "FAQs" },
    { key: "orders", label: "Orders", count: orders.length },
    { key: "inquiries", label: "Inquiries", count: inquiries.length },
  ];

  const tabTitles = {
    dashboard: "Analytics Overview",
    products: "Product Catalog",
    categories: "Product Categories",
    specifications: "Specification Fields",
    blogs: "Journal & Articles",
    faqs: "Store FAQ Management",
    orders: "Order Management",
    inquiries: "Customer Inquiries",
  };
  const tabDescriptions = {
    dashboard: "Performance metrics, system actions, and recent inquiries.",
    products: "Manage listing parameters, auto SKU generation, and image gallery.",
    categories: "Setup category tags, SKU prefixes, and sequence sorting.",
    specifications: "Add, edit, or remove dynamic specification keys.",
    blogs: "Publish press releases, style guides, and product announcements.",
    faqs: "Update dynamic accordion contents for customer support.",
    orders: "Update customer order statuses and fulfill orders.",
    inquiries: "Review contact messages and pricing requests from the storefront.",
  };

  const headerActions = (
    <>
      {activeTab === "dashboard" && (
        <Button onClick={handleDbInitialize} disabled={isInitializing}>
          {isInitializing ? "Initializing…" : "Initialize Database"}
        </Button>
      )}
      {activeTab === "products" && <Button onClick={() => openProductDrawer()}>+ Add Product</Button>}
      {activeTab === "categories" && <Button onClick={() => openCategoryDrawer()}>+ Add Category</Button>}
      {activeTab === "specifications" && <Button onClick={() => openSpecDrawer()}>+ Add Spec Field</Button>}
      {activeTab === "blogs" && <Button onClick={() => openBlogDrawer()}>+ Add Post</Button>}
      {activeTab === "faqs" && <Button onClick={() => openFaqDrawer()}>+ Add FAQ</Button>}
    </>
  );

  const statCards = [
    { label: "Products", value: stats?.products ?? 0 },
    { label: "Categories", value: stats?.categories ?? 0 },
    { label: "Articles", value: stats?.blogs ?? 0 },
    { label: "Orders", value: stats?.orders ?? 0, accent: "crimson" },
    { label: "Inquiries", value: stats?.inquiries ?? 0 },
  ];

  // Shared Tailwind class strings for consistent tables across tabs
  const tWrap = "overflow-x-auto";
  const tbl = "w-full text-left text-sm";
  const th = "px-5 py-3 text-[0.7rem] font-bold uppercase tracking-wide text-gray-500 whitespace-nowrap";
  const td = "px-5 py-3 align-middle text-gray-600";
  const tHead = "border-b border-line bg-sand";
  const tRow = "border-b border-line transition-colors hover:bg-sand";
  const fieldCls = "rounded border border-line bg-sand px-3 py-2 text-sm text-ink outline-none focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/20";

  return (
    <>
      <AdminShell
        navItems={navItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        title={tabTitles[activeTab]}
        description={tabDescriptions[activeTab]}
        actions={headerActions}
        exitHref={MAIN_SITE_URL}
      >
        <ToastBridge error={error} success={success} />

        {loading ? (
          <div className="py-20 text-center italic text-gray-400">Loading records…</div>
        ) : (
          <>
            {/* ── TAB: DASHBOARD ── */}
            {activeTab === "dashboard" && (
              <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                {statCards.map((s) => (
                  <StatCard
                    key={s.label}
                    label={s.label}
                    value={s.value}
                    accent={s.accent}
                    icon={<span className="text-lg">◆</span>}
                  />
                ))}
              </section>
            )}

            {/* ── TAB: PRODUCTS ── */}
            {activeTab === "products" && (
              <Card bodyClassName="p-0">
                <div className="flex flex-wrap gap-3 p-4 sm:p-5">
                  <input
                    type="text"
                    placeholder="Search by name or SKU…"
                    value={prodSearch}
                    onChange={(e) => setProdSearch(e.target.value)}
                    className={`${fieldCls} w-full sm:max-w-xs`}
                  />
                  <select
                    value={prodCatFilter}
                    onChange={(e) => setProdCatFilter(e.target.value)}
                    className={`${fieldCls} cursor-pointer`}
                  >
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    value={prodStatusFilter}
                    onChange={(e) => setProdStatusFilter(e.target.value)}
                    className={`${fieldCls} cursor-pointer`}
                  >
                    <option value="all">All Status</option>
                    {PRODUCT_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className={`${tWrap} border-t border-line`}>
                  <table className={tbl}>
                    <thead>
                      <tr className={tHead}>
                        <th className={th}>Image</th>
                        <th className={th}>SKU</th>
                        <th className={th}>Name</th>
                        <th className={th}>Category</th>
                        <th className={th}>Price</th>
                        <th className={th}>Status</th>
                        <th className={th}>Order</th>
                        <th className={th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className={tRow}>
                          <td className={td}>
                            <div className="size-11 overflow-hidden rounded border border-line bg-sand">
                              {p.images && p.images[0] && (
                                <img src={p.images[0]} alt={p.name} className="size-full object-cover" />
                              )}
                            </div>
                          </td>
                          <td className={`${td} font-semibold text-ink`}>{p.sku}</td>
                          <td className={`${td} text-ink`}>{p.name}</td>
                          <td className={td}>{p.category}</td>
                          <td className={`${td} font-medium text-ink`}>₹{p.price}</td>
                          <td className={td}>
                            <select
                              value={PRODUCT_STATUS_OPTIONS.includes(p.status) ? p.status : ""}
                              onChange={(e) => handleProductStatusChange(p, e.target.value)}
                              className={statusSelectCls(p.status)}
                              aria-label={`Update status for ${p.name}`}
                            >
                              {!PRODUCT_STATUS_OPTIONS.includes(p.status) && p.status && (
                                <option value={p.status}>{p.status}</option>
                              )}
                              {PRODUCT_STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                          <td className={td}>{p.display_order}</td>
                          <td className={td}>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => openProductDrawer(p)}>Edit</Button>
                              <Button variant="danger" size="sm" onClick={() => handleProductDelete(p.slug)}>Delete</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan="8" className="px-5 py-10 text-center italic text-gray-400">
                            No products matching filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* ── TAB: CATEGORIES ── */}
            {activeTab === "categories" && (
              <Card bodyClassName="p-0">
                <p className="px-5 py-4 text-sm text-gray-500">
                  💡 Use the ▲ / ▼ buttons to sort categories. Reordering syncs immediately and controls the website category layout.
                </p>
                <div className={`${tWrap} border-t border-line`}>
                  <table className={tbl}>
                    <thead>
                      <tr className={tHead}>
                        <th className={th}>ID</th>
                        <th className={th}>Category Name</th>
                        <th className={th}>SKU Prefix</th>
                        <th className={th}>Gender</th>
                        <th className={th}>Display Order</th>
                        <th className={th}>Reorder</th>
                        <th className={th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((cat, index) => (
                        <tr key={cat.id} className={tRow}>
                          <td className={td}>{cat.id}</td>
                          <td className={`${td} font-semibold text-ink`}>{cat.name}</td>
                          <td className={td}><code className="rounded bg-sand px-1.5 py-0.5 text-xs">{cat.sku_prefix}</code></td>
                          <td className={td}>{Array.isArray(cat.genders) && cat.genders.length > 0 ? cat.genders.join(", ") : "—"}</td>
                          <td className={td}>{cat.display_order}</td>
                          <td className={td}>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" disabled={index === 0} onClick={() => handleCategoryReorder("up", index)}>▲</Button>
                              <Button variant="outline" size="sm" disabled={index === categories.length - 1} onClick={() => handleCategoryReorder("down", index)}>▼</Button>
                            </div>
                          </td>
                          <td className={td}>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => openCategoryDrawer(cat)}>Edit</Button>
                              <Button variant="danger" size="sm" onClick={() => handleCategoryDelete(cat.id)}>Delete</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* ── TAB: SPECIFICATIONS ── */}
            {activeTab === "specifications" && (
              <Card bodyClassName="p-0">
                <div className={tWrap}>
                  <table className={tbl}>
                    <thead>
                      <tr className={tHead}>
                        <th className={th}>ID</th>
                        <th className={th}>Specification Key</th>
                        <th className={th}>Display Order</th>
                        <th className={th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {specFields.map((field) => (
                        <tr key={field.id} className={tRow}>
                          <td className={td}>{field.id}</td>
                          <td className={`${td} font-semibold text-ink`}>{field.name}</td>
                          <td className={td}>{field.display_order}</td>
                          <td className={td}>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => openSpecDrawer(field)}>Edit</Button>
                              <Button variant="danger" size="sm" onClick={() => handleSpecDelete(field.id)}>Delete</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* ── TAB: BLOGS ── */}
            {activeTab === "blogs" && (
              <Card bodyClassName="p-0">
                <div className={tWrap}>
                  <table className={tbl}>
                    <thead>
                      <tr className={tHead}>
                        <th className={th}>Cover</th>
                        <th className={th}>Title</th>
                        <th className={th}>Slug</th>
                        <th className={th}>Status</th>
                        <th className={th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blogs.map((b) => (
                        <tr key={b.id} className={tRow}>
                          <td className={td}>
                            <div className="h-11 w-16 overflow-hidden rounded border border-line bg-sand">
                              {b.coverImage && (
                                <img src={b.coverImage} alt={b.title} className="size-full object-cover" />
                              )}
                            </div>
                          </td>
                          <td className={`${td} font-semibold text-ink`}>{b.title}</td>
                          <td className={td}>{b.slug}</td>
                          <td className={td}><Badge tone={b.status === "Active" ? "success" : "warning"}>{b.status}</Badge></td>
                          <td className={td}>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => openBlogDrawer(b)}>Edit</Button>
                              <Button variant="danger" size="sm" onClick={() => handleBlogDelete(b.slug)}>Delete</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {blogs.length === 0 && (
                        <tr><td colSpan="5" className="px-5 py-10 text-center italic text-gray-400">No articles yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* ── TAB: FAQS ── */}
            {activeTab === "faqs" && (
              <Card bodyClassName="p-0">
                <div className={tWrap}>
                  <table className={tbl}>
                    <thead>
                      <tr className={tHead}>
                        <th className={th}>ID</th>
                        <th className={th}>Question</th>
                        <th className={th}>Answer</th>
                        <th className={th}>Order</th>
                        <th className={th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {faqs.map((faq) => (
                        <tr key={faq.id} className={tRow}>
                          <td className={td}>{faq.id}</td>
                          <td className={`${td} font-semibold text-ink`}>{faq.question}</td>
                          <td className={td}>{faq.answer.substring(0, 100)}…</td>
                          <td className={td}>{faq.display_order}</td>
                          <td className={td}>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => openFaqDrawer(faq)}>Edit</Button>
                              <Button variant="danger" size="sm" onClick={() => handleFaqDelete(faq.id)}>Delete</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {faqs.length === 0 && (
                        <tr><td colSpan="5" className="px-5 py-10 text-center italic text-gray-400">No FAQs yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* ── TAB: ORDERS ── */}
            {activeTab === "orders" && (
              <Card bodyClassName="p-0">
                <div className={tWrap}>
                  <table className={tbl}>
                    <thead>
                      <tr className={tHead}>
                        <th className={th}>Order #</th>
                        <th className={th}>Customer</th>
                        <th className={th}>Contact / Email</th>
                        <th className={th}>Address</th>
                        <th className={th}>Amount</th>
                        <th className={th}>Items</th>
                        <th className={th}>Status</th>
                        <th className={th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((ord) => (
                        <tr key={ord.id} className={tRow}>
                          <td className={`${td} font-semibold text-ink`}>{ord.order_number}</td>
                          <td className={`${td} font-medium text-ink`}>{ord.name}</td>
                          <td className={td}>
                            <div>{ord.phone}</div>
                            <div className="text-xs text-gray-400">{ord.email}</div>
                          </td>
                          <td className={`${td} max-w-[180px] whitespace-pre-wrap text-xs`}>{ord.address}</td>
                          <td className={`${td} font-semibold text-ink`}>₹{parseFloat(ord.total_amount).toFixed(2)}</td>
                          <td className={`${td} text-xs`}>
                            {Array.isArray(ord.items) ? ord.items.map((it, idx) => (
                              <div key={idx}>• {it.name} x {it.quantity} ({it.metal} / Size: {it.size})</div>
                            )) : "—"}
                          </td>
                          <td className={td}>
                            <select
                              value={ord.status}
                              onChange={(e) => handleOrderStatusUpdate(ord.order_number, e.target.value)}
                              className={`${fieldCls} min-w-[120px] cursor-pointer`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className={td}>
                            <Button variant="danger" size="sm" onClick={() => handleOrderDelete(ord.order_number)}>Delete</Button>
                          </td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr><td colSpan="8" className="px-5 py-10 text-center italic text-gray-400">No orders found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* ── TAB: INQUIRIES ── */}
            {activeTab === "inquiries" && (
              <Card bodyClassName="p-0">
                <div className={tWrap}>
                  <table className={tbl}>
                    <thead>
                      <tr className={tHead}>
                        <th className={th}>Name</th>
                        <th className={th}>Email</th>
                        <th className={th}>Phone</th>
                        <th className={th}>Message</th>
                        <th className={th}>Received At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inquiries.map((inq) => (
                        <tr key={inq.id} className={tRow}>
                          <td className={`${td} font-semibold text-ink`}>{inq.name}</td>
                          <td className={td}><a className="text-crimson hover:underline" href={`mailto:${inq.email}`}>{inq.email}</a></td>
                          <td className={td}>{inq.phone ? <a className="text-crimson hover:underline" href={`tel:${inq.phone}`}>{inq.phone}</a> : "—"}</td>
                          <td className={td}>{inq.message}</td>
                          <td className={`${td} whitespace-nowrap`}>{new Date(inq.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                      {inquiries.length === 0 && (
                        <tr><td colSpan="5" className="px-5 py-10 text-center italic text-gray-400">No inquiries.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
      </AdminShell>

      {/* ── PRODUCT DRAWERS / MODALS ── */}
      <Modal open={isProductDrawerOpen} onClose={() => setIsProductDrawerOpen(false)} title={editingProduct ? "Edit Product" : "Add New Product"} size="lg">
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
                    value={formProdGender}
                    onChange={(e) => {
                      const g = e.target.value;
                      setFormProdGender(g);
                      // Clear sub-category if it no longer belongs to the chosen gender
                      const stillValid = categories.some(
                        (c) => String(c.id) === String(formProdCatId) && Array.isArray(c.genders) && c.genders.includes(g)
                      );
                      if (!stillValid) setFormProdCatId("");
                    }}
                    className={styles.input}
                  >
                    <option value="">Select Category</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Sub-category *</label>
                  <select
                    required
                    value={formProdCatId}
                    onChange={(e) => setFormProdCatId(e.target.value)}
                    className={styles.input}
                    disabled={!formProdGender}
                  >
                    <option value="">{formProdGender ? "Select Sub-category" : "Select Category first"}</option>
                    {categories
                      .filter((c) => Array.isArray(c.genders) && c.genders.includes(formProdGender))
                      .map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
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
                  <label className={styles.label}>Availability</label>
                  <input type="text" value={formProdAvailability} onChange={(e) => setFormProdAvailability(e.target.value)} className={styles.input} />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Status</label>
                  <select value={formProdStatus} onChange={(e) => setFormProdStatus(e.target.value)} className={styles.input}>
                    {PRODUCT_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
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
      </Modal>

      {/* ── CATEGORY DRAWER ── */}
      <Modal open={isCatDrawerOpen} onClose={() => setIsCatDrawerOpen(false)} title={editingCategory ? "Edit Category" : "Add Category"}>
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
              <div className={styles.formGroup}>
                <label className={styles.label}>Gender Groups</label>
                <div style={{ display: "flex", gap: "20px", marginTop: "6px" }}>
                  {["Men", "Women"].map((g) => (
                    <label key={g} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.9rem" }}>
                      <input
                        type="checkbox"
                        checked={formCatGenders.includes(g)}
                        onChange={(e) =>
                          setFormCatGenders(
                            e.target.checked
                              ? [...formCatGenders, g]
                              : formCatGenders.filter((x) => x !== g)
                          )
                        }
                      />
                      {g}
                    </label>
                  ))}
                </div>
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
      </Modal>

      {/* ── SPECIFICATION DRAWER ── */}
      <Modal open={isSpecDrawerOpen} onClose={() => setIsSpecDrawerOpen(false)} title={editingSpecField ? "Edit Spec Field" : "Add Spec Field"}>
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
      </Modal>

      {/* ── BLOG DRAWER ── */}
      <Modal open={isBlogDrawerOpen} onClose={() => setIsBlogDrawerOpen(false)} title={editingBlog ? "Edit Blog Post" : "Add Blog Post"} size="lg">
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
      </Modal>

      {/* ── FAQ DRAWER ── */}
      <Modal open={isFaqDrawerOpen} onClose={() => setIsFaqDrawerOpen(false)} title={editingFaq ? "Edit FAQ" : "Add FAQ"}>
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
      </Modal>
    </>
  );
}
