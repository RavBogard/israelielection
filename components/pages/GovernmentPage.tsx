import OutgoingGovernmentSection from "../OutgoingGovernment";
import SeatBasis from "../seat-context/SeatBasis";
import { connection } from "next/server";
import PageHead from "../PageHead";
import GovernmentLive from "../government/GovernmentLive";
import { lifecycleForRender } from "@/lib/seat-context-server";
import { FORMATION } from "@/lib/i18n/formation-live";
import { forecastPresentation } from "../live-forecast/LiveForecast";
import type { Lang } from "@/lib/i18n";
import "../article/article.css";
export default async function GovernmentPage({ lang }: { lang: Lang }) {
  await connection();
  const snapshot = await lifecycleForRender();
  const t = FORMATION[lang];
  return (
    <div className="wrap article-page gov">
      <PageHead title={t.title} standfirst={t.intro} />
      {!snapshot && <SeatBasis context={null} lang={lang} />}
      {snapshot && (
        <GovernmentLive
          initial={snapshot}
          lang={lang}
          {...forecastPresentation(lang)}
        />
      )}
      {lang==="en"&&<details><summary>Outgoing government · historical record</summary><OutgoingGovernmentSection/></details>}
    </div>
  );
}
