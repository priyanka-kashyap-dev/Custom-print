"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ShoppingCart, User as UserIcon, Moon, Sun } from "lucide-react";
import styles from "./Navbar.module.css";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, loginWithGoogle, logout, cart, theme, toggleTheme } = useAppContext();
  
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/#home" },
    { name: "Products", href: "/#products" },
    { name: "How It Works", href: "/#how-it-works" },
    { name: "Custom Orders", href: "/#custom-orders" },
    { name: "Contact", href: "/#contact" },
  ];

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}>
      {/* Announcement Bar */}
      <div style={{
        background: "var(--primary-color)",
        color: "white",
        padding: "8px 24px",
        fontSize: "0.85rem",
        textAlign: "center",
        fontWeight: 500,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 1001,
        position: "relative",
        width: "100%"
      }}>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <span>📞 +91 98765 43210</span>
        </div>
        <div style={{ display: "none" }} className="md:block"> {/* Using inline style or basic class logic for responsive text */}
          Use code <strong style={{ color: "white", background: "var(--primary-color)", padding: "2px 6px", borderRadius: "4px", marginLeft: "4px" }}>FESTIVE15</strong> for 15% off bulk orders!
        </div>
      </div>

      <div className={`container ${styles.navbar}`}>
        <Link href="/" className={styles.logo}>
          Print<span>Style</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav}>
          <ul className={styles.navLinks}>
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link href={link.href} className={styles.navLink}>
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
          <div className={styles.navActions}>
            <button onClick={toggleTheme} className={styles.cartIcon} style={{ background: 'transparent' }}>
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <Link href="/cart" className={styles.cartIcon}>
              <ShoppingCart size={20} />
              {cartItemCount > 0 && <span className={styles.cartBadge}>{cartItemCount}</span>}
            </Link>
            
            {user ? (
              <div className={styles.userMenu}>
                <Link href="/orders" className={styles.navLink}>Orders</Link>
                <button onClick={logout} className={styles.logoutBtn}>Logout</button>
              </div>
            ) : (
              <Link href="/login" className={styles.ctaButton}>
                <UserIcon size={18} style={{ marginRight: '8px' }}/> Login
              </Link>
            )}
          </div>
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          className={styles.mobileMenuButton}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className={styles.mobileNav}
          >
            <ul className={styles.mobileNavLinks}>
              <li>
                <button 
                  onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }}
                  className={styles.mobileNavLink}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'flex-start' }}
                >
                  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />} 
                  {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                </button>
              </li>
              {navLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className={styles.mobileNavLink}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/cart"
                  className={styles.mobileNavLink}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Cart ({cartItemCount})
                </Link>
              </li>
              {user ? (
                <>
                  <li>
                    <Link
                      href="/orders"
                      className={styles.mobileNavLink}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      My Orders
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className={styles.mobileCtaButton}
                      style={{ width: '100%', marginTop: '10px' }}
                    >
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link
                    href="/login"
                    className={styles.mobileCtaButton}
                    style={{ display: "block", textAlign: "center", width: '100%', marginTop: '10px' }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
