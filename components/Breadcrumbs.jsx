import Link from "next/link";
import styles from "./Breadcrumbs.module.css";

export default function Breadcrumbs({ items }) {
  return (
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
      <ol className={styles.list}>
        {items.map((item, idx) => (
          <li key={idx} className={styles.item}>
            {idx < items.length - 1 ? (
              <>
                <Link href={item.href} className={styles.link}>
                  {item.label}
                </Link>
                <span className={styles.separator}>/</span>
              </>
            ) : (
              <span className={styles.current}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
