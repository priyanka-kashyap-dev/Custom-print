"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext, PaymentMethod, ShippingAddress } from "@/context/AppContext";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import {
  Trash2,
  ArrowRight,
  ShoppingBag,
  QrCode,
  CreditCard,
  Banknote,
  ShieldCheck,
  MapPin,
  Truck,
  CheckCircle,
  AlertCircle,
  Loader2,
  Lock,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      setTimeout(() => resolve(Boolean(window.Razorpay)), 1200);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CartPage() {
  const router = useRouter();
  const { cart, removeFromCart, clearCart, cartTotal, user, savedAddress, setSavedAddress } =
    useAppContext();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");

  // Shipping Address Form State
  const [address, setAddress] = useState<ShippingAddress>(() => ({
    fullName: savedAddress.fullName || user?.name || "",
    phone: savedAddress.phone || "",
    addressLine1: savedAddress.addressLine1 || "",
    addressLine2: savedAddress.addressLine2 || "",
    city: savedAddress.city || "New Delhi",
    state: savedAddress.state || "Delhi",
    postalCode: savedAddress.postalCode || "110001",
    country: "India",
  }));

  // Distance & COD Calculation State
  const [distanceKm, setDistanceKm] = useState<number>(12);
  const [durationText, setDurationText] = useState<string>("Same Day / Next Day");
  const [codCharge, setCodCharge] = useState<number>(80);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [distanceCalculated, setDistanceCalculated] = useState(true);

  // Processing & UI States
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync user info into address once logged in
  useEffect(() => {
    if (user?.name && !address.fullName) {
      setAddress((prev) => ({ ...prev, fullName: user.name }));
    }
  }, [user, address.fullName]);

  // Recalculate delivery distance whenever address changes
  const calculateDistance = useCallback(async (addr: ShippingAddress) => {
    if (!addr.city && !addr.postalCode) return;

    setIsCalculatingDistance(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/delivery/calculate-distance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressLine1: addr.addressLine1,
          addressLine2: addr.addressLine2,
          city: addr.city,
          state: addr.state,
          postalCode: addr.postalCode,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDistanceKm(data.distanceKm || 12);
        setDurationText(data.durationText || "1-2 Business Days");
        // Rule: <= 25 KM => ₹80, > 25 KM => ₹300
        setCodCharge(data.codCharge || (data.distanceKm <= 25 ? 80 : 300));
        setDistanceCalculated(true);
      }
    } catch (err) {
      console.warn("Distance calculation fallback used:", err);
    } finally {
      setIsCalculatingDistance(false);
    }
  }, []);

  // Debounced address calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (address.postalCode || address.city) {
        calculateDistance(address);
        setSavedAddress(address);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [address.postalCode, address.city, address.state, address.addressLine1, calculateDistance, setSavedAddress, address]);

  // Price breakdown calculations
  const productSubtotal = cartTotal;
  const deliveryCharges = 0; // Free delivery offer
  const activeCodCharge = paymentMethod === "COD" ? codCharge : 0;
  const finalPayableTotal = productSubtotal + activeCodCharge;

  // Dynamic UPI Intent URI for QR code
  const upiMerchantVpa = "payment@printstyle";
  const upiMerchantName = "PrintStyle Store";
  const upiQrUri = `upi://pay?pa=${encodeURIComponent(upiMerchantVpa)}&pn=${encodeURIComponent(
    upiMerchantName
  )}&am=${finalPayableTotal}&cu=INR&tn=Order%20Payment`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    upiQrUri
  )}&margin=8`;

  // Place Order Handler
  const handleCheckout = async () => {
    if (!user) {
      setErrorMessage("Please sign in with your account to complete your order.");
      router.push("/login?redirect=/cart");
      return;
    }

    if (!address.fullName?.trim() || !address.phone?.trim() || !address.addressLine1?.trim()) {
      setErrorMessage("Please complete your full name, phone number, and delivery street address.");
      window.scrollTo({ top: 300, behavior: "smooth" });
      return;
    }

    if (cart.length === 0) {
      setErrorMessage("Your cart is empty. Please add items to checkout.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Create order on backend
      const createRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          paymentMethod,
          shippingAddress: address,
        }),
      });

      const createData = await createRes.json();

      if (!createRes.ok || !createData.success) {
        throw new Error(createData.error || "Failed to create order on server.");
      }

      // Handle Cash on Delivery (COD) flow
      if (paymentMethod === "COD") {
        clearCart();
        router.push(`/order-confirmation?orderId=${createData.orderId}`);
        return;
      }

      // Handle Prepaid flow (UPI / Card via Razorpay)
      const options = {
        key: createData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
        amount: createData.amount,
        currency: "INR",
        name: "PrintStyle Store",
        description: `Order #${createData.orderId}`,
        order_id: createData.razorpayOrderId.startsWith("rzp_order_")
          ? undefined
          : createData.razorpayOrderId,
        image: "/images/products/tshirt.jpg",
        prefill: {
          name: createData.customer?.name || address.fullName,
          email: createData.customer?.email || user.email,
          contact: createData.customer?.phone || address.phone,
          method: paymentMethod === "UPI" ? "upi" : "card",
        },
        theme: {
          color: "#4f46e5",
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: async function (response: any) {
          // Cryptographic backend verification - NEVER trust frontend alone!
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: createData.orderId,
                razorpayOrderId: response.razorpay_order_id || createData.razorpayOrderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              clearCart();
              router.push(`/order-confirmation?orderId=${createData.orderId}`);
            } else {
              setErrorMessage(
                verifyData.error ||
                  "Payment signature verification failed. Please contact support if amount was debited."
              );
              setIsProcessing(false);
            }
          } catch (verifyErr) {
            setErrorMessage(
              verifyErr instanceof Error
                ? verifyErr.message
                : "Failed to communicate with verification server."
            );
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            setErrorMessage("Payment was cancelled or closed. You can retry anytime.");
          },
        },
      };

      const isRzpLoaded = await loadRazorpayScript();
      if (!isRzpLoaded && typeof window.Razorpay === "undefined") {
        throw new Error("Razorpay checkout SDK could not load. Please check your internet connection.");
      }

      const rzpInstance = new window.Razorpay(options);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rzpInstance.on("payment.failed", function (failResponse: any) {
        setIsProcessing(false);
        setErrorMessage(
          failResponse.error?.description || "Payment failed. Please try a different card or UPI ID."
        );
      });
      rzpInstance.open();
    } catch (err) {
      console.error("Checkout error:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred during checkout."
      );
      setIsProcessing(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingTop: "80px" }}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Navbar />

      <div className="container" style={{ flex: 1, padding: "clamp(20px, 4vw, 40px) 16px" }}>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)", marginBottom: "1.5rem", color: "var(--primary-color)" }}
        >
          Your Cart & Checkout
        </motion.h1>

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: "1rem 1.25rem",
              borderRadius: "12px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#dc2626",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              fontSize: "0.95rem",
            }}
          >
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {cart.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: "center", padding: "4rem 0" }}
          >
            <ShoppingBag size={64} color="var(--border-color)" style={{ margin: "0 auto 1rem" }} />
            <h2>Your cart is empty</h2>
            <p style={{ color: "var(--text-light)", marginBottom: "2rem" }}>
              Looks like you haven&apos;t added any custom products yet.
            </p>
            <Link
              href="/#products"
              style={{
                background: "var(--primary-color)",
                color: "white",
                padding: "12px 24px",
                borderRadius: "var(--border-radius-lg)",
                fontWeight: 600,
                display: "inline-block",
              }}
            >
              Start Shopping
            </Link>
          </motion.div>
        ) : (
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "flex-start" }}>
            {/* Left Column: Cart Items + Shipping Address + Payment Method */}
            <div style={{ flex: "1 1 520px", minWidth: 0 }}>
              {/* Item List */}
              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShoppingBag size={20} color="var(--primary-color)" /> Selected Items ({cart.length})
                </h3>
                {cart.map((item, index) => (
                  <motion.div
                    key={`${item.id}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "clamp(12px, 3vw, 16px)",
                      borderRadius: "14px",
                      marginBottom: "0.75rem",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "10px",
                        overflow: "hidden",
                        position: "relative",
                        flexShrink: 0,
                        border: "1px solid var(--border-color)",
                        backgroundColor: item.imageColor || "#f1f5f9",
                      }}
                    >
                      <Image
                        src={item.image || "/images/products/tshirt.jpg"}
                        alt={item.title}
                        fill
                        style={{ objectFit: "cover" }}
                        unoptimized
                      />
                    </div>
                    <div style={{ flex: "1 1 180px", minWidth: "140px" }}>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 4px" }}>{item.title}</h4>
                      {item.customDesign?.text && (
                        <p style={{ fontSize: "0.8rem", color: "var(--primary-color)", margin: "0 0 2px" }}>
                          Custom Text: &quot;{item.customDesign.text}&quot;
                        </p>
                      )}
                      <p style={{ color: "var(--text-light)", fontSize: "0.85rem", margin: 0 }}>
                        Qty: {item.quantity} × ₹{item.price}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", marginLeft: "auto" }}>
                      <p style={{ fontWeight: 700, fontSize: "1.05rem", margin: "0 0 4px", color: "var(--text-color)" }}>
                        ₹{item.price * item.quantity}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        style={{
                          color: "var(--error-color)",
                          background: "transparent",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "0.8rem",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Delivery Address Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass"
                style={{
                  padding: "clamp(1.25rem, 3vw, 1.75rem)",
                  borderRadius: "16px",
                  marginBottom: "2rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <MapPin color="var(--primary-color)" size={22} />
                    <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Delivery Address</h2>
                  </div>
                  {isCalculatingDistance && (
                    <span style={{ fontSize: "0.85rem", color: "var(--primary-color)", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Loader2 size={14} className="spin" /> Calculating distance...
                    </span>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Receiver's name"
                      value={address.fullName || ""}
                      onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                        background: "var(--background-color)",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={address.phone || ""}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                        background: "var(--background-color)",
                      }}
                    />
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                      Street Address & House / Flat No. *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Flat 402, Sunshine Heights, Main Market Road"
                      value={address.addressLine1 || ""}
                      onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                        background: "var(--background-color)",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                      City *
                    </label>
                    <input
                      type="text"
                      placeholder="City (e.g. New Delhi, Noida)"
                      value={address.city || ""}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                        background: "var(--background-color)",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                      State *
                    </label>
                    <input
                      type="text"
                      placeholder="State (e.g. Delhi, UP, Karnataka)"
                      value={address.state || ""}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                        background: "var(--background-color)",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="6-digit postal code"
                      value={address.postalCode || ""}
                      onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                        background: "var(--background-color)",
                      }}
                    />
                  </div>
                </div>

                {/* Distance & Delivery Notice */}
                {distanceCalculated && (
                  <div
                    style={{
                      marginTop: "1.25rem",
                      padding: "0.75rem 1rem",
                      borderRadius: "10px",
                      background: "rgba(79, 70, 229, 0.06)",
                      border: "1px solid rgba(79, 70, 229, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "0.85rem",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Truck size={16} color="var(--primary-color)" />
                      <span>
                        Calculated Delivery Distance: <strong>{distanceKm} KM</strong> from Store
                      </span>
                    </div>
                    <span style={{ color: "var(--text-light)" }}>Estimated: {durationText}</span>
                  </div>
                )}
              </motion.div>

              {/* Payment Methods Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass"
                style={{
                  padding: "clamp(1.25rem, 3vw, 1.75rem)",
                  borderRadius: "16px",
                  marginBottom: "2rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                  <ShieldCheck color="var(--success-color)" size={24} />
                  <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Select Payment Method</h2>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {/* Option A: UPI / QR Code */}
                  <div
                    onClick={() => setPaymentMethod("UPI")}
                    style={{
                      border: `2px solid ${
                        paymentMethod === "UPI" ? "var(--primary-color)" : "var(--border-color)"
                      }`,
                      borderRadius: "12px",
                      padding: "1.25rem",
                      cursor: "pointer",
                      transition: "var(--transition)",
                      background: paymentMethod === "UPI" ? "rgba(79, 70, 229, 0.03)" : "transparent",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <input
                          type="radio"
                          name="paymentOption"
                          checked={paymentMethod === "UPI"}
                          onChange={() => setPaymentMethod("UPI")}
                        />
                        <QrCode size={24} color="var(--primary-color)" />
                        <div>
                          <span style={{ fontWeight: 700, fontSize: "1rem" }}>QR Code Payment (UPI)</span>
                          <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-light)" }}>
                            Google Pay, PhonePe, Paytm, or any UPI app • Instant Verification
                          </span>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background: "#ecfdf5",
                          color: "#059669",
                          padding: "4px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        ZERO EXTRA FEES
                      </span>
                    </div>

                    <AnimatePresence>
                      {paymentMethod === "UPI" && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: "hidden", marginTop: "1rem" }}
                        >
                          <div
                            style={{
                              background: "var(--background-color)",
                              padding: "1.5rem",
                              borderRadius: "12px",
                              textAlign: "center",
                              border: "1px solid var(--border-color)",
                            }}
                          >
                            <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--primary-color)", margin: "0 0 4px" }}>
                              Total Payable: ₹{finalPayableTotal}
                            </p>
                            <p style={{ fontSize: "0.85rem", color: "var(--text-light)", margin: "0 0 1rem" }}>
                              Scan this dynamic UPI QR code with any payment app to pay securely:
                            </p>

                            <div
                              style={{
                                width: "200px",
                                height: "200px",
                                background: "white",
                                margin: "0 auto 1rem",
                                padding: "10px",
                                borderRadius: "12px",
                                border: "2px solid var(--border-color)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                              }}
                            >
                              <Image
                                src={qrCodeImageUrl}
                                alt="UPI QR Code"
                                width={180}
                                height={180}
                                unoptimized
                              />
                            </div>

                            <div
                              style={{
                                display: "inline-block",
                                background: "rgba(79, 70, 229, 0.08)",
                                padding: "6px 14px",
                                borderRadius: "20px",
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                color: "var(--primary-color)",
                                marginBottom: "0.75rem",
                              }}
                            >
                              UPI ID: {upiMerchantVpa}
                            </div>

                            <p style={{ fontSize: "0.8rem", color: "var(--text-light)", margin: "0 0 12px" }}>
                              Supported apps: Google Pay • PhonePe • Paytm • BHIM • Cred • Amazon Pay
                            </p>

                            {/* Razorpay Test Mode Guide for UPI */}
                            <div
                              style={{
                                margin: "0 auto 14px",
                                maxWidth: "380px",
                                padding: "10px 14px",
                                borderRadius: "8px",
                                background: "rgba(59, 130, 246, 0.08)",
                                border: "1px solid rgba(59, 130, 246, 0.25)",
                                textAlign: "left",
                                fontSize: "0.82rem",
                                color: "#1e40af",
                              }}
                            >
                              <div style={{ fontWeight: 700, marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                                <span>🧪</span> How to Test UPI in Test Mode:
                              </div>
                              <ol style={{ margin: "4px 0 0", paddingLeft: "18px", lineHeight: "1.45" }}>
                                <li>Click <strong>&quot;Verify & Pay via UPI&quot;</strong> below to open Razorpay.</li>
                                <li>Choose <strong>UPI / QR</strong> in the payment popup.</li>
                                <li>Enter Test VPA: <code style={{ background: "rgba(59, 130, 246, 0.15)", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>success@razorpay</code></li>
                                <li>Click <strong>Pay</strong> &rarr; Click green <strong>&quot;Success&quot;</strong> button to complete.</li>
                              </ol>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCheckout();
                              }}
                              disabled={isProcessing}
                              style={{
                                width: "100%",
                                padding: "10px 16px",
                                background: "var(--primary-color)",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "8px",
                                fontWeight: 700,
                                fontSize: "0.9rem",
                                cursor: isProcessing ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                              }}
                            >
                              <QrCode size={16} /> Pay ₹{finalPayableTotal} via UPI App / Gateway
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Option B: Credit / Debit Card */}
                  <div
                    onClick={() => setPaymentMethod("Card")}
                    style={{
                      border: `2px solid ${
                        paymentMethod === "Card" ? "var(--primary-color)" : "var(--border-color)"
                      }`,
                      borderRadius: "12px",
                      padding: "1.25rem",
                      cursor: "pointer",
                      transition: "var(--transition)",
                      background: paymentMethod === "Card" ? "rgba(79, 70, 229, 0.03)" : "transparent",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <input
                          type="radio"
                          name="paymentOption"
                          checked={paymentMethod === "Card"}
                          onChange={() => setPaymentMethod("Card")}
                        />
                        <CreditCard size={24} color="var(--primary-color)" />
                        <div>
                          <span style={{ fontWeight: 700, fontSize: "1rem" }}>Credit / Debit Card</span>
                          <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-light)" }}>
                            Visa, Mastercard, RuPay, Maestro • 256-bit SSL Gateway Encrypted
                          </span>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background: "#ecfdf5",
                          color: "#059669",
                          padding: "4px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        SECURE PCI-DSS
                      </span>
                    </div>

                    <AnimatePresence>
                      {paymentMethod === "Card" && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: "hidden", marginTop: "1rem" }}
                        >
                          <div
                            style={{
                              background: "var(--background-color)",
                              padding: "1.25rem",
                              borderRadius: "12px",
                              border: "1px solid var(--border-color)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", color: "var(--primary-color)", fontWeight: 700 }}>
                              <CreditCard size={18} />
                              <span>How Card & OTP Payment Works:</span>
                            </div>

                            <p style={{ fontSize: "0.85rem", color: "var(--text-light)", lineHeight: 1.6, margin: "0 0 12px" }}>
                              Under <strong>RBI & PCI-DSS banking regulations</strong>, e-commerce websites must never capture raw card numbers or CVV directly in browser textboxes. Instead, clicking the button below opens the bank-certified, 256-bit encrypted Razorpay window:
                            </p>

                            {/* 3 Steps Visual Guide */}
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                                gap: "8px",
                                marginBottom: "14px",
                              }}
                            >
                              <div style={{ background: "var(--surface-color)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "0.8rem" }}>
                                <strong style={{ color: "var(--primary-color)", display: "block" }}>Step 1: Gateway Popup</strong>
                                Opens official 256-bit encrypted modal
                              </div>
                              <div style={{ background: "var(--surface-color)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "0.8rem" }}>
                                <strong style={{ color: "var(--primary-color)", display: "block" }}>Step 2: Domestic Card</strong>
                                Test: 4100 2800 0000 1007
                              </div>
                              <div style={{ background: "var(--surface-color)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "0.8rem" }}>
                                <strong style={{ color: "var(--primary-color)", display: "block" }}>Step 3: Bank OTP</strong>
                                3D-Secure (Test OTP: 1234)
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCheckout();
                              }}
                              disabled={isProcessing}
                              style={{
                                width: "100%",
                                padding: "12px 18px",
                                background: "var(--primary-color)",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "8px",
                                fontWeight: 700,
                                fontSize: "0.95rem",
                                cursor: isProcessing ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
                              }}
                            >
                              {isProcessing ? (
                                <>
                                  <Loader2 size={18} className="spin" /> Opening Secure Gateway...
                                </>
                              ) : (
                                <>
                                  <Lock size={16} /> Enter Card Number & Verify OTP (₹{finalPayableTotal})
                                </>
                              )}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Option C: Cash on Delivery (COD) */}
                  <div
                    onClick={() => setPaymentMethod("COD")}
                    style={{
                      border: `2px solid ${
                        paymentMethod === "COD" ? "var(--primary-color)" : "var(--border-color)"
                      }`,
                      borderRadius: "12px",
                      padding: "1.25rem",
                      cursor: "pointer",
                      transition: "var(--transition)",
                      background: paymentMethod === "COD" ? "rgba(79, 70, 229, 0.03)" : "transparent",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <input
                          type="radio"
                          name="paymentOption"
                          checked={paymentMethod === "COD"}
                          onChange={() => setPaymentMethod("COD")}
                        />
                        <Banknote size={24} color="var(--primary-color)" />
                        <div>
                          <span style={{ fontWeight: 700, fontSize: "1rem" }}>Cash on Delivery (COD)</span>
                          <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-light)" }}>
                            Pay in cash when your parcel is delivered at your doorstep
                          </span>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background: "#fffbeb",
                          color: "#b45309",
                          padding: "4px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        +₹{codCharge} COD FEE
                      </span>
                    </div>

                    <AnimatePresence>
                      {paymentMethod === "COD" && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: "hidden", marginTop: "1rem" }}
                        >
                          <div
                            style={{
                              background: "var(--background-color)",
                              padding: "1rem 1.25rem",
                              borderRadius: "10px",
                              border: "1px solid var(--border-color)",
                              fontSize: "0.85rem",
                            }}
                          >
                            <p style={{ margin: "0 0 6px", fontWeight: 600 }}>
                              Distance-based COD surcharge breakdown:
                            </p>
                            <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "var(--text-light)", lineHeight: 1.6 }}>
                              <li>0 – 25 KM distance: <strong>₹80</strong> extra</li>
                              <li>Above 25 KM distance: <strong>₹300</strong> extra</li>
                            </ul>
                            <p style={{ margin: "8px 0 0", color: "var(--primary-color)", fontWeight: 600 }}>
                              Your calculated distance: {distanceKm} KM → Applicable COD fee: ₹{codCharge}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column: Dynamic Price Breakdown & Pay Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass"
              style={{
                flex: "1 1 320px",
                minWidth: "280px",
                padding: "clamp(1.25rem, 3vw, 2rem)",
                borderRadius: "16px",
                position: "sticky",
                top: "100px",
              }}
            >
              <h2 style={{ marginBottom: "1.25rem", fontSize: "1.3rem" }}>Checkout Price Breakdown</h2>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.85rem", fontSize: "0.95rem" }}>
                <span style={{ color: "var(--text-light)" }}>Product Subtotal ({cart.length} items)</span>
                <span style={{ fontWeight: 600 }}>₹{productSubtotal}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.85rem", fontSize: "0.95rem" }}>
                <span style={{ color: "var(--text-light)" }}>Custom Printing Charges</span>
                <span style={{ color: "var(--success-color)", fontWeight: 600 }}>Included</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.85rem", fontSize: "0.95rem" }}>
                <span style={{ color: "var(--text-light)" }}>Standard Delivery Charges</span>
                <span style={{ color: "var(--success-color)", fontWeight: 600 }}>FREE</span>
              </div>

              {paymentMethod === "COD" ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.85rem",
                    fontSize: "0.95rem",
                    color: "#b45309",
                    fontWeight: 600,
                  }}
                >
                  <span>COD Extra Charge ({distanceKm} KM)</span>
                  <span>+₹{codCharge}</span>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.85rem",
                    fontSize: "0.85rem",
                    color: "var(--success-color)",
                  }}
                >
                  <span>Prepaid Discount</span>
                  <span>No COD Surcharge</span>
                </div>
              )}

              <div style={{ borderBottom: "1px dashed var(--border-color)", margin: "1.25rem 0" }} />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "1.75rem",
                  fontSize: "1.35rem",
                  fontWeight: 800,
                  color: "var(--text-color)",
                }}
              >
                <span>Final Payable</span>
                <span style={{ color: "var(--primary-color)" }}>₹{finalPayableTotal}</span>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={isProcessing}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.6rem",
                  width: "100%",
                  padding: "1rem",
                  background: isProcessing
                    ? "#94a3b8"
                    : "linear-gradient(135deg, var(--secondary-color), var(--primary-color))",
                  color: "white",
                  borderRadius: "var(--border-radius-lg)",
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  border: "none",
                  cursor: isProcessing ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
                  transition: "var(--transition)",
                }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={20} className="spin" />
                    <span>Processing Secure Payment...</span>
                  </>
                ) : paymentMethod === "COD" ? (
                  <>
                    <span>Place Cash on Delivery Order</span>
                    <ArrowRight size={20} />
                  </>
                ) : paymentMethod === "UPI" ? (
                  <>
                    <span>Verify & Pay ₹{finalPayableTotal} via UPI</span>
                    <ArrowRight size={20} />
                  </>
                ) : (
                  <>
                    <span>Pay ₹{finalPayableTotal} by Card</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              <div
                style={{
                  marginTop: "1.25rem",
                  textAlign: "center",
                  fontSize: "0.8rem",
                  color: "var(--text-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <ShieldCheck size={16} color="var(--success-color)" />
                <span>100% Secure Checkout • Verified Payment Gateway</span>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
