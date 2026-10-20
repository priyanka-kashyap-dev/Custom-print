"use client";

import { motion } from "framer-motion";
import { Package, Image as ImageIcon, Printer, Truck, Sparkles } from "lucide-react";
import styles from "./HowItWorks.module.css";

const steps = [
  {
    num: "01",
    icon: <Package size={28} />,
    title: "Choose Your Product",
    description: "Browse our premium t-shirts, cushions, couches, mugs & frames.",
  },
  {
    num: "02",
    icon: <ImageIcon size={28} />,
    title: "Upload Your Photo or Design",
    description: "Send your favorite memories, family portraits, quotes, or graphics.",
  },
  {
    num: "03",
    icon: <Printer size={28} />,
    title: "Expert HD Print & Proof",
    description: "We use high-definition sublimation and fade-proof textile inks.",
  },
  {
    num: "04",
    icon: <Truck size={28} />,
    title: "Doorstep Fast Delivery",
    description: "Delivered securely in premium gift packaging directly to you.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className={styles.section}>
      <div className={`container ${styles.container}`}>
        <div className={styles.header}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(79, 70, 229, 0.1)", color: "var(--primary-color)", padding: "4px 12px", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: 700, marginBottom: "12px", textTransform: "uppercase" }}>
            <Sparkles size={14} /> Easy 4-Step Process
          </div>
          <motion.h2 
            className={styles.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            How It <span className="text-gradient">Works</span>
          </motion.h2>
          <motion.p 
            className={styles.subtitle}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Creating your personalized gift is simple, fun, and lightning fast.
          </motion.p>
        </div>

        <div className={styles.stepsContainer}>
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              className={styles.step}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.12 }}
            >
              <div style={{ position: "relative", width: "fit-content", margin: "0 auto 18px" }}>
                <div className={styles.iconWrapper}>
                  {step.icon}
                </div>
                <span
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-6px",
                    background: "linear-gradient(135deg, var(--secondary-color), var(--primary-color))",
                    color: "white",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(79, 70, 229, 0.4)",
                    zIndex: 3,
                  }}
                >
                  {step.num}
                </span>
                {index < steps.length - 1 && (
                  <div className={styles.connector}></div>
                )}
              </div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDescription}>{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
