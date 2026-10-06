import { mediumDate } from "@/lib/format";
import { seatFigure } from "@/lib/polls";
import type { HouseEffect } from "@/lib/house-effects";
import type { Lang } from "@/lib/i18n";
import POLLS from "@/lib/i18n/polls";
import { Ltr, pollsterName, Tx } from "./names";
import "./bloc-race.css";

const BLOCS = ["net", "opp"] as const;
/** A gap in seats, one decimal always, as every average figure on the site. */
const signed = (n: number) => { const v = seatFigure(Math.abs(n)); return v === "0.0" ? v : `${n > 0 ? "+" : "−"}${v}`; };
/** Scale ticks are whole seats. */
const tick = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0");

/** Each pollster's average gap from the site's bloc average, as a bar either side of zero. */
export default function HouseEffects({ rows, labels, hollowNames, title, lang = "en" }: { rows: HouseEffect[]; labels: Record<"net" | "opp", string>; hollowNames: string[]; title: string; lang?: Lang }) {
  const T = POLLS[lang], t = T.house, he = lang === "he";
  // The gap scale is a signed number line, so it stays left to right in Hebrew, like the numerals on it.
  const M = Math.max(2, Math.ceil(Math.max(...rows.flatMap((r) => [Math.abs(r.gap.net), Math.abs(r.gap.opp)])) / 2) * 2);
  const pos = (n: number) => 50 + (n / M) * 50;
  const scale = [-M, -M / 2, 0, M / 2, M];
  return (
    <section className="he" aria-labelledby="he-h">
      <h2 id="he-h" className="sec-h">{title}</h2>
      <table className="he-table">
        <caption className="sr-only">{t.caption}</caption>
        <thead>
          <tr>
            <th scope="col">{t.pollster}</th>
            <th scope="col" className="num n">{t.polls}</th>
            {BLOCS.map((b) => (
              <th key={b} scope="col" className="gap">
                {labels[b]}
                <span className="he-scale" aria-hidden="true">{scale.map((t, i) => <i key={t} className={i % 2 ? "mid" : undefined} style={{ left: `${pos(t)}%` }}>{tick(t)}</i>)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const hollow = hollowNames.includes(r.pollster);
            return (
              <tr key={r.pollster}>
                <th scope="row"><Tx text={pollsterName(r.pollster, lang)} lang={lang} /></th>
                <td className="num n">{r.n}</td>
                {BLOCS.map((b) => {
                  const g = r.gap[b];
                  return (
                    <td key={b} className="gap"><span className="he-cell">
                      <span className="he-track" aria-hidden="true">
                        <i className="zero" />
                        <i className={`bar${hollow ? " hollow" : ""}`} style={{ left: `${Math.min(50, pos(g))}%`, width: `${Math.abs(pos(g) - 50)}%`, ["--c" as string]: `var(--b-${b})` }} />
                      </span>
                      <span className="he-v"><Ltr lang={lang}>{signed(g)}</Ltr><span className="sr-only">{T.common.seats}</span></span></span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="fig-note">{t.note}</p>
      <details className="pd-how">
        <summary>{T.common.howToRead}</summary>
        {he ? <p className="fig-note">{t.how(hollowNames.map((n) => pollsterName(n, lang)))}</p> : <p className="fig-note">
          For each poll: its own bloc total minus the site&apos;s bloc average on its publication date, an average that includes that poll; then the mean
          over the pollster&apos;s polls. Hollow bars are {hollowNames.join(" and ")}. A pollster with one
          or two polls says little. A lean is a difference from the other pollsters, not proof of error: the site average is not the true figure.
        </p>}
      </details>
      <details className="he-data">
        <summary>{t.numbers}</summary>
        <div className="table-scroll" tabIndex={0} role="region" aria-label={t.tableAria}>
          <table className="data-table">
            <thead><tr><th scope="col">{t.pollster}</th><th scope="col">{t.published}</th>{BLOCS.map((b) => <th key={b} scope="col" className="num">{labels[b]}</th>)}</tr></thead>
            <tbody>{rows.flatMap((r) => r.polls.map(({ poll, gap }) => <tr key={poll.id}><th scope="row"><Tx text={pollsterName(r.pollster, lang)} lang={lang} /></th><td>{mediumDate(poll.published, lang)}</td>{BLOCS.map((b) => <td key={b} className="num"><Ltr lang={lang}>{signed(gap[b])}</Ltr></td>)}</tr>))}</tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
