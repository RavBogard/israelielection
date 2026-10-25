import "@/lib/i18n/de/register";
import ResultsPage from "@/components/pages/ResultsPage";
import text from "@/lib/i18n/results";
import { localizedAlternates } from "@/lib/canonical";
export const revalidate = 60;
export const metadata = {title: text.de.meta.title, description: text.de.meta.description, alternates: localizedAlternates("/de/results")};
export default function Page() { return <ResultsPage lang="de" revalidate={revalidate} />; }
