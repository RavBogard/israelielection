import "@/lib/i18n/zh/register";
import ResultsPage from "@/components/pages/ResultsPage";
import text from "@/lib/i18n/results";
import { localizedAlternates } from "@/lib/canonical";
export const revalidate = 60;
export const metadata = {title: text.zh.meta.title, description: text.zh.meta.description, alternates: localizedAlternates("/zh/results")};
export default function Page() { return <ResultsPage lang="zh" revalidate={revalidate} />; }
