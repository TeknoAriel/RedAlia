import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.kiteprop.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.kiteprop.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "kiteprop.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.kiteprop.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.kiteprop.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
