import type { Metadata } from "next";
import SectionIndex from "@/components/article/SectionIndex";
import { communityIndex } from "@/lib/content";

const INTRO =
  "Nine groups of Israeli voters: how many they are and where they live, how their towns have voted since 2019, what they think on the six big issues, and who they are in their own words. The groups overlap; they are not a ranking or a hierarchy.";

export const metadata: Metadata = { title: "Communities", description: INTRO };

export default async function Page() {
  const items = (await communityIndex()).map((s) => ({ href: s.href, title: s.meta.title, dek: s.meta.dek }));
  return <SectionIndex title="Communities" intro={INTRO} items={items} />;
}
