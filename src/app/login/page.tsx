"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, LogIn, UserPlus, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function LoginPage() {
  const { user } = useAppContext();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // If already authenticated, redirect
  if (user) {
    router.push("/");
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    // Simulated email handler with informational note recommending Google Auth
    setTimeout(() => {
      setStatusMessage(
        isSignUp
          ? "For instant, passwordless security, please use the 'Continue with Google' button below!"
          : "Please use 'Continue with Google' for real-time authentication with database syncing."
      );
      setIsLoading(false);
    }, 800);
  };

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
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass"
          style={{
            maxWidth: "460px",
            width: "100%",
            padding: "2.5rem 2rem",
            borderRadius: "var(--border-radius-lg)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <h1
              style={{
                fontSize: "2rem",
                marginBottom: "0.5rem",
                fontFamily: "var(--font-heading)",
              }}
            >
              {isSignUp ? "Create an Account" : "Welcome Back"}
            </h1>
            <p style={{ color: "var(--text-light)", fontSize: "0.95rem" }}>
              {isSignUp
                ? "Sign up with Google to customize and track your orders"
                : "Sign in to manage your orders and custom designs"}
            </p>
          </div>

          {/* Quick Google Sign In */}
          <div style={{ marginBottom: "1.5rem" }}>
            <GoogleSignInButton
              redirectAfterLogin="/"
              buttonText={isSignUp ? "signup_with" : "continue_with"}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                marginTop: "0.75rem",
                fontSize: "0.8rem",
                color: "var(--text-light)",
              }}
            >
              <ShieldCheck size={14} color="var(--success-color)" />
              <span>Free, secure Google account authentication</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              margin: "1.5rem 0",
              color: "var(--text-light)",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }} />
            <span style={{ padding: "0 1rem", fontSize: "0.85rem", textTransform: "uppercase" }}>
              OR with email
            </span>
            <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }} />
          </div>

          {statusMessage && (
            <div
              style={{
                background: "rgba(79, 70, 229, 0.08)",
                border: "1px solid var(--primary-color)",
                color: "var(--primary-color)",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "0.85rem",
                marginBottom: "1.25rem",
                lineHeight: 1.4,
              }}
            >
              {statusMessage}
            </div>
          )}

          <form onSubmit={handleEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {isSignUp && (
              <div>
                <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 500, fontSize: "0.9rem" }}>
                  Full Name
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    required={isSignUp}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      outline: "none",
                      fontFamily: "inherit",
                      transition: "var(--transition)",
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 500, fontSize: "0.9rem" }}>
                Email Address
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Mail size={18} style={{ position: "absolute", left: "12px", color: "var(--text-light)" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{
                    width: "100%",
                    padding: "12px 12px 12px 40px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    outline: "none",
                    fontFamily: "inherit",
                    transition: "var(--transition)",
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <label style={{ fontWeight: 500, fontSize: "0.9rem" }}>Password</label>
                {!isSignUp && (
                  <Link href="#" style={{ fontSize: "0.8rem", color: "var(--primary-color)" }}>
                    Forgot Password?
                  </Link>
                )}
              </div>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Lock size={18} style={{ position: "absolute", left: "12px", color: "var(--text-light)" }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: "100%",
                    padding: "12px 12px 12px 40px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    outline: "none",
                    fontFamily: "inherit",
                    transition: "var(--transition)",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                background: "var(--primary-color)",
                color: "white",
                padding: "12px",
                borderRadius: "8px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                marginTop: "0.5rem",
                opacity: isLoading ? 0.7 : 1,
                cursor: "pointer",
                border: "none",
              }}
            >
              {isLoading ? (
                "Processing..."
              ) : isSignUp ? (
                <>
                  <UserPlus size={18} /> Create Account
                </>
              ) : (
                <>
                  <LogIn size={18} /> Sign In
                </>
              )}
            </button>
          </form>

          {/* Toggle between Login and Registration */}
          <div style={{ textAlign: "center", marginTop: "1.75rem", fontSize: "0.9rem", color: "var(--text-light)" }}>
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setStatusMessage(null);
                  }}
                  style={{
                    color: "var(--primary-color)",
                    fontWeight: 600,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setStatusMessage(null);
                  }}
                  style={{
                    color: "var(--primary-color)",
                    fontWeight: 600,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}
