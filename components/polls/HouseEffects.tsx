import { mediumDate } from "@/lib/format";
import { seatFigure } from "@/lib/polls";
import type { HouseEffect } from "@/lib/house-effects";
import "./bloc-race.css";

const BLOCS = ["net", "opp"] as const;
/** A gap in seats, one decimal always, as every average figure on the site. */
const signed = (n: number) => { const v = seatFigure(Math.abs(n)); return v === "0.0" ? v : `${n > 0 ? "+" : "−"}${v}`; };
/** Scale ticks are whole seats. */
const tick = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0");

/** Each pollster's average gap from the site's bloc average, as a bar either side of zero. */
export default function HouseEffects({ rows, labels, hollowNames, title }: { rows: HouseEffect[]; labels: Record<"net" | "opp", string>; hollowNames: string[]; title: string }) {
  const M = Math.max(2, Math.ceil(Math.max(...rows.flatMap((r) => [Math.abs(r.gap.net), Math.abs(r.gap.opp)])) / 2) * 2);
  const pos = (n: number) => 50 + (n / M) * 50;
  const scale = [-M, -M / 2, 0, M / 2, M];
  return (
    <section className="he" aria-labelledby="he-h">
      <h2 id="he-h" className="sec-h">{title}</h2>
      <table className="he-table">
        <caption className="sr-only">Each pollster&apos;s average gap from the site average, in seats, for the two blocs</caption>
        <thead>
          <tr>
            <th scope="col">Pollster</th>
            <th scope="col" className="num n">Polls</th>
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
                <th scope="row">{r.pollster}</th>
                <td className="num n">{r.n}</td>
                {BLOCS.map((b) => {
                  const g = r.gap[b];
                  return (
                    <td key={b} className="gap"><span className="he-cell">
                      <span className="he-track" aria-hidden="true">
                        <i className="zero" />
                        <i className={`bar${hollow ? " hollow" : ""}`} style={{ left: `${Math.min(50, pos(g))}%`, width: `${Math.abs(pos(g) - 50)}%`, ["--c" as string]: `var(--b-${b})` }} />
                      </span>
                      <span className="he-v">{signed(g)}<span className="sr-only"> seats</span></span></span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="fig-note">Seats above or below the site average, averaged over each pollster&apos;s campaign polls.</p>
      <details className="pd-how">
        <summary>How to read this</summary>
        <p className="fig-note">
          For each poll: its own bloc total minus the site&apos;s bloc average on its publication date, an average that includes that poll; then the mean
          over the pollster&apos;s polls. Hollow bars are {hollowNames.join(" and ")}. A pollster with one
          or two polls says little. A lean is a difference from the other pollsters, not proof of error: the site average is not the true figure.
        </p>
      </details>
      <details className="he-data">
        <summary>The numbers: every poll&apos;s gap</summary>
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Gap of every poll from the site average, horizontally scrollable">
          <table className="data-table">
            <thead><tr><th scope="col">Pollster</th><th scope="col">Published</th>{BLOCS.map((b) => <th key={b} scope="col" className="num">{labels[b]}</th>)}</tr></thead>
            <tbody>{rows.flatMap((r) => r.polls.map(({ poll, gap }) => <tr key={poll.id}><th scope="row">{r.pollster}</th><td>{mediumDate(poll.published)}</td>{BLOCS.map((b) => <td key={b} className="num">{signed(gap[b])}</td>)}</tr>))}</tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
