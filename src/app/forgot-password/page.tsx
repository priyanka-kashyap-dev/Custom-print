"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowLeft, ArrowRight, AlertCircle, CheckCircle, ShieldAlert } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setResetUrl(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Explicitly handle "user not registered"
        if (res.status === 404 || data.code === "USER_NOT_REGISTERED") {
          setError(data.error || "User is not registered with this email address.");
        } else {
          setError(data.error || "Failed to process request. Please try again.");
        }
        return;
      }

      setSuccess("Account found! Redirecting to password reset page...");
      setResetUrl(data.resetUrl || `/reset-password?token=${data.resetToken}`);

      // Smoothly redirect to the reset password page as requested
      setTimeout(() => {
        router.push(data.resetUrl || `/reset-password?token=${data.resetToken}`);
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
          padding: "clamp(20px, 4vw, 40px) 16px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass"
          style={{
            maxWidth: "460px",
            width: "100%",
            padding: "clamp(1.5rem, 5vw, 2.5rem) clamp(1.1rem, 4vw, 2rem)",
            borderRadius: "var(--border-radius-lg)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "rgba(79, 70, 229, 0.1)",
                color: "var(--primary-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
              }}
            >
              <Mail size={28} />
            </div>
            <h1
              style={{
                fontSize: "1.85rem",
                marginBottom: "0.5rem",
                fontFamily: "var(--font-heading)",
              }}
            >
              Forgot Password
            </h1>
            <p style={{ color: "var(--text-light)", fontSize: "0.95rem" }}>
              Enter your registered email address and we will verify your account to reset your password.
            </p>
          </div>

          {/* Error Message - Highlights when user is not registered */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid var(--error-color)",
                color: "var(--error-color)",
                padding: "14px 16px",
                borderRadius: "10px",
                fontSize: "0.9rem",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
              }}
            >
              <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong style={{ display: "block", marginBottom: "2px" }}>{error}</strong>
                {error.toLowerCase().includes("not registered") && (
                  <span style={{ fontSize: "0.85rem", opacity: 0.9 }}>
                    Don&apos;t have an account yet?{" "}
                    <Link
                      href="/login?tab=signup"
                      style={{ color: "var(--primary-color)", fontWeight: 600, textDecoration: "underline" }}
                    >
                      Sign Up Here
                    </Link>
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid var(--success-color)",
                color: "var(--success-color)",
                padding: "14px 16px",
                borderRadius: "10px",
                fontSize: "0.9rem",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <CheckCircle size={20} style={{ flexShrink: 0 }} />
              <div>
                <div>{success}</div>
                {resetUrl && (
                  <Link
                    href={resetUrl}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      marginTop: "6px",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "var(--primary-color)",
                    }}
                  >
                    Click here if not redirected automatically <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label
                htmlFor="forgot-email"
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  marginBottom: "0.5rem",
                }}
              >
                Registered Email Address
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 42px",
                    borderRadius: "var(--border-radius)",
                    border: "1px solid var(--border-color)",
                    background: "var(--background-color)",
                    color: "var(--text-color)",
                    fontSize: "0.95rem",
                  }}
                />
                <Mail
                  size={18}
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-light)",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "var(--border-radius)",
                background: "var(--primary-color)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "1rem",
                border: "none",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1,
                transition: "var(--transition)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "0.5rem",
              }}
            >
              {isLoading ? "Verifying Email..." : "Get Reset Link"}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "1.75rem" }}>
            <Link
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.9rem",
                color: "var(--text-light)",
                transition: "var(--transition)",
              }}
            >
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </div>
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}
