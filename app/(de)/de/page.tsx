import "@/lib/i18n/de/register";
import HomePage from "@/components/pages/HomePage";
import text from "@/lib/i18n/home";
import { localizedAlternates } from "@/lib/canonical";
export const revalidate = 3600;
export const metadata = {title: text.de.title, description: text.de.hero.standfirst, alternates: localizedAlternates("/de")};
export default function Page() { return <HomePage lang="de" revalidate={revalidate} />; }
