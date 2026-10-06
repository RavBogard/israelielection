import type { Metadata } from "next";
import { alternates } from "@/lib/canonical";
import BuilderPage from "@/components/pages/BuilderPage";
import { parties } from "@/lib/data";
import builder from "@/lib/i18n/builder";

// Every minute: on election night the builder adds the count as it comes in.
export const revalidate = 60;

const DESCRIPTION = builder.en.description;

/** A shared coalition link carries its own card: the chosen parties on the 120-seat grid. */
export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const q = await searchParams;
  const with_ = typeof q.with === "string" ? q.with : "";
  const poll = typeof q.poll === "string" ? q.poll : "";
  const ids = with_.split(",").filter((id) => parties.some((p) => p.id === id));
  if (!ids.length) return { title: "Coalition Builder", description: DESCRIPTION, alternates: alternates("/coalition-builder") };
  const card = `/api/card?with=${ids.join(",")}${poll ? `&poll=${encodeURIComponent(poll)}` : ""}`;
  const names = ids.map((id) => parties.find((p) => p.id === id)!.name);
  return {
    title: "A coalition on the Coalition Builder",
    alternates: alternates("/coalition-builder"),
    description: `${names.join(", ")}: does it reach 61? ${DESCRIPTION}`,
    openGraph: { images: [{ url: card, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", images: [card] },
  };
}

export default function Page() {
  return <BuilderPage lang="en" revalidate={revalidate} />;
}
