import type { Metadata } from "next";
import { alternates } from "@/lib/canonical";
import SectionIndex from "@/components/article/SectionIndex";
import { Chart } from "@/components/article/Article";
import { LEAD_CHARTS } from "@/components/article/leads";
import VotingRightsGuide from "@/components/VotingRightsGuide";
import { guideIndex } from "@/lib/content";

const INTRO =
  "The machinery of an Israeli election: how votes become Knesset seats, how a government is formed after the count, how Israelis cast their ballots, and who under Israeli rule has no vote at all.";

export const metadata: Metadata = { title: "How it works", description: INTRO, alternates: alternates("/how-it-works") };

const LEAD = "The machinery of an Israeli election, each part shown by the figure its page opens with.";

export default async function Page() {
  const items = (await guideIndex()).map((s) => {
    const lead = LEAD_CHARTS[s.href];
    const figure = s.slug === "who-votes" ? <VotingRightsGuide /> : lead && <div className="article ix-fig"><Chart id={lead} compact /></div>;
    return { href: s.href, title: s.meta.title, dek: s.meta.dek, figure };
  });
  return <SectionIndex title="How it works" intro={LEAD} items={items} extra={{ href: "/vote-map", title: "Vote map", dek: "How each locality voted, 2019–2022, list by list.", label: "Also" }} />;
}
