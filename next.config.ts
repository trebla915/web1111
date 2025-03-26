import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // ⚠️ Warning: Enabling this will disable TypeScript errors during builds
    ignoreBuildErrors: true,
  },
  eslint: {
    // ⚠️ Warning: Enabling this will disable ESLint errors during builds
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-icons/fi': 'react-icons/fi/index'
    }
    return config
  }
};

module.exports = nextConfig;
