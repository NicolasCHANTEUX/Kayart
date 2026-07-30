import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "80mb"
    }
  },
  images: {
    remotePatterns: []
  }
};

export default nextConfig;
