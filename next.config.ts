import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // If you plan to deploy to a subdirectory (like GitHub Pages)
  // basePath: '/your-repo-name',
  // assetPrefix: '/your-repo-name',
};

export default nextConfig;
