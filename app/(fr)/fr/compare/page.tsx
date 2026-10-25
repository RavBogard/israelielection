import "@/lib/i18n/fr/register";
import ComparePage from "@/components/pages/ComparePage";
import text from "@/lib/i18n/compare";
import { localizedAlternates } from "@/lib/canonical";
export const revalidate = 3600;
export const metadata = {title: text.fr.title, description: text.fr.description, alternates: localizedAlternates("/fr/compare")};
export default function Page() { return <ComparePage lang="fr" />; }
