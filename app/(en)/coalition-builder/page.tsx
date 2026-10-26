import { builderCardSelection } from "@/lib/builder-metadata";
import type { Metadata } from "next";
import { alternates } from "@/lib/canonical";
import BuilderPage from "@/components/pages/BuilderPage";
import builder from "@/lib/i18n/builder";

// Every minute: on election night the builder adds the count as it comes in.
export const revalidate = 60;

const DESCRIPTION = builder.en.description;

/** A shared coalition link carries its own card: the chosen parties on the 120-seat grid. */
export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const q = await searchParams;
  const {ids,names,card}=await builderCardSelection(q,"en");
  if (!ids.length) return { title: "Coalition Builder", description: DESCRIPTION, alternates: alternates("/coalition-builder") };
  return {
    title: "A coalition on the Coalition Builder",
    alternates: alternates("/coalition-builder"),
    description: `${names.join(", ")}: an initial-confidence scenario. ${DESCRIPTION}`,
    openGraph: { images: [{ url: card, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", images: [card] },
  };
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const revision = typeof query.context === "string" ? query.context : undefined;
  return <BuilderPage revision={revision} lang="en" revalidate={revalidate} />;
}
