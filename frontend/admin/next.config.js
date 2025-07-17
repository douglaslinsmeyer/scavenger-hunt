/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  
  // Configure base path for admin app when deployed
  basePath: process.env.BASE_PATH || '/admin',
  assetPrefix: process.env.BASE_PATH || '/admin',
  
  // Environment variables
  env: {
    BACKEND_BASE_URL: process.env.BACKEND_BASE_URL || 'http://localhost/api',
    BASE_PATH: process.env.BASE_PATH || '/admin',
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