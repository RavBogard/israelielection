import type { Metadata } from "next";
import SectionIndex from "@/components/article/SectionIndex";
import { Chart } from "@/components/article/Article";
import { LEAD_CHARTS } from "@/components/article/leads";
import { communityIndex } from "@/lib/content";

const INTRO =
  "Nine groups of Israeli voters: how many they are and where they live, how their towns have voted since 2019, what they think on the six big issues, and who they are in their own words. The groups overlap; they are not a ranking or a hierarchy.";

export const metadata: Metadata = { title: "Communities", description: INTRO };

/** The head says one thing; each group then shows the chart its page opens with. */
const LEAD = "Nine groups of Israeli voters, each shown by the chart its page opens with.";
const FOOT = "The groups overlap; they are not a ranking or a hierarchy. Each page covers how many they are and where they live, how their towns have voted since 2019, what they think on the six big issues, and who they are in their own words.";

export default async function Page() {
  const items = (await communityIndex()).map((s) => {
    const lead = LEAD_CHARTS[s.href];
    return { href: s.href, title: s.meta.title, dek: s.meta.dek, figure: lead && <div className="article ix-fig"><Chart id={lead} /></div> };
  });
  return <SectionIndex title="Communities" intro={LEAD} items={items} foot={FOOT} />;
}
