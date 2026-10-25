import "@/lib/i18n/fa/register";
import HomePage from "@/components/pages/HomePage";
import text from "@/lib/i18n/home";
import { localizedAlternates } from "@/lib/canonical";
export const revalidate = 3600;
export const metadata = {title: text.fa.title, description: text.fa.hero.standfirst, alternates: localizedAlternates("/fa")};
export default function Page() { return <HomePage lang="fa" revalidate={revalidate} />; }
