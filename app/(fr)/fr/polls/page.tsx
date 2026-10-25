import "@/lib/i18n/fr/register";
import PollsPage from "@/components/pages/PollsPage";
import text from "@/lib/i18n/polls";
import { localizedAlternates } from "@/lib/canonical";
export const revalidate = 3600;
export const metadata = {title: text.fr.meta.title, description: text.fr.meta.description, alternates: localizedAlternates("/fr/polls")};
export default function Page() { return <PollsPage lang="fr" />; }
