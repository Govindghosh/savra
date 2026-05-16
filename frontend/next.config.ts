import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_POLLING_INTERVAL_MS: process.env.NEXT_PUBLIC_POLLING_INTERVAL_MS
  }
};

export default nextConfig;
