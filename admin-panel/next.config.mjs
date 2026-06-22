import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* admin panel runs as a Node.js API server, not a static export */
  serverExternalPackages: ['mongodb', '@aws-sdk/client-s3'],
  // Pin the Turbopack workspace root to THIS folder. Without this, Next.js
  // walks up and picks the repo-root lockfile as the root, then tries to
  // compile the website's instrumentation.js/lib/mongodb.js during the admin
  // build — where mongodb isn't installed on Vercel. (Fixes "Can't resolve 'mongodb'".)
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
