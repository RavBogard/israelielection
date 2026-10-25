import "@/lib/i18n/zh/register";
import ComparePage from "@/components/pages/ComparePage";
import text from "@/lib/i18n/compare";
import { localizedAlternates } from "@/lib/canonical";
export const revalidate = 3600;
export const metadata = {title: text.zh.title, description: text.zh.description, alternates: localizedAlternates("/zh/compare")};
export default function Page() { return <ComparePage lang="zh" />; }
