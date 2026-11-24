"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Package,
  ArrowRight,
  ShoppingBag,
  MapPin,
  QrCode,
  CreditCard,
  Banknote,
  FileCheck2,
  Loader2,
  Truck,
  Download,
  Printer,
  FileText,
  ShieldCheck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Order } from "@/context/AppContext";
import PaymentReceiptModal from "@/components/PaymentReceiptModal";

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          if (data.orders && Array.isArray(data.orders)) {
            const matched = data.orders.find(
              (o: { orderId?: string; _id?: string }) =>
                o.orderId === orderId || o._id === orderId
            );
            if (matched) {
              setOrder({
                id: matched.orderId || matched._id,
                date: matched.createdAt || new Date().toISOString(),
                items: matched.items || [],
                subtotal: matched.subtotal,
                codCharge: matched.codCharge || 0,
                total: matched.total,
                status: matched.status,
                paymentMethod: matched.paymentMethod,
                paymentStatus: matched.paymentStatus,
                transactionId: matched.transactionId,
                razorpayPaymentId: matched.razorpayPaymentId,
                paymentDate: matched.paymentDate,
                customerName: matched.customerName,
                customerEmail: matched.customerEmail,
                shippingAddress: matched.shippingAddress,
                deliveryDistanceKm: matched.deliveryDistanceKm,
                deliveryDurationText: matched.deliveryDurationText,
              });
            }
          }
        }
      } catch (e) {
        console.warn("Could not fetch order confirmation details:", e);
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <Loader2 size={40} className="spin" color="var(--primary-color)" style={{ margin: "0 auto 1rem" }} />
        <p style={{ color: "var(--text-light)" }}>Loading order details...</p>
      </div>
    );
  }

  const isCOD = order?.paymentMethod === "COD";
  const isPaid = order?.paymentStatus === "SUCCESS" || order?.paymentStatus === "Paid";

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "clamp(20px, 4vw, 40px) 16px" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass"
        style={{
          padding: "clamp(1.5rem, 4vw, 2.75rem)",
          borderRadius: "20px",
          boxShadow: "var(--shadow-lg)",
          textAlign: "center",
        }}
      >
        {/* Status Icon */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: isPaid ? "rgba(16, 185, 129, 0.12)" : "rgba(79, 70, 229, 0.12)",
            color: isPaid ? "var(--success-color)" : "var(--primary-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
          }}
        >
          {isPaid ? <CheckCircle2 size={44} /> : <Truck size={44} />}
        </div>

        {/* Status Heading */}
        <h1
          style={{
            fontSize: "clamp(1.5rem, 3.5vw, 2rem)",
            marginBottom: "0.5rem",
            color: isPaid ? "var(--success-color)" : "var(--primary-color)",
          }}
        >
          {isCOD
            ? "Order Placed Successfully – Cash on Delivery"
            : isPaid
            ? "Payment Successful! Your order has been placed successfully."
            : "Order Received"}
        </h1>

        <p style={{ color: "var(--text-light)", fontSize: "0.95rem", marginBottom: "1.75rem" }}>
          {isCOD
            ? "Your Cash on Delivery order is confirmed and currently queued for custom printing."
            : "We have cryptographically verified your payment with the payment gateway and issued your invoice."}
        </p>

        {/* Order Identifier Banner */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--background-color)",
            padding: "8px 18px",
            borderRadius: "30px",
            border: "1px solid var(--border-color)",
            fontSize: "0.95rem",
            fontWeight: 700,
            marginBottom: "2rem",
          }}
        >
          <span>Order ID:</span>
          <span style={{ color: "var(--primary-color)" }}>#{order?.id || orderId}</span>
        </div>

        {/* Payment & Transaction Card */}
        <div
          style={{
            background: "var(--background-color)",
            padding: "1.5rem",
            borderRadius: "14px",
            border: "1px solid var(--border-color)",
            textAlign: "left",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1.25rem",
            marginBottom: "2rem",
          }}
        >
          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-light)", display: "block", marginBottom: "4px" }}>
              Payment Method
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, fontSize: "0.95rem" }}>
              {order?.paymentMethod === "UPI" && <QrCode size={18} color="var(--primary-color)" />}
              {order?.paymentMethod === "Card" && <CreditCard size={18} color="var(--primary-color)" />}
              {order?.paymentMethod === "COD" && <Banknote size={18} color="var(--primary-color)" />}
              {order?.paymentMethod === "UPI"
                ? "UPI / QR Code"
                : order?.paymentMethod === "Card"
                ? "Credit / Debit Card"
                : "Cash on Delivery"}
            </div>
          </div>

          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-light)", display: "block", marginBottom: "4px" }}>
              Payment Status
            </span>
            <span
              style={{
                fontWeight: 700,
                fontSize: "0.95rem",
                color: isPaid ? "var(--success-color)" : "#b45309",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              {isPaid ? <CheckCircle2 size={16} /> : <Clock size={16} />}
              {order?.paymentStatus || (isCOD ? "PENDING" : "SUCCESS")}
            </span>
          </div>

          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-light)", display: "block", marginBottom: "4px" }}>
              Transaction ID
            </span>
            <span style={{ fontWeight: 600, fontSize: "0.85rem", wordBreak: "break-all" }}>
              {order?.transactionId || order?.razorpayPaymentId || "N/A (Cash on Delivery)"}
            </span>
          </div>

          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-light)", display: "block", marginBottom: "4px" }}>
              Total Payable Amount
            </span>
            <span style={{ fontWeight: 800, fontSize: "1.15rem", color: "var(--primary-color)" }}>
              ₹{order?.total || 0}
            </span>
          </div>
        </div>

        {/* COD Distance Surcharge Banner if COD */}
        {isCOD && (
          <div
            style={{
              padding: "1rem 1.25rem",
              borderRadius: "12px",
              background: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              color: "#92400e",
              textAlign: "left",
              marginBottom: "2rem",
              fontSize: "0.9rem",
            }}
          >
            <p style={{ margin: "0 0 4px", fontWeight: 700 }}>
              💵 Cash on Delivery Information
            </p>
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              Delivery Distance: <strong>{order?.deliveryDistanceKm || 12} KM</strong> • Distance COD Charge:{" "}
              <strong>₹{order?.codCharge || 80}</strong>. Please keep <strong>₹{order?.total}</strong> in cash ready when the
              delivery agent arrives.
            </p>
          </div>
        )}

        {/* Shipping Address */}
        {order?.shippingAddress && (
          <div
            style={{
              textAlign: "left",
              background: "var(--background-color)",
              padding: "1.25rem",
              borderRadius: "12px",
              border: "1px solid var(--border-color)",
              marginBottom: "2rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontWeight: 700 }}>
              <MapPin size={18} color="var(--primary-color)" /> Delivering to:
            </div>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-color)", lineHeight: 1.5 }}>
              <strong>{order.shippingAddress.fullName || order.customerName}</strong>
              <br />
              {order.shippingAddress.addressLine1}
              {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
              <br />
              Phone: {order.shippingAddress.phone || "N/A"}
            </p>
          </div>
        )}

        {/* Navigation & Action Buttons */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setShowReceipt(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#10b981",
              color: "white",
              padding: "12px 24px",
              borderRadius: "var(--border-radius-lg)",
              fontWeight: 700,
              fontSize: "0.95rem",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
              transition: "transform 0.2s ease",
            }}
          >
            <Download size={18} /> Download Payment Receipt (PDF)
          </button>

          <Link
            href="/orders"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--primary-color)",
              color: "white",
              padding: "12px 26px",
              borderRadius: "var(--border-radius-lg)",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: "0.95rem",
            }}
          >
            <Package size={18} /> Track Order Progress
          </Link>

          <Link
            href="/#products"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "transparent",
              border: "1px solid var(--border-color)",
              color: "var(--text-color)",
              padding: "12px 24px",
              borderRadius: "var(--border-radius-lg)",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: "0.95rem",
            }}
          >
            <ShoppingBag size={18} /> Continue Shopping
          </Link>
        </div>

        {/* Payment Receipt Modal */}
        <PaymentReceiptModal
          isOpen={showReceipt}
          order={order}
          onClose={() => setShowReceipt(false)}
        />
      </motion.div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingTop: "80px" }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <Suspense
          fallback={
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <Loader2 size={40} className="spin" color="var(--primary-color)" style={{ margin: "0 auto" }} />
            </div>
          }
        >
          <OrderConfirmationContent />
        </Suspense>
      </div>
      <Footer />
    </main>
  );
}
