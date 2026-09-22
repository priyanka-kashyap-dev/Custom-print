"use client";

import { motion } from "framer-motion";
import styles from "./Hero.module.css";
import Link from "next/link";

export default function Hero() {
  return (
    <section id="home" className={styles.heroSection}>
      <div className={`container ${styles.container}`}>
        <div className={styles.content}>
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
              Turn your favorite moments, photos and ideas into beautifully printed gifts. 
              Custom gifts made just for you.
            </p>
          </motion.div>
          
          <motion.div
            className={styles.actions}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          >
            <Link href="#products" className={styles.primaryButton}>
              Explore Products
            </Link>
            <Link href="#custom-orders" className={styles.secondaryButton}>
              Create Custom Gift
            </Link>
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
              <div className={styles.imagePlaceholder}>Custom T-Shirt</div>
            </div>
            <div className={`${styles.imageWrapper} ${styles.img2}`}>
              <div className={styles.imagePlaceholder}>Heart Cushion</div>
            </div>
            <div className={`${styles.imageWrapper} ${styles.img3}`}>
              <div className={styles.imagePlaceholder}>Photo Frame</div>
            </div>
          </div>
          <div className={styles.decorativeCircle}></div>
          <div className={styles.decorativeCircle2}></div>
        </motion.div>
      </div>
    </section>
  );
}
