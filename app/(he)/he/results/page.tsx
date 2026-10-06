// Loads the Hebrew interface words before this module reads them (lib/i18n/he-text.ts).
import "@/lib/i18n/he/register";
import type { Metadata } from "next";
import { heAlternates } from "@/lib/canonical";
import ResultsPage from "@/components/pages/ResultsPage";
import resultsText from "@/lib/i18n/results";

const t = resultsText.he.meta;
export const metadata: Metadata = { title: t.title, description: t.description, alternates: heAlternates("/he/results") };

// Every minute on election night, as the English page.
export const revalidate = 60;

export default function Page() {
  return <ResultsPage lang="he" revalidate={revalidate} />;
}
