// Loads the Hebrew interface words before this module reads them (lib/i18n/he-text.ts).
import "@/lib/i18n/he/register";
import type { Metadata } from "next";
import { heAlternates } from "@/lib/canonical";
import HomePage from "@/components/pages/HomePage";
import chrome from "@/lib/i18n/chrome";

// As the English home: every minute, for election night.
export const revalidate = 60;

export const metadata: Metadata = { title: { absolute: chrome.he.siteName }, description: chrome.he.description, alternates: heAlternates("/he") };

export default function Page() {
  return <HomePage lang="he" revalidate={revalidate} />;
}
