import "@/lib/i18n/fr/register";
import ResultsPage from "@/components/pages/ResultsPage";
import text from "@/lib/i18n/results";
import { localizedAlternates } from "@/lib/canonical";
export const revalidate = 60;
export const metadata = {title: text.fr.meta.title, description: text.fr.meta.description, alternates: localizedAlternates("/fr/results")};
export default function Page() { return <ResultsPage lang="fr" revalidate={revalidate} />; }
