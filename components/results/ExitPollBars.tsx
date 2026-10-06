import SeatBar from "@/components/SeatBar";
import { blocs, exitPolls, parties } from "@/lib/data";
import { BLOC_ORDER, BLOC_SEAT_ORDER, blocTotals, pollLabel, pollTotal } from "@/lib/polls";
import { exitRows, exitTime } from "@/lib/results-phase";
import type { ResultsConfig } from "@/lib/results";
import type { BlocId } from "@/lib/types";
import type { Lang } from "@/lib/i18n";
import resultsText from "@/lib/i18n/results";
import { blocName, pollsterName, T } from "./names";
import { rich } from "./rich";
import "./exit-polls.css";

const T24 = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const fig = (n: number) => String(Math.round(n * 10) / 10);

/** The channels' exit polls as one 120-seat bar each, by bloc, with the 61 tick; a channel not yet added is a hatched bar. */
export default function ExitPollBars({ config, heading = "h2", className, lang = "en" }: { config: ResultsConfig; heading?: "h2" | "h3" | null; className?: string; lang?: Lang }) {
  const t = resultsText[lang].exitBars;
  const label = Object.fromEntries(blocs.map((b) => [b.id, blocName(b, lang).text])) as Record<BlocId, string>;
  const rows = exitRows(exitPolls);
  const H = heading;
  const any = rows.some((r) => r.poll);
  return (
    <section className={`xp${className ? ` ${className}` : ""}`} aria-labelledby={H ? "xp-h" : undefined} aria-label={H ? undefined : t.aria}>
      {H && <H id="xp-h" className={H === "h2" ? "sec-h" : "sec-h3"}>{t.h}</H>}
      <ul className="xp-rows">
        {rows.map(({ pollster, poll }) => {
          if (!poll) {
            const name = pollsterName(pollster, lang);
            return (
              <li key={pollster} className="xp-row xp-wait">
                <p className="xp-lbl"><b><T v={name} lang={lang} /></b> <span>{t.notYet}</span></p>
                <SeatBar size="l" segments={[]} rest={{ hatch: true, title: t.notYetTitle }} label={t.notYetLabel(name.text)} />
              </li>
            );
          }
          const totals = blocTotals(poll, parties);
          const missing = Math.max(0, 120 - pollTotal(poll));
          const name = pollLabel(poll, lang);
          return (
            <li key={pollster} className="xp-row">
              <p className="xp-lbl"><b>{name}</b> <span>{t.time(T24.format(new Date(exitTime(poll, config))))}</span></p>
              <SeatBar
                size="l"
                className="sb-fit"
                segments={BLOC_SEAT_ORDER.map((b) => ({ key: b, seats: totals[b], color: `var(--b-${b})`, ink: `var(--b-${b}-ink)`, label: fig(totals[b]), title: `${label[b]} ${fig(totals[b])}` }))}
                rest={missing ? { hatch: true, title: t.notByBloc } : undefined}
                label={t.label(name, BLOC_ORDER.map((b) => `${label[b]} ${fig(totals[b])}`).join(", "))}
              />
            </li>
          );
        })}
      </ul>
      <ul className="fig-key xp-key">
        {BLOC_ORDER.map((b) => <li key={b}><span className="sw" style={{ background: `var(--b-${b})` }} aria-hidden="true" />{label[b]}</li>)}
        {rows.some((r) => !r.poll) && <li><span className="sw xp-sw-wait" aria-hidden="true" />{t.notYetTitle}</li>}
      </ul>
      <p className="fig-src xp-src">{rich(any ? t.srcAny : t.srcNone, lang)}</p>
    </section>
  );
}
