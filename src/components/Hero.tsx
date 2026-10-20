"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section id="home" className={styles.heroSection}>
      <div className={`container ${styles.container}`}>
        <div className={styles.content}>
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={styles.trustBadge}
          >
            <Sparkles size={14} color="#f59e0b" />
            <span>India&apos;s #1 Custom Printing Studio</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className={styles.title}>
              Make It <span className="text-gradient">Personal.</span>
            </h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <p className={styles.subtitle}>
              Turn your favorite moments, photos and ideas into beautifully printed custom gifts.
              T-shirts, pillows, couches &amp; couple sets crafted with museum-grade precision.
            </p>
          </motion.div>
          
          <motion.div
            className={styles.actions}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          >
            <Link href="#products" className={styles.primaryButton}>
              Explore Products <ArrowRight size={18} style={{ marginLeft: "8px" }} />
            </Link>
            <Link href="#custom-orders" className={styles.secondaryButton}>
              <Sparkles size={16} style={{ marginRight: "8px" }} /> Create Custom Gift
            </Link>
          </motion.div>

          <motion.div
            className={styles.heroMicroTrust}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <span><ShieldCheck size={14} color="#10b981" /> 100% Cotton Bio-Washed</span>
            <span><Zap size={14} color="#f59e0b" /> 24h Express Dispatch</span>
          </motion.div>
        </div>

        <motion.div
          className={styles.visual}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        >
          <div className={styles.imageGrid}>
            <div className={`${styles.imageWrapper} ${styles.img1}`}>
              <Image
                src="/images/products/tshirt.jpg"
                alt="Custom Printed T-Shirt"
                fill
                sizes="(max-width: 768px) 180px, 280px"
                style={{ objectFit: "cover" }}
                priority
                unoptimized
              />
              <div className={styles.floatingChip}>🔥 Bestseller</div>
            </div>

            <div className={`${styles.imageWrapper} ${styles.img2}`}>
              <Image
                src="/images/products/heart-pillow.jpg"
                alt="Heart Shaped Personalized Pillow"
                fill
                sizes="(max-width: 768px) 150px, 240px"
                style={{ objectFit: "cover" }}
                priority
                unoptimized
              />
              <div className={styles.floatingChip} style={{ background: "rgba(239, 68, 68, 0.85)" }}>❤️ Most Loved</div>
            </div>

            <div className={`${styles.imageWrapper} ${styles.img3}`}>
              <Image
                src="/images/products/couple-gift.jpg"
                alt="Couple Personalized Mugs and Frame"
                fill
                sizes="(max-width: 768px) 130px, 200px"
                style={{ objectFit: "cover" }}
                priority
                unoptimized
              />
              <div className={styles.floatingChip} style={{ background: "rgba(16, 185, 129, 0.85)" }}>⭐ 4.9 Rating</div>
            </div>
          </div>
          <div className={styles.decorativeCircle}></div>
          <div className={styles.decorativeCircle2}></div>
        </motion.div>
      </div>
    </section>
  );
}
