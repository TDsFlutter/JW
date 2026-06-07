"use client";
import Image from "next/image";
import styles from "./Footer.module.css";

const aboutLinks = ["Our Story", "Careers", "Press", "Blog"];
const shopLinks = ["Bibendumetos", "Pellentes Habitanto", "Senectus", "Consequatod"];
const popularSearch = ["18K White Gold", "Rose Gold", "Wedding Jewelry", "Luxury Watches"];
const helpLinks = ["Sizing Help", "Returns & Exchanges", "Shipping", "Theme FAQs"];

export default function Footer() {
  return (
    <footer className={styles.footer} id="site-footer">
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Logo & Brand Info */}
          <div className={styles.logoCol}>
            <span className={styles.logoText}>ëlla</span>
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
            <p className={styles.infoText}>TEXT: (090) 123-Ella</p>
            <p className={styles.infoText}>Email: example@domain.com</p>
          </div>

          <div className={styles.col}>
            <h4 className={styles.colTitle}>Address</h4>
            <p className={styles.infoText}>
              685 Market Street
              <br />
              San Francisco, CA
              <br />
              94105, US
            </p>
          </div>
        </div>

        {/* Bottom Social Bar */}
        <div className={styles.bottomBar}>
          <div className={styles.socials}>
            <a href="#" aria-label="Instagram" className={styles.socialBtn}>
              <Image
                src="/assets/ant-design_instagram-filled.png"
                alt="Instagram"
                width={18}
                height={18}
              />
            </a>
            <a href="#" aria-label="Facebook" className={styles.socialBtn}>
              <Image src="/assets/mdi_facebook.png" alt="Facebook" width={18} height={18} />
            </a>
            <a href="#" aria-label="Twitter" className={styles.socialBtn}>
              <Image
                src="/assets/ant-design_twitter-circle-filled.png"
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
