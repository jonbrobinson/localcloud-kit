import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3030/api",
  },
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Set the port for development
  devIndicators: {
    buildActivity: false,
  },
};

export default nextConfig;
