import "@/lib/i18n/zh/register";
import PollsPage from "@/components/pages/PollsPage";
import text from "@/lib/i18n/polls";
import { localizedAlternates } from "@/lib/canonical";
export const revalidate = 3600;
export const metadata = {title: text.zh.meta.title, description: text.zh.meta.description, alternates: localizedAlternates("/zh/polls")};
export default function Page() { return <PollsPage lang="zh" />; }
