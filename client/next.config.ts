import type { NextConfig } from "next";

// Where the Express API runs. The browser only ever talks to Next.js; requests to
// /api/* are proxied to Express, so the login cookie stays first-party (no CORS needed).
const API_URL = process.env.API_URL || "http://localhost:5000";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
