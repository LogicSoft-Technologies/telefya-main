import path from "node:path";
import type { NextConfig } from "next";

const selfieSegmentationShim = path.resolve(
  process.cwd(),
  "lib/media/selfie-segmentation-shim.ts",
);

const nextConfig: NextConfig = {
  reactStrictMode: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  turbopack: {
    resolveAlias: {
      "@mediapipe/selfie_segmentation":
        "./lib/media/selfie-segmentation-shim.ts",
    },
  },

  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@mediapipe/selfie_segmentation": selfieSegmentationShim,
    };

    return config;
  },
};

export default nextConfig;