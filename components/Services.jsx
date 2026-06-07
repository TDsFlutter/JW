"use client";
import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import styles from "./Services.module.css";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

const services = [
  {
    icon: `${BASE_PATH}/assets/Frame 42.png`,
    title: "FREE SHIPPING",
    description: "Lorem ipsum dolor sit amet,",
  },
  {
    icon: `${BASE_PATH}/assets/package.png`,
    title: "FREE IN STORE RETURN",
    description: "Lorem ipsum dolor sit amet,",
  },
  {
    icon: `${BASE_PATH}/assets/gala_secure.png`,
    title: "100%SECURE CHECKOUT",
    description: "Lorem ipsum dolor sit amet,",
  },
];

export default function Services() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className={styles.section} id="services" ref={ref}>
      <div className={styles.container}>
        {services.map((service, idx) => (
          <motion.div
            key={idx}
            className={styles.item}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: idx * 0.15 }}
          >
            <div className={styles.iconWrap}>
              <Image
                src={service.icon}
                alt={service.title}
                width={40}
                height={40}
                className={styles.icon}
              />
            </div>
            <div className={styles.text}>
              <h4 className={styles.serviceTitle}>{service.title}</h4>
              <p className={styles.serviceDesc}>{service.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
