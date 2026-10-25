import "@/lib/i18n/ar/register";
import HomePage from "@/components/pages/HomePage";
import text from "@/lib/i18n/home";
import { localizedAlternates } from "@/lib/canonical";
export const revalidate = 3600;
export const metadata = {title: text.ar.title, description: text.ar.hero.standfirst, alternates: localizedAlternates("/ar")};
export default function Page() { return <HomePage lang="ar" revalidate={revalidate} />; }
