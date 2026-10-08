"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";

export default function ThemeEffects() {
  const { theme } = useAppContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Generate random stars for the dark mode background
  const stars = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2
  }));

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: "none",
      zIndex: -1,
      overflow: "hidden"
    }}>
      {theme === "dark" && (
        <div style={{ width: "100%", height: "100%", background: "radial-gradient(circle at 50% 0%, rgba(30, 27, 75, 0.4) 0%, transparent 70%)" }}>
          {stars.map((star) => (
            <motion.div
              key={star.id}
              initial={{ opacity: 0.1, scale: 0.8 }}
              animate={{ opacity: [0.1, 1, 0.1], scale: [0.8, 1.2, 0.8] }}
              transition={{
                duration: star.duration,
                repeat: Infinity,
                delay: star.delay,
                ease: "easeInOut"
              }}
              style={{
                position: "absolute",
                top: star.top,
                left: star.left,
                width: star.size,
                height: star.size,
                backgroundColor: "white",
                borderRadius: "50%",
                boxShadow: "0 0 8px 2px rgba(255, 255, 255, 0.3)"
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
          style={{ width: "100%", height: "100%", background: "radial-gradient(circle at 80% 10%, rgba(252, 211, 77, 0.15) 0%, transparent 50%)" }}
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
              background: "conic-gradient(from 0deg at 50% 50%, rgba(252, 211, 77, 0.1) 0deg, transparent 60deg, rgba(252, 211, 77, 0.1) 120deg, transparent 180deg, rgba(252, 211, 77, 0.1) 240deg, transparent 300deg, rgba(252, 211, 77, 0.1) 360deg)",
              borderRadius: "50%",
              filter: "blur(40px)"
            }}
          />
        </motion.div>
      )}
    </div>
  );
}
