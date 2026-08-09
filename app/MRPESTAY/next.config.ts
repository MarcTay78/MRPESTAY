import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/app/MRPESTAY",
  trailingSlash: true,
  async redirects() {
    return [{ source: "/", destination: "/dashboard", permanent: false }];
  },
};

export default nextConfig;
