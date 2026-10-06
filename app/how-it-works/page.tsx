import type { Metadata } from "next";
import { alternates } from "@/lib/canonical";
import SectionIndex from "@/components/article/SectionIndex";
import OnePage from "@/components/article/OnePage";
import { guideIndex } from "@/lib/content";

const INTRO =
  "The machinery of an Israeli election: how votes become Knesset seats, how a government is formed after the count, how Israelis cast their ballots, and who under Israeli rule has no vote at all.";

export const metadata: Metadata = { title: "How it works", description: INTRO, alternates: alternates("/how-it-works") };

const LEAD = "The machinery of an Israeli election, from the ballot slip to a sworn-in government.";

export default async function Page() {
  const guides = await guideIndex();
  const panel = (slug: string) => {
    const g = guides.find((s) => s.slug === slug)!;
    return { href: g.href, title: g.meta.title };
  };
  const items = guides.map((s) => ({ href: s.href, title: s.meta.title, dek: s.meta.dek }));
  const band = <OnePage voting={panel("voting")} seats={panel("seats")} forming={panel("forming-a-government")} whoVotes={panel("who-votes")} />;
  return <SectionIndex title="How it works" intro={LEAD} band={band} items={items} extra={{ href: "/vote-map", title: "Vote map", dek: "How each locality voted, 2019–2022, list by list.", label: "Also" }} />;
}
