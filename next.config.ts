import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb' // allow large video uploads
    }
  }
};

export default nextConfig;
