"use client";
import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import styles from "./ImageGallery.module.css";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

const images = [
  {
    src: `${BASE_PATH}/assets/Rectangle 37.png`,
    alt: "Earrings collection",
    gridArea: "left",
  },
  {
    src: `${BASE_PATH}/assets/Rectangle 32.png`,
    alt: "Rings collection",
    gridArea: "mid-top",
  },
  {
    src: `${BASE_PATH}/assets/Rectangle 23.png`,
    alt: "Ring styling detail",
    gridArea: "mid-bottom-left",
  },
  {
    src: `${BASE_PATH}/assets/Rectangle 34.png`,
    alt: "Bracelet styling detail",
    gridArea: "mid-bottom-right",
  },
  {
    src: `${BASE_PATH}/assets/Rectangle 22.png`,
    alt: "Bracelet collection detail",
    gridArea: "right",
  },
];

export default function ImageGallery() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className={styles.section} id="image-gallery" ref={ref}>
      <div className={styles.container}>
        <motion.h2
          className={styles.title}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          Image Gallery
        </motion.h2>
        <motion.p
          className={styles.subtitle}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Phasellus lorem malesuada ligula pulvinar commodo maecenas
        </motion.p>

        <div className={styles.grid}>
          {images.map((img, idx) => (
            <motion.div
              key={idx}
              className={`${styles.gridItem} ${styles[img.gridArea.replace(/-/g, "")]}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + idx * 0.1 }}
            >
              <div className={styles.imageWrap}>
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className={styles.image}
                />
                <div className={styles.overlay}>
                  <span className={styles.zoomText}>View Style</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
