import "@/lib/i18n/de/register";
import PollsPage from "@/components/pages/PollsPage";
import text from "@/lib/i18n/polls";
import { localizedAlternates } from "@/lib/canonical";
export const revalidate = 3600;
export const metadata = {title: text.de.meta.title, description: text.de.meta.description, alternates: localizedAlternates("/de/polls")};
export default function Page() { return <PollsPage lang="de" />; }
