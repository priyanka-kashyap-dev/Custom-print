"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, LogIn, UserPlus, ShieldCheck, AlertCircle, CheckCircle, ShieldAlert, Eye, EyeOff } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GoogleSignInButton from "@/components/GoogleSignInButton";

function LoginForm() {
  const { user, setUser } = useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Read initial query params
  useEffect(() => {
    if (searchParams.get("tab") === "signup") {
      setIsSignUp(true);
    }
    if (searchParams.get("reset") === "success") {
      setSuccessMessage("Password reset successfully! Please sign in with your new password.");
    }
  }, [searchParams]);

  // If already authenticated, smoothly navigate to /account
  useEffect(() => {
    if (user) {
      router.push("/account");
    }
  }, [user, router]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
      const payload = isSignUp ? { name, email, password } : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "USER_NOT_REGISTERED") {
          setErrorMessage("User is not registered. Please sign up or continue with Google.");
        } else {
          setErrorMessage(data.error || "Authentication failed. Please try again.");
        }
        return;
      }

      if (data.user) {
        setUser({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          photoURL: data.user.avatar || "",
          role: data.user.role || "customer",
        });
        router.push("/account");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Network error. Please try again.");
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
        padding: "clamp(1.5rem, 5vw, 2.5rem) clamp(1.1rem, 4vw, 2rem)",
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
            ? "Sign up with Google or Email to customize and track your orders"
            : "Sign in to manage your orders and custom designs"}
        </p>
      </div>

      {/* Quick Google Sign In */}
      <div style={{ marginBottom: "1.5rem" }}>
        <GoogleSignInButton
          redirectAfterLogin="/account"
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

      {/* Success Notification (e.g. after password reset) */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid var(--success-color)",
            color: "var(--success-color)",
            padding: "12px 14px",
            borderRadius: "8px",
            fontSize: "0.88rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle size={18} style={{ flexShrink: 0 }} />
          <span>{successMessage}</span>
        </motion.div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid var(--error-color)",
            color: "var(--error-color)",
            padding: "12px 14px",
            borderRadius: "8px",
            fontSize: "0.88rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
          }}
        >
          <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <div>{errorMessage}</div>
            {errorMessage.toLowerCase().includes("not registered") && !isSignUp && (
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setErrorMessage(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  marginTop: "4px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "var(--primary-color)",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Click here to register an account
              </button>
            )}
          </div>
        </motion.div>
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
                  background: "var(--background-color)",
                  color: "var(--text-color)",
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
                background: "var(--background-color)",
                color: "var(--text-color)",
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
              <Link
                href="/forgot-password"
                style={{ fontSize: "0.82rem", color: "var(--primary-color)", fontWeight: 500 }}
              >
                Forgot Password?
              </Link>
            )}
          </div>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Lock size={18} style={{ position: "absolute", left: "12px", color: "var(--text-light)" }} />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              style={{
                width: "100%",
                padding: "12px 42px 12px 40px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "var(--background-color)",
                color: "var(--text-color)",
                outline: "none",
                fontFamily: "inherit",
                transition: "var(--transition)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={{
                position: "absolute",
                right: "12px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--text-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "4px",
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
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
            cursor: isLoading ? "not-allowed" : "pointer",
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
                setErrorMessage(null);
                setSuccessMessage(null);
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
                setErrorMessage(null);
                setSuccessMessage(null);
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
  );
}

export default function LoginPage() {
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
        <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Loading login form...</div>}>
          <LoginForm />
        </Suspense>
      </div>

      <Footer />
    </main>
  );
}
