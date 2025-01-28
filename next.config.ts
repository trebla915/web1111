import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['firebasestorage.googleapis.com'], // Allow Firebase Storage URLs for images
  },
};

export default nextConfig;