"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { isFirebaseConfigured } from "@/lib/firebase";
import styles from "./Footer.module.css";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

const aboutLinks = ["Our Story", "Careers", "Press", "Blog"];
const shopLinks = ["Bibendumetos", "Pellentes Habitanto", "Senectus", "Consequatod"];
const popularSearch = ["18K White Gold", "Rose Gold", "Wedding Jewelry", "Luxury Watches"];
const helpLinks = ["Sizing Help", "Returns & Exchanges", "Shipping", "Theme FAQs"];

export default function Footer() {
  const [contacts, setContacts] = useState({
    phone: "+91 98765 43210",
    whatsapp: "+91 98765 43210",
    email: "support@ella-jewelry.com",
    address: "ORNIVAJEWELS Jewelry Studio\nDiamond Bourse, BKC\nMumbai, Maharashtra 400051",
    hours: "Monday – Saturday: 10:00 AM – 7:00 PM IST\nSunday: Closed",
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    twitter: "https://twitter.com"
  });

  useEffect(() => {
    const cached = localStorage.getItem("mock_contacts");
    if (cached) {
      try {
        setContacts(JSON.parse(cached));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  return (
    <footer className={styles.footer} id="site-footer">
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Logo & Brand Info */}
          <div className={styles.logoCol}>
            <span className={styles.logoText}>ORNIVAJEWELS</span>
          </div>

          {/* Links Columns */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>About</h4>
            <ul className={styles.list}>
              {aboutLinks.map((link, idx) => (
                <li key={idx} className={styles.item}>
                  <a href="#" className={styles.link}>
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.col}>
            <h4 className={styles.colTitle}>Shop</h4>
            <ul className={styles.list}>
              {shopLinks.map((link, idx) => (
                <li key={idx} className={styles.item}>
                  <a href="#" className={styles.link}>
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.col}>
            <h4 className={styles.colTitle}>Popular Search</h4>
            <ul className={styles.list}>
              {popularSearch.map((link, idx) => (
                <li key={idx} className={styles.item}>
                  <a href="#" className={styles.link}>
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.col}>
            <h4 className={styles.colTitle}>Help</h4>
            <ul className={styles.list}>
              {helpLinks.map((link, idx) => (
                <li key={idx} className={styles.item}>
                  <a href="#" className={styles.link}>
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Address */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Contact Us</h4>
            <p className={styles.infoText}>TEL: {contacts.phone}</p>
            <p className={styles.infoText}>Email: {contacts.email}</p>
          </div>

          <div className={styles.col}>
            <h4 className={styles.colTitle}>Address</h4>
            <p className={styles.infoText} style={{ whiteSpace: "pre-wrap" }}>
              {contacts.address}
            </p>
          </div>
        </div>

        {/* Bottom Social Bar */}
        <div className={styles.bottomBar}>
          <div className={styles.socials}>
            <a href={contacts.instagram || "#"} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={styles.socialBtn}>
              <Image
                src={`${BASE_PATH}/assets/ant-design_instagram-filled.png`}
                alt="Instagram"
                width={18}
                height={18}
              />
            </a>
            <a href={contacts.facebook || "#"} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={styles.socialBtn}>
              <Image src={`${BASE_PATH}/assets/mdi_facebook.png`} alt="Facebook" width={18} height={18} />
            </a>
            <a href={contacts.twitter || "#"} target="_blank" rel="noopener noreferrer" aria-label="Twitter" className={styles.socialBtn}>
              <Image
                src={`${BASE_PATH}/assets/ant-design_twitter-circle-filled.png`}
                alt="Twitter"
                width={18}
                height={18}
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
