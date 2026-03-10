import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "https://app-local.localcloudkit.com:3030/api",
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
