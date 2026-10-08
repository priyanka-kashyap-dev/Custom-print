"use client";

import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import Link from "next/link";
import { Package, Clock, Printer, Truck, CheckCircle, CreditCard, QrCode, Banknote, FileCheck2, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { OrderStatus, PaymentStatus } from "@/context/AppContext";

export default function OrdersPage() {
  const { user, orders } = useAppContext();

  if (!user) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingTop: "80px" }}>
        <Navbar />
        <div className="container" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <h2>Please login to view your orders</h2>
        </div>
        <Footer />
      </main>
    );
  }

  const getStatusIndex = (status: OrderStatus) => {
    const statuses: OrderStatus[] = ["Payment Verification Failed", "Order Placed", "Processing", "Printed", "Shipped", "Delivered"];
    return Math.max(0, statuses.indexOf(status) - 1); // Offset by 1 to ignore the Failed state for the happy path timeline
  };

  const statusIcons = {
    "Order Placed": <Package size={20} />,
    "Processing": <Clock size={20} />,
    "Printed": <Printer size={20} />,
    "Shipped": <Truck size={20} />,
    "Delivered": <CheckCircle size={20} />
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch(status) {
      case "Paid":
      case "COD Collected":
        return "var(--success-color)";
      case "Failed":
      case "Refunded":
        return "var(--error-color)";
      default:
        return "var(--primary-color)";
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingTop: "80px" }}>
      <Navbar />
      
      <div className="container" style={{ flex: 1, padding: "40px 24px" }}>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: "2.5rem", marginBottom: "2rem", color: "var(--primary-color)" }}
        >
          My Orders
        </motion.h1>

        {orders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: "center", padding: "4rem 0" }}
          >
            <Package size={64} color="var(--border-color)" style={{ margin: "0 auto 1rem" }} />
            <h2>No orders yet</h2>
            <p style={{ color: "var(--text-light)", marginBottom: "2rem" }}>You haven't placed any orders with us.</p>
            <Link href="/#products" style={{
              background: "var(--primary-color)",
              color: "white",
              padding: "12px 24px",
              borderRadius: "var(--border-radius-lg)",
              fontWeight: 600,
              display: "inline-block"
            }}>
              Start Shopping
            </Link>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {orders.map((order, index) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass"
                style={{
                  padding: "2rem",
                  borderRadius: "var(--border-radius)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>Order #{order.id}</h3>
                    <p style={{ color: "var(--text-light)", fontSize: "0.9rem" }}>
                      Placed on {new Date(order.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontWeight: 600, fontSize: "1.2rem", color: "var(--primary-color)" }}>${order.total}</p>
                    <p style={{ color: "var(--text-light)", fontSize: "0.9rem" }}>{order.items.length} item(s)</p>
                  </div>
                </div>

                {/* Payment Information */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", background: "var(--background-color)", padding: "1.5rem", borderRadius: "8px", marginBottom: "2rem", border: "1px solid var(--border-color)" }}>
                  <div style={{ flex: "1 1 200px" }}>
                    <p style={{ color: "var(--text-light)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>Payment Method</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600 }}>
                      {order.paymentMethod === "UPI" && <QrCode size={18} />}
                      {order.paymentMethod === "Card" && <CreditCard size={18} />}
                      {order.paymentMethod === "COD" && <Banknote size={18} />}
                      {order.paymentMethod === "UPI" ? "UPI / QR Code" : order.paymentMethod === "Card" ? "Credit / Debit Card" : "Cash on Delivery"}
                    </div>
                  </div>
                  
                  <div style={{ flex: "1 1 200px" }}>
                    <p style={{ color: "var(--text-light)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>Payment Status</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, color: getPaymentStatusColor(order.paymentStatus) }}>
                      {order.paymentStatus === "Paid" && <CheckCircle size={18} />}
                      {order.paymentStatus === "Verification Pending" && <Clock size={18} />}
                      {order.paymentStatus === "Failed" && <AlertCircle size={18} />}
                      {order.paymentStatus}
                    </div>
                  </div>

                  <div style={{ flex: "1 1 200px" }}>
                    <p style={{ color: "var(--text-light)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>Transaction ID</p>
                    <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <FileCheck2 size={18} /> {order.transactionId || "N/A"}
                    </div>
                  </div>

                  {order.paymentMethod === "COD" && (
                    <div style={{ flex: "1 1 200px" }}>
                      <p style={{ color: "var(--text-light)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>COD Charge</p>
                      <div style={{ fontWeight: 600, color: "var(--primary-color)" }}>
                        ${order.codCharge}
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress Timeline */}
                {order.status !== "Payment Verification Failed" && (
                  <div style={{ marginBottom: "2rem" }}>
                    <p style={{ fontWeight: 600, marginBottom: "1rem" }}>Order Status: <span style={{ color: "var(--primary-color)" }}>{order.status}</span></p>
                    
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
                      {/* Background line */}
                      <div style={{ position: "absolute", top: "20px", left: "0", right: "0", height: "4px", background: "var(--border-color)", zIndex: 1, borderRadius: "2px" }} />
                      
                      {/* Progress line */}
                      <div style={{ 
                        position: "absolute", 
                        top: "20px", 
                        left: "0", 
                        width: `${(getStatusIndex(order.status) / 4) * 100}%`, 
                        height: "4px", 
                        background: "var(--primary-color)", 
                        zIndex: 2, 
                        borderRadius: "2px",
                        transition: "width 1s ease-in-out"
                      }} />

                      {/* Status Nodes */}
                      {(["Order Placed", "Processing", "Printed", "Shipped", "Delivered"] as (Exclude<OrderStatus, "Payment Verification Failed">)[]).map((status, i) => {
                        const isCompleted = getStatusIndex(order.status) >= i;
                        const isActive = getStatusIndex(order.status) === i;
                        
                        return (
                          <div key={status} style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 3, gap: "0.5rem" }}>
                            <div style={{ 
                              width: "44px", 
                              height: "44px", 
                              borderRadius: "50%", 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center",
                              background: isCompleted ? "var(--primary-color)" : "white",
                              color: isCompleted ? "white" : "var(--text-light)",
                              border: `2px solid ${isCompleted ? "var(--primary-color)" : "var(--border-color)"}`,
                              boxShadow: isActive ? "0 0 0 4px rgba(214, 184, 176, 0.3)" : "none",
                              transition: "all 0.3s ease"
                            }}>
                              {statusIcons[status]}
                            </div>
                            <span style={{ fontSize: "0.8rem", fontWeight: isCompleted ? 600 : 400, color: isCompleted ? "var(--text-color)" : "var(--text-light)", textAlign: "center", maxWidth: "80px" }}>
                              {status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Items List */}
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
                  <h4 style={{ marginBottom: "1rem", fontSize: "1rem" }}>Items in this order</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                    {order.items.map(item => (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "1rem", background: "var(--background-color)", padding: "0.5rem 1rem", borderRadius: "8px" }}>
                        <div style={{ width: "30px", height: "30px", borderRadius: "4px", backgroundColor: item.imageColor }} />
                        <div>
                          <p style={{ fontWeight: 500, fontSize: "0.9rem" }}>{item.title}</p>
                          <p style={{ color: "var(--text-light)", fontSize: "0.8rem" }}>Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      <Footer />
    </main>
  );
}
