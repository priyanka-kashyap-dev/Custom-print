"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Tags, Truck, ThumbsUp } from "lucide-react";

export default function TrustBadges() {
  const badges = [
    {
      icon: <ShieldCheck size={32} color="var(--primary-color)" />,
      title: "Best Quality Printing",
      desc: "Next-gen Technology"
    },
    {
      icon: <Tags size={32} color="var(--primary-color)" />,
      title: "Lowest Price Guarantee",
      desc: "Save Your Money"
    },
    {
      icon: <Truck size={32} color="var(--primary-color)" />,
      title: "Free Shipping",
      desc: "All Over the Country"
    },
    {
      icon: <ThumbsUp size={32} color="var(--primary-color)" />,
      title: "100% Satisfaction",
      desc: "Money Back Guarantee"
    }
  ];

  return (
    <section style={{ padding: "40px 0", background: "var(--background-color)", borderBottom: "1px solid var(--border-color)", borderTop: "1px solid var(--border-color)" }}>
      <div className="container">
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "2rem" }}>
          {badges.map((badge, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "1rem", 
                flex: "1 1 200px", 
                justifyContent: "center" 
              }}
            >
              <div style={{
                background: "var(--background-color)",
                padding: "16px",
                borderRadius: "50%",
                boxShadow: "var(--shadow-sm)"
              }}>
                {badge.icon}
              </div>
              <div>
                <h4 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--text-color)" }}>{badge.title}</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-light)", margin: 0 }}>{badge.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
