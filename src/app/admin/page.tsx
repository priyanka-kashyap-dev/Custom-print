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
  QrCode,
  CreditCard,
  Banknote,
  Truck,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  Navigation,
  Boxes,
  RotateCcw,
  Eye,
} from "lucide-react";
import { useAppContext, Product } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import styles from "./AdminDashboard.module.css";
import { isAdminEmail } from "@/lib/auth-constants";
import ConfirmModal from "@/components/ConfirmModal";

interface ExtendedProduct extends Product {
  originalPrice?: number;
  stock?: number;
  badge?: string;
  category?: string;
  status?: "active" | "out_of_stock" | "draft";
  updatedAt?: string;
}

interface AdminOrder {
  _id: string;
  orderId: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: Array<{
    productId?: string | number;
    title: string;
    price: number;
    quantity: number;
    image?: string;
    imageColor?: string;
    customDesign?: {
      text?: string;
      textColor?: string;
      fontFamily?: string;
    };
  }>;
  subtotal: number;
  deliveryCharge?: number;
  codCharge?: number;
  total: number;
  status: string;
  paymentMethod: "UPI" | "Card" | "COD";
  paymentStatus: string;
  transactionId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentDate?: string;
  deliveryDistanceKm?: number;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  paymentHistory?: Array<{
    status: string;
    paymentStatus?: string;
    timestamp: string;
    note?: string;
    updatedBy?: string;
    transactionId?: string;
  }>;
}

export default function AdminPage() {
  const { user, isAdmin, logout, refreshProducts } = useAppContext();
  const [activeTab, setActiveTab] = useState<"stock" | "add" | "upload" | "orders">("stock");

  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Custom confirmation modal state (replaces native window.confirm)
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "primary" | "success";
    isLoading?: boolean;
    children?: React.ReactNode;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  // Refund prompt modal state (replaces native window.prompt)
  const [refundModalState, setRefundModalState] = useState<{
    orderId: string;
    amount: number;
    reason: string;
  } | null>(null);

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

  // Orders Management States
  const [adminOrders, setAdminOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [filterMethod, setFilterMethod] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [orderSearch, setOrderSearch] = useState<string>("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

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

  const fetchAdminOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterMethod !== "all") params.append("method", filterMethod);
      if (filterStatus !== "all") params.append("paymentStatus", filterStatus);
      if (orderSearch.trim()) params.append("search", orderSearch.trim());

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.orders && Array.isArray(data.orders)) {
          setAdminOrders(data.orders);
        }
      }
    } catch (err) {
      console.warn("Could not load admin orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  }, [filterMethod, filterStatus, orderSearch]);

  useEffect(() => {
    if (isAuthorized) {
      fetchAdminProducts();
      fetchAdminOrders();
    }
  }, [isAuthorized, fetchAdminProducts, fetchAdminOrders]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (res.ok) {
        showNotification(`Order #${orderId} status updated to "${newStatus}"`);
        await fetchAdminOrders();
      } else {
        const err = await res.json();
        showNotification(err.error || "Failed to update order status", "error");
      }
    } catch {
      showNotification("Network error updating order status", "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCollectCodCash = (orderId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Collect COD Payment",
      message: `Confirm collection of cash for Order #${orderId} and mark payment as SUCCESS (PAID)?`,
      confirmText: "Yes, Mark Paid",
      cancelText: "Cancel",
      variant: "success",
      onConfirm: async () => {
        setUpdatingOrderId(orderId);
        try {
          const res = await fetch("/api/orders", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, action: "mark_cod_paid" }),
          });
          if (res.ok) {
            showNotification(`Payment for Order #${orderId} marked as SUCCESS (COD Collected)`);
            await fetchAdminOrders();
          } else {
            const err = await res.json();
            showNotification(err.error || "Failed to record cash collection", "error");
          }
        } catch {
          showNotification("Network error updating payment", "error");
        } finally {
          setUpdatingOrderId(null);
          setConfirmConfig(null);
        }
      },
    });
  };

  const handleRefundOrder = (orderId: string, currentTotal: number) => {
    setRefundModalState({
      orderId,
      amount: currentTotal,
      reason: "Customer cancellation / return request",
    });
  };

  // Orders revenue and KPI calculations
  const totalRevenue = adminOrders
    .filter((o) => ["SUCCESS", "PAID", "COD COLLECTED"].includes(String(o.paymentStatus).toUpperCase()))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const successfulPaymentsCount = adminOrders.filter((o) =>
    ["SUCCESS", "PAID", "COD COLLECTED"].includes(String(o.paymentStatus).toUpperCase())
  ).length;

  const pendingPaymentsCount = adminOrders.filter((o) =>
    ["PENDING", "COD PENDING", "VERIFICATION PENDING"].includes(String(o.paymentStatus).toUpperCase())
  ).length;

  const codCollectionsTotal = adminOrders
    .filter((o) => o.paymentMethod === "COD" && ["SUCCESS", "PAID", "COD COLLECTED"].includes(String(o.paymentStatus).toUpperCase()))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const codOrdersCount = adminOrders.filter((o) => o.paymentMethod === "COD").length;

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

  const handleDeleteProduct = (id: string | number, title: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Remove Product",
      message: `Are you sure you want to remove "${title}" from the store? This action cannot be undone.`,
      confirmText: "Yes, Delete",
      cancelText: "Cancel",
      variant: "danger",
      onConfirm: async () => {
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
        } finally {
          setConfirmConfig(null);
        }
      },
    });
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
        {activeTab === "orders" ? (
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricIcon} style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
                <DollarSign size={24} />
              </div>
              <div className={styles.metricInfo}>
                <h4>Total Verified Revenue</h4>
                <p className={styles.metricValue}>₹{totalRevenue}</p>
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricIcon} style={{ background: "rgba(79, 70, 229, 0.12)", color: "var(--primary-color)" }}>
                <CheckCircle size={24} />
              </div>
              <div className={styles.metricInfo}>
                <h4>Successful Payments</h4>
                <p className={styles.metricValue}>{successfulPaymentsCount} orders</p>
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricIcon} style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
                <Clock size={24} />
              </div>
              <div className={styles.metricInfo}>
                <h4>Pending Payments</h4>
                <p className={styles.metricValue}>{pendingPaymentsCount} orders</p>
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricIcon} style={{ background: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6" }}>
                <Banknote size={24} />
              </div>
              <div className={styles.metricInfo}>
                <h4>COD Collections</h4>
                <p className={styles.metricValue}>₹{codCollectionsTotal} <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-light)" }}>({codOrdersCount} COD)</span></p>
              </div>
            </div>
          </div>
        ) : (
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
        )}

        {/* Navigation Tabs */}
        <div className={styles.tabsBar}>
          <button
            onClick={() => setActiveTab("orders")}
            className={`${styles.tabBtn} ${activeTab === "orders" ? styles.activeTabBtn : ""}`}
          >
            <ShoppingBag size={18} /> Orders & Payments ({adminOrders.length})
          </button>
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

        {/* TAB 0: Orders & Payments Management */}
        {activeTab === "orders" && (
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Order Management & Gateway Payment Verification</h2>
                <p style={{ color: "var(--text-light)", fontSize: "0.88rem", margin: "4px 0 0" }}>
                  Monitor live transactions, verify payment signatures, manage COD collections, and update 8-stage printing progress.
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                <button
                  onClick={fetchAdminOrders}
                  className={styles.storeLinkBtn}
                  disabled={ordersLoading}
                  style={{ padding: "8px 14px", fontSize: "0.85rem" }}
                  title="Reload live orders"
                >
                  <RefreshCw size={14} className={ordersLoading ? "spin" : ""} /> Refresh Orders
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                alignItems: "center",
                marginBottom: "20px",
                background: "var(--background-color)",
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid var(--border-color)",
              }}
            >
              {/* Search */}
              <div style={{ flex: "1 1 240px", minWidth: "200px", position: "relative" }}>
                <Search
                  size={16}
                  color="var(--text-light)"
                  style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
                />
                <input
                  type="text"
                  placeholder="Search by Order ID, customer, email, txn ID..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") fetchAdminOrders();
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 12px 8px 36px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    background: "var(--surface-color)",
                    fontSize: "0.88rem",
                  }}
                />
              </div>

              {/* Method Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-light)", fontWeight: 500 }}>Method:</span>
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    background: "var(--surface-color)",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                  }}
                >
                  <option value="all">All Methods</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="COD">Cash on Delivery (COD)</option>
                </select>
              </div>

              {/* Status Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-light)", fontWeight: 500 }}>Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    background: "var(--surface-color)",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                  }}
                >
                  <option value="all">All Payment Statuses</option>
                  <option value="SUCCESS">SUCCESS (Paid)</option>
                  <option value="PENDING">PENDING (Unpaid / COD)</option>
                  <option value="FAILED">FAILED</option>
                  <option value="REFUNDED">REFUNDED</option>
                </select>
              </div>

              <button
                onClick={fetchAdminOrders}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: "var(--primary-color)",
                  color: "#fff",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Apply Filters
              </button>
            </div>

            {/* Orders Table */}
            {ordersLoading ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <RefreshCw size={32} className="spin" style={{ color: "var(--primary-color)" }} />
                <p style={{ marginTop: "12px", color: "var(--text-light)" }}>Fetching orders and gateway sync...</p>
              </div>
            ) : adminOrders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <ShoppingBag size={48} color="var(--border-color)" style={{ margin: "0 auto 12px" }} />
                <h3>No orders match your filter criteria</h3>
                <p style={{ color: "var(--text-light)" }}>Try clearing search keywords or switching filters.</p>
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Order ID & Date</th>
                      <th>Customer</th>
                      <th>Payment & Txn ID</th>
                      <th>Delivery & COD</th>
                      <th>Total</th>
                      <th>Order Progress</th>
                      <th>Payment Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminOrders.map((ord) => {
                      const isCOD = ord.paymentMethod === "COD";
                      const pStatus = String(ord.paymentStatus || "").toUpperCase();
                      const isPaid = pStatus === "SUCCESS" || pStatus === "PAID" || pStatus === "COD COLLECTED";
                      const isPending = pStatus === "PENDING" || pStatus === "COD PENDING" || pStatus === "VERIFICATION PENDING";
                      const isRefunded = pStatus === "REFUNDED" || pStatus === "REFUND REQUESTED";
                      const isExpanded = expandedOrderId === ord.orderId;

                      return (
                        <tr key={ord.orderId || ord._id} style={{ borderBottom: isExpanded ? "none" : undefined }}>
                          {/* Order ID & Date */}
                          <td>
                            <div style={{ fontWeight: 700, color: "var(--primary-color)" }}>#{ord.orderId}</div>
                            <div style={{ fontSize: "0.78rem", color: "var(--text-light)" }}>
                              {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                          </td>

                          {/* Customer */}
                          <td>
                            <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{ord.customerName}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-light)", wordBreak: "break-all" }}>
                              {ord.customerEmail}
                            </div>
                            {ord.customerPhone && (
                              <div style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>📞 {ord.customerPhone}</div>
                            )}
                          </td>

                          {/* Payment & Txn ID */}
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, fontSize: "0.85rem" }}>
                              {ord.paymentMethod === "UPI" && <QrCode size={15} color="var(--primary-color)" />}
                              {ord.paymentMethod === "Card" && <CreditCard size={15} color="var(--primary-color)" />}
                              {ord.paymentMethod === "COD" && <Banknote size={15} color="var(--primary-color)" />}
                              <span>{ord.paymentMethod === "UPI" ? "UPI QR" : ord.paymentMethod === "Card" ? "Card" : "COD"}</span>
                            </div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--text-light)",
                                maxWidth: "160px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={ord.transactionId || ord.razorpayPaymentId || "N/A"}
                            >
                              Txn: {ord.transactionId || ord.razorpayPaymentId || (isCOD ? "Cash on Delivery" : "Pending Gateway")}
                            </div>
                          </td>

                          {/* Delivery Distance & COD */}
                          <td>
                            <div style={{ fontSize: "0.85rem" }}>
                              <Truck size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                              {ord.deliveryDistanceKm ? `${ord.deliveryDistanceKm} KM` : "Local NCR"}
                            </div>
                            {isCOD && (
                              <div style={{ fontSize: "0.78rem", color: "#b45309", fontWeight: 600 }}>
                                COD Charge: ₹{ord.codCharge || 0}
                              </div>
                            )}
                          </td>

                          {/* Total */}
                          <td>
                            <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text-color)" }}>
                              ₹{ord.total}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>{ord.items.length} item(s)</div>
                          </td>

                          {/* Order Progress (8 stages) */}
                          <td>
                            <select
                              value={ord.status}
                              disabled={updatingOrderId === ord.orderId}
                              onChange={(e) => handleUpdateOrderStatus(ord.orderId, e.target.value)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "8px",
                                border: "1px solid var(--border-color)",
                                background: "var(--surface-color)",
                                fontSize: "0.82rem",
                                fontWeight: 600,
                                color: "var(--primary-color)",
                                cursor: "pointer",
                              }}
                            >
                              <option value="Order Placed">1. Order Placed</option>
                              <option value="Payment Confirmed">2. Payment Confirmed</option>
                              <option value="Order Processing">3. Order Processing</option>
                              <option value="Printing in Progress">4. Printing in Progress</option>
                              <option value="Ready for Dispatch">5. Ready for Dispatch</option>
                              <option value="Shipped">6. Shipped</option>
                              <option value="Out for Delivery">7. Out for Delivery</option>
                              <option value="Delivered">8. Delivered</option>
                              <option value="Cancelled">❌ Cancelled</option>
                              <option value="Payment Verification Failed">⚠️ Verification Failed</option>
                            </select>
                          </td>

                          {/* Payment Status Badge */}
                          <td>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 10px",
                                borderRadius: "12px",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                background: isPaid
                                  ? "rgba(16, 185, 129, 0.15)"
                                  : isPending
                                  ? "rgba(245, 158, 11, 0.15)"
                                  : isRefunded
                                  ? "rgba(139, 92, 246, 0.15)"
                                  : "rgba(239, 68, 68, 0.15)",
                                color: isPaid
                                  ? "#059669"
                                  : isPending
                                  ? "#b45309"
                                  : isRefunded
                                  ? "#7c3aed"
                                  : "#dc2626",
                                border: `1px solid ${
                                  isPaid ? "#a7f3d0" : isPending ? "#fde68a" : isRefunded ? "#ddd6fe" : "#fecaca"
                                }`,
                              }}
                            >
                              {isPaid ? "PAID" : isPending ? "PENDING" : isRefunded ? "REFUNDED" : "FAILED"}
                            </span>
                          </td>

                          {/* Quick Actions */}
                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                              {isCOD && !isPaid && (
                                <button
                                  onClick={() => handleCollectCodCash(ord.orderId)}
                                  disabled={updatingOrderId === ord.orderId}
                                  className={styles.actionBtn}
                                  style={{
                                    background: "#10b981",
                                    color: "#fff",
                                    padding: "4px 10px",
                                    fontSize: "0.78rem",
                                    fontWeight: 600,
                                    borderRadius: "6px",
                                  }}
                                  title="Record cash collected from customer and mark as PAID"
                                >
                                  Collect ₹{ord.total}
                                </button>
                              )}

                              {isPaid && !isRefunded && (
                                <button
                                  onClick={() => handleRefundOrder(ord.orderId, ord.total)}
                                  disabled={updatingOrderId === ord.orderId}
                                  className={styles.actionBtn}
                                  style={{
                                    background: "rgba(139, 92, 246, 0.1)",
                                    color: "#7c3aed",
                                    padding: "4px 8px",
                                    fontSize: "0.78rem",
                                    borderRadius: "6px",
                                  }}
                                  title="Initiate refund to customer"
                                >
                                  <RotateCcw size={12} /> Refund
                                </button>
                              )}

                              <button
                                onClick={() => setExpandedOrderId(isExpanded ? null : ord.orderId)}
                                className={styles.actionBtn}
                                style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                                title="Expand details"
                              >
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
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

            {/* Expanded Order Detail Drawer / Modal for the selected order */}
            {expandedOrderId && (() => {
              const ord = adminOrders.find((o) => o.orderId === expandedOrderId);
              if (!ord) return null;

              return (
                <div
                  style={{
                    marginTop: "20px",
                    background: "var(--background-color)",
                    padding: "20px",
                    borderRadius: "14px",
                    border: "2px solid var(--primary-color)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ margin: 0, fontSize: "1.15rem" }}>
                      Order Audit & Inspection: <span style={{ color: "var(--primary-color)" }}>#{ord.orderId}</span>
                    </h3>
                    <button
                      onClick={() => setExpandedOrderId(null)}
                      style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-light)" }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                    {/* Item Customizations */}
                    <div style={{ background: "var(--surface-color)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                      <h4 style={{ margin: "0 0 10px", fontSize: "0.92rem", fontWeight: 700 }}>
                        Ordered Items ({ord.items.length})
                      </h4>
                      {ord.items.map((item, idx) => (
                        <div key={idx} style={{ padding: "8px 0", borderBottom: "1px solid var(--border-color)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 600 }}>
                            <span>{item.title}</span>
                            <span>₹{item.price * item.quantity}</span>
                          </div>
                          {item.customDesign?.text && (
                            <div style={{ fontSize: "0.78rem", color: "var(--primary-color)", marginTop: "2px" }}>
                              Custom Text: &quot;{item.customDesign.text}&quot;
                            </div>
                          )}
                          <div style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>Qty: {item.quantity} × ₹{item.price}</div>
                        </div>
                      ))}
                    </div>

                    {/* Shipping Address */}
                    <div style={{ background: "var(--surface-color)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                      <h4 style={{ margin: "0 0 10px", fontSize: "0.92rem", fontWeight: 700 }}>
                        Delivery Address & Distance
                      </h4>
                      {ord.shippingAddress ? (
                        <div style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
                          <p style={{ margin: "0 0 4px", fontWeight: 700 }}>{ord.shippingAddress.fullName || ord.customerName}</p>
                          <p style={{ margin: 0, color: "var(--text-light)" }}>
                            {ord.shippingAddress.addressLine1}
                            {ord.shippingAddress.addressLine2 ? `, ${ord.shippingAddress.addressLine2}` : ""}
                            <br />
                            {ord.shippingAddress.city}, {ord.shippingAddress.state} {ord.shippingAddress.postalCode}
                            <br />
                            Phone: {ord.shippingAddress.phone || "N/A"}
                          </p>
                          <div style={{ marginTop: "8px", fontWeight: 600, color: "var(--primary-color)" }}>
                            Distance: {ord.deliveryDistanceKm || 12} KM • COD Charge: ₹{ord.codCharge || 0}
                          </div>
                        </div>
                      ) : (
                        <p style={{ color: "var(--text-light)", fontSize: "0.85rem" }}>No shipping address recorded</p>
                      )}
                    </div>

                    {/* Gateway Payment Details & Audit History */}
                    <div style={{ background: "var(--surface-color)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border-color)", gridColumn: "1 / -1" }}>
                      <h4 style={{ margin: "0 0 10px", fontSize: "0.92rem", fontWeight: 700 }}>
                        Gateway References & Payment Audit Trail
                      </h4>
                      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", fontSize: "0.85rem", marginBottom: "14px" }}>
                        <div>
                          <span style={{ color: "var(--text-light)", display: "block", fontSize: "0.75rem" }}>Payment ID</span>
                          <strong>{ord.transactionId || ord.razorpayPaymentId || "None"}</strong>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-light)", display: "block", fontSize: "0.75rem" }}>Gateway Order ID</span>
                          <strong>{ord.razorpayOrderId || "None"}</strong>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-light)", display: "block", fontSize: "0.75rem" }}>Payment Method</span>
                          <strong>{ord.paymentMethod}</strong>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-light)", display: "block", fontSize: "0.75rem" }}>Payment Status</span>
                          <strong style={{ color: ord.paymentStatus === "SUCCESS" ? "var(--success-color)" : "#b45309" }}>
                            {ord.paymentStatus}
                          </strong>
                        </div>
                      </div>

                      {/* Audit Log Events */}
                      {ord.paymentHistory && ord.paymentHistory.length > 0 && (
                        <div>
                          <span style={{ fontSize: "0.8rem", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                            Event History:
                          </span>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {ord.paymentHistory.map((h, hIdx) => (
                              <div
                                key={hIdx}
                                style={{
                                  fontSize: "0.78rem",
                                  background: "var(--background-color)",
                                  padding: "6px 10px",
                                  borderRadius: "6px",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  flexWrap: "wrap",
                                }}
                              >
                                <span>
                                  <strong>[{h.status}]</strong> {h.note || "Status change recorded"}
                                </span>
                                <span style={{ color: "var(--text-light)" }}>
                                  {new Date(h.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • By {h.updatedBy || "System"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

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

        {/* Admin Confirmation Modal */}
        {confirmConfig && (
          <ConfirmModal
            isOpen={confirmConfig.isOpen}
            title={confirmConfig.title}
            message={confirmConfig.message}
            confirmText={confirmConfig.confirmText}
            cancelText={confirmConfig.cancelText}
            variant={confirmConfig.variant}
            isLoading={confirmConfig.isLoading}
            onConfirm={confirmConfig.onConfirm}
            onClose={() => setConfirmConfig(null)}
          >
            {confirmConfig.children}
          </ConfirmModal>
        )}

        {/* Admin Refund Prompt Modal */}
        {refundModalState && (
          <ConfirmModal
            isOpen={Boolean(refundModalState)}
            title="Process Order Refund"
            message={`Issue full refund of ₹${refundModalState.amount} for Order #${refundModalState.orderId}?`}
            confirmText="Process Refund"
            cancelText="Cancel"
            variant="warning"
            isLoading={updatingOrderId === refundModalState.orderId}
            onConfirm={async () => {
              const orderId = refundModalState.orderId;
              const reason = refundModalState.reason || "Customer cancellation / return";
              setUpdatingOrderId(orderId);
              try {
                const res = await fetch("/api/orders", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ orderId, action: "refund", refundReason: reason }),
                });
                if (res.ok) {
                  showNotification(`Order #${orderId} marked as REFUNDED`);
                  await fetchAdminOrders();
                  setRefundModalState(null);
                } else {
                  const err = await res.json();
                  showNotification(err.error || "Failed to process refund", "error");
                }
              } catch {
                showNotification("Network error processing refund", "error");
              } finally {
                setUpdatingOrderId(null);
              }
            }}
            onClose={() => {
              if (!updatingOrderId) setRefundModalState(null);
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: "var(--text-color)",
                }}
              >
                Refund Reason / Customer Notes:
              </label>
              <input
                type="text"
                value={refundModalState.reason}
                onChange={(e) =>
                  setRefundModalState((prev) =>
                    prev ? { ...prev, reason: e.target.value } : null
                  )
                }
                placeholder="e.g. Return request, printing defect, customer cancellation"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  background: "var(--background-color)",
                  color: "var(--text-color)",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>
          </ConfirmModal>
        )}
      </main>

      <Footer />
    </div>
  );
}
