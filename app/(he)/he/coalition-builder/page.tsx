import type { Metadata } from "next";
import { heAlternates } from "@/lib/canonical";
import BuilderPage from "@/components/pages/BuilderPage";
import { parties } from "@/lib/data";
import builder from "@/lib/i18n/builder";
import { list } from "@/lib/i18n/he-grammar";
import { partyText } from "@/lib/i18n/overlays";

// Every minute: on election night the builder adds the count as it comes in.
export const revalidate = 60;

const T = builder.he;

/** A shared coalition link carries its own card (the English card for v1: PLAN.md section 1). */
export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const q = await searchParams;
  const with_ = typeof q.with === "string" ? q.with : "";
  const poll = typeof q.poll === "string" ? q.poll : "";
  const ids = with_.split(",").filter((id) => parties.some((p) => p.id === id));
  if (!ids.length) return { title: T.title, description: T.description, alternates: heAlternates("/he/coalition-builder") };
  const card = `/api/card?with=${ids.join(",")}${poll ? `&poll=${encodeURIComponent(poll)}` : ""}`;
  const names = ids.map((id) => partyText(parties.find((p) => p.id === id)!, "name", "he").text);
  return {
    title: `קואליציה של ${list(names)}`,
    alternates: heAlternates("/he/coalition-builder"),
    description: `${list(names)}: מגיעות ל-61? ${T.description}`,
    openGraph: { images: [{ url: card, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", images: [card] },
  };
}

export default function Page() {
  return <BuilderPage lang="he" revalidate={revalidate} />;
}
