import type { Metadata } from "next";
import { alternates } from "@/lib/canonical";
import ResultsPage from "@/components/pages/ResultsPage";
import resultsText from "@/lib/i18n/results";

const t = resultsText.en.meta;
export const metadata: Metadata = { title: t.title, description: t.description, alternates: alternates("/results") };

// Every minute on election night; before then the page only says when the count starts.
export const revalidate = 60;

export default function Page() {
  return <ResultsPage lang="en" revalidate={revalidate} />;
}
