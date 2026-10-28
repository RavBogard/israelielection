import Link from "next/link";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
import { longDate } from "@/lib/format";
import { editionPath, type Lang } from "@/lib/i18n";
import { SCORECARD } from "@/lib/i18n/scorecard";
import { seatContextForRender } from "@/lib/seat-context-server";
import { scorecardFor } from "./ForecastScorecard";

/** The /about "How our forecast did" note: nothing until the seats are official, then a pointer to the scorecard. */
export function ForecastScoreNoteView({ context, lang }: { context: SharedSeatContext | null; lang: Lang }) {
  const s = scorecardFor(context);
  if (!s) return null;
  const t = SCORECARD[lang];
  return (
    <section className="forecast-score-note" aria-labelledby="forecast-score-note-h" data-testid="about-forecast-note">
      <h2 id="forecast-score-note-h">{t.aboutH}</h2>
      <p>
        {t.aboutText(longDate(s.certifiedOn, lang))}{" "}
        <Link href={`${editionPath("/forecast", lang) ?? "/forecast"}#scorecard`}>{t.aboutLink}</Link>
      </p>
    </section>
  );
}

export default async function ForecastScoreNote({ lang = "en" }: { lang?: Lang }) {
  return <ForecastScoreNoteView context={await seatContextForRender()} lang={lang} />;
}
