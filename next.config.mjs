import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
// NOTE: `output: 'export'` (static export for GitHub Pages) was removed so the
// website can run server-side API routes and connect to MongoDB directly.
// Deploy on a Node host (e.g. Vercel) and set MONGODB_URI in its env.
const nextConfig = {
  images: {
    unoptimized: true,
  },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
  serverExternalPackages: ['mongodb'],
  // Pin the Turbopack workspace root to THIS folder so the multi-lockfile repo
  // doesn't make Next.js infer the wrong root (and pull in admin-panel files).
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
