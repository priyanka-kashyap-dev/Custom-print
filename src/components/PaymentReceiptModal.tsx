"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Printer, Download, CheckCircle2, ShieldCheck, MapPin, CreditCard, QrCode, Banknote } from "lucide-react";
import { Order } from "@/context/AppContext";

export interface PaymentReceiptModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
}

export default function PaymentReceiptModal({
  isOpen,
  order,
  onClose,
}: PaymentReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const isCOD = order.paymentMethod === "COD";
  const isPaid = order.paymentStatus === "SUCCESS" || order.paymentStatus === "Paid";

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(6px)",
          overflowY: "auto",
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: "680px",
            width: "100%",
            background: "#ffffff",
            color: "#0f172a",
            borderRadius: "18px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
            overflow: "hidden",
            margin: "auto",
            border: "1px solid #e2e8f0",
          }}
        >
          {/* Top Bar (Hidden in print) */}
          <div
            className="no-print"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              background: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "0.95rem", color: "#4f46e5" }}>
              <Download size={18} /> Official Payment Receipt
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={handlePrint}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#4f46e5",
                  color: "#ffffff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(79, 70, 229, 0.3)",
                }}
              >
                <Printer size={15} /> Save / Print PDF
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Printable Invoice Container */}
          <div
            id="printable-receipt"
            ref={receiptRef}
            style={{
              padding: "clamp(20px, 4vw, 36px)",
              background: "#ffffff",
              color: "#0f172a",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
          >
            {/* Header: Company & Invoice Info */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "2px solid #4f46e5",
                paddingBottom: "18px",
                marginBottom: "20px",
                flexWrap: "wrap",
                gap: "14px",
              }}
            >
              <div>
                <h1 style={{ margin: "0 0 4px", fontSize: "1.6rem", fontWeight: 800, color: "#4f46e5", letterSpacing: "-0.5px" }}>
                  PrintStyle
                </h1>
                <p style={{ margin: "0 0 2px", fontSize: "0.85rem", color: "#475569", fontWeight: 600 }}>
                  Custom Printing & Personalized Gifts
                </p>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                  Tiwariganj, Lucknow, Uttar Pradesh 226028, India
                </p>
              </div>

              <div style={{ textAlign: "right" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    borderRadius: "6px",
                    background: isPaid ? "#ecfdf5" : "#fffbeb",
                    color: isPaid ? "#059669" : "#b45309",
                    border: `1px solid ${isPaid ? "#a7f3d0" : "#fde68a"}`,
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    marginBottom: "6px",
                    textTransform: "uppercase",
                  }}
                >
                  {isPaid ? "TAX INVOICE • PAID" : "ORDER RECEIPT • COD PENDING"}
                </span>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>
                  Receipt #: INV-{order.id.replace("CP-", "")}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                  Date: {new Date(order.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>

            {/* Billed To & Payment Details */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
                background: "#f8fafc",
                padding: "16px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                marginBottom: "20px",
                fontSize: "0.85rem",
              }}
            >
              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#64748b", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                  Billed & Shipped To:
                </span>
                <p style={{ margin: "0 0 2px", fontWeight: 700, color: "#0f172a" }}>
                  {order.shippingAddress?.fullName || order.customerName || "Customer"}
                </p>
                <p style={{ margin: "0 0 2px", color: "#475569" }}>
                  {order.shippingAddress?.addressLine1}
                  {order.shippingAddress?.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""}
                </p>
                <p style={{ margin: "0 0 2px", color: "#475569" }}>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
                </p>
                {order.shippingAddress?.phone && (
                  <p style={{ margin: 0, color: "#64748b" }}>Phone: {order.shippingAddress.phone}</p>
                )}
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#64748b", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                  Payment Information:
                </span>
                <p style={{ margin: "0 0 3px", color: "#0f172a" }}>
                  <strong>Method:</strong> {order.paymentMethod === "UPI" ? "UPI / QR Code" : order.paymentMethod === "Card" ? "Credit / Debit Card" : "Cash on Delivery"}
                </p>
                <p style={{ margin: "0 0 3px", color: "#0f172a" }}>
                  <strong>Status:</strong>{" "}
                  <span style={{ color: isPaid ? "#059669" : "#b45309", fontWeight: 700 }}>
                    {order.paymentStatus || (isCOD ? "PENDING" : "SUCCESS")}
                  </span>
                </p>
                <p style={{ margin: "0 0 3px", color: "#0f172a", wordBreak: "break-all" }}>
                  <strong>Transaction ID:</strong> {order.transactionId || order.razorpayPaymentId || "N/A (Cash on Delivery)"}
                </p>
                <p style={{ margin: 0, color: "#64748b" }}>
                  <strong>Order ID:</strong> #{order.id}
                </p>
              </div>
            </div>

            {/* Items Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ background: "#f1f5f9", borderBottom: "2px solid #cbd5e1" }}>
                  <th style={{ padding: "10px 8px", textAlign: "left", color: "#334155", fontWeight: 700 }}>Description</th>
                  <th style={{ padding: "10px 8px", textAlign: "center", color: "#334155", fontWeight: 700 }}>Qty</th>
                  <th style={{ padding: "10px 8px", textAlign: "right", color: "#334155", fontWeight: 700 }}>Unit Price</th>
                  <th style={{ padding: "10px 8px", textAlign: "right", color: "#334155", fontWeight: 700 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={index} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "10px 8px", color: "#1e293b" }}>
                      <strong>{item.title}</strong>
                      {item.customDesign?.text && (
                        <div style={{ fontSize: "0.78rem", color: "#4f46e5", marginTop: "2px" }}>
                          Custom Print Text: &quot;{item.customDesign.text}&quot;
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "center", color: "#475569" }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "right", color: "#475569" }}>
                      ₹{item.price}
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 600, color: "#0f172a" }}>
                      ₹{item.price * item.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total Calculation */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
              <div style={{ width: "260px", background: "#f8fafc", padding: "14px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.88rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", color: "#475569" }}>
                  <span>Product Subtotal:</span>
                  <span>₹{order.subtotal}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", color: "#059669" }}>
                  <span>Delivery Charges:</span>
                  <span>FREE</span>
                </div>
                {isCOD && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", color: "#b45309" }}>
                    <span>COD Distance Fee:</span>
                    <span>+₹{order.codCharge}</span>
                  </div>
                )}
                <div style={{ borderTop: "2px solid #cbd5e1", marginTop: "8px", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.1rem", color: "#0f172a" }}>
                  <span>Total Paid:</span>
                  <span style={{ color: "#4f46e5" }}>₹{order.total}</span>
                </div>
              </div>
            </div>

            {/* Footer Seal & Notes */}
            <div
              style={{
                borderTop: "1px dashed #cbd5e1",
                paddingTop: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                fontSize: "0.78rem",
                color: "#64748b",
              }}
            >
              <div>
                <p style={{ margin: "0 0 2px" }}>Thank you for shopping with <strong>PrintStyle</strong>!</p>
                <p style={{ margin: 0 }}>This is a computer-generated tax invoice and requires no physical signature.</p>
              </div>

              {isPaid && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    background: "#ecfdf5",
                    color: "#059669",
                    fontWeight: 700,
                    border: "1px solid #a7f3d0",
                  }}
                >
                  <ShieldCheck size={16} /> VERIFIED GATEWAY PAYMENT
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none;
            border: none;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </AnimatePresence>
  );
}
