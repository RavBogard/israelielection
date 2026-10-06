import SeatBar from "@/components/SeatBar";
import { blocs, exitPolls, parties } from "@/lib/data";
import { BLOC_ORDER, BLOC_SEAT_ORDER, blocTotals, pollLabel, pollTotal } from "@/lib/polls";
import { exitRows, exitTime } from "@/lib/results-phase";
import type { ResultsConfig } from "@/lib/results";
import type { BlocId } from "@/lib/types";
import "./exit-polls.css";

const T = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const fig = (n: number) => String(Math.round(n * 10) / 10);
const label = Object.fromEntries(blocs.map((b) => [b.id, b.label])) as Record<BlocId, string>;

/** The channels' exit polls as one 120-seat bar each, by bloc, with the 61 tick; a channel not yet added is a hatched bar. */
export default function ExitPollBars({ config, heading = "h2", className }: { config: ResultsConfig; heading?: "h2" | "h3" | null; className?: string }) {
  const rows = exitRows(exitPolls);
  const H = heading;
  const any = rows.some((r) => r.poll);
  return (
    <section className={`xp${className ? ` ${className}` : ""}`} aria-labelledby={H ? "xp-h" : undefined} aria-label={H ? undefined : "Exit polls"}>
      {H && <H id="xp-h" className={H === "h2" ? "sec-h" : "sec-h3"}>Exit polls</H>}
      <ul className="xp-rows">
        {rows.map(({ pollster, poll }) => {
          if (!poll)
            return (
              <li key={pollster} className="xp-row xp-wait">
                <p className="xp-lbl"><b>{pollster}</b> <span>not yet added</span></p>
                <SeatBar size="l" segments={[]} rest={{ hatch: true, title: "Not yet added" }} label={`${pollster} exit poll: not yet added.`} />
              </li>
            );
          const totals = blocTotals(poll, parties);
          const missing = Math.max(0, 120 - pollTotal(poll));
          return (
            <li key={pollster} className="xp-row">
              <p className="xp-lbl"><b>{pollLabel(poll)}</b> <span>{T.format(new Date(exitTime(poll, config)))} Israel time</span></p>
              <SeatBar
                size="l"
                className="sb-fit"
                segments={BLOC_SEAT_ORDER.map((b) => ({ key: b, seats: totals[b], color: `var(--b-${b})`, ink: `var(--b-${b}-ink)`, label: fig(totals[b]), title: `${label[b]} ${fig(totals[b])}` }))}
                rest={missing ? { hatch: true, title: "Not reported by bloc" } : undefined}
                label={`${pollLabel(poll)}: ${BLOC_ORDER.map((b) => `${label[b]} ${fig(totals[b])}`).join(", ")}. A majority is 61.`}
              />
            </li>
          );
        })}
      </ul>
      <ul className="fig-key xp-key">
        {BLOC_ORDER.map((b) => <li key={b}><span className="sw" style={{ background: `var(--b-${b})` }} aria-hidden="true" />{label[b]}</li>)}
        {rows.some((r) => !r.poll) && <li><span className="sw xp-sw-wait" aria-hidden="true" />Not yet added</li>}
      </ul>
      <p className="fig-src xp-src">
        {any
          ? <>Exit polls as broadcast. They are estimates; the committee&apos;s count replaces them. Seats by bloc are each channel&apos;s own figures.</>
          : <>Kan, Channel 12 and Channel 13 broadcast exit polls as polls close (<a href="https://www.ynetnews.com/article/h1tyl0a4s">Ynet, Nov 1, 2022</a>). They are added here once published; nothing is shown until then.</>}
      </p>
    </section>
  );
}
