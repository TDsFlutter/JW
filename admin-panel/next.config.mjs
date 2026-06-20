/** @type {import('next').NextConfig} */
const nextConfig = {
  /* admin panel runs as a Node.js API server, not a static export */
  serverExternalPackages: ['mongodb', '@aws-sdk/client-s3'],
};

export default nextConfig;
