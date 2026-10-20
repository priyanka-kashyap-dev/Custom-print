"use client";

import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import Link from "next/link";
import Image from "next/image";
import { User as UserIcon, Mail, ShieldCheck, Package, ShoppingBag, LogOut, ArrowRight, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function AccountPage() {
  const { user, logout, orders } = useAppContext();

  if (!user) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          paddingTop: "80px",
          background: "var(--background-color)",
        }}
      >
        <Navbar />
        <div
          className="container"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 24px",
            textAlign: "center",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass"
            style={{
              maxWidth: "460px",
              width: "100%",
              padding: "3rem 2rem",
              borderRadius: "var(--border-radius-lg)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(79, 70, 229, 0.1)",
                color: "var(--primary-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem",
              }}
            >
              <UserIcon size={32} />
            </div>
            <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>My Account</h1>
            <p style={{ color: "var(--text-light)", marginBottom: "2rem", fontSize: "0.95rem" }}>
              Please sign in with your Google account to view your profile, manage your orders, and track deliveries.
            </p>
            <GoogleSignInButton redirectAfterLogin="/account" buttonText="signin_with" />
          </motion.div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        paddingTop: "80px",
        background: "var(--background-color)",
      }}
    >
      <Navbar />

      <div className="container" style={{ flex: 1, padding: "clamp(20px, 4vw, 40px) 16px", maxWidth: "900px" }}>
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass"
          style={{
            padding: "clamp(1.25rem, 4vw, 2.5rem)",
            borderRadius: "var(--border-radius-lg)",
            boxShadow: "var(--shadow-lg)",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1.25rem",
              borderBottom: "1px solid var(--border-color)",
              paddingBottom: "1.5rem",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              {/* Profile Avatar */}
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.name}
                  width={64}
                  height={64}
                  unoptimized
                  style={{
                    borderRadius: "50%",
                    boxShadow: "var(--shadow-md)",
                    border: "3px solid var(--primary-color)",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--primary-color), var(--secondary-color))",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.6rem",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div style={{ minWidth: 0 }}>
                <h1 style={{ fontSize: "clamp(1.35rem, 4vw, 1.75rem)", marginBottom: "0.25rem", wordBreak: "break-word" }}>
                  {user.name}
                </h1>
                <p
                  style={{
                    color: "var(--text-light)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.9rem",
                    wordBreak: "break-all",
                  }}
                >
                  <Mail size={16} style={{ flexShrink: 0 }} />
                  {user.email}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "transparent",
                border: "1px solid var(--border-color)",
                padding: "10px 18px",
                borderRadius: "8px",
                fontWeight: 600,
                color: "var(--text-color)",
                transition: "var(--transition)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "var(--error-color)";
                e.currentTarget.style.color = "var(--error-color)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.color = "var(--text-color)";
              }}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>

          {/* Account Details Badges */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.25rem",
            }}
          >
            <div
              style={{
                background: "var(--background-color)",
                padding: "1.25rem",
                borderRadius: "12px",
                border: "1px solid var(--border-color)",
              }}
            >
              <span style={{ fontSize: "0.85rem", color: "var(--text-light)", display: "block", marginBottom: "4px" }}>
                Full Name
              </span>
              <span style={{ fontWeight: 600, fontSize: "1rem", color: "var(--text-color)" }}>
                {user.name}
              </span>
            </div>

            <div
              style={{
                background: "var(--background-color)",
                padding: "1.25rem",
                borderRadius: "12px",
                border: "1px solid var(--border-color)",
              }}
            >
              <span style={{ fontSize: "0.85rem", color: "var(--text-light)", display: "block", marginBottom: "4px" }}>
                Email Address
              </span>
              <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-color)", wordBreak: "break-all" }}>
                {user.email}
              </span>
            </div>

            <div
              style={{
                background: "var(--background-color)",
                padding: "1.25rem",
                borderRadius: "12px",
                border: "1px solid var(--border-color)",
              }}
            >
              <span style={{ fontSize: "0.85rem", color: "var(--text-light)", display: "block", marginBottom: "4px" }}>
                Account Status
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: 600,
                  color: "var(--success-color)",
                  fontSize: "0.95rem",
                }}
              >
                <ShieldCheck size={18} /> Verified Google Account
              </span>
            </div>

            <div
              style={{
                background: "var(--background-color)",
                padding: "1.25rem",
                borderRadius: "12px",
                border: "1px solid var(--border-color)",
              }}
            >
              <span style={{ fontSize: "0.85rem", color: "var(--text-light)", display: "block", marginBottom: "4px" }}>
                Role & Permissions
              </span>
              <span style={{ fontWeight: 600, fontSize: "0.95rem", textTransform: "capitalize" }}>
                {user.role || "Customer"}
              </span>
            </div>

            <div
              style={{
                background: "var(--background-color)",
                padding: "1.25rem",
                borderRadius: "12px",
                border: "1px solid var(--border-color)",
              }}
            >
              <span style={{ fontSize: "0.85rem", color: "var(--text-light)", display: "block", marginBottom: "4px" }}>
                Total Orders Placed
              </span>
              <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{orders.length} order(s)</span>
            </div>
          </div>
        </motion.div>

        {/* Quick Links Section */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
          <Link
            href="/orders"
            className="glass"
            style={{
              padding: "1.75rem",
              borderRadius: "var(--border-radius)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transition: "var(--transition)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "rgba(79, 70, 229, 0.1)",
                  color: "var(--primary-color)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Package size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.1rem", marginBottom: "2px" }}>My Orders</h3>
                <p style={{ color: "var(--text-light)", fontSize: "0.85rem" }}>Track shipping & view past orders</p>
              </div>
            </div>
            <ArrowRight size={20} color="var(--primary-color)" />
          </Link>

          <Link
            href="/cart"
            className="glass"
            style={{
              padding: "1.75rem",
              borderRadius: "var(--border-radius)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transition: "var(--transition)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "rgba(139, 92, 246, 0.1)",
                  color: "var(--secondary-color)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShoppingBag size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.1rem", marginBottom: "2px" }}>My Cart</h3>
                <p style={{ color: "var(--text-light)", fontSize: "0.85rem" }}>Complete pending custom orders</p>
              </div>
            </div>
            <ArrowRight size={20} color="var(--secondary-color)" />
          </Link>

          <Link
            href="/#products"
            className="glass"
            style={{
              padding: "1.75rem",
              borderRadius: "var(--border-radius)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transition: "var(--transition)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "rgba(16, 185, 129, 0.1)",
                  color: "var(--success-color)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.1rem", marginBottom: "2px" }}>Custom Printing</h3>
                <p style={{ color: "var(--text-light)", fontSize: "0.85rem" }}>Explore new t-shirts & pillows</p>
              </div>
            </div>
            <ArrowRight size={20} color="var(--success-color)" />
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}
