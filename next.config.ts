import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * Evita depender de `/_next/image` (en Vercel puede responder 402 por cuota del optimizador).
     * Cargamos imágenes remotas en origen para asegurar fotos de propiedades y logos.
     */
    unoptimized: true,
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
