import "@/lib/i18n/fa/register";
import ResultsPage from "@/components/pages/ResultsPage";
import text from "@/lib/i18n/results";
import { localizedAlternates } from "@/lib/canonical";
export const revalidate = 60;
export const metadata = {title: text.fa.meta.title, description: text.fa.meta.description, alternates: localizedAlternates("/fa/results")};
export default function Page() { return <ResultsPage lang="fa" revalidate={revalidate} />; }
