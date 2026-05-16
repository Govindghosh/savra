import type { NextConfig } from "next";
import path from "node:path";
try {
  const { config: loadEnv } = await import("dotenv");
  loadEnv({ path: path.resolve(process.cwd(), "../.env") });
} catch (e) {
  // dotenv not found, probably production
}


const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_POLLING_INTERVAL_MS: process.env.NEXT_PUBLIC_POLLING_INTERVAL_MS
  }
};

export default nextConfig;
