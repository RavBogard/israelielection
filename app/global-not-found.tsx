import type { Metadata } from "next";
import EnglishShell, { EN_METADATA, VIEWPORT } from "@/components/EnglishShell";
import NotFound from "./(en)/not-found";
import "./globals.css";

// Unmatched URLs anywhere on the site. With two root layouts ((en) and (he)/he) there is no single layout to
// compose a 404 from, so Next renders this file instead (experimental.globalNotFound in next.config.ts). It wraps
// the English not-found body in the English chrome; notFound() inside English pages still uses app/(en)/not-found.tsx.

export const metadata: Metadata = { ...EN_METADATA, title: "Not found | Israel Votes 2026" };

export const viewport = VIEWPORT;

export default function GlobalNotFound() {
  return (
    <EnglishShell>
      <NotFound />
    </EnglishShell>
  );
}
