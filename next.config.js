/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'via.placeholder.com',
      'example.com'
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "1111eptx.com", "www.1111eptx.com"],
    },
  },
};

module.exports = nextConfig;
