import type { ReactNode } from "react";
import { allCharts, allPositions, type ChartRow } from "@/lib/articles";
import { parties } from "@/lib/data";

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

const rowSource = (r: ChartRow) => r.source && r.url && <span className="rs"><a href={r.url}>{r.source}{r.date ? `, ${r.date}` : ""}</a></span>;

/** A chart from data/charts: horizontal bars, or a small table. */
export function Chart({ id }: { id: string }) {
  const c = charts[id];
  if (!c) throw new Error(`Unknown chart "${id}" (see data/charts/)`);
  const unit = c.unit ?? "";
  const max = c.max ?? (unit === "%" ? 100 : Math.max(...c.rows.map((r) => r.value ?? 0)));
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
      ) : (
        <div className="tw">
          <table>
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
                    <td key={i}>{x}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="cs">
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

/** What each party says on an issue, from data/positions/<issue>.json. */
export function Positions({ issue }: { issue: string }) {
  const p = positions[issue];
  if (!p) throw new Error(`Unknown positions table "${issue}" (see data/positions/)`);
  return (
    <figure className="positions">
      <figcaption className="ct">{p.title}</figcaption>
      <ul>
        {p.rows.map((r) => {
          const party = parties.find((x) => x.id === r.party)!;
          return (
            <li key={r.party}>
              <p className="pn">
                <span className="sw" style={{ background: `var(--b-${party.bloc})` }} aria-hidden />
                <a href={`/parties/${party.id}`}>{party.name}</a>
              </p>
              <p className="pt">{r.text}</p>
              <p className="cs">
                <SourceLine source={r.source} url={r.url} date={r.date} />
              </p>
            </li>
          );
        })}
      </ul>
      {p.note && (
        <p className="cs">
          <Linked text={p.note} />
        </p>
      )}
    </figure>
  );
}

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
