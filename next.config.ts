import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@neondatabase/serverless", "@anthropic-ai/sdk"],
  env: {
    DATABASE_URL: process.env.DATABASE_URL ?? "",
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
  },
};

export default nextConfig;
