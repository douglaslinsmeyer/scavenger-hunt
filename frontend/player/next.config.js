/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  
  // No basePath needed - player app serves from root
  
  // Environment variables
  env: {
    BACKEND_BASE_URL: process.env.BACKEND_BASE_URL || 'http://localhost/api',
    WS_URL: process.env.WS_URL || 'ws://localhost:3000',
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;