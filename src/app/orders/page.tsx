"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import Link from "next/link";
import {
  Package,
  CheckCircle,
  Clock,
  Printer,
  Boxes,
  Truck,
  Navigation,
  CheckCircle2,
  CreditCard,
  QrCode,
  Banknote,
  FileCheck2,
  AlertCircle,
  XCircle,
  Ban,
  MapPin,
  Sparkles,
  Download,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Order, OrderStatus, PaymentStatus } from "@/context/AppContext";
import ConfirmModal from "@/components/ConfirmModal";
import PaymentReceiptModal from "@/components/PaymentReceiptModal";

// 8 Mandatory Order Progress Steps
const TIMELINE_STEPS: OrderStatus[] = [
  "Order Placed",
  "Payment Confirmed",
  "Order Processing",
  "Printing in Progress",
  "Ready for Dispatch",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

const statusIcons: Record<string, React.ReactNode> = {
  "Order Placed": <Package size={18} />,
  "Payment Confirmed": <CheckCircle size={18} />,
  "Order Processing": <Clock size={18} />,
  "Printing in Progress": <Printer size={18} />,
  "Ready for Dispatch": <Boxes size={18} />,
  "Shipped": <Truck size={18} />,
  "Out for Delivery": <Navigation size={18} />,
  "Delivered": <CheckCircle2 size={18} />,
  "Cancelled": <XCircle size={18} />,
  "Payment Failed": <AlertCircle size={18} />,
  "Payment Verification Failed": <AlertCircle size={18} />,
  // Legacy aliases
  "Processing": <Clock size={18} />,
  "Printed": <Boxes size={18} />,
};

export default function OrdersPage() {
  const { user, orders, updateOrderStatus } = useAppContext();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [cancelErrorMessage, setCancelErrorMessage] = useState<string | null>(null);

  if (!user) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingTop: "80px" }}>
        <Navbar />
        <div
          className="container"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: "1rem",
            padding: "40px 20px",
          }}
        >
          <div
            style={{
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              background: "rgba(79, 70, 229, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary-color)",
            }}
          >
            <Package size={36} />
          </div>
          <h2>Please sign in to track your orders</h2>
          <p style={{ color: "var(--text-light)", maxWidth: "480px" }}>
            Sign in with your account to view your past orders, delivery tracking, and live printing updates.
          </p>
          <Link
            href="/login?redirect=/orders"
            style={{
              background: "var(--primary-color)",
              color: "white",
              padding: "12px 28px",
              borderRadius: "var(--border-radius-lg)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Sign In to Continue
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const getStatusIndex = (status: OrderStatus) => {
    // Normalization for legacy orders
    if (status === "Processing") return 2; // maps to Order Processing
    if (status === "Printed") return 4; // maps to Ready for Dispatch
    return TIMELINE_STEPS.indexOf(status);
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const s = String(status).toUpperCase();
    if (s === "SUCCESS" || s === "PAID" || s === "COD COLLECTED") {
      return {
        bg: "rgba(16, 185, 129, 0.12)",
        color: "#059669",
        border: "rgba(16, 185, 129, 0.3)",
        label: "SUCCESS",
        icon: <CheckCircle size={15} />,
      };
    }
    if (s === "PENDING" || s === "COD PENDING" || s === "VERIFICATION PENDING") {
      return {
        bg: "rgba(245, 158, 11, 0.12)",
        color: "#b45309",
        border: "rgba(245, 158, 11, 0.3)",
        label: "PENDING",
        icon: <Clock size={15} />,
      };
    }
    if (s === "REFUNDED" || s === "REFUND REQUESTED") {
      return {
        bg: "rgba(139, 92, 246, 0.12)",
        color: "#7c3aed",
        border: "rgba(139, 92, 246, 0.3)",
        label: "REFUNDED",
        icon: <CheckCircle2 size={15} />,
      };
    }
    return {
      bg: "rgba(239, 68, 68, 0.12)",
      color: "#dc2626",
      border: "rgba(239, 68, 68, 0.3)",
      label: "FAILED",
      icon: <AlertCircle size={15} />,
    };
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingTop: "80px" }}>
      <Navbar />

      <div className="container" style={{ flex: 1, padding: "clamp(20px, 4vw, 40px) 16px", maxWidth: "960px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)", margin: "0 0 6px", color: "var(--primary-color)" }}
            >
              My Orders
            </motion.h1>
            <p style={{ color: "var(--text-light)", margin: 0, fontSize: "0.95rem" }}>
              Track live 8-step printing and delivery status in real time
            </p>
          </div>

          <Link
            href="/#products"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 18px",
              borderRadius: "10px",
              border: "1px solid var(--border-color)",
              color: "var(--text-color)",
              textDecoration: "none",
              fontSize: "0.9rem",
              fontWeight: 600,
            }}
          >
            <Sparkles size={16} color="var(--primary-color)" /> Browse Products
          </Link>
        </div>

        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: "center", padding: "4rem 0" }}
            className="glass"
          >
            <Package size={64} color="var(--border-color)" style={{ margin: "0 auto 1rem" }} />
            <h2>No orders placed yet</h2>
            <p style={{ color: "var(--text-light)", marginBottom: "2rem" }}>
              You haven&apos;t placed any custom printing orders with us yet.
            </p>
            <Link
              href="/#products"
              style={{
                background: "var(--primary-color)",
                color: "white",
                padding: "12px 26px",
                borderRadius: "var(--border-radius-lg)",
                fontWeight: 600,
                display: "inline-block",
                textDecoration: "none",
              }}
            >
              Start Customizing Products
            </Link>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {orders.map((order, index) => {
              const badge = getPaymentStatusBadge(order.paymentStatus);
              const currentIndex = getStatusIndex(order.status);
              const isCancelled = order.status === "Cancelled";
              const isVerificationFailed =
                order.status === "Payment Verification Failed" || order.status === "Payment Failed";

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="glass"
                  style={{
                    padding: "clamp(1.25rem, 3.5vw, 2rem)",
                    borderRadius: "18px",
                    boxShadow: "var(--shadow-md)",
                  }}
                >
                  {/* Header Row */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "1.5rem",
                      flexWrap: "wrap",
                      gap: "1rem",
                      borderBottom: "1px solid var(--border-color)",
                      paddingBottom: "1.25rem",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <h3 style={{ fontSize: "1.25rem", margin: 0, fontWeight: 700 }}>Order #{order.id}</h3>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: "20px",
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {badge.icon} {badge.label}
                        </span>
                      </div>
                      <p style={{ color: "var(--text-light)", fontSize: "0.85rem", margin: "4px 0 0" }}>
                        Placed on {new Date(order.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontWeight: 800, fontSize: "1.35rem", margin: 0, color: "var(--primary-color)" }}>
                        ₹{order.total}
                      </p>
                      <p style={{ color: "var(--text-light)", fontSize: "0.85rem", margin: "2px 0 0" }}>
                        {order.items.length} item(s) • Free Shipping
                      </p>
                      <button
                        type="button"
                        onClick={() => setReceiptOrder(order)}
                        style={{
                          marginTop: "8px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "rgba(79, 70, 229, 0.08)",
                          border: "1px solid rgba(79, 70, 229, 0.2)",
                          color: "var(--primary-color)",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <Download size={14} /> Receipt / Invoice
                      </button>
                    </div>
                  </div>

                  {/* Payment Details Card */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "1rem",
                      background: "var(--background-color)",
                      padding: "1.25rem",
                      borderRadius: "12px",
                      marginBottom: "1.75rem",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-light)", display: "block", marginBottom: "4px" }}>
                        Payment Method
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, fontSize: "0.95rem" }}>
                        {order.paymentMethod === "UPI" && <QrCode size={18} color="var(--primary-color)" />}
                        {order.paymentMethod === "Card" && <CreditCard size={18} color="var(--primary-color)" />}
                        {order.paymentMethod === "COD" && <Banknote size={18} color="var(--primary-color)" />}
                        {order.paymentMethod === "UPI"
                          ? "UPI / QR Code"
                          : order.paymentMethod === "Card"
                          ? "Credit / Debit Card"
                          : "Cash on Delivery"}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-light)", display: "block", marginBottom: "4px" }}>
                        Transaction / Payment ID
                      </span>
                      <div style={{ fontWeight: 600, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px", wordBreak: "break-all" }}>
                        <FileCheck2 size={16} color="var(--text-light)" />
                        <span>{order.transactionId || order.razorpayPaymentId || "N/A (Cash on Delivery)"}</span>
                      </div>
                    </div>

                    {order.paymentMethod === "COD" && (
                      <div>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-light)", display: "block", marginBottom: "4px" }}>
                          COD Distance Charge
                        </span>
                        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#b45309" }}>
                          +₹{order.codCharge} ({order.deliveryDistanceKm ? `${order.deliveryDistanceKm} KM` : "<=25 KM"})
                        </div>
                      </div>
                    )}

                    <div>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-light)", display: "block", marginBottom: "4px" }}>
                        Current Status
                      </span>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--primary-color)" }}>
                        {order.status}
                      </div>
                    </div>
                  </div>

                  {/* Cancelled Banner */}
                  {isCancelled && (
                    <div
                      style={{
                        marginBottom: "1.75rem",
                        padding: "1rem 1.25rem",
                        borderRadius: "10px",
                        background: "rgba(239, 68, 68, 0.08)",
                        border: "1px solid rgba(239, 68, 68, 0.25)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        color: "#dc2626",
                      }}
                    >
                      <Ban size={22} style={{ flexShrink: 0 }} />
                      <div>
                        <p style={{ fontWeight: 700, margin: 0, fontSize: "0.95rem" }}>Order has been cancelled</p>
                        <p style={{ fontSize: "0.85rem", margin: "2px 0 0", opacity: 0.9 }}>
                          {order.paymentStatus === "SUCCESS" || order.paymentStatus === "Paid"
                            ? "A refund has been initiated to your original payment method."
                            : "No charges were collected for this order."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Payment Verification Failure Banner */}
                  {isVerificationFailed && (
                    <div
                      style={{
                        marginBottom: "1.75rem",
                        padding: "1rem 1.25rem",
                        borderRadius: "10px",
                        background: "rgba(239, 68, 68, 0.08)",
                        border: "1px solid rgba(239, 68, 68, 0.25)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        color: "#dc2626",
                      }}
                    >
                      <AlertCircle size={22} style={{ flexShrink: 0 }} />
                      <div>
                        <p style={{ fontWeight: 700, margin: 0, fontSize: "0.95rem" }}>
                          Payment verification could not be completed
                        </p>
                        <p style={{ fontSize: "0.85rem", margin: "2px 0 0", opacity: 0.9 }}>
                          The gateway reported that the transaction was not completed or signature failed.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 8-Step Timeline */}
                  {!isCancelled && !isVerificationFailed && (
                    <div style={{ marginBottom: "2rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                          Live Progress: <span style={{ color: "var(--primary-color)" }}>{order.status}</span>
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>
                          Step {Math.max(1, currentIndex + 1)} of {TIMELINE_STEPS.length}
                        </span>
                      </div>

                      {/* Desktop Timeline */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          position: "relative",
                          padding: "10px 0",
                          overflowX: "auto",
                        }}
                      >
                        {/* Background track */}
                        <div
                          style={{
                            position: "absolute",
                            top: "27px",
                            left: "20px",
                            right: "20px",
                            height: "4px",
                            background: "var(--border-color)",
                            zIndex: 1,
                            borderRadius: "2px",
                          }}
                        />

                        {/* Completed fill */}
                        <div
                          style={{
                            position: "absolute",
                            top: "27px",
                            left: "20px",
                            width: `${Math.min(
                              100,
                              Math.max(0, (currentIndex / (TIMELINE_STEPS.length - 1)) * 100)
                            )}%`,
                            height: "4px",
                            background: "var(--primary-color)",
                            zIndex: 2,
                            borderRadius: "2px",
                            transition: "width 0.6s ease-in-out",
                          }}
                        />

                        {/* Timeline Nodes */}
                        {TIMELINE_STEPS.map((stepName, i) => {
                          const isDone = currentIndex >= i;
                          const isCurrent = currentIndex === i;

                          return (
                            <div
                              key={stepName}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                zIndex: 3,
                                minWidth: "72px",
                                textAlign: "center",
                              }}
                            >
                              <div
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "50%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  background: isDone ? "var(--primary-color)" : "white",
                                  color: isDone ? "white" : "var(--text-light)",
                                  border: `2px solid ${isDone ? "var(--primary-color)" : "var(--border-color)"}`,
                                  boxShadow: isCurrent ? "0 0 0 4px rgba(79, 70, 229, 0.25)" : "none",
                                  transition: "all 0.3s ease",
                                }}
                              >
                                {statusIcons[stepName]}
                              </div>
                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  marginTop: "6px",
                                  fontWeight: isDone ? 700 : 400,
                                  color: isDone ? "var(--text-color)" : "var(--text-light)",
                                  lineHeight: 1.2,
                                  maxWidth: "75px",
                                }}
                              >
                                {stepName}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Delivery Address & Order Items Accordion / Details */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.25rem" }}>
                    {/* Items */}
                    <div>
                      <h4 style={{ fontSize: "0.95rem", marginBottom: "0.75rem", fontWeight: 700 }}>
                        Ordered Items ({order.items.length})
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              background: "var(--background-color)",
                              padding: "8px 12px",
                              borderRadius: "10px",
                              border: "1px solid var(--border-color)",
                            }}
                          >
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "6px",
                                backgroundColor: item.imageColor || "#e2e8f0",
                                flexShrink: 0,
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontWeight: 600, fontSize: "0.85rem", margin: 0, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                {item.title}
                              </p>
                              {item.customDesign?.text && (
                                <p style={{ fontSize: "0.75rem", color: "var(--primary-color)", margin: 0 }}>
                                  Custom Text: &quot;{item.customDesign.text}&quot;
                                </p>
                              )}
                              <p style={{ color: "var(--text-light)", fontSize: "0.78rem", margin: 0 }}>
                                Qty: {item.quantity} × ₹{item.price}
                              </p>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                              ₹{item.price * item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping Address */}
                    {order.shippingAddress && (
                      <div>
                        <h4 style={{ fontSize: "0.95rem", marginBottom: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                          <MapPin size={16} color="var(--primary-color)" /> Shipping Address
                        </h4>
                        <div
                          style={{
                            background: "var(--background-color)",
                            padding: "10px 14px",
                            borderRadius: "10px",
                            border: "1px solid var(--border-color)",
                            fontSize: "0.85rem",
                            lineHeight: 1.5,
                            color: "var(--text-color)",
                          }}
                        >
                          <p style={{ margin: "0 0 2px", fontWeight: 700 }}>
                            {order.shippingAddress.fullName || order.customerName}
                          </p>
                          <p style={{ margin: 0, color: "var(--text-light)" }}>
                            {order.shippingAddress.addressLine1}
                            {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""}
                            <br />
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                            <br />
                            Phone: {order.shippingAddress.phone || "N/A"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cancel Order Action */}
                  {order.status === "Order Placed" && (
                    <div
                      style={{
                        marginTop: "1.25rem",
                        paddingTop: "1rem",
                        borderTop: "1px dashed var(--border-color)",
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <button
                        onClick={() => setOrderToCancel(order)}
                        disabled={cancellingId === order.id}
                        style={{
                          background: "rgba(239, 68, 68, 0.08)",
                          border: "1px solid rgba(239, 68, 68, 0.25)",
                          color: "var(--error-color)",
                          padding: "8px 16px",
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        Cancel Order
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancellation Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(orderToCancel)}
        title="Cancel Order"
        message={
          orderToCancel
            ? `Are you sure you want to cancel Order #${orderToCancel.id}? ${
                orderToCancel.paymentStatus === "SUCCESS" || orderToCancel.paymentStatus === "Paid"
                  ? `Since this order was prepaid (₹${orderToCancel.total}), a full refund will be initiated to your original payment method.`
                  : "This Cash on Delivery order will be cancelled immediately with zero charges."
              }`
            : ""
        }
        confirmText="Yes, Cancel Order"
        cancelText="No, Keep Order"
        variant="danger"
        isLoading={Boolean(cancellingId && cancellingId === orderToCancel?.id)}
        onConfirm={async () => {
          if (!orderToCancel) return;
          setCancellingId(orderToCancel.id);
          const res = await updateOrderStatus(orderToCancel.id, "Cancelled");
          setCancellingId(null);
          if (res.success) {
            setOrderToCancel(null);
          } else {
            setCancelErrorMessage(res.error || "Failed to cancel order");
          }
        }}
        onClose={() => {
          if (!cancellingId) setOrderToCancel(null);
        }}
      />

      {/* Cancellation Error Modal */}
      <ConfirmModal
        isOpen={Boolean(cancelErrorMessage)}
        title="Cancellation Error"
        message={cancelErrorMessage || ""}
        confirmText="Understood"
        cancelText="Close"
        variant="warning"
        onConfirm={() => setCancelErrorMessage(null)}
        onClose={() => setCancelErrorMessage(null)}
      />

      {/* Payment Receipt / Tax Invoice Modal */}
      <PaymentReceiptModal
        isOpen={Boolean(receiptOrder)}
        order={receiptOrder}
        onClose={() => setReceiptOrder(null)}
      />

      <Footer />
    </main>
  );
}
