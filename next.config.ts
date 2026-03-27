import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.pike.replit.dev",
    "*.sisko.replit.dev",
    "*.replit.dev",
    "*.replit.app",
  ],
};

export default nextConfig;
