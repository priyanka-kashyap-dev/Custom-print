"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Star, ShoppingCart, Check, Sparkles } from "lucide-react";
import styles from "./Products.module.css";
import { useAppContext, Product } from "@/context/AppContext";

const CATEGORIES = [
  { id: "all", label: "🌟 All Products" },
  { id: "Apparel", label: "👕 Apparel" },
  { id: "Home Decor", label: "🛋️ Pillows & Cushions" },
  { id: "Gifts", label: "🎁 Couple & Gifts" },
  { id: "Furniture", label: "🪑 Custom Couches" },
  { id: "Wall Decor", label: "🖼️ Canvas & Frames" },
];

export default function Products() {
  const { products, addToCart } = useAppContext();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [addedId, setAddedId] = useState<string | number | null>(null);

  const filteredProducts = selectedCategory === "all"
    ? products
    : products.filter((p) => p.category?.toLowerCase() === selectedCategory.toLowerCase());

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <section id="products" className={styles.productSection}>
      <div className={`container ${styles.container}`}>
        <div className={styles.header}>
          <div className={styles.sectionBadge}>
            <Sparkles size={14} /> Curated Catalog
          </div>
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
            Discover our range of premium personalized products, crafted with precision printing and supreme quality.
          </motion.p>

          {/* Category Filter Pills (Optimized for Mobile Swipe) */}
          <div className={styles.filterBar}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`${styles.filterPill} ${selectedCategory === cat.id ? styles.activeFilterPill : ""}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.grid}>
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, index) => {
              const imageSrc = product.image || (product.images && product.images[0]) || "/images/products/tshirt.jpg";
              const isAdded = addedId === product.id;
              const isOutOfStock = product.stock === 0;

              return (
                <motion.div
                  key={product.id}
                  className={styles.card}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                >
                  <div className={styles.imageContainer}>
                    <Image
                      src={imageSrc}
                      alt={product.title}
                      fill
                      sizes="(max-width: 600px) 50vw, (max-width: 1024px) 33vw, 320px"
                      className={styles.productImg}
                      unoptimized
                    />

                    {/* Marketing Badge */}
                    {product.badge && (
                      <span className={styles.productBadge}>
                        {product.badge}
                      </span>
                    )}

                    {/* Stock Alert */}
                    {product.stock !== undefined && product.stock > 0 && product.stock <= 10 && (
                      <span className={styles.lowStockBadge}>
                        Only {product.stock} left!
                      </span>
                    )}

                    {isOutOfStock && (
                      <div className={styles.outOfStockOverlay}>
                        <span>Out of Stock</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.cardContent}>
                    <div className={styles.ratingRow}>
                      <div className={styles.stars}>
                        <Star size={13} fill="#f59e0b" color="#f59e0b" />
                        <span className={styles.ratingNum}>{product.rating || 4.9}</span>
                      </div>
                      <span className={styles.reviewCount}>({product.reviews || 48})</span>
                    </div>

                    <h3 className={styles.cardTitle}>{product.title}</h3>
                    <p className={styles.cardDescription}>{product.description}</p>

                    <div className={styles.cardFooter}>
                      <div className={styles.priceCol}>
                        <span className={styles.price}>${product.price}</span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className={styles.originalPrice}>${product.originalPrice}</span>
                        )}
                      </div>

                      <button 
                        onClick={() => handleAddToCart(product)}
                        disabled={isOutOfStock}
                        className={`${styles.customizeBtn} ${isAdded ? styles.addedBtn : ""}`}
                        aria-label={`Add ${product.title} to cart`}
                      >
                        {isAdded ? (
                          <>
                            <Check size={16} /> Added
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={15} /> Add
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
