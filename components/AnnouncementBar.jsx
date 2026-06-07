"use client";
import styles from "./AnnouncementBar.module.css";

export default function AnnouncementBar() {
  return (
    <div className={styles.bar} id="announcement-bar">
      <div className={styles.inner}>
        <span className={styles.left}>FREE SHIPPING OVER ₹1,499</span>
        <span className={styles.center}>
          Mid Season Sale Up to 70% OFF
        </span>
        <button className={styles.saleBtn}>SALE</button>
      </div>
    </div>
  );
}
