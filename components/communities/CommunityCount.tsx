import { ballotLists } from "@/lib/ballot";
import { ballotLabels } from "@/lib/ballot-locale";
import { COMMUNITY_TOWNS } from "@/lib/communities-2026";
import type { Lang } from "@/lib/i18n";
import CommunityCount2026 from "./CommunityCount2026";

/** The 2026 block for a community page (server wrapper: only the list names cross to the client). Nothing for a community with no towns configured. */
export default function CommunityCount({ slug, lang }: { slug: string; lang: Lang }) {
  const def = COMMUNITY_TOWNS[slug];
  if (!def) return null;
  const labels = ballotLabels(lang);
  const names = Object.fromEntries(ballotLists.map((l) => [l.letters, labels[l.id]?.name.text ?? l.name]));
  return <CommunityCount2026 slug={slug} lang={lang} names={names} combinedOnly={!!def.combinedOnly} />;
}
