"use client";

import { motion } from "framer-motion";
import styles from "./CustomDesign.module.css";
import Link from "next/link";

export default function CustomDesign() {
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
            <h2 className={styles.title}>Have Your Own Idea?</h2>
            <p className={styles.description}>
              Send us your photo, text, or design and we&apos;ll help turn it into a beautiful printed product. Our design team is ready to bring your vision to life.
            </p>
            <Link href="#contact" className={styles.ctaButton}>
              Start a Custom Request
            </Link>
          </motion.div>
          
          <motion.div 
            className={styles.visual}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className={styles.imagePlaceholder}>
              <div className={styles.glassCard}>
                <div className={styles.mockupTitle}>Your Design Here</div>
                <div className={styles.mockupGraphic}></div>
              </div>
            </div>
            <div className={styles.decorativeBlob}></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
