"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, CheckCircle2, X, Loader2, HelpCircle } from "lucide-react";

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary" | "success";
  isLoading?: boolean;
  children?: React.ReactNode;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
  children,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <AlertTriangle size={28} color="#ef4444" />,
          iconBg: "rgba(239, 68, 68, 0.12)",
          confirmBtnBg: "#ef4444",
          confirmBtnHover: "#dc2626",
          confirmBtnColor: "#ffffff",
        };
      case "warning":
        return {
          icon: <AlertTriangle size={28} color="#f59e0b" />,
          iconBg: "rgba(245, 158, 11, 0.12)",
          confirmBtnBg: "#f59e0b",
          confirmBtnHover: "#d97706",
          confirmBtnColor: "#ffffff",
        };
      case "success":
        return {
          icon: <CheckCircle2 size={28} color="#10b981" />,
          iconBg: "rgba(16, 185, 129, 0.12)",
          confirmBtnBg: "#10b981",
          confirmBtnHover: "#059669",
          confirmBtnColor: "#ffffff",
        };
      case "primary":
      default:
        return {
          icon: <HelpCircle size={28} color="var(--primary-color)" />,
          iconBg: "rgba(79, 70, 229, 0.12)",
          confirmBtnBg: "var(--primary-color)",
          confirmBtnHover: "var(--secondary-color)",
          confirmBtnColor: "#ffffff",
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          background: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(6px)",
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: "440px",
            width: "100%",
            background: "var(--surface-color, #ffffff)",
            color: "var(--text-color, #1e293b)",
            borderRadius: "20px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            border: "1px solid var(--border-color, #e2e8f0)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Close X */}
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "transparent",
              border: "none",
              color: "var(--text-light, #94a3b8)",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>

          {/* Modal Content */}
          <div style={{ padding: "28px 24px 20px", textAlign: "center" }}>
            {/* Context Icon */}
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: vStyles.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              {vStyles.icon}
            </div>

            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                margin: "0 0 8px",
                letterSpacing: "-0.3px",
              }}
            >
              {title}
            </h3>

            {message && (
              <p
                style={{
                  fontSize: "0.92rem",
                  color: "var(--text-light, #64748b)",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {message}
              </p>
            )}

            {children && (
              <div style={{ marginTop: message ? "16px" : "0", textAlign: "left" }}>
                {children}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div
            style={{
              padding: "16px 24px 24px",
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
              background: "var(--background-color, #f8fafc)",
              borderTop: "1px solid var(--border-color, #e2e8f0)",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: "10px 18px",
                borderRadius: "10px",
                border: "1px solid var(--border-color, #cbd5e1)",
                background: "var(--surface-color, #ffffff)",
                color: "var(--text-color, #334155)",
                fontWeight: 600,
                fontSize: "0.92rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={async () => {
                await onConfirm();
              }}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: "10px 18px",
                borderRadius: "10px",
                border: "none",
                background: vStyles.confirmBtnBg,
                color: vStyles.confirmBtnColor,
                fontWeight: 700,
                fontSize: "0.92rem",
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                transition: "all 0.2s ease",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="spin" /> Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
