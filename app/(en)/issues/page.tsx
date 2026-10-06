import type { Metadata } from "next";
import { alternates } from "@/lib/canonical";
import SectionIndex from "@/components/article/SectionIndex";
import { SplitMini } from "@/components/article/Article";
import { issueIndex } from "@/lib/content";
import { meta as lens } from "@/content/american-lens.mdx";

export const metadata: Metadata = { title: "Issues", description: "Seven questions in Israel's 2026 election, how Israelis divide on each, and where the lists stand, by their seats in the polling average.", alternates: alternates("/issues") };

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
