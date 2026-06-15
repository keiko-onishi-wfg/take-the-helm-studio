import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@neondatabase/serverless"],
  env: {
    DATABASE_URL: process.env.DATABASE_URL ?? "",
  },
};

export default nextConfig;
