import EmbedPage from "@/components/pages/EmbedPage";
import { EMBEDS } from "@/lib/i18n/embeds";
import type { EmbedQuery } from "@/components/pages/EmbedPage";
export const metadata = {
  title: EMBEDS.fr.average,
  robots: { index: false, follow: true },
};
export default function Page({ searchParams }: { searchParams: EmbedQuery }) {
  return <EmbedPage kind="average" lang="fr" searchParams={searchParams} />;
}
