import Link from "next/link";
import styles from "./Footer.module.css";

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const TwitterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
  </svg>
);

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.container}`}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <Link href="/" className={styles.logo}>
              Lumina<span>Prints</span>
            </Link>
            <p className={styles.description}>
              Premium custom personalized gifts designed to turn your favorite moments into lasting memories.
            </p>
            <div className={styles.socials}>
              <a href="#" className={styles.socialLink} aria-label="Instagram">
                <InstagramIcon />
              </a>
              <a href="#" className={styles.socialLink} aria-label="Facebook">
                <FacebookIcon />
              </a>
              <a href="#" className={styles.socialLink} aria-label="Twitter">
                <TwitterIcon />
              </a>
            </div>
          </div>
          
          <div className={styles.links}>
            <h4 className={styles.linksTitle}>Products</h4>
            <ul>
              <li><Link href="#products">Custom T-Shirts</Link></li>
              <li><Link href="#products">Personalized Cushions</Link></li>
              <li><Link href="#products">Couple Gifts</Link></li>
              <li><Link href="#products">Photo Gifts</Link></li>
            </ul>
          </div>
          
          <div className={styles.links}>
            <h4 className={styles.linksTitle}>Company</h4>
            <ul>
              <li><Link href="#how-it-works">How It Works</Link></li>
              <li><Link href="#custom-orders">Custom Orders</Link></li>
              <li><Link href="#contact">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        
        <div className={styles.bottom}>
          <p>&copy; {new Date().getFullYear()} Lumina Prints. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
