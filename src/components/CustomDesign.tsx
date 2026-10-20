"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Upload, Palette, ArrowRight } from "lucide-react";
import styles from "./CustomDesign.module.css";

const COLOR_OPTIONS = [
  { name: "Obsidian", color: "#0f172a" },
  { name: "Royal Indigo", color: "#4f46e5" },
  { name: "Rose Coral", color: "#f43f5e" },
  { name: "Emerald", color: "#10b981" },
];

export default function CustomDesign() {
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);

  return (
    <section id="custom-orders" className={styles.section}>
      <div className={`container ${styles.container}`}>
        <div className={styles.contentWrapper}>
          <motion.div 
            className={styles.content}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(79, 70, 229, 0.1)", color: "var(--primary-color)", padding: "4px 12px", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: 700, marginBottom: "14px" }}>
              <Palette size={14} /> Custom Design Studio
            </div>

            <h2 className={styles.title}>Have Your Own Idea?</h2>
            <p className={styles.description}>
              Send us your high-resolution photos, logo, or custom artwork. Our master printing team transfers your design onto museum-grade canvas, shirts, mugs, or pillows with vivid color accuracy.
            </p>

            <div style={{ display: "flex", gap: "10px", alignItems: "center", margin: "20px 0 24px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-light)" }}>Preview Accent:</span>
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setSelectedColor(c)}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor: c.color,
                    border: selectedColor.name === c.name ? "3px solid var(--text-color)" : "2px solid rgba(255,255,255,0.8)",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                    transition: "transform 0.2s ease",
                    transform: selectedColor.name === c.name ? "scale(1.15)" : "scale(1)",
                  }}
                  title={c.name}
                  aria-label={c.name}
                />
              ))}
            </div>

            <Link href="#contact" className={styles.ctaButton}>
              <Upload size={18} style={{ marginRight: "8px" }} /> Start a Custom Request <ArrowRight size={16} style={{ marginLeft: "6px" }} />
            </Link>
          </motion.div>
          
          <motion.div 
            className={styles.visual}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div 
              className={styles.imagePlaceholder}
              style={{
                borderRadius: "24px",
                overflow: "hidden",
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                border: `3px solid ${selectedColor.color}`,
                transition: "border-color 0.4s ease",
                position: "relative",
              }}
            >
              <Image
                src="/images/products/canvas.jpg"
                alt="Custom Canvas Studio Print"
                fill
                sizes="(max-width: 768px) 320px, 480px"
                style={{ objectFit: "cover" }}
                unoptimized
              />

              <div
                style={{
                  position: "absolute",
                  bottom: "16px",
                  left: "16px",
                  right: "16px",
                  background: "rgba(15, 23, 42, 0.85)",
                  backdropFilter: "blur(12px)",
                  borderRadius: "14px",
                  padding: "12px 16px",
                  color: "#fff",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Gallery Canvas Print</div>
                  <div style={{ fontSize: "0.78rem", color: "#cbd5e1" }}>HD Sublimation • Lifetime Guarantee</div>
                </div>
                <span style={{ background: selectedColor.color, color: "#fff", padding: "4px 10px", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 700 }}>
                  {selectedColor.name}
                </span>
              </div>
            </div>
            <div className={styles.decorativeBlob}></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
