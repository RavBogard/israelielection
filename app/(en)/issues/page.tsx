import type { Metadata } from "next";
import { alternates } from "@/lib/canonical";
import SectionIndex from "@/components/article/SectionIndex";
import { seatContextForRender } from "@/lib/seat-context-server";
import { seatBasisPhrase } from "@/lib/i18n/post-count";
import { SplitMini } from "@/components/article/Article";
import { issueIndex } from "@/lib/content";
import { meta as lens } from "@/content/american-lens.mdx";

export const metadata: Metadata = { title: "Issues", description: "Seven questions in Israel's 2026 election, how Israelis divide on each, and where the lists stand, by their seats.", alternates: alternates("/issues") };

/** The page head says one thing; the rest of the intro is the American lens card below. */
const lead = (basis: string) => `Seven questions in Israel's 2026 election, and where the Knesset splits on each, by the lists' ${basis}.`;

export default async function Page() {
  const context = await seatContextForRender();
  const items = (await issueIndex()).map((s) => ({ href: s.href, title: s.meta.title, dek: s.meta.dek, figure: <SplitMini issue={s.href.split("/").at(-1)!} /> }));
  return (
    <SectionIndex
      title="Issues"
      intro={lead(seatBasisPhrase(context, "en"))}
      items={items}
      extra={{ href: "/american-lens", title: lens.title, dek: lens.dek, label: "Also" }}
    />
  );
}
