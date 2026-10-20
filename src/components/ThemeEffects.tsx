"use client";

import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";

// Deterministic star field generation for dark mode (pure and SSR-safe)
const STARS = Array.from({ length: 50 }).map((_, i) => ({
  id: i,
  top: `${((i * 37 + 13) % 100)}%`,
  left: `${((i * 61 + 29) % 100)}%`,
  size: (i % 3) + 1.5,
  duration: ((i * 7) % 3) + 2.5,
  delay: ((i * 11) % 20) / 10,
}));

const emptySubscribe = () => () => {};

export default function ThemeEffects() {
  const { theme } = useAppContext();
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!isClient) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
        zIndex: -1,
        overflow: "hidden",
      }}
    >
      {theme === "dark" && (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "radial-gradient(circle at 50% 0%, rgba(30, 27, 75, 0.4) 0%, transparent 70%)",
          }}
        >
          {STARS.map((star) => (
            <motion.div
              key={star.id}
              initial={{ opacity: 0.1, scale: 0.8 }}
              animate={{ opacity: [0.1, 1, 0.1], scale: [0.8, 1.2, 0.8] }}
              transition={{
                duration: star.duration,
                repeat: Infinity,
                delay: star.delay,
                ease: "easeInOut",
              }}
              style={{
                position: "absolute",
                top: star.top,
                left: star.left,
                width: star.size,
                height: star.size,
                backgroundColor: "white",
                borderRadius: "50%",
                boxShadow: "0 0 8px 2px rgba(255, 255, 255, 0.3)",
              }}
            />
          ))}
        </div>
      )}

      {theme === "light" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          style={{
            width: "100%",
            height: "100%",
            background: "radial-gradient(circle at 80% 10%, rgba(252, 211, 77, 0.15) 0%, transparent 50%)",
          }}
        >
          {/* Subtle sun ray effect for light mode */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
            style={{
              position: "absolute",
              top: "-20%",
              right: "-10%",
              width: "60vw",
              height: "60vw",
              background:
                "conic-gradient(from 0deg at 50% 50%, rgba(252, 211, 77, 0.1) 0deg, transparent 60deg, rgba(252, 211, 77, 0.1) 120deg, transparent 180deg, rgba(252, 211, 77, 0.1) 240deg, transparent 300deg, rgba(252, 211, 77, 0.1) 360deg)",
              borderRadius: "50%",
              filter: "blur(40px)",
            }}
          />
        </motion.div>
      )}
    </div>
  );
}
