import type { Metadata } from "next";
import { heAlternates } from "@/lib/canonical";
import ComparePage from "@/components/pages/ComparePage";
import compareText from "@/lib/i18n/compare";

export const metadata: Metadata = { title: compareText.he.title, description: compareText.he.description, alternates: heAlternates("/he/compare") };

export default function Page() {
  return <ComparePage lang="he" />;
}
