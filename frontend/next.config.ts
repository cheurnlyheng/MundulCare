import type { NextConfig } from "next";

// Server-only (not NEXT_PUBLIC_) so it never ships to the browser - the browser only
// ever talks to this Next.js origin, which proxies to the backend behind the scenes.
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`, // Forward to Spring Boot
      },
      {
        source: '/uploads/:path*',
        destination: `${BACKEND_URL}/uploads/:path*`, // Uploaded profile/doctor photos
      },
    ];
  },
};

export default nextConfig;
