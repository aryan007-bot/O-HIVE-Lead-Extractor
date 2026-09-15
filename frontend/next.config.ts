import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "https://ohive-backend.onrender.com/api/v1/:path*",
      },
      {
        source: "/health",
        destination: "https://ohive-backend.onrender.com/health",
      },
    ];
  },
};

export default nextConfig;
