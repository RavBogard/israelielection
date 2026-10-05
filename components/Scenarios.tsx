import Link from "next/link";
import SeatGrid from "./SeatGrid";
import { averagePoll, mainPolls, parties } from "@/lib/data";
import { MAJORITY } from "@/lib/coalition";
import { builderHref, clears, readClears, scenarioNumbers, type Scenario, type ScenariosFile } from "@/lib/scenarios";
import data from "@/data/teach-scenarios.json";

/*
 * Coalition scenarios for class, drawn as ballot slips that open in place: the summary carries the
 * title, the line-up and the seat count from the polls; the slip opens to the fact, the thing to
 * try in the Builder, the question and the sources. Native <details>, so no script.
 */
const { scenarios } = data as ScenariosFile;
const partyOf = (id: string) => parties.find((p) => p.id === id)!;
const avgSeats = (id: string) => averagePoll.results[id]?.seats ?? 0;

/** The slip's top bar: one band per list in its bloc colour, as wide as its seats in the average. */
function Bar({ ids, even }: { ids: string[]; even: boolean }) {
  return (
    <span className="bar" aria-hidden="true">
      {ids.map((id) => (
        <span key={id} style={{ flexGrow: even ? 1 : Math.max(avgSeats(id), 1), background: `var(--b-${partyOf(id).bloc})` }} />
      ))}
    </span>
  );
}

function Count({ s }: { s: Scenario }) {
  const n = scenarioNumbers(s.with, parties, averagePoll, mainPolls);
  const segments = s.with.map((id) => {
    const p = partyOf(id);
    return { id, seats: avgSeats(id), color: `var(--b-${p.bloc})`, label: p.name };
  });
  const range = n.low === n.high ? `${n.low} in each of the latest ${n.polls} polls` : `${n.low} to ${n.high} across the latest ${n.polls} polls`;
  const reach = n.reaching === 0 ? `none reaching ${MAJORITY}` : n.reaching === n.polls ? `all reaching ${MAJORITY}` : `${n.reaching} reaching ${MAJORITY}`;
  return (
    <div className="count">
      <p className="hook">
        <span className="n">{n.average}</span>
        <span className="read">{n.average >= MAJORITY ? "seats in the poll average, a majority" : `seats in the poll average, ${MAJORITY - n.average} short of ${MAJORITY}`}</span>
      </p>
      <p className="range">
        {range}, {reach}.
      </p>
      <SeatGrid variant="meter" labelRule segments={segments} className="sc-grid" title={`${s.title}: ${n.average} of 120 seats in the poll average; ${MAJORITY} is a majority`} />
    </div>
  );
}

function Clears({ s }: { s: Scenario }) {
  const n = mainPolls.length;
  return (
    <ul className="clears">
      {s.with.map((id) => {
        const p = partyOf(id);
        const k = clears(id, mainPolls);
        return (
          <li key={id}>
            <span className="nm">{p.name}</span>
            <span className="dots" aria-hidden="true">
              {mainPolls.map((poll, i) => (
                <span key={poll.id} className={i < k ? "on" : ""} style={{ ["--fill" as string]: `var(--b-${p.bloc})` }} />
              ))}
            </span>
            <span className="txt">{readClears(k, n)}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function Scenarios() {
  return (
    <ul className="scenarios">
      {scenarios.map((s) => {
        const threshold = s.show === "threshold";
        return (
          <li key={s.id} id={`scenario-${s.id}`}>
            <details className="scenario">
              <summary aria-labelledby={`scenario-${s.id}-h`}>
                <Bar ids={s.with} even={threshold} />
                <div className="sum">
                  <h3 id={`scenario-${s.id}-h`}>{s.title}</h3>
                  <span className="lineup">{s.with.map((id) => partyOf(id).name).join(", ")}</span>
                  {threshold ? <Clears s={s} /> : <Count s={s} />}
                  <span className="more">
                    <span className="closed">Read the card</span>
                    <span className="opened">Close the card</span>
                  </span>
                </div>
              </summary>
              <div className="body">
                <p className="lead">{s.lead}</p>
                <div className="try">
                  <Link className="btn primary" href={builderHref(s.with)}>
                    Open in the Coalition Builder
                  </Link>
                  <p>{s.notice}</p>
                </div>
                <div className="q">
                  <p className="lbl">For discussion</p>
                  <p>{s.question}</p>
                </div>
                <p className="src">
                  Sources:{" "}
                  {s.sources.map((x, i) => (
                    <span key={x.url}>
                      {i > 0 && "; "}
                      <a href={x.url}>
                        {x.name}, {x.date}
                      </a>
                    </span>
                  ))}
                  .
                </p>
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
