import "@/lib/i18n/ar/register";
import PollsPage from "@/components/pages/PollsPage";
import text from "@/lib/i18n/polls";
import { localizedAlternates } from "@/lib/canonical";
export const revalidate = 3600;
export const metadata = {title: text.ar.meta.title, description: text.ar.meta.description, alternates: localizedAlternates("/ar/polls")};
export default function Page() { return <PollsPage lang="ar" />; }
