import { addDays, LIMITS, RESULTS_TO_DISSOLUTION, type Milestone } from "@/lib/formation";
import { shortDate } from "@/lib/format";

/** Each step's window in days from the published results, if every period before it runs out in full. */
const L = LIMITS;
const W1 = L.assignFirst, W2 = W1 + L.firstPeriod, W3 = W2 + L.firstExtension, W4 = W3 + L.assignSecond, W5 = W4 + L.secondPeriod, W6 = W5 + L.knessetRequest, W7 = W6 + L.assignThird, W8 = W7 + L.thirdPeriod;
const END = RESULTS_TO_DISSOLUTION + L.presentation;

type Kind = "president" | "nominee" | "discretion" | "knesset" | "any";
const ROWS: { id: string; label: string; from: number; to: number; kind: Kind }[] = [
  { id: "first-tasked", label: "The president picks a first nominee", from: 0, to: W1, kind: "president" },
  { id: "first-period", label: "First nominee's 28 days", from: W1, to: W2, kind: "nominee" },
  { id: "first-extension", label: "Up to 14 more, if the president extends", from: W2, to: W3, kind: "discretion" },
  { id: "second-tasked", label: "A second nominee, if needed", from: W3, to: W4, kind: "president" },
  { id: "second-period", label: "Second nominee's 28 days", from: W4, to: W5, kind: "nominee" },
  { id: "knesset-request", label: "61 members may name someone", from: W5, to: W6, kind: "knesset" },
  { id: "third-tasked", label: "The president assigns their choice", from: W6, to: W7, kind: "president" },
  { id: "third-period", label: "That member's 14 days", from: W7, to: W8, kind: "nominee" },
  { id: "government", label: "A government can be sworn in at any point", from: 0, to: END, kind: "any" },
];
const TICKS = [0, W1, W2, W3, W5, W6, W8];
/** Ticks that get a printed label: day 7 sits too close to day 0. */
const LABELLED = TICKS.filter((d) => d !== W1);

/**
 * The formation clock as one chart: each step a bar on a shared axis of days from the published
 * results, so the reader sees how long each stage can run and where the longest path ends (day 117,
 * then a new election). Bars are numbered as the list of steps below them. Once the results are
 * published the axis carries dates and a marker for today.
 */
export default function FormationClock({ steps, published, today }: { steps: Milestone[]; published: string | null; today: string }) {
  const pos = (d: number) => `${(d / END) * 100}%`;
  const num = (id: string) => steps.findIndex((m) => m.id === id) + 1;
  const day = published ? Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${published}T00:00:00Z`)) / 86_400_000) : null;
  return (
    <figure className="gov-fig gov-clock">
      <figcaption className="gov-fig-h">
        The longest path the law allows, in days from the official results{published ? `, published ${shortDate(published)}` : ""}
      </figcaption>
      <div className="gc-axis" aria-hidden="true">
        <span className="gc-lab" />
        <span className="gc-track">
          {LABELLED.map((d) => (
            <span key={d} className="gc-tick" style={{ left: pos(d) }}>
              {published ? shortDate(addDays(published, d)) : d === 0 ? "Day 0" : d}
            </span>
          ))}
        </span>
      </div>
      <ol className="gc-rows">
        {ROWS.map((r) => (
          <li key={r.id} className={`gc-row ${r.kind}`}>
            <span className="gc-lab">
              <b>{num(r.id) || ""}</b>
              <span>{r.label}</span>
            </span>
            <span className="gc-track">
              {TICKS.map((d) => <i key={d} className="gc-grid" style={{ left: pos(d) }} aria-hidden="true" />)}
              <span className="gc-bar" style={{ left: pos(r.from), width: `calc(${pos(r.to - r.from)} - 2px)` }}>
                <span className="sr-only">{`From day ${r.from} to day ${r.to}`}</span>
                {r.to - r.from >= 21 && r.kind !== "any" && <span className="gc-len" aria-hidden="true">{r.to - r.from} days</span>}
              </span>
              {day !== null && day >= 0 && day <= END && <i className="gc-now" style={{ left: pos(day) }} aria-hidden="true" />}
            </span>
          </li>
        ))}
      </ol>
      <div className="gc-axis gc-foot" aria-hidden="true">
        <span className="gc-lab" />
        <span className="gc-track">
          <span className="gc-end" style={{ left: pos(W8) }}>Day {W8}: no government, so the Knesset dissolves and a new election follows</span>
          {day !== null && day >= 0 && day <= END && <span className="gc-nowl" style={{ left: pos(day) }}>Today, day {day}</span>}
        </span>
      </div>
      <p className="gov-fig-src">
        Black bars are a nominee&apos;s time to build a coalition; grey bars are the president&apos;s or the Knesset&apos;s turn; the hatched bar is the extension, which the president may grant or refuse.
        {!published && " The axis gets calendar dates once the Central Elections Committee publishes the official results, expected about a week after election day."}
      </p>
    </figure>
  );
}
