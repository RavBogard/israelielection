import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "mdx"],
  async redirects() {
    // The Coalition Builder moved to the home page; old shared links keep their ?poll=&with= query.
    // The Palestinian-state issue page took its title's address (ruling 108).
    return [
      { source: "/coalition", destination: "/", permanent: true },
      { source: "/issues/not-on-ballot", destination: "/issues/palestinian-state", permanent: true },
    ];
  },
};

// Reference pages are MDX in content/; their charts and party tables live in data/ (see lib/articles.ts).
export default createMDX({})(nextConfig);
