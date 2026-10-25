import "@/lib/i18n/fr/register";
import HomePage from "@/components/pages/HomePage";
import text from "@/lib/i18n/home";
import { localizedAlternates } from "@/lib/canonical";
export const revalidate = 3600;
export const metadata = {title: text.fr.title, description: text.fr.hero.standfirst, alternates: localizedAlternates("/fr")};
export default function Page() { return <HomePage lang="fr" revalidate={revalidate} />; }
