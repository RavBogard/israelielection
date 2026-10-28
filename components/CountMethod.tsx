import { locale, type Lang } from "@/lib/i18n";
import { COUNT_METHOD, type CountMethodValues } from "@/lib/i18n/count-method";
import { getLiveForecast } from "@/lib/live-forecast/server";
import { expectedFinalValid, getCountEstimate } from "@/lib/live-forecast/count-estimate";
import "@/components/count-method.css";

/**
 * /forecast on election night: how the count projection heading the site works, with tonight's figures filled in
 * (Daniel, 2026-10-28). Renders nothing until the projection runs on the count.
 */
export async function countMethod(lang: Lang) {
  const est = await getLiveForecast().then((s) => getCountEstimate(s)).catch(() => null);
  if (!est || est.mode !== "count" || !est.blocIntervals) return null;
  const t = COUNT_METHOD[lang], loc = locale(lang);
  const pct = (x: number) => `${Math.round(x * 100).toLocaleString(loc)}%`;
  const ratio = (x: number | undefined) => (x ?? 1).toLocaleString(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const bloc = (id: string) => { const b = est.blocIntervals![id]; return b ? `${b.median.toLocaleString(loc)} (${b.lo.toLocaleString(loc)}–${b.hi.toLocaleString(loc)})` : "—"; };
  const v: CountMethodValues = {
    pct: pct(est.coverage.votes),
    expected: expectedFinalValid().toLocaleString(loc),
    net: bloc("net"), opp: bloc("opp"), arab: bloc("arab"),
    arabT: ratio(est.sectorTurnout?.arab), harediT: ratio(est.sectorTurnout?.haredi), jewishT: ratio(est.sectorTurnout?.jewish),
    env: (Math.round((est.envelopes?.expected ?? 0) / 1000) * 1000).toLocaleString(loc),
    weight: pct(est.blend?.weight ?? 1),
  };
  return (
    <section key="count-method" className="count-method" aria-labelledby="cm-h">
      <h2 id="cm-h" className="sec-h">{t.h}</h2>
      <p className="cm-lead">{t.lead}</p>
      <p className="cm-now">{t.now(v)}</p>
      <h3>{t.stepsH}</h3>
      <ol className="cm-steps">{t.steps.map((s, i) => <li key={i}>{s(v)}</li>)}</ol>
      <h3>{t.movesH}</h3>
      <p>{t.moves}</p>
      <p className="cm-tested">{t.tested}</p>
      <p className="cm-below">{t.below}</p>
    </section>
  );
}
