import { NextResponse } from "next/server";

// Single authorized admin identity (kept in sync with lib/auth.js).
const ADMIN_EMAIL = "admin@jw.com";
const ADMIN_UID = "zsTvN4fN6FbGuYVSoVHlji2bvLA3";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function deny(status, error) {
  return NextResponse.json({ error }, { status, headers: CORS });
}

// Edge-safe base64url JWT payload decode (no Node Buffer in this runtime).
function decodeJwt(token) {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    const json = decodeURIComponent(
      bin
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Returns { uid, email, isAdmin } on success, or { status, error } on failure.
function getClaims(req) {
  const header = req.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return { status: 401, error: "Missing authentication token" };
  const token = header.slice(7).trim();
  if (!token) return { status: 401, error: "Missing authentication token" };

  const payload = decodeJwt(token);
  if (!payload) return { status: 401, error: "Invalid token" };

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) return { status: 401, error: "Token expired" };
  if (projectId && payload.aud !== projectId) return { status: 401, error: "Invalid token audience" };
  if (projectId && payload.iss !== `https://securetoken.google.com/${projectId}`)
    return { status: 401, error: "Invalid token issuer" };

  const uid = payload.user_id || payload.sub;
  if (!uid) return { status: 401, error: "Invalid token" };
  const email = (payload.email || "").toLowerCase();
  return { uid, email, isAdmin: uid === ADMIN_UID || email === ADMIN_EMAIL };
}

const CATALOG = ["/api/products", "/api/categories", "/api/blogs", "/api/faqs", "/api/specifications"];
const startsWithAny = (path, list) => list.some((p) => path === p || path.startsWith(p + "/"));

export function proxy(req) {
  const { pathname, searchParams } = req.nextUrl;
  const method = req.method;

  // CORS preflight is handled by each route's OPTIONS handler.
  if (method === "OPTIONS") return NextResponse.next();

  // ── PUBLIC (no token) ──────────────────────────────────────────────
  // Catalog reads (so products/categories/blogs/faqs are visible to anyone,
  // no login required) + public submissions (contact form, guest checkout).
  const isCatalogRead = method === "GET" && startsWithAny(pathname, CATALOG);
  const isPublicSubmit = method === "POST" && (pathname === "/api/contact" || pathname === "/api/orders");
  if (isCatalogRead || isPublicSubmit) return NextResponse.next();

  // ── Everything else requires a valid token ─────────────────────────
  const claims = getClaims(req);
  if (claims.status) return deny(claims.status, claims.error);

  // ── ADMIN-only ─────────────────────────────────────────────────────
  const isCatalogWrite =
    (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE") &&
    startsWithAny(pathname, CATALOG);
  const isAdminArea =
    pathname === "/api/db-init" ||
    pathname === "/api/stats" ||
    startsWithAny(pathname, ["/api/upload"]) ||
    startsWithAny(pathname, ["/api/product-reviews"]) ||
    startsWithAny(pathname, ["/api/settings"]) ||
    (pathname === "/api/contact" && method === "GET") ||
    isCatalogWrite;

  if (isAdminArea) {
    if (!claims.isAdmin) return deny(403, "Admin access required");
    return NextResponse.next();
  }

  // ── Orders: own orders for owner; everything else admin ─────────────
  if (startsWithAny(pathname, ["/api/orders"])) {
    const userId = searchParams.get("user_id");
    if (method === "GET" && userId) {
      if (!claims.isAdmin && userId !== claims.uid) return deny(403, "Forbidden");
      return NextResponse.next();
    }
    if (!claims.isAdmin) return deny(403, "Admin access required");
    return NextResponse.next();
  }

  // ── Customer endpoints (valid token sufficient; route enforces ownership) ──
  // e.g. /api/users/profile — the route itself checks self-vs-admin access.
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
