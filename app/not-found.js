"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductPageClient from "./products/[slug]/ProductPageClient";

// On a static export, product detail pages are pre-rendered per slug at build
// time. Any product whose slug was not in the build (e.g. added via the admin
// panel afterwards, or when the build could not reach the products API) is
// served this 404 document by the static host. Because the product page is
// fully client-rendered from the API anyway, we recover here by detecting a
// /products/<slug> path and rendering the product client page for it.
export default function NotFound() {
  const [slug, setSlug] = useState(undefined); // undefined = still checking

  useEffect(() => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    let path = window.location.pathname;
    if (basePath && path.startsWith(basePath)) {
      path = path.slice(basePath.length);
    }
    const match = path.match(/^\/products\/([^/]+)\/?$/);
    if (match && match[1] !== "_placeholder") {
      setSlug(decodeURIComponent(match[1]));
    } else {
      setSlug(null);
    }
  }, []);

  if (slug === undefined) {
    return (
      <div style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#707070", fontStyle: "italic" }}>Loading...</p>
      </div>
    );
  }

  if (slug) {
    return <ProductPageClient params={Promise.resolve({ slug })} />;
  }

  return (
    <div
      style={{
        minHeight: "55vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px 20px",
      }}
    >
      <h1 style={{ fontSize: "3rem", margin: 0, color: "#1a1a1a" }}>404</h1>
      <p style={{ color: "#707070", margin: "12px 0 24px" }}>
        This page could not be found.
      </p>
      <Link
        href="/shop"
        style={{
          background: "#1a1a1a",
          color: "#fff",
          padding: "12px 28px",
          borderRadius: "4px",
          textDecoration: "none",
          fontSize: "0.85rem",
          letterSpacing: "0.05em",
        }}
      >
        Back to Shop
      </Link>
    </div>
  );
}
