"use client";

import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, CheckCircle, ShieldAlert, ArrowRight, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Missing reset token. Please request a new password reset link.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify your entries.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password.");
        return;
      }

      setSuccess("Password saved successfully! Redirecting to login page...");

      // Redirection to login after saving new password as requested
      setTimeout(() => {
        router.push("/login?reset=success");
      }, 1800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
          <Lock size={28} />
        </div>
        <h1
          style={{
            fontSize: "1.85rem",
            marginBottom: "0.5rem",
            fontFamily: "var(--font-heading)",
          }}
        >
          Reset Password
        </h1>
        <p style={{ color: "var(--text-light)", fontSize: "0.95rem" }}>
          Choose a new, secure password for your account.
        </p>
      </div>

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
            <strong style={{ display: "block" }}>{error}</strong>
            {error.includes("expired") && (
              <Link
                href="/forgot-password"
                style={{ color: "var(--primary-color)", fontSize: "0.85rem", textDecoration: "underline" }}
              >
                Request a new reset link
              </Link>
            )}
          </div>
        </motion.div>
      )}

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
            <strong>{success}</strong>
            <div style={{ fontSize: "0.82rem", opacity: 0.9, marginTop: "4px" }}>
              Taking you to the login screen now...
            </div>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div>
          <label
            htmlFor="new-password"
            style={{
              display: "block",
              fontSize: "0.9rem",
              fontWeight: 500,
              marginBottom: "0.5rem",
            }}
          >
            New Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
              style={{
                width: "100%",
                padding: "12px 42px 12px 42px",
                borderRadius: "var(--border-radius)",
                border: "1px solid var(--border-color)",
                background: "var(--background-color)",
                color: "var(--text-color)",
                fontSize: "0.95rem",
              }}
            />
            <Lock
              size={18}
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-light)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--text-light)",
                cursor: "pointer",
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            style={{
              display: "block",
              fontSize: "0.9rem",
              fontWeight: 500,
              marginBottom: "0.5rem",
            }}
          >
            Confirm New Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              minLength={6}
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
            <Lock
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
          disabled={isLoading || !token}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: "var(--border-radius)",
            background: "var(--primary-color)",
            color: "#fff",
            fontWeight: 600,
            fontSize: "1rem",
            border: "none",
            cursor: isLoading || !token ? "not-allowed" : "pointer",
            opacity: isLoading || !token ? 0.7 : 1,
            transition: "var(--transition)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginTop: "0.5rem",
          }}
        >
          {isLoading ? "Saving Password..." : "Save New Password"}
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
  );
}

export default function ResetPasswordPage() {
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
        <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Loading reset form...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>

      <Footer />
    </main>
  );
}
