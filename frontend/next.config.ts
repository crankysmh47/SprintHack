import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },
  },
  // Also try separate key if the above is for actions
  // allowedDevOrigins is not yet in standard types for all versions, but let's try strict config
};

export default nextConfig;
