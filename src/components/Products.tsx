"use client";

import { motion } from "framer-motion";
import styles from "./Products.module.css";
import Link from "next/link";

const products = [
  {
    id: 1,
    title: "Custom T-Shirts",
    description: "Premium cotton t-shirts with your unique design or photo.",
    price: "Starting from $25",
    color: "#fdfbfb",
  },
  {
    id: 2,
    title: "Personalized Cushions",
    description: "Cozy up with memories. Soft cushions featuring your photos.",
    price: "Starting from $30",
    color: "#f7f0f6",
  },
  {
    id: 3,
    title: "Heart-Shaped Cushions",
    description: "The perfect romantic gift for your loved one.",
    price: "Starting from $35",
    color: "#fae8e8",
  },
  {
    id: 4,
    title: "Couple Gifts",
    description: "Matching sets and personalized gifts for couples.",
    price: "Starting from $40",
    color: "#f0f4f8",
  },
  {
    id: 5,
    title: "Personalized Photo Gifts",
    description: "Frames, mugs, and more to showcase your favorite moments.",
    price: "Starting from $15",
    color: "#fdf8ec",
  },
  {
    id: 6,
    title: "Custom Designs",
    description: "Have an idea? We'll help you bring it to life on any product.",
    price: "Custom Pricing",
    color: "#f3f0f7",
  },
];

export default function Products() {
  return (
    <section id="products" className={styles.productSection}>
      <div className={`container ${styles.container}`}>
        <div className={styles.header}>
          <motion.h2 
            className={styles.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Explore Our <span className="text-gradient">Collection</span>
          </motion.h2>
          <motion.p 
            className={styles.subtitle}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Discover our range of premium personalized products, crafted with love and attention to detail.
          </motion.p>
        </div>

        <div className={styles.grid}>
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              className={styles.card}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div 
                className={styles.imagePlaceholder}
                style={{ backgroundColor: product.color }}
              >
                <div className={styles.placeholderText}>{product.title}</div>
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{product.title}</h3>
                <p className={styles.cardDescription}>{product.description}</p>
                <div className={styles.cardFooter}>
                  <span className={styles.price}>{product.price}</span>
                  <Link href="#contact" className={styles.customizeBtn}>
                    Customize
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
