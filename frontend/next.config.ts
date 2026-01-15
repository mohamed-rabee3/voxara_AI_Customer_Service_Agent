import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React strict mode for development
  reactStrictMode: true,

  // Environment variables exposed to the client
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    NEXT_PUBLIC_LIVEKIT_URL: process.env.NEXT_PUBLIC_LIVEKIT_URL || "",
  },

  // Image optimization domains (if needed)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.livekit.cloud",
      },
    ],
  },

  // Turbopack configuration (Next.js 15+)
  turbopack: {},
};

export default nextConfig;
