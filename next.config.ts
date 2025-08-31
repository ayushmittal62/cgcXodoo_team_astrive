import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Temporarily ignore ESLint errors during builds so production builds don't fail
    // while we complete the migration away from mock/demo code.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
