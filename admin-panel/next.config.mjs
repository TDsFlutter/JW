import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* admin panel runs as a Node.js API server, not a static export */
  serverExternalPackages: ['mongodb', '@aws-sdk/client-s3'],
  // Pin BOTH roots to THIS folder. Without this, Next.js walks up and picks the
  // repo-root lockfile as the root, then tries to compile the website's
  // instrumentation.js / lib/mongodb.js during the admin build — where mongodb
  // isn't installed on Vercel. (Fixes "Can't resolve 'mongodb'".)
  //
  // On Vercel, `outputFileTracingRoot` is forced to the repo root and OVERRIDES
  // `turbopack.root` unless we set it to the same value here — otherwise the
  // effective root reverts to the repo root and the cross-app build breaks.
  outputFileTracingRoot: __dirname,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
