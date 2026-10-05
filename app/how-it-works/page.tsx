import type { Metadata } from "next";
import SectionIndex from "@/components/article/SectionIndex";
import { guideIndex } from "@/lib/content";

const INTRO =
  "The machinery of an Israeli election: how votes become Knesset seats, how a government is formed after the count, and how Israelis cast their ballots.";

export const metadata: Metadata = { title: "How it works", description: INTRO };

export default async function Page() {
  const items = (await guideIndex()).map((s) => ({ href: s.href, title: s.meta.title, dek: s.meta.dek }));
  return <SectionIndex title="How it works" intro={INTRO} items={items} extra={{ href: "/vote-map", title: "Vote map", dek: "How each locality voted, 2019–2022, list by list.", label: "Also" }} />;
}
