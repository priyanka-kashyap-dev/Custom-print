"use client";

import { motion } from "framer-motion";
import { Package, Image as ImageIcon, Printer, Truck } from "lucide-react";
import styles from "./HowItWorks.module.css";

const steps = [
  {
    icon: <Package size={32} />,
    title: "Choose Your Product",
    description: "Browse our collection and select the item you want to customize.",
  },
  {
    icon: <ImageIcon size={32} />,
    title: "Share Your Design",
    description: "Upload your favorite photo or let us know your design idea.",
  },
  {
    icon: <Printer size={32} />,
    title: "We Print It",
    description: "Our experts carefully print your design with premium quality.",
  },
  {
    icon: <Truck size={32} />,
    title: "Get It Delivered",
    description: "Receive your custom gift right at your doorstep securely.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className={styles.section}>
      <div className={`container ${styles.container}`}>
        <div className={styles.header}>
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
            Creating your personalized gift is simple. Just follow these four easy steps.
          </motion.p>
        </div>

        <div className={styles.stepsContainer}>
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              className={styles.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <div className={styles.iconWrapper}>
                {step.icon}
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
