"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext, PaymentMethod } from "@/context/AppContext";
import Link from "next/link";
import { Trash2, ArrowRight, ShoppingBag, QrCode, CreditCard, Banknote, ShieldCheck, Upload } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CartPage() {
  const { cart, removeFromCart, cartTotal, placeOrder, adminSettings } = useAppContext();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [upiUtr, setUpiUtr] = useState("");

  const total = paymentMethod === "COD" ? cartTotal + adminSettings.codCharge : cartTotal;

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingTop: "80px" }}>
      <Navbar />
      
      <div className="container" style={{ flex: 1, padding: "40px 24px" }}>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: "2.5rem", marginBottom: "2rem", color: "var(--primary-color)" }}
        >
          Your Cart
        </motion.h1>

        {cart.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: "center", padding: "4rem 0" }}
          >
            <ShoppingBag size={64} color="var(--border-color)" style={{ margin: "0 auto 1rem" }} />
            <h2>Your cart is empty</h2>
            <p style={{ color: "var(--text-light)", marginBottom: "2rem" }}>Looks like you haven't added any custom products yet.</p>
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
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 60%" }}>
              {cart.map((item, index) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "1.5rem",
                    borderRadius: "var(--border-radius)",
                    marginBottom: "1rem",
                    gap: "1.5rem"
                  }}
                >
                  <div style={{ 
                    width: "80px", 
                    height: "80px", 
                    backgroundColor: item.imageColor,
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    🎨
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>{item.title}</h3>
                    <p style={{ color: "var(--text-light)", fontSize: "0.9rem" }}>Quantity: {item.quantity}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontWeight: 600, fontSize: "1.2rem", marginBottom: "0.5rem" }}>${item.price * item.quantity}</p>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      style={{ color: "var(--error-color)", background: "transparent", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                </motion.div>
              ))}

              {/* Payment Section */}
              <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass"
                  style={{
                    padding: "2rem",
                    borderRadius: "var(--border-radius)",
                    marginTop: "2rem"
                  }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                  <ShieldCheck color="var(--success-color)" size={24} />
                  <h2>Secure Payment</h2>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {/* UPI Option */}
                  <div 
                    onClick={() => setPaymentMethod("UPI")}
                    style={{
                      border: `2px solid ${paymentMethod === "UPI" ? "var(--primary-color)" : "var(--border-color)"}`,
                      borderRadius: "8px",
                      padding: "1rem",
                      cursor: "pointer",
                      transition: "var(--transition)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <input type="radio" checked={paymentMethod === "UPI"} readOnly />
                      <QrCode size={24} />
                      <span style={{ fontWeight: 600 }}>UPI / QR Code</span>
                    </div>
                    
                    <AnimatePresence>
                      {paymentMethod === "UPI" && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: "hidden", marginTop: "1rem" }}
                        >
                          <div style={{ background: "var(--background-color)", padding: "1.5rem", borderRadius: "8px", textAlign: "center" }}>
                            <div style={{ width: "150px", height: "150px", background: "white", margin: "0 auto 1rem", border: "1px dashed var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <QrCode size={64} color="var(--text-light)" />
                            </div>
                            <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>UPI ID: payment@printstyle</p>
                            <p style={{ color: "var(--text-light)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Scan & Pay using Google Pay, PhonePe, Paytm, or BHIM.</p>
                            
                            <div style={{ textAlign: "left" }}>
                              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 500 }}>Upload Payment Screenshot</label>
                              <div style={{ border: "1px dashed var(--border-color)", padding: "1rem", borderRadius: "8px", display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", marginBottom: "1rem" }}>
                                <Upload size={18} /> Choose file...
                              </div>
                              
                              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 500 }}>UTR / Transaction ID</label>
                              <input 
                                type="text" 
                                value={upiUtr}
                                onChange={(e) => setUpiUtr(e.target.value)}
                                placeholder="Enter 12-digit UTR"
                                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "white" }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Card Option */}
                  <div 
                    onClick={() => setPaymentMethod("Card")}
                    style={{
                      border: `2px solid ${paymentMethod === "Card" ? "var(--primary-color)" : "var(--border-color)"}`,
                      borderRadius: "8px",
                      padding: "1rem",
                      cursor: "pointer",
                      transition: "var(--transition)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <input type="radio" checked={paymentMethod === "Card"} readOnly />
                      <CreditCard size={24} />
                      <span style={{ fontWeight: 600 }}>Credit / Debit Card</span>
                    </div>
                  </div>

                  {/* COD Option */}
                  <div 
                    onClick={() => setPaymentMethod("COD")}
                    style={{
                      border: `2px solid ${paymentMethod === "COD" ? "var(--primary-color)" : "var(--border-color)"}`,
                      borderRadius: "8px",
                      padding: "1rem",
                      cursor: "pointer",
                      transition: "var(--transition)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <input type="radio" checked={paymentMethod === "COD"} readOnly />
                      <Banknote size={24} />
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 600 }}>Cash on Delivery</span>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-light)" }}>Additional ₹{adminSettings.codCharge} charge applies</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass"
              style={{
                flex: "1 1 30%",
                padding: "2rem",
                borderRadius: "var(--border-radius)",
                height: "fit-content",
                position: "sticky",
                top: "100px"
              }}
            >
              <h2 style={{ marginBottom: "1.5rem" }}>Order Summary</h2>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                <span style={{ color: "var(--text-light)" }}>Subtotal</span>
                <span>${cartTotal}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                <span style={{ color: "var(--text-light)" }}>Shipping</span>
                <span>Free</span>
              </div>

              {paymentMethod === "COD" && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", color: "var(--primary-color)" }}>
                  <span>COD Charge</span>
                  <span>${adminSettings.codCharge}</span>
                </div>
              )}

              <div style={{ borderBottom: "1px solid var(--border-color)", marginBottom: "1.5rem" }} />

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem", fontSize: "1.2rem", fontWeight: 700 }}>
                <span>Total</span>
                <span>${total}</span>
              </div>

              <Link 
                href="/orders" 
                onClick={(e) => {
                  if (paymentMethod === "UPI" && upiUtr.length < 5) {
                    e.preventDefault();
                    alert("Please enter a valid UTR / Transaction ID for verification.");
                    return;
                  }
                  placeOrder(paymentMethod, paymentMethod === "UPI" ? upiUtr : undefined);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  width: "100%",
                  padding: "1rem",
                  background: "linear-gradient(135deg, var(--secondary-color), var(--primary-color))",
                  color: "white",
                  borderRadius: "var(--border-radius-lg)",
                  fontWeight: 600,
                  fontSize: "1.1rem"
                }}
              >
                Checkout <ArrowRight size={20} />
              </Link>
            </motion.div>
          </div>
        )}
      </div>
      
      <Footer />
    </main>
  );
}
