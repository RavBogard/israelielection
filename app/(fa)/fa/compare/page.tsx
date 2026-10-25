import "@/lib/i18n/fa/register";
import ComparePage from "@/components/pages/ComparePage";
import text from "@/lib/i18n/compare";
import { localizedAlternates } from "@/lib/canonical";
export const revalidate = 3600;
export const metadata = {title: text.fa.title, description: text.fa.description, alternates: localizedAlternates("/fa/compare")};
export default function Page() { return <ComparePage lang="fa" />; }
