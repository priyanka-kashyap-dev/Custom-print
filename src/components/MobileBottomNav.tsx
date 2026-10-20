"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Sparkles, ShoppingCart, User as UserIcon, ShieldAlert } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import styles from "./MobileBottomNav.module.css";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user, cart, isAdmin } = useAppContext();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const isUserAdmin = Boolean(
    isAdmin || (user && user.email.toLowerCase().trim() === "pkashyap1506@gmail.com")
  );

  return (
    <nav className={styles.bottomNav} aria-label="Mobile Navigation">
      <ul className={styles.navList}>
        <li className={styles.navItem}>
          <Link
            href="/"
            className={`${styles.navLink} ${pathname === "/" ? styles.activeLink : ""}`}
          >
            <div className={styles.iconWrapper}>
              <Home size={20} />
            </div>
            <span>Home</span>
          </Link>
        </li>

        <li className={styles.navItem}>
          <Link
            href="/#products"
            className={`${styles.navLink} ${pathname === "/#products" ? styles.activeLink : ""}`}
          >
            <div className={styles.iconWrapper}>
              <ShoppingBag size={20} />
            </div>
            <span>Products</span>
          </Link>
        </li>

        <li className={styles.navItem}>
          <Link
            href="/#custom-orders"
            className={styles.navLink}
          >
            <div className={styles.iconWrapper}>
              <Sparkles size={20} color="var(--primary-color)" />
            </div>
            <span>Studio</span>
          </Link>
        </li>

        <li className={styles.navItem}>
          <Link
            href="/cart"
            className={`${styles.navLink} ${pathname === "/cart" ? styles.activeLink : ""}`}
          >
            <div className={styles.iconWrapper}>
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
            </div>
            <span>Cart</span>
          </Link>
        </li>

        {isUserAdmin ? (
          <li className={styles.navItem}>
            <Link
              href="/admin"
              className={`${styles.navLink} ${pathname === "/admin" ? styles.activeLink : ""}`}
            >
              <div className={styles.iconWrapper}>
                <ShieldAlert size={20} color="#10b981" />
                <span className={styles.adminDot} />
              </div>
              <span style={{ color: "#10b981", fontWeight: 700 }}>Admin</span>
            </Link>
          </li>
        ) : (
          <li className={styles.navItem}>
            <Link
              href={user ? "/account" : "/login"}
              className={`${styles.navLink} ${pathname === "/account" || pathname === "/login" ? styles.activeLink : ""}`}
            >
              <div className={styles.iconWrapper}>
                <UserIcon size={20} />
              </div>
              <span>{user ? "Account" : "Sign In"}</span>
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
