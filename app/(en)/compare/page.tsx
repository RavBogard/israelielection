import type { Metadata } from "next";
import { alternates } from "@/lib/canonical";
import ComparePage from "@/components/pages/ComparePage";
import compareText from "@/lib/i18n/compare";

export const metadata: Metadata = { title: compareText.en.title, description: compareText.en.description, alternates: alternates("/compare") };

export default function Page() {
  return <ComparePage lang="en" />;
}
