/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'lh3.googleusercontent.com' // Add if using Google user content URLs
    ],
  },
  // Remove experimental flag if using Next.js 13.4+
  // experimental: {
  //   appDir: true,
  // },
};

module.exports = nextConfig;