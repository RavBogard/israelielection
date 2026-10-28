import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/embed/", "/api/"],
    },
    sitemap: "https://www.israelvotes.org/sitemap.xml",
  };
}
