import type { Live } from "@/lib/results-live";
import type { Lang } from "@/lib/i18n";
import resultsText from "@/lib/i18n/results";
const EN = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jerusalem", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });
// Hebrew: day first, 24-hour, Israel time understood ("27.10, 23:41").
const HE = new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
export const freshnessTime = (value: string, lang: Lang = "en") => (lang === "he" ? HE : EN).format(new Date(value));
export default function ResultsFreshness({ live, lang = "en" }: { live: Extract<Live, { state: "open" }>; lang?: Lang }) {
  const t = resultsText[lang].freshness;
  const time = (value: string) => freshnessTime(value, lang);
  const env = live.count.envelopes;
  const n = (x: number) => x.toLocaleString("en-US");
  return <aside className={`rs-freshness ${live.freshness}${live.freshness === "stale" ? " callout" : ""}`} aria-label={t.aria}>
    {live.fixture && <p><b>{t.fixture}</b></p>}
    <p><b>{live.freshness === "stale" ? t.stale : t.fresh}</b>{t.captured(time(live.fetchedAt))}{t.sourceTime(live.sourceUpdatedAt ? time(live.sourceUpdatedAt) : null)}{live.freshness === "stale" && t.attempt(time(live.attemptedAt))}</p>
    <p>{t.partial}{t.envelopes(env?.present ? n(env.valid) : null, env ? env.present : null)}</p>
  </aside>;
}
