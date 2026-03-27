import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.pike.replit.dev",
    "*.sisko.replit.dev",
    "*.replit.dev",
    "*.replit.app",
  ],
  transpilePackages: ["firebase"],
  experimental: {
    optimizePackageImports: ["firebase"],
  },
};

export default nextConfig;
