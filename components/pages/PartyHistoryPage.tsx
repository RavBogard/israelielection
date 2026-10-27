import Link from "next/link";
import PageHead from "@/components/PageHead";
import type { PartyHistory as HistoryRow } from "@/lib/party-history";
import PartyHistory from "@/components/PartyHistory";
import PartyLanes from "@/components/history/PartyLanes";
import source from "@/data/party-history.json";
import { translatedTool } from "@/lib/reference/catalog";
import { historyPartyLabels } from "@/lib/history-pages";
import { editionPath, type Lang } from "@/lib/i18n";
import { historyText, historicalDate } from "@/lib/i18n/history";
import "@/components/PartyHistory.css";

export default function PartyHistoryPage({ lang = "en" }: { lang?: Lang }) {
  const t = historyText(lang),
    edition = translatedTool("tools:party-history", lang, source),
    labels = historyPartyLabels(lang);
  return (
    <div
      className="wrap party-history-page"
      data-historical-edition="2026"
      data-historical-view="party-history"
    >
      <PageHead title={t.historyTitle} standfirst={t.historyIntro} />
      <p className="note">{t.archive}</p>
      <p>
        {t.checked}:{" "}
        <time dateTime={source.checked}>
          {historicalDate(source.checked, lang)}
        </time>
      </p>
      {lang !== "en" && edition.state !== "ready" && (
        <p className="note" role="status">
          {t.original}
        </p>
      )}
      <PartyLanes
        lang={lang}
        data={edition.data.histories as HistoryRow[]}
        labels={labels}
      />
      <div className="history-key">
        <p>
          <strong>{t.relationship}.</strong> {t.relationshipNote}
        </p>
        <p lang={edition.contentLang} dir="auto">
          {edition.data.scope}
        </p>
        <p>
          <Link href={editionPath("/vote-map", lang)!}>{t.turnout}</Link> ·{" "}
          <Link href={editionPath("/timeline", lang)!}>{t.timelineTitle}</Link>{" "}
          · <Link href={editionPath("/parties", lang)!}>{t.profile}</Link> ·{" "}
          <Link href={editionPath("/ballot", lang)!}>{t.ballot}</Link>
        </p>
      </div>
      <PartyHistory
        lang={lang}
        contentLang={edition.contentLang}
        data={edition.data.histories as HistoryRow[]}
        labels={labels}
      />
    </div>
  );
}
