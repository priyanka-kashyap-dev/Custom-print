"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Tags, Truck, ThumbsUp } from "lucide-react";

export default function TrustBadges() {
  const badges = [
    {
      icon: <ShieldCheck size={26} color="var(--primary-color)" />,
      title: "Best Quality Printing",
      desc: "HD Sublimation & Inks",
    },
    {
      icon: <Tags size={26} color="#10b981" />,
      title: "Lowest Price Guarantee",
      desc: "Direct Factory Pricing",
    },
    {
      icon: <Truck size={26} color="#3b82f6" />,
      title: "Free Express Shipping",
      desc: "Fast Pan-India Delivery",
    },
    {
      icon: <ThumbsUp size={26} color="#f59e0b" />,
      title: "100% Satisfaction",
      desc: "Money-Back Guarantee",
    },
  ];

  return (
    <section style={{ padding: "clamp(24px, 4vw, 36px) 0", background: "var(--background-color)", borderBottom: "1px solid var(--border-color)", borderTop: "1px solid var(--border-color)" }}>
      <div className="container">
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "clamp(12px, 2vw, 24px)",
        }}>
          {badges.map((badge, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "12px",
                background: "var(--surface-color)",
                padding: "14px 16px",
                borderRadius: "16px",
                border: "1px solid var(--border-color)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div style={{
                background: "rgba(79, 70, 229, 0.08)",
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                {badge.icon}
              </div>
              <div>
                <h4 style={{ fontSize: "0.92rem", fontWeight: 700, margin: "0 0 2px", color: "var(--text-color)" }}>{badge.title}</h4>
                <p style={{ fontSize: "0.78rem", color: "var(--text-light)", margin: 0 }}>{badge.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
