import "@/lib/i18n/fa/register";
import PollsPage from "@/components/pages/PollsPage";
import text from "@/lib/i18n/polls";
import { localizedAlternates } from "@/lib/canonical";
export const revalidate = 3600;
export const metadata = {title: text.fa.meta.title, description: text.fa.meta.description, alternates: localizedAlternates("/fa/polls")};
export default function Page() { return <PollsPage lang="fa" />; }
