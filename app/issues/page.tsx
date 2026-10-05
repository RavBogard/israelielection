import type { Metadata } from "next";
import SectionIndex from "@/components/article/SectionIndex";
import { issueIndex } from "@/lib/content";
import { meta as lens } from "@/content/american-lens.mdx";

const INTRO =
  "Seven questions that decide how Israelis vote in 2026. Each page sets out what is at stake, what Israelis think by group, what each party says, and the misreadings an American reader is likely to bring.";

export const metadata: Metadata = { title: "Issues", description: INTRO };

export default async function Page() {
  const items = (await issueIndex()).map((s) => ({ href: s.href, title: s.meta.title, dek: s.meta.dek }));
  return (
    <SectionIndex
      title="Issues"
      intro={INTRO}
      items={items}
      extra={{ href: "/american-lens", title: lens.title, dek: lens.dek, label: "Also" }}
    />
  );
}
