"use client";

import { motion } from "framer-motion";
import styles from "./Products.module.css";
import { useAppContext } from "@/context/AppContext";

const products = [
  {
    id: 1,
    title: "Custom Printed Shirts",
    description: "Premium cotton t-shirts with your unique design or photo.",
    price: 25,
    imageColor: "#fdfbfb",
  },
  {
    id: 2,
    title: "Personalized Pillows",
    description: "Cozy up with memories. Soft cushions featuring your photos.",
    price: 30,
    imageColor: "#f7f0f6",
  },
  {
    id: 3,
    title: "Heart-Shaped Pillows",
    description: "The perfect romantic gift for your loved one.",
    price: 35,
    imageColor: "#fae8e8",
  },
  {
    id: 4,
    title: "Custom Printed Couches",
    description: "Unique printed couches to bring your living room to life.",
    price: 299,
    imageColor: "#f0f4f8",
  },
  {
    id: 5,
    title: "Couple Gifts",
    description: "Matching sets and personalized gifts for couples.",
    price: 40,
    imageColor: "#fdf8ec",
  },
  {
    id: 6,
    title: "Custom Designs",
    description: "Have an idea? We'll help you bring it to life on any product.",
    price: 50,
    imageColor: "#f3f0f7",
  },
];

export default function Products() {
  const { addToCart } = useAppContext();

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
                style={{ backgroundColor: product.imageColor }}
              >
                <div className={styles.placeholderText}>{product.title}</div>
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{product.title}</h3>
                <p className={styles.cardDescription}>{product.description}</p>
                <div className={styles.cardFooter}>
                  <span className={styles.price}>${product.price}</span>
                  <button 
                    onClick={() => addToCart(product)}
                    className={styles.customizeBtn}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
