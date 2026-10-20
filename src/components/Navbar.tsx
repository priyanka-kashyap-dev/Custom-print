"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ShoppingCart, User as UserIcon, Moon, Sun, ShieldAlert } from "lucide-react";
import styles from "./Navbar.module.css";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout, cart, theme, toggleTheme, isAdmin } = useAppContext();

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const isUserAdmin = Boolean(
    isAdmin || (user && user.email.toLowerCase().trim() === "pkashyap1506@gmail.com")
  );

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
      <div className={styles.announcementBar}>
        <div className={styles.announcementPromo}>
          ✨ Code <strong>FESTIVE15</strong> for 15% off | 📞 +91 9026332538 | ⚡ Express Delivery
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
            <button
              onClick={toggleTheme}
              className={styles.cartIcon}
              style={{ background: "transparent" }}
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <Link href="/cart" className={styles.cartIcon} aria-label="View shopping cart">
              <ShoppingCart size={20} />
              {cartItemCount > 0 && <span className={styles.cartBadge}>{cartItemCount}</span>}
            </Link>

            {isUserAdmin && (
              <Link href="/admin" className={styles.adminNavBtn} title="Admin stock & price management">
                <ShieldAlert size={15} /> Admin
              </Link>
            )}

            {user ? (
              <div className={styles.userMenu}>
                <Link href="/account" className={styles.userBadge} title={`Logged in as ${user.email}`}>
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.name}
                      width={28}
                      height={28}
                      style={{ borderRadius: "50%", flexShrink: 0 }}
                      unoptimized
                    />
                  ) : (
                    <div className={styles.avatarInitials}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={styles.userInfoCol}>
                    <span className={styles.userName}>{user.name}</span>
                    <span className={styles.userEmail}>{user.email}</span>
                  </div>
                </Link>
                <Link href="/account" className={styles.accountLink}>
                  My Account
                </Link>
                <Link href="/orders" className={styles.navLink}>
                  Orders
                </Link>
                <button onClick={logout} className={styles.logoutBtn}>
                  Logout
                </button>
              </div>
            ) : (
              <Link href="/login" className={styles.ctaButton}>
                <UserIcon size={16} style={{ marginRight: "6px" }} /> Login / Sign In
              </Link>
            )}
          </div>
        </nav>

        {/* Mobile Controls */}
        <div className={styles.mobileControls}>
          <button
            onClick={toggleTheme}
            className={styles.cartIcon}
            style={{ background: "transparent" }}
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <Link href="/cart" className={styles.cartIcon} aria-label="View shopping cart">
            <ShoppingCart size={20} />
            {cartItemCount > 0 && <span className={styles.cartBadge}>{cartItemCount}</span>}
          </Link>
          {user ? (
            <Link href="/account" className={styles.mobileAccountIcon} title={`Account: ${user.email}`} aria-label="My Account">
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.name}
                  width={28}
                  height={28}
                  style={{ borderRadius: "50%" }}
                  unoptimized
                />
              ) : (
                <div className={styles.avatarInitials} style={{ width: 28, height: 28, fontSize: "0.75rem" }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>
          ) : (
            <Link href="/login" className={styles.mobileLoginBtn} aria-label="Login">
              <UserIcon size={14} /> Login
            </Link>
          )}
          <button
            className={styles.mobileMenuButton}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
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
              {user && (
                <li
                  style={{
                    padding: "12px 14px",
                    background: "var(--background-color)",
                    borderRadius: "12px",
                    border: "1px solid var(--border-color)",
                    marginBottom: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {user.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt={user.name}
                        width={40}
                        height={40}
                        style={{ borderRadius: "50%" }}
                        unoptimized
                      />
                    ) : (
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          background: "var(--primary-color)",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "bold",
                        }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text-color)" }}>{user.name}</div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-light)" }}>{user.email}</div>
                    </div>
                  </div>
                </li>
              )}

              <li>
                <button
                  onClick={() => {
                    toggleTheme();
                    setIsMobileMenuOpen(false);
                  }}
                  className={styles.mobileNavLink}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    justifyContent: "flex-start",
                    background: "none",
                  }}
                >
                  {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
                  {theme === "light" ? "Dark Mode" : "Light Mode"}
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
                  {isUserAdmin && (
                    <li>
                      <Link
                        href="/admin"
                        className={styles.mobileNavLink}
                        style={{
                          background: "rgba(16, 185, 129, 0.12)",
                          color: "#10b981",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <ShieldAlert size={18} /> Admin Dashboard (Stock & Prices)
                      </Link>
                    </li>
                  )}
                  <li>
                    <Link
                      href="/account"
                      className={styles.mobileNavLink}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      My Account
                    </Link>
                  </li>
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
                      style={{ width: "100%", marginTop: "10px" }}
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
                    style={{ display: "block", textAlign: "center", width: "100%", marginTop: "10px" }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login / Sign In
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
