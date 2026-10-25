import "@/lib/i18n/ar/register";
import ComparePage from "@/components/pages/ComparePage";
import text from "@/lib/i18n/compare";
import { localizedAlternates } from "@/lib/canonical";
export const revalidate = 3600;
export const metadata = {title: text.ar.title, description: text.ar.description, alternates: localizedAlternates("/ar/compare")};
export default function Page() { return <ComparePage lang="ar" />; }
