import type { ReactNode } from "react";
import { allCharts, allPositions, type Chart as ChartData, type ChartRow, type Positions } from "@/lib/articles";
import { averagePoll, parties } from "@/lib/data";
import { partyColor } from "@/lib/party-colors";
import { shade } from "../compare/model";
import type { PositionRow } from "@/lib/compare";
import { DotPlot, Lines, formOf, heatMax, heatStyle, rowSource, unshaded } from "./ChartViz";

/*
 * The building blocks of a reference page, registered for every MDX file in
 * mdx-components.tsx. Charts and party tables are looked up by id in data/, so the
 * copy never carries a number without its source.
 */

const charts = allCharts();
const positions = allPositions();

function SourceLine({ source, url, date, sample }: { source: string; url: string; date: string; sample?: string }) {
  return (
    <>
      <a href={url}>{source}</a>, {date}
      {sample ? `, ${sample}` : ""}
    </>
  );
}

/** Notes are plain text; a bare URL in one becomes a short link named for its site, so it can wrap. */
function Linked({ text }: { text: string }) {
  const parts = text.split(/(https:\/\/[^\s)]+[^\s).,;:])/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 ? (
          <a key={i} href={part}>
            {new URL(part).hostname.replace(/^(www|en)\./, "")}
          </a>
        ) : (
          part
        )
      )}
    </>
  );
}

/** A data/charts table as a table, with each percentage cell shaded by its size when `heat` is set. */
function NumbersTable({ c, heat }: { c: ChartData; heat: boolean }) {
  const top = heat ? heatMax(c) : 0;
  return (
        <div className="tw">
          <table className={heat ? "heat" : undefined}>
            <caption className="sr-only">{c.title}</caption>
            <thead>
              <tr>
                {c.columns!.map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {c.rows.map((r) => (
                <tr key={r.label}>
                  <th scope="row">
                    {r.label}
                    {rowSource(r)}
                  </th>
                  {r.cells!.map((x, i) => (
                    <td key={i} style={heat && !unshaded(c.columns![i + 1] ?? "") ? heatStyle(x, top) : undefined}>{x}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
  );
}

/** A chart from data/charts: horizontal bars, or a table drawn as lines, a dot plot or a shaded table (see ChartViz). */
export function Chart({ id }: { id: string }) {
  const c = charts[id];
  if (!c) throw new Error(`Unknown chart "${id}" (see data/charts/)`);
  const unit = c.unit ?? "";
  const max = c.max ?? (unit === "%" ? 100 : Math.max(...c.rows.map((r) => r.value ?? 0)));
  const form = formOf(c);
  const print = (r: ChartRow) => r.display ?? `${r.value}${unit === "%" ? "%" : unit ? ` ${unit}` : ""}`;
  return (
    <figure className="chart">
      <figcaption className="ct">{c.title}</figcaption>
      {c.question && (
        <p className="cq">
          <Linked text={c.question} />
        </p>
      )}
      {c.kind === "bars" ? (
        <ul className="bars">
          {c.rows.map((r) => (
            <li key={r.label} title={`${r.label}: ${print(r)}`}>
              <span className="bl">
                {r.label}
                {rowSource(r)}
              </span>
              <span className="bt">
                <span className="bf" style={{ width: `${Math.max(0, Math.min(100, ((r.value ?? 0) / max) * 100))}%` }} />
              </span>
              <span className="bv">{print(r)}</span>
            </li>
          ))}
        </ul>
      ) : form === "lines" || form === "dots" ? (
        <>
          {form === "lines" ? <Lines c={c} /> : <DotPlot c={c} />}
          <details className="cv-numbers" open={form === "lines" && c.rows.some((r) => !!r.source)}>
            <summary>The numbers<span className="sr-only">: {c.title}</span></summary>
            <NumbersTable c={c} heat={false} />
          </details>
        </>
      ) : (
        <NumbersTable c={c} heat={form === "heat"} />
      )}
      <p className="cs">
        {form === "heat" && heatMax(c) > 0 && `Darkest shade: ${heatMax(c)}%${c.columns!.slice(1).some(unshaded) ? "; turnout is a share of eligible voters, so it is not shaded" : ""}. `}
        Source: <SourceLine {...c} />
        {c.note && (
          <>
            . <Linked text={c.note} />
          </>
        )}
      </p>
    </figure>
  );
}

const SEATS = 120;
type PositionRowData = Positions["rows"][number];

/**
 * What each party says on an issue, from data/positions/<issue>.json: first the Knesset split by
 * answer (each answer's lists' seats in the polling average on a 120-seat bar, shaded on the stance
 * ramp the profiles and Compare use), then each answer's lists with their words and sources.
 */
export function Positions({ issue }: { issue: string }) {
  const p = positions[issue];
  if (!p) throw new Error(`Unknown positions table "${issue}" (see data/positions/)`);
  const stances = p.stances ?? [];
  const scale = issue !== "economy" && stances.length > 1;
  const at = (i: number) => (scale ? i / (stances.length - 1) : null);
  const seats = (id: string) => averagePoll.results[id]?.seats ?? 0;
  const hasText = (r: PositionRowData) => !!r.text?.trim() && !(r as PositionRow).declined && r.status !== "declined" && r.status !== "none";
  const groups = stances.map((st, i) => {
    const rows = p.rows.filter((r) => hasText(r) && r.stance === st.id);
    return { st, n: i + 1, pos: at(i), rows, seats: rows.reduce((a, r) => a + seats(r.party), 0) };
  });
  const sorted = new Set(groups.flatMap((g) => g.rows.map((r) => r.party)));
  const unsorted = p.rows.filter((r) => hasText(r) && !sorted.has(r.party));
  const quiet = p.rows.filter((r) => !hasText(r));
  const rest = Math.max(0, SEATS - groups.reduce((a, g) => a + g.seats, 0));
  const name = (id: string) => parties.find((x) => x.id === id)!;
  const Entry = ({ r }: { r: PositionRowData }) => {
    const party = name(r.party);
    return (
      <li>
        <p className="pn">
          <span className="sw" style={{ background: partyColor(party.id) }} aria-hidden />
          <a href={`/parties/${party.id}`}>{party.name}</a>
          {seats(party.id) > 0 && <span className="ps">{Math.round(seats(party.id))} seats</span>}
          {((r as PositionRow).declined || r.status === "declined") && <span className="ps">Declined to answer</span>}
        </p>
        {r.text?.trim() && <p className="pt">{r.text}</p>}
        {r.source && (
          <p className="cs">
            <SourceLine source={r.source} url={r.url!} date={r.date!} />
            {r.basis === "record" ? ". On the record, because the party did not answer the questionnaire" : ""}
          </p>
        )}
      </li>
    );
  };
  return (
    <figure className="positions">
      <figcaption className="ct">{p.title}</figcaption>
      {p.question && <p className="cq">{p.question}</p>}
      {stances.length > 0 && (
        <>
          <div className="ps-bar" role="img" aria-label={`Seats in the polling average by answer: ${groups.filter((g) => g.seats > 0).map((g) => `${g.st.label} ${Math.round(g.seats)}`).join(", ")}; no recorded answer or below the threshold ${Math.round(rest)}. A majority is 61.`}>
            {groups.filter((g) => g.seats > 0).map((g) => (
              <span key={g.st.id} className={`seg on-${g.pos === null ? "ink" : g.pos < 0.5 ? "light" : "dark"}`} style={{ width: `${(g.seats / SEATS) * 100}%`, background: shade(g.pos) }} title={`${g.st.label}: ${Math.round(g.seats)} seats`}>
                <b>{g.n}</b>
              </span>
            ))}
            {rest > 0 && <span className="seg rest" style={{ width: `${(rest / SEATS) * 100}%` }} title={`No recorded answer, or below the threshold: ${Math.round(rest)} seats`} />}
            <i className="maj" style={{ left: `${(61 / SEATS) * 100}%` }} aria-hidden />
          </div>
          <p className="ps-note">
            {scale ? "Answers in order from one end of the debate to the other; " : "These priorities can coexist, so they are not ordered; "}
            the bar is the 120 seats of the current polling average, the tick is 61.
          </p>
        </>
      )}
      {groups.filter((g) => g.rows.length).map((g) => (
        <section key={g.st.id} className="ps-grp">
          <h4>
            <span className={`key on-${g.pos === null ? "ink" : g.pos < 0.5 ? "light" : "dark"}`} style={{ background: shade(g.pos) }} aria-hidden>{g.n}</span>
            {g.st.label}
            <span className="gs">{Math.round(g.seats)} seats</span>
          </h4>
          <ul>{g.rows.map((r) => <Entry key={r.party} r={r} />)}</ul>
        </section>
      ))}
      {unsorted.length > 0 && (
        <section className="ps-grp">
          <h4>{stances.length ? "Recorded, not classified" : "Recorded positions"}</h4>
          <ul>{unsorted.map((r) => <Entry key={r.party} r={r} />)}</ul>
        </section>
      )}
      {quiet.length > 0 && (
        <section className="ps-grp quiet">
          <h4>{quiet.some((r) => (r as PositionRow).declined || r.status === "declined") ? "Declined, or no position in these sources" : "No position in these sources"}</h4>
          <ul>
            {quiet.map((r) => (r.text?.trim() ? <Entry key={r.party} r={r} /> : (
              <li key={r.party}>
                <p className="pn">
                  <span className="sw" style={{ background: partyColor(r.party) }} aria-hidden />
                  <a href={`/parties/${r.party}`}>{name(r.party).name}</a>
                  <span className="ps">{(r as PositionRow).declined || r.status === "declined" ? "Declined to answer" : "No position found"}</span>
                </p>
              </li>
            )))}
          </ul>
        </section>
      )}
      {p.note && (
        <p className="cs">
          <Linked text={p.note} />
        </p>
      )}
      <p className="cs"><a href={`/compare#issue-${AXIS_OF[issue] ?? ""}`}>Compare every list on this issue</a></p>
    </figure>
  );
}

const AXIS_OF: Record<string, string> = { "haredi-draft": "draft", courts: "courts", "war-hostages": "war", "west-bank": "wb", "religion-state": "relig", economy: "econ", "palestinian-state": "pstate" };

/** A quotation, verbatim, with who said it, where and when. */
export function Quote({ children, who, role, source, url, date }: { children: ReactNode; who: string; role?: string; source: string; url: string; date: string }) {
  return (
    <figure className="quote">
      <blockquote>{children}</blockquote>
      <figcaption>
        {who}
        {role ? `, ${role}` : ""}. <a href={url}>{source}</a>, {date}
      </figcaption>
    </figure>
  );
}

/** A boxed aside: a definition, a caveat, or a group kept out of the page totals. */
export function Note({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <aside className="note">
      {title && <p className="nt">{title}</p>}
      {children}
    </aside>
  );
}
