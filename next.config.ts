import path from "node:path";
import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "mdx"],
  async redirects() {
    // The Coalition Builder has its own page again; old shared links keep their ?poll=&with= query.
    // The Palestinian-state issue page took its title's address (ruling 108).
    return [
      { source: "/coalition", destination: "/coalition-builder", permanent: true },
      { source: "/issues/not-on-ballot", destination: "/issues/palestinian-state", permanent: true },
      // Teaching resources were dropped (Daniel, 2026-10-06); old links land on the home page.
      { source: "/teach", destination: "/", permanent: false },
      { source: "/teach/:path*", destination: "/", permanent: false },
      // The changes log was cut (Daniel, 2026-10-06); dated developments are in the briefings.
      { source: "/changes", destination: "/news", permanent: true },
    ];
  },
};

// Reference pages are MDX in content/; their charts and party tables live in data/ (see lib/articles.ts).
// Glossary terms link to /glossary on first use (lib/remark-glossary.mjs; a string so Turbopack can load it).
export default createMDX({ options: { remarkPlugins: [path.join(process.cwd(), "lib/remark-glossary.mjs"), path.join(process.cwd(), "lib/remark-headings.mjs")] } })(nextConfig);
