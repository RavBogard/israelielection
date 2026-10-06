import type { ResultsSnapshot } from "@/lib/results-snapshot";
import { results, type ResultsConfig } from "@/lib/results";
import type { Lang } from "@/lib/i18n";
import resultsText from "@/lib/i18n/results";
import { lettersName, T } from "@/components/results/names";
import { freshnessTime } from "@/components/ResultsFreshness";
/** `names`: party id → the list's name in the page's language (lists the site does not track fall back to the committee's Hebrew slip name, or their letters in English). */
export default function ResultsChanges({ current, previous, config, names, lang = "en" }: { current: ResultsSnapshot; previous: ResultsSnapshot | null; config: ResultsConfig; names: Record<string,string>; lang?: Lang }) {
  const t = resultsText[lang].changes;
  if (!previous || previous.hash === current.hash) return <p className="note">{t.none}</p>;
  const before = results(previous.count, config); const after = results(current.count, config);
  const signed = (n: number) => `${n > 0 ? "+" : ""}${n.toLocaleString("en-US")}`;
  // Hebrew: signed figures run left to right inside the right-to-left line.
  const fig = (n: number) => (lang === "he" ? <bdi dir="ltr">{signed(n)}</bdi> : signed(n));
  const letters = [...new Set([...Object.keys(previous.count.votes), ...Object.keys(current.count.votes)])];
  const changes = letters.map((letter) => ({ letter, votes: (current.count.votes[letter] ?? 0) - (previous.count.votes[letter] ?? 0), seats: (after.alloc.seats[letter] ?? 0) - (before.alloc.seats[letter] ?? 0) })).filter((row) => row.votes || row.seats);
  const delta = signed(current.count.valid - previous.count.valid);
  return <section className="rs-changes"><h2 className="sec-h">{t.h}</h2><p>{t.compared}<time dateTime={previous.capturedAt}>{lang === "he" ? freshnessTime(previous.capturedAt, "he") : previous.capturedAt}</time>{t.after[0]}{lang === "he" ? <bdi dir="ltr">{delta}</bdi> : delta}{t.after[1]}</p><div className="table-scroll"><table className="data-table"><thead><tr><th>{t.th.list}</th><th className="num">{t.th.votes}</th><th className="num">{t.th.seats}</th></tr></thead><tbody>{changes.map((row) => <tr key={row.letter}><th scope="row"><T v={lettersName(row.letter, config, names, lang)} lang={lang} /></th><td className="num">{fig(row.votes)}</td><td className="num">{fig(row.seats)}</td></tr>)}</tbody></table></div></section>;
}
