"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, LogIn } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LoginPage() {
  const { loginWithGoogle } = useAppContext();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Real Firebase Email/Password Auth would go here:
    // await signInWithEmailAndPassword(auth, email, password);
    setTimeout(() => {
      // Mock success for now, in a real app you'd call AppContext.loginWithEmail(email, password)
      alert("Email login simulation successful. Please use Google Login for the full demo experience!");
      setIsLoading(false);
    }, 1500);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await loginWithGoogle();
    setIsLoading(false);
    router.push("/"); // redirect to home after login
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingTop: "80px", background: "var(--background-color)" }}>
      <Navbar />
      
      <div className="container" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass"
          style={{
            maxWidth: "450px",
            width: "100%",
            padding: "3rem 2rem",
            borderRadius: "var(--border-radius-lg)",
            boxShadow: "var(--shadow-lg)"
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem", fontFamily: "var(--font-heading)" }}>Welcome Back</h1>
            <p style={{ color: "var(--text-light)" }}>Sign in to manage your orders and custom designs</p>
          </div>

          <form onSubmit={handleEmailLogin} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, fontSize: "0.9rem" }}>Email Address</label>
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
                    transition: "var(--transition)"
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label style={{ fontWeight: 500, fontSize: "0.9rem" }}>Password</label>
                <Link href="#" style={{ fontSize: "0.8rem", color: "var(--primary-color)" }}>Forgot Password?</Link>
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
                    transition: "var(--transition)"
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
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? "Signing in..." : <><LogIn size={18} /> Sign In</>}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", margin: "2rem 0", color: "var(--text-light)" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }} />
            <span style={{ padding: "0 1rem", fontSize: "0.9rem" }}>OR</span>
            <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }} />
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            style={{
              background: "white",
              color: "var(--text-color)",
              border: "1px solid var(--border-color)",
              padding: "12px",
              borderRadius: "8px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              width: "100%",
              boxShadow: "var(--shadow-sm)",
              transition: "var(--transition)"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "#f9f9f9"}
            onMouseOut={(e) => e.currentTarget.style.background = "white"}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            Sign in with Google
          </button>

          <p style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.9rem", color: "var(--text-light)" }}>
            Don't have an account? <Link href="#" style={{ color: "var(--primary-color)", fontWeight: 600 }}>Sign up</Link>
          </p>
        </motion.div>
      </div>
      
      <Footer />
    </main>
  );
}
