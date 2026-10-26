import { builderCardSelection } from "@/lib/builder-metadata";
// Register this edition before reading its interface dictionary.
import "@/lib/i18n/zh/register";
import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/canonical";
import BuilderPage from "@/components/pages/BuilderPage";
import builder from "@/lib/i18n/builder";

// Every minute: on election night the builder adds the count as it comes in.
export const revalidate = 60;

const T = builder.zh;

/** A shared coalition link carries its own card (the English card for v1: PLAN.md section 1). */
export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const q = await searchParams;
  const {ids,names,card}=await builderCardSelection(q,"zh");
  if (!ids.length) return { title: T.title, description: T.description, alternates: localizedAlternates("/zh/coalition-builder") };
  return {
    title: `${T.title}: ${names.join(", ")}`,
    alternates: localizedAlternates("/zh/coalition-builder"),
    description: `${names.join(", ")}: ${T.description}`,
    openGraph: { images: [{ url: card, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", images: [card] },
  };
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const revision = typeof query.context === "string" ? query.context : undefined;
  return <BuilderPage revision={revision} lang="zh" revalidate={revalidate} />;
}
