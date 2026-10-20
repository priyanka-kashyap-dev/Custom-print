"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  DollarSign,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  Lock,
  Layers,
  ArrowRight,
  TrendingUp,
  Image as ImageIcon,
  Check,
  Copy,
  Camera,
  X,
  Sparkles,
  Link2,
} from "lucide-react";
import { useAppContext, Product } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import styles from "./AdminDashboard.module.css";
import { isAdminEmail } from "@/lib/auth-constants";

interface ExtendedProduct extends Product {
  originalPrice?: number;
  stock?: number;
  badge?: string;
  category?: string;
  status?: "active" | "out_of_stock" | "draft";
  updatedAt?: string;
}

export default function AdminPage() {
  const { user, isAdmin, logout, refreshProducts } = useAppContext();
  const [activeTab, setActiveTab] = useState<"stock" | "add" | "upload" | "orders">("stock");

  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit row states
  const [editingRows, setEditingRows] = useState<Record<string, { price: number; stock: number; originalPrice: number; status: string }>>({});
  const [savingId, setSavingId] = useState<string | number | null>(null);

  // Image Editor Modal state for editing product image
  const [imageModalProduct, setImageModalProduct] = useState<ExtendedProduct | null>(null);
  const [editingImageUrl, setEditingImageUrl] = useState<string>("");
  const [imageModalTab, setImageModalTab] = useState<"preset" | "upload" | "url">("preset");
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [isModalUploading, setIsModalUploading] = useState(false);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Add Product Form
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Apparel");
  const [newPrice, setNewPrice] = useState("");
  const [newOriginalPrice, setNewOriginalPrice] = useState("");
  const [newStock, setNewStock] = useState("50");
  const [newBadge, setNewBadge] = useState("New");
  const [newDescription, setNewDescription] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("/images/products/tshirt.jpg");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Image Upload state
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; filename: string; timestamp: number }>>([
    { url: "/images/products/tshirt.jpg", filename: "tshirt.jpg", timestamp: Date.now() },
    { url: "/images/products/pillow.jpg", filename: "pillow.jpg", timestamp: Date.now() - 1000 },
    { url: "/images/products/heart-pillow.jpg", filename: "heart-pillow.jpg", timestamp: Date.now() - 2000 },
    { url: "/images/products/couch.jpg", filename: "couch.jpg", timestamp: Date.now() - 3000 },
    { url: "/images/products/couple-gift.jpg", filename: "couple-gift.jpg", timestamp: Date.now() - 4000 },
    { url: "/images/products/canvas.jpg", filename: "canvas.jpg", timestamp: Date.now() - 5000 },
  ]);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAuthorized = user && (isAdminEmail(user.email) || isAdmin || user.role === "admin");

  const fetchAdminProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      if (res.ok) {
        const data = await res.json();
        if (data.products && Array.isArray(data.products)) {
          setProducts(data.products);
          // initialize edit row states
          const rowMap: Record<string, { price: number; stock: number; originalPrice: number; status: string }> = {};
          data.products.forEach((p: ExtendedProduct) => {
            rowMap[String(p.id)] = {
              price: p.price,
              stock: p.stock !== undefined ? p.stock : 50,
              originalPrice: p.originalPrice || 0,
              status: p.status || "active",
            };
          });
          setEditingRows(rowMap);
        }
      }
    } catch (err) {
      console.warn("Could not load admin products:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchAdminProducts();
    }
  }, [isAuthorized, fetchAdminProducts]);

  const showNotification = (text: string, type: "success" | "error" = "success") => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handlePriceChange = (id: string | number, value: number) => {
    setEditingRows((prev) => ({
      ...prev,
      [String(id)]: {
        ...prev[String(id)],
        price: value,
      },
    }));
  };

  const handleStockChange = (id: string | number, value: number) => {
    setEditingRows((prev) => ({
      ...prev,
      [String(id)]: {
        ...prev[String(id)],
        stock: Math.max(0, value),
      },
    }));
  };

  const handleSaveProduct = async (id: string | number) => {
    const edit = editingRows[String(id)];
    if (!edit) return;

    setSavingId(id);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          price: edit.price,
          stock: edit.stock,
          originalPrice: edit.originalPrice,
          status: edit.stock === 0 ? "out_of_stock" : edit.status,
        }),
      });

      if (res.ok) {
        showNotification("Product stock and price updated successfully!");
        await fetchAdminProducts();
        await refreshProducts();
      } else {
        showNotification("Failed to update product.", "error");
      }
    } catch {
      showNotification("Network error updating product.", "error");
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteProduct = async (id: string | number, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}" from the store?`)) return;

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showNotification(`"${title}" deleted successfully.`);
        await fetchAdminProducts();
        await refreshProducts();
      } else {
        showNotification("Failed to delete product.", "error");
      }
    } catch {
      showNotification("Error deleting product.", "error");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setUploadedImages((prev) => [
          { url: data.url, filename: data.filename, timestamp: Date.now() },
          ...prev,
        ]);
        setNewImageUrl(data.url);
        showNotification(`Image "${file.name}" uploaded successfully!`);
      } else {
        const err = await res.json();
        showNotification(err.error || "Image upload failed.", "error");
      }
    } catch {
      showNotification("Network error uploading image.", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Image Editor Modal Actions
  const openImageEditor = (product: ExtendedProduct) => {
    setImageModalProduct(product);
    setEditingImageUrl(product.image || "/images/products/tshirt.jpg");
    setImageModalTab("preset");
  };

  const closeImageEditor = () => {
    setImageModalProduct(null);
    setEditingImageUrl("");
    setIsModalUploading(false);
    setIsSavingImage(false);
  };

  const handleModalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);

    setIsModalUploading(true);
    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setUploadedImages((prev) => [
          { url: data.url, filename: data.filename, timestamp: Date.now() },
          ...prev,
        ]);
        setEditingImageUrl(data.url);
        showNotification(`Image "${file.name}" uploaded successfully!`);
      } else {
        const err = await res.json();
        showNotification(err.error || "Image upload failed.", "error");
      }
    } catch {
      showNotification("Network error uploading image.", "error");
    } finally {
      setIsModalUploading(false);
      if (modalFileInputRef.current) modalFileInputRef.current.value = "";
    }
  };

  const handleSaveProductImage = async () => {
    if (!imageModalProduct) return;
    if (!editingImageUrl.trim()) {
      showNotification("Please select or upload an image.", "error");
      return;
    }

    setIsSavingImage(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: imageModalProduct.id,
          image: editingImageUrl.trim(),
        }),
      });

      if (res.ok) {
        showNotification(`Image updated for "${imageModalProduct.title}"!`);
        setProducts((prev) =>
          prev.map((p) =>
            p.id === imageModalProduct.id
              ? { ...p, image: editingImageUrl.trim(), images: [editingImageUrl.trim()] }
              : p
          )
        );
        closeImageEditor();
        await refreshProducts();
      } else {
        const err = await res.json();
        showNotification(err.error || "Failed to update product image.", "error");
      }
    } catch {
      showNotification("Network error updating product image.", "error");
    } finally {
      setIsSavingImage(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice) {
      showNotification("Please provide title and price.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          price: Number(newPrice),
          originalPrice: Number(newOriginalPrice) || 0,
          stock: Number(newStock) || 50,
          badge: newBadge,
          description: newDescription.trim() || "Premium custom printed personalized item.",
          image: newImageUrl,
          images: [newImageUrl],
          status: "active",
        }),
      });

      if (res.ok) {
        showNotification("New product published to live store!");
        setNewTitle("");
        setNewPrice("");
        setNewOriginalPrice("");
        setNewDescription("");
        setActiveTab("stock");
        await fetchAdminProducts();
        await refreshProducts();
      } else {
        const err = await res.json();
        showNotification(err.error || "Failed to create product.", "error");
      }
    } catch {
      showNotification("Error creating product.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    showNotification("Image URL copied to clipboard!");
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  // Metrics
  const totalProducts = products.length;
  const totalStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const lowStockCount = products.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 10).length;
  const outOfStockCount = products.filter((p) => (p.stock || 0) === 0).length;

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // If user is not admin
  if (!isAuthorized) {
    return (
      <div className={styles.adminContainer}>
        <Navbar />
        <div className={styles.deniedWrapper}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={styles.deniedCard}
          >
            <div className={styles.lockIconWrap}>
              <Lock size={32} />
            </div>
            <h1 style={{ fontSize: "1.8rem", marginBottom: "8px" }}>Admin Access Required</h1>
            <p style={{ color: "var(--text-light)", marginBottom: "20px", fontSize: "0.95rem", lineHeight: 1.6 }}>
              This management console is restricted to authorized administrator accounts.
            </p>

            {user ? (
              <div style={{ marginBottom: "24px", padding: "12px", background: "var(--background-color)", borderRadius: "12px" }}>
                <p style={{ margin: "0 0 6px", fontSize: "0.85rem", color: "var(--text-light)" }}>Currently signed in as:</p>
                <p style={{ margin: 0, fontWeight: 600 }}>{user.email}</p>
                <button
                  onClick={logout}
                  className={styles.actionBtn}
                  style={{ marginTop: "12px", width: "100%", justifyContent: "center" }}
                >
                  Switch Account
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <GoogleSignInButton redirectAfterLogin="/admin" buttonText="signin_with" />
                <Link
                  href="/login?redirect=/admin"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-color)",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Sign in with Email Password
                </Link>
              </div>
            )}
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      <Navbar />

      <main className={styles.adminMain}>
        {/* Toast Notification */}
        <AnimatePresence>
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                position: "fixed",
                top: "90px",
                right: "20px",
                zIndex: 9999,
                background: statusMessage.type === "success" ? "#10b981" : "#ef4444",
                color: "white",
                padding: "12px 20px",
                borderRadius: "12px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {statusMessage.type === "success" ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
              {statusMessage.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Header */}
        <div className={styles.dashboardHeader}>
          <div className={styles.titleArea}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
              <h1>Admin Command Center</h1>
              <span className={styles.adminBadge}>
                <span className={styles.adminBadgeDot} /> {user?.email || "Admin"}
              </span>
            </div>
            <p>Manage product stock, update live prices, and upload custom print assets.</p>
          </div>

          <div className={styles.headerActions}>
            <button onClick={fetchAdminProducts} className={styles.storeLinkBtn} title="Reload catalog">
              <RefreshCw size={16} /> Sync
            </button>
            <Link href="/" target="_blank" className={styles.storeLinkBtn}>
              <ExternalLink size={16} /> View Live Store
            </Link>
          </div>
        </div>

        {/* Metrics Overview Grid */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ background: "rgba(79, 70, 229, 0.1)", color: "var(--primary-color)" }}>
              <Package size={24} />
            </div>
            <div className={styles.metricInfo}>
              <h4>Total Catalog Items</h4>
              <p className={styles.metricValue}>{totalProducts}</p>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
              <TrendingUp size={24} />
            </div>
            <div className={styles.metricInfo}>
              <h4>Units In Stock</h4>
              <p className={styles.metricValue}>{totalStock}</p>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>
              <AlertTriangle size={24} />
            </div>
            <div className={styles.metricInfo}>
              <h4>Low Stock Items</h4>
              <p className={styles.metricValue}>{lowStockCount}</p>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}>
              <Layers size={24} />
            </div>
            <div className={styles.metricInfo}>
              <h4>Out of Stock</h4>
              <p className={styles.metricValue}>{outOfStockCount}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={styles.tabsBar}>
          <button
            onClick={() => setActiveTab("stock")}
            className={`${styles.tabBtn} ${activeTab === "stock" ? styles.activeTabBtn : ""}`}
          >
            <Package size={18} /> Stock & Price Management
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={`${styles.tabBtn} ${activeTab === "add" ? styles.activeTabBtn : ""}`}
          >
            <Plus size={18} /> Add New Product
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`${styles.tabBtn} ${activeTab === "upload" ? styles.activeTabBtn : ""}`}
          >
            <Upload size={18} /> Upload Custom Images ({uploadedImages.length})
          </button>
        </div>

        {/* TAB 1: Stock & Price Management */}
        {activeTab === "stock" && (
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Live Inventory & Price Control</h2>
                <p style={{ color: "var(--text-light)", fontSize: "0.88rem", margin: "4px 0 0" }}>
                  Changes take effect immediately across all customer devices and mobile phones.
                </p>
              </div>

              <div className={styles.searchBar}>
                <Search size={18} color="var(--text-light)" />
                <input
                  type="text"
                  placeholder="Search products by title or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <RefreshCw size={32} className="spin" style={{ color: "var(--primary-color)" }} />
                <p style={{ marginTop: "12px", color: "var(--text-light)" }}>Loading store inventory...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <Package size={48} color="var(--border-color)" style={{ margin: "0 auto 12px" }} />
                <h3>No products match your search</h3>
                <p style={{ color: "var(--text-light)" }}>Try a different keyword or add a new product.</p>
              </div>
            ) : (
              <div className={styles.productsTableWrapper}>
                <table className={styles.productsTable}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Selling Price ($)</th>
                      <th>Compare At ($)</th>
                      <th>Stock Quantity</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const idStr = String(product.id);
                      const currentEdit = editingRows[idStr] || {
                        price: product.price,
                        stock: product.stock !== undefined ? product.stock : 50,
                        originalPrice: product.originalPrice || 0,
                        status: product.status || "active",
                      };

                      const isLow = currentEdit.stock > 0 && currentEdit.stock <= 10;
                      const isOut = currentEdit.stock === 0;

                      return (
                        <tr key={product.id}>
                          <td>
                            <div className={styles.productTitleCell}>
                              <div
                                className={styles.thumbWrapper}
                                onClick={() => openImageEditor(product)}
                                title="Click to change product image"
                              >
                                <Image
                                  src={product.image || "/images/products/tshirt.jpg"}
                                  alt={product.title}
                                  width={64}
                                  height={64}
                                  className={styles.productThumb}
                                  unoptimized
                                />
                                <div className={styles.thumbOverlayBtn}>
                                  <Camera size={14} />
                                  <span>Edit</span>
                                </div>
                              </div>
                              <div>
                                <h4 className={styles.productName}>{product.title}</h4>
                                <div className={styles.productMeta}>
                                  {product.badge && (
                                    <span style={{ background: "rgba(79, 70, 229, 0.1)", color: "var(--primary-color)", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600, marginRight: "6px" }}>
                                      {product.badge}
                                    </span>
                                  )}
                                  ID: {idStr}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => openImageEditor(product)}
                                  className={styles.editImageLinkBtn}
                                  title="Change or upload product image"
                                >
                                  <Camera size={12} /> Edit Photo
                                </button>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span style={{ fontSize: "0.9rem", color: "var(--text-color)" }}>
                              {product.category || "General"}
                            </span>
                          </td>

                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <span style={{ fontWeight: 600, color: "var(--text-light)" }}>$</span>
                              <input
                                type="number"
                                className={styles.inlineInput}
                                value={currentEdit.price}
                                onChange={(e) => handlePriceChange(product.id, Number(e.target.value))}
                                min="0"
                                step="1"
                              />
                            </div>
                          </td>

                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <span style={{ fontWeight: 600, color: "var(--text-light)" }}>$</span>
                              <input
                                type="number"
                                className={styles.inlineInput}
                                value={currentEdit.originalPrice}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setEditingRows((prev) => ({
                                    ...prev,
                                    [idStr]: { ...prev[idStr], originalPrice: val },
                                  }));
                                }}
                                min="0"
                                step="1"
                              />
                            </div>
                          </td>

                          <td>
                            <div className={styles.stockControl}>
                              <button
                                type="button"
                                className={styles.stepperBtn}
                                onClick={() => handleStockChange(product.id, currentEdit.stock - 1)}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                className={styles.inlineInput}
                                style={{ width: "65px" }}
                                value={currentEdit.stock}
                                onChange={(e) => handleStockChange(product.id, Number(e.target.value))}
                                min="0"
                              />
                              <button
                                type="button"
                                className={styles.stepperBtn}
                                onClick={() => handleStockChange(product.id, currentEdit.stock + 1)}
                              >
                                +
                              </button>
                            </div>
                          </td>

                          <td>
                            {isOut ? (
                              <span className={`${styles.statusPill} ${styles.statusOutOfStock}`}>Out of Stock</span>
                            ) : isLow ? (
                              <span className={`${styles.statusPill} ${styles.statusLowStock}`}>Low Stock ({currentEdit.stock})</span>
                            ) : (
                              <span className={`${styles.statusPill} ${styles.statusInStock}`}>In Stock</span>
                            )}
                          </td>

                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: "8px" }}>
                              <button
                                type="button"
                                onClick={() => openImageEditor(product)}
                                className={`${styles.actionBtn} ${styles.imageBtn}`}
                                title="Edit product photo"
                              >
                                <Camera size={14} /> <span className={styles.actionBtnText}>Photo</span>
                              </button>
                              <button
                                onClick={() => handleSaveProduct(product.id)}
                                disabled={savingId === product.id}
                                className={`${styles.actionBtn} ${styles.saveBtn}`}
                              >
                                {savingId === product.id ? "Saving..." : <><Check size={14} /> Save</>}
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id, product.title)}
                                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                title="Delete product"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Add New Product */}
        {activeTab === "add" && (
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Create & Publish New Custom Print Product</h2>
                <p style={{ color: "var(--text-light)", fontSize: "0.88rem", margin: "4px 0 0" }}>
                  Instantly add a new customizable item to the store catalog.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateProduct}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Product Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Personalized Magic Color-Changing Mug"
                    className={styles.formInput}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Category *</label>
                  <select
                    className={styles.formSelect}
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    <option value="Apparel">👕 Apparel (T-Shirts, Hoodies)</option>
                    <option value="Home Decor">🛋️ Home Decor (Pillows, Cushions)</option>
                    <option value="Gifts">🎁 Personalized Gifts</option>
                    <option value="Furniture">🪑 Custom Couches & Chairs</option>
                    <option value="Wall Decor">🖼️ Wall Decor & Canvas Prints</option>
                    <option value="Drinkware">☕ Custom Mugs & Bottles</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Selling Price ($) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 29"
                    className={styles.formInput}
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Compare-At Original Price ($) (Optional)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 39 (to show discount badge)"
                    className={styles.formInput}
                    value={newOriginalPrice}
                    onChange={(e) => setNewOriginalPrice(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Starting Stock Units *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className={styles.formInput}
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Marketing Badge Tag</label>
                  <select
                    className={styles.formSelect}
                    value={newBadge}
                    onChange={(e) => setNewBadge(e.target.value)}
                  >
                    <option value="New">✨ New Arrival</option>
                    <option value="Bestseller">🔥 Bestseller</option>
                    <option value="Trending">⚡ Trending</option>
                    <option value="Most Loved">❤️ Most Loved</option>
                    <option value="Luxury">👑 Luxury</option>
                    <option value="Special Offer">🏷️ Special Offer</option>
                    <option value="">None</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup} style={{ marginBottom: "20px" }}>
                <label>Product Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe materials, printing quality, sizing, and personalization options..."
                  className={styles.formTextarea}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>

              {/* Image Selection / Upload for Product */}
              <div className={styles.formGroup} style={{ marginBottom: "28px" }}>
                <label>Product Image Source</label>
                <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
                  <Image
                    src={newImageUrl}
                    alt="Product preview"
                    width={80}
                    height={80}
                    style={{ borderRadius: "12px", objectFit: "cover", border: "2px solid var(--primary-color)" }}
                    unoptimized
                  />
                  <div style={{ flex: 1, minWidth: "220px" }}>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="/images/products/tshirt.jpg or upload below"
                    />
                    <p style={{ margin: "6px 0 0", fontSize: "0.82rem", color: "var(--text-light)" }}>
                      Choose an image URL or pick an uploaded image from the gallery tab.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={styles.actionBtn}
                style={{
                  background: "var(--primary-color)",
                  color: "#fff",
                  padding: "14px 28px",
                  fontSize: "1rem",
                  borderRadius: "var(--border-radius)",
                  boxShadow: "0 4px 16px rgba(79, 70, 229, 0.3)",
                }}
              >
                {isSubmitting ? "Publishing to Store..." : "🚀 Publish Product to Store"}
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: Upload Custom Images & Media Gallery */}
        {activeTab === "upload" && (
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Custom Image & Mockup Studio</h2>
                <p style={{ color: "var(--text-light)", fontSize: "0.88rem", margin: "4px 0 0" }}>
                  Upload high-resolution client photos, custom t-shirt graphics, print mockups, or banners.
                </p>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              style={{ display: "none" }}
            />

            {/* Drag & Drop Card */}
            <div
              className={styles.dropzone}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={styles.dropzoneIcon}>
                <Upload size={28} />
              </div>
              <h3 className={styles.dropzoneTitle}>
                {isUploading ? "Uploading & Optimizing..." : "Click or Drop Custom Image Here"}
              </h3>
              <p className={styles.dropzoneSub}>
                Supports JPG, PNG, WebP, SVG (up to 15MB). Images are stored and immediately ready for products.
              </p>
            </div>

            {/* Gallery Grid */}
            <h3 style={{ fontSize: "1.1rem", marginBottom: "16px", marginTop: "32px" }}>
              Uploaded Assets & Product Mockups ({uploadedImages.length})
            </h3>

            <div className={styles.galleryGrid}>
              {uploadedImages.map((img, idx) => (
                <div key={idx} className={styles.galleryCard}>
                  <Image
                    src={img.url}
                    alt={img.filename}
                    width={200}
                    height={200}
                    className={styles.galleryImg}
                    unoptimized
                  />
                  <div className={styles.galleryCardFooter}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-light)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100px" }}>
                      {img.filename}
                    </span>
                    <button
                      onClick={() => copyToClipboard(img.url)}
                      className={styles.actionBtn}
                      style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                      title="Copy URL"
                    >
                      {copiedUrl === img.url ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image Editor Modal for Admin */}
        <AnimatePresence>
          {imageModalProduct && (
            <div className={styles.modalBackdrop} onClick={closeImageEditor}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={styles.imageEditModal}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.modalHeader}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div className={styles.modalIconWrap}>
                      <Camera size={20} />
                    </div>
                    <div>
                      <h3>Edit Product Photo</h3>
                      <p className={styles.modalSubtitle}>
                        Editing image for: <strong style={{ color: "var(--primary-color)" }}>{imageModalProduct.title}</strong>
                      </p>
                    </div>
                  </div>
                  <button onClick={closeImageEditor} className={styles.modalCloseBtn} title="Close dialog">
                    <X size={20} />
                  </button>
                </div>

                <div className={styles.modalBody}>
                  {/* Live Preview Column */}
                  <div className={styles.modalPreviewSection}>
                    <div className={styles.modalPreviewFrame}>
                      {editingImageUrl ? (
                        <Image
                          src={editingImageUrl}
                          alt={imageModalProduct.title}
                          width={220}
                          height={220}
                          className={styles.modalPreviewImg}
                          unoptimized
                        />
                      ) : (
                        <div className={styles.modalPreviewPlaceholder}>
                          <ImageIcon size={48} color="var(--border-color)" />
                          <span>No image selected</span>
                        </div>
                      )}
                      <span className={styles.previewTag}>Live Preview</span>
                    </div>
                    <div className={styles.previewPathText} title={editingImageUrl}>
                      {editingImageUrl || "Select an image"}
                    </div>
                  </div>

                  {/* Controls Column */}
                  <div className={styles.modalControlsSection}>
                    <div className={styles.modalTabs}>
                      <button
                        type="button"
                        className={`${styles.modalTabBtn} ${imageModalTab === "preset" ? styles.modalTabBtnActive : ""}`}
                        onClick={() => setImageModalTab("preset")}
                      >
                        <Sparkles size={14} /> Studio Catalog ({uploadedImages.length})
                      </button>
                      <button
                        type="button"
                        className={`${styles.modalTabBtn} ${imageModalTab === "upload" ? styles.modalTabBtnActive : ""}`}
                        onClick={() => setImageModalTab("upload")}
                      >
                        <Upload size={14} /> Upload New Photo
                      </button>
                      <button
                        type="button"
                        className={`${styles.modalTabBtn} ${imageModalTab === "url" ? styles.modalTabBtnActive : ""}`}
                        onClick={() => setImageModalTab("url")}
                      >
                        <Link2 size={14} /> Custom URL
                      </button>
                    </div>

                    {/* TAB 1: Catalog Presets */}
                    {imageModalTab === "preset" && (
                      <div className={styles.presetGridWrapper}>
                        <p style={{ margin: "0 0 10px", fontSize: "0.85rem", color: "var(--text-light)" }}>
                          Click any studio product photo or uploaded asset to assign to this product:
                        </p>
                        <div className={styles.presetGrid}>
                          {uploadedImages.map((img, idx) => {
                            const isSelected = editingImageUrl === img.url;
                            return (
                              <div
                                key={`${img.url}-${idx}`}
                                className={`${styles.presetItem} ${isSelected ? styles.presetItemActive : ""}`}
                                onClick={() => setEditingImageUrl(img.url)}
                                title={img.filename}
                              >
                                <Image
                                  src={img.url}
                                  alt={img.filename}
                                  width={75}
                                  height={75}
                                  className={styles.presetImg}
                                  unoptimized
                                />
                                {isSelected && (
                                  <div className={styles.presetCheckedBadge}>
                                    <Check size={12} strokeWidth={3} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* TAB 2: Upload File */}
                    {imageModalTab === "upload" && (
                      <div className={styles.modalUploadZone}>
                        <input
                          ref={modalFileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          onChange={handleModalFileUpload}
                          style={{ display: "none" }}
                          id="modalProductFileInput"
                        />
                        <label htmlFor="modalProductFileInput" className={styles.dropZoneLabel}>
                          {isModalUploading ? (
                            <div style={{ textAlign: "center", padding: "16px" }}>
                              <RefreshCw size={32} className="spin" style={{ color: "var(--primary-color)", margin: "0 auto 10px" }} />
                              <p style={{ fontWeight: 600, margin: 0 }}>Uploading to media storage...</p>
                            </div>
                          ) : (
                            <>
                              <div className={styles.uploadIconBadge}>
                                <Upload size={24} />
                              </div>
                              <h4>Upload from Computer or Phone</h4>
                              <p>Select any JPG, PNG, or WebP photo to replace this item&apos;s photo.</p>
                              <span className={styles.browsePill}>Browse Photo</span>
                            </>
                          )}
                        </label>
                      </div>
                    )}

                    {/* TAB 3: Direct URL */}
                    {imageModalTab === "url" && (
                      <div className={styles.modalUrlSection}>
                        <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-color)", display: "block", marginBottom: "6px" }}>
                          Direct Image Link (URL)
                        </label>
                        <input
                          type="url"
                          placeholder="https://... or /images/products/..."
                          value={editingImageUrl}
                          onChange={(e) => setEditingImageUrl(e.target.value)}
                          className={styles.formInput}
                        />
                        <p style={{ margin: "8px 0 0", fontSize: "0.8rem", color: "var(--text-light)" }}>
                          Paste a hosted link to any image. The preview on the left updates immediately.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    onClick={closeImageEditor}
                    className={styles.modalCancelBtn}
                    disabled={isSavingImage}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProductImage}
                    disabled={isSavingImage || !editingImageUrl}
                    className={styles.modalSaveBtn}
                  >
                    {isSavingImage ? (
                      <>
                        <RefreshCw size={16} className="spin" /> Updating Store...
                      </>
                    ) : (
                      <>
                        <Check size={16} /> Save & Apply Image
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
