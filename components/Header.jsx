"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import styles from "./Header.module.css";

const navItems = [
  { name: "HOME", href: "/" },
  { name: "SHOP", href: "/shop" },
  { name: "ABOUT US", href: "/about" },
  { name: "ASK PRICE", href: "/ask-price" },
  { name: "CONTACT", href: "/contact" },
  { name: "FAQs", href: "/faqs" },
  { name: "BLOG", href: "/blog" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { cartCount, wishlist, setCartOpen } = useCart();
  const { currentUser } = useAuth();
  const router = useRouter();
  const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
  };

  return (
    <header className={styles.header} id="site-header">
      <div className={styles.topRow}>
        <div className={styles.logo}>
          <Link href="/" className={styles.logoText}>
            ëlla
          </Link>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="What are you looking for? Bridal e.g diamond ring"
            className={styles.searchInput}
            id="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className={styles.searchIcons}>
            <button className={styles.iconBtn} aria-label="Search" onClick={handleSearch}>
              <Image src={`${BASE_PATH}/assets/search.png`} alt="Search" width={18} height={18} />
            </button>
            <button className={styles.iconBtn} aria-label="Voice search">
              <Image src={`${BASE_PATH}/assets/mic.png`} alt="Microphone" width={18} height={18} />
            </button>
          </div>
        </div>

        <div className={styles.headerActions}>
          <Link href="/shop?wishlist=true" className={styles.iconBtn} aria-label="Wishlist">
            <Image src={`${BASE_PATH}/assets/heart.png`} alt="Wishlist" width={22} height={22} />
            {wishlist.length > 0 && (
              <span className={styles.badge}>{wishlist.length}</span>
            )}
          </Link>
          <Link href={currentUser ? "/profile" : "/login"} className={styles.iconBtn} aria-label="Account">
            <Image src={`${BASE_PATH}/assets/user.png`} alt="Account" width={22} height={22} />
          </Link>
          <button 
            className={styles.iconBtn} 
            aria-label="Shopping bag"
            onClick={() => setCartOpen(true)}
          >
            <Image src={`${BASE_PATH}/assets/shopping-bag.png`} alt="Cart" width={22} height={22} />
            {cartCount > 0 && (
              <span className={styles.badge}>{cartCount}</span>
            )}
          </button>
        </div>

        <button
          className={styles.hamburger}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          id="mobile-menu-toggle"
        >
          <span className={`${styles.hamburgerLine} ${mobileOpen ? styles.open : ""}`}></span>
          <span className={`${styles.hamburgerLine} ${mobileOpen ? styles.open : ""}`}></span>
          <span className={`${styles.hamburgerLine} ${mobileOpen ? styles.open : ""}`}></span>
        </button>
      </div>

      <nav className={`${styles.nav} ${mobileOpen ? styles.navOpen : ""}`} id="main-nav">
        <ul className={styles.navList}>
          {navItems.map((item, idx) => (
            <li key={idx} className={styles.navItem}>
              <Link href={item.href} className={styles.navLink} onClick={() => setMobileOpen(false)}>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
