import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* admin panel runs as a Node.js API server, not a static export */
  serverExternalPackages: ['mongodb', '@aws-sdk/client-s3'],
  // Pin the Turbopack workspace root to THIS folder so the multi-lockfile repo
  // doesn't make Next.js infer the wrong root locally (and pull in the website's
  // instrumentation.js / lib/mongodb.js). On Vercel, the project's Root Directory
  // is set to `admin-panel` with "include files outside root" disabled, so the
  // build is already isolated — do NOT also pin outputFileTracingRoot, or it
  // conflicts with Vercel's output path and breaks the deploy step.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
