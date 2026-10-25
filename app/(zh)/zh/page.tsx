import "@/lib/i18n/zh/register";
import HomePage from "@/components/pages/HomePage";
import text from "@/lib/i18n/home";
import { localizedAlternates } from "@/lib/canonical";
export const revalidate = 3600;
export const metadata = {title: text.zh.title, description: text.zh.hero.standfirst, alternates: localizedAlternates("/zh")};
export default function Page() { return <HomePage lang="zh" revalidate={revalidate} />; }
