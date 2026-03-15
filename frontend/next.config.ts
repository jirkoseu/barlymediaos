import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [new URL("https://cdn.sktorrent.eu/**")],
  },
};

export default nextConfig;
