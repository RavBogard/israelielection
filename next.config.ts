import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // The Coalition Builder moved to the home page; old shared links keep their ?poll=&with= query.
    return [{ source: "/coalition", destination: "/", permanent: true }];
  },
};

export default nextConfig;
