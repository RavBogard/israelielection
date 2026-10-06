import type { Metadata } from "next";
import SectionIndex from "@/components/article/SectionIndex";
import { SplitMini } from "@/components/article/Article";
import { issueIndex } from "@/lib/content";
import { meta as lens } from "@/content/american-lens.mdx";

const INTRO =
  "Seven questions in Israel's 2026 election, and how Israelis divide on each. What Americans most expect to find, Palestinian statehood and the conduct of the war in Gaza, is not a top-tier issue for the Jewish-majority parties or in what their voters say will decide the vote: see A Palestinian state and the 2026 vote, and the American lens.";

export const metadata: Metadata = { title: "Issues", description: INTRO };

/** The page head says one thing; the rest of the intro is the American lens card below. */
const LEAD = "Seven questions in Israel's 2026 election, and where the Knesset splits on each, by the lists' seats in the polling average.";

export default async function Page() {
  const items = (await issueIndex()).map((s) => ({ href: s.href, title: s.meta.title, dek: s.meta.dek, figure: <SplitMini issue={s.href.split("/").at(-1)!} /> }));
  return (
    <SectionIndex
      title="Issues"
      intro={LEAD}
      items={items}
      extra={{ href: "/american-lens", title: lens.title, dek: lens.dek, label: "Also" }}
    />
  );
}
