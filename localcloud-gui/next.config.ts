import type { NextConfig } from "next";

// When running GUI standalone (npm run dev), proxy /api to backend. In Docker, nginx handles /api.
const API_PROXY_TARGET = process.env.API_PROXY_TARGET || "http://localhost:3031";

const nextConfig: NextConfig = {
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "https://app-local.localcloudkit.com:3030/api",
  },

  // Proxy /api to backend when running standalone dev (avoids 404/Network Error)
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_PROXY_TARGET}/api/:path*` }];
  },

  // Improve performance
  compress: true,

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            // Allow same-origin framing (needed for Keycloak auth flows)
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            // Allow framing from the app domain and Keycloak subdomain;
            // upgrade-insecure-requests ensures any stray http:// sub-resources
            // are promoted to https automatically.
            key: "Content-Security-Policy",
            value: [
              "frame-ancestors 'self' https://keycloak.localcloudkit.com:3030",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
