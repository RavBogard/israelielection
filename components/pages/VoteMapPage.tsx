import Link from "next/link";
import VoteMap from "@/components/VoteMap";
import PageHead from "@/components/PageHead";
import VoteMapGuide from "./VoteMapGuide";
import VoteMapGuideHe from "./VoteMapGuideHe";
import { mapText } from "@/lib/i18n/vote-map";
import { referenceText } from "@/lib/i18n/reference";
import type { Lang } from "@/lib/i18n";
import "@/components/article/article.css";
export default function VoteMapPage({ lang = "en" }: { lang?: Lang }) {
  const t = mapText(lang),
    reference = referenceText(lang);
  return (
    <div className="wrap article-page vote-map-page">
      <PageHead title={t.title} standfirst={t.intro} />
      <VoteMap />
      {lang === "en" ? (
        <VoteMapGuide />
      ) : lang === "he" ? (
        <VoteMapGuideHe />
      ) : (
        <aside className="article vm-text">
          <h2>{reference.pending}</h2>
          <p>{reference.pendingNote}</p>
          <Link href="/vote-map?original=en">{reference.original}</Link>
        </aside>
      )}
    </div>
  );
}
