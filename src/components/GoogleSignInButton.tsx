"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";

interface GoogleSignInButtonProps {
  redirectAfterLogin?: string;
  buttonText?: "signin_with" | "signup_with" | "continue_with";
  onSuccess?: () => void;
  onError?: (errorMessage: string) => void;
}

interface GooglePromptNotification {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  getNotDisplayedReason?: () => string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: string | number;
            }
          ) => void;
          prompt: (notification?: (notification: GooglePromptNotification) => void) => void;
        };
      };
    };
  }
}

export default function GoogleSignInButton({
  redirectAfterLogin = "/",
  buttonText = "continue_with",
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const { setUser } = useAppContext();
  const router = useRouter();
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Handle Google credential response returned from Google Identity Services
  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      setIsLoading(true);
      setErrorMsg(null);

      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Google authentication failed on the server.");
        }

        // Update app context user state
        if (data.user) {
          setUser({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            photoURL: data.user.avatar || "",
            role: data.user.role || "customer",
          });
        }

        if (onSuccess) {
          onSuccess();
        } else {
          router.push(redirectAfterLogin);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to complete Google Sign-In.";
        setErrorMsg(msg);
        if (onError) onError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [setUser, onSuccess, router, redirectAfterLogin, onError]
  );

  useEffect(() => {
    if (!clientId) {
      return;
    }

    const scriptId = "google-gsi-client";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const initializeGsi = () => {
      if (window.google?.accounts?.id && buttonContainerRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            cancel_on_tap_outside: true,
          });

          // Clear previous render if any
          buttonContainerRef.current.innerHTML = "";

          window.google.accounts.id.renderButton(buttonContainerRef.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: buttonText,
            shape: "rectangular",
            logo_alignment: "left",
            width: "380",
          });

          setIsScriptLoaded(true);
        } catch (e) {
          console.error("Error initializing Google Identity Services:", e);
        }
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGsi;
      document.body.appendChild(script);
    } else if (window.google?.accounts?.id) {
      initializeGsi();
    }
  }, [clientId, buttonText, handleCredentialResponse]);

  const handleManualClick = () => {
    if (!clientId) {
      setErrorMsg(
        "Google OAuth Client ID is not configured yet. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your .env.local file."
      );
      return;
    }

    if (window.google?.accounts?.id) {
      setIsLoading(true);
      window.google.accounts.id.prompt((notification: GooglePromptNotification) => {
        setIsLoading(false);
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.warn("Google One Tap was skipped or not displayed:", notification.getNotDisplayedReason?.());
        }
      });
    }
  };

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
      {/* Official Google Identity Services Container */}
      <div 
        ref={buttonContainerRef} 
        style={{ 
          minHeight: "44px", 
          justifyContent: "center", 
          width: "100%",
          display: isScriptLoaded && clientId ? "flex" : "none" 
        }} 
      />

      {/* Styled Fallback / Loading / No-Client-ID State Button */}
      {(!isScriptLoaded || !clientId) && (
        <button
          type="button"
          onClick={handleManualClick}
          disabled={isLoading}
          style={{
            background: "white",
            color: "#1f2937",
            border: "1px solid var(--border-color)",
            padding: "12px 16px",
            borderRadius: "8px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            width: "100%",
            boxShadow: "var(--shadow-sm)",
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "var(--transition)",
            fontSize: "0.95rem",
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "white")}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
          </svg>
          {isLoading ? "Signing in..." : "Continue with Google"}
        </button>
      )}

      {/* Error alert */}
      {errorMsg && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid var(--error-color)",
            color: "var(--error-color)",
            padding: "8px 12px",
            borderRadius: "8px",
            fontSize: "0.85rem",
            width: "100%",
            textAlign: "center",
          }}
        >
          {errorMsg}
        </div>
      )}
    </div>
  );
}
