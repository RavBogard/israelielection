import type { Metadata } from "next";
import PageHead from "@/components/PageHead";
import { heAlternates } from "@/lib/canonical";
import chrome from "@/lib/i18n/chrome";

// Placeholder until wave 2A builds the Hebrew home from components/pages/HomePage.tsx.
const t = chrome.he;

export const metadata: Metadata = { title: { absolute: t.siteName }, alternates: heAlternates("/he") };

export default function HebrewHome() {
  return (
    <div className="wrap">
      <PageHead title={t.homeTitle} standfirst={t.homeStandfirst} />
    </div>
  );
}
