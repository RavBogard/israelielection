import type { Lang } from "@/lib/i18n";
import { POST_COUNT, RULE_SHORT, fill } from "@/lib/i18n/post-count";
import { blocText, pledgeText } from "@/lib/i18n/overlay-text";
import { blocs, parties, pledgeRules } from "@/lib/data";
import { redLines } from "@/lib/red-lines";
import type { Poll } from "@/lib/types";
import { En, Loc } from "./Loc";
import "./red-lines.css";

const seatsIn = (poll: Poll) => (id: string) => {
  const r = poll.results[id];
  return r && !r.belowThreshold ? r.seats : 0;
};

/**
 * "Red lines in play": for the seats in view, what each bloc needs to reach 61 and the recorded pledges (each with
 * its source and date) that stand in the way of every combination that would. Arithmetic only, never odds; it is
 * generated from data/pledge-rules.json, so it follows the seats.
 */
export default function RedLines({ poll, lang, fig }: { poll: Poll; lang: Lang; fig: (n: number) => string }) {
  const T = POST_COUNT[lang];
  const { needs, combos } = redLines(seatsIn(poll), parties, pledgeRules);
  const blocName = (id: string) => blocText(blocs.find((b) => b.id === id)!, lang);
  const ruleOf = (id: string) => pledgeRules.find((r) => r.id === id)!;
  if (!needs.length) return null;
  return (
    <section className="red-lines" aria-labelledby="red-lines-h" data-testid="red-lines">
      <h2 id="red-lines-h">{T.redTitle}</h2>
      <h3>{T.redNeedsHead}</h3>
      <ul className="rl-needs">
        {needs.map((n) => (
          <li key={n.bloc} data-bloc={n.bloc}>
            <i className="sw" style={{ background: `var(--b-${n.bloc})` }} aria-hidden="true" />
            <Loc v={{ text: fill(n.gap > 0 ? T.redNeeds : T.redReached, { bloc: blocName(n.bloc).text, seats: fig(n.seats), gap: fig(n.gap) }), lang: blocName(n.bloc).lang }} page={lang} />
          </li>
        ))}
      </ul>
      {combos.length > 0 && <h3>{T.redCombosHead}</h3>}
      <ul className="rl-combos">
        {combos.map((c) => (
          <li key={c.blocs.join("+")} data-combo={c.blocs.join("+")}>
            <b>
              {c.parts.map((p, i) => (
                <span key={p.bloc}>
                  {i > 0 && " + "}
                  <Loc v={blocName(p.bloc)} page={lang} /> {fig(p.seats)}
                </span>
              ))}
              {" = "}
              {fig(c.total)}
            </b>
            . {c.blockedBy.length === 0 ? T.redNone : <>{T.redAgainst}{" "}
              {c.blockedBy.map((id, i) => {
                const rule = ruleOf(id);
                return (
                  <span key={id} data-rule={id}>
                    {i > 0 && "; "}
                    {RULE_SHORT[id]?.[lang] ?? <Loc v={pledgeText(rule, lang)} page={lang} />}{" "}
                    <span className="s">(<En page={lang}>{rule.source}</En>)</span>
                  </span>
                );
              })}.</>}
          </li>
        ))}
      </ul>
      <p className="fig-src">{T.redCaveat}</p>
    </section>
  );
}
