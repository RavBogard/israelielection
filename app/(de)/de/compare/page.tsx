import "@/lib/i18n/de/register";
import ComparePage from "@/components/pages/ComparePage";
import text from "@/lib/i18n/compare";
import { localizedAlternates } from "@/lib/canonical";
export const revalidate = 3600;
export const metadata = {title: text.de.title, description: text.de.description, alternates: localizedAlternates("/de/compare")};
export default function Page() { return <ComparePage lang="de" />; }
